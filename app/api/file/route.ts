/**
 * GET /api/file?repo=owner/repo&path=file.ts&ref=HEAD
 * Returns a structured JSON preview of a single file (first 16 KB).
 * Uses raw.githubusercontent.com — consistent with the rest of the codebase.
 */
import "server-only";

import { NextResponse } from "next/server";
import type { ApiError, FilePreviewResponse } from "@/lib/types";

export const runtime = "nodejs";

const MAX_PREVIEW_BYTES = 16 * 1024; // 16 KB

function authHeaders(reqToken: string | null): Record<string, string> {
  const token = reqToken || process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    "User-Agent": "RepoContext/0.1 (+https://repocontext.local)",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function GET(
  request: Request,
): Promise<NextResponse | Response> {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo");
  const path = searchParams.get("path");
  const ref = searchParams.get("ref") ?? "HEAD";

  if (!repo || !path) {
    return NextResponse.json<ApiError>(
      { error: "Missing required params: repo and path" },
      { status: 400 },
    );
  }

  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    return NextResponse.json<ApiError>(
      { error: "Invalid repo format. Expected owner/repo" },
      { status: 400 },
    );
  }

  try {
    // Use the GitHub Contents API (not raw.githubusercontent) so we can get
    // the true file size from the response metadata before decoding.
    const reqToken = request.headers.get("x-github-token");
    const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/contents/${path}?ref=${encodeURIComponent(ref)}`;
    const res = await fetch(apiUrl, {
      headers: {
        ...authHeaders(reqToken),
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 60 },
    });

    if (res.status === 404) {
      return NextResponse.json<ApiError>(
        { error: "File not found" },
        { status: 404 },
      );
    }

    if (!res.ok) {
      return NextResponse.json<ApiError>(
        { error: `GitHub returned ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();

    // The Contents API returns an array for directories.
    if (Array.isArray(data) || data.type !== "file") {
      return NextResponse.json<ApiError>(
        { error: "Path resolves to a directory, not a file" },
        { status: 400 },
      );
    }

    let rawBuffer: Buffer;
    if (data.content) {
      rawBuffer = Buffer.from(data.content, "base64");
    } else if (data.download_url) {
      const rawRes = await fetch(data.download_url, { headers: authHeaders(reqToken) });
      if (!rawRes.ok) throw new Error("Failed to fetch large file content");
      rawBuffer = Buffer.from(await rawRes.arrayBuffer());
    } else {
      throw new Error("No content available for file");
    }

    if (searchParams.get("download") === "true") {
      const filename = path.split("/").pop() ?? "file";
      const responseHeaders = {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(rawBuffer.length),
      };
      return new NextResponse(new Uint8Array(rawBuffer), { headers: responseHeaders });
    }

    const truncated = rawBuffer.length > MAX_PREVIEW_BYTES;
    const preview = rawBuffer.subarray(0, MAX_PREVIEW_BYTES).toString("utf-8");

    return NextResponse.json<FilePreviewResponse>({
      content: preview,
      truncated,
      size: rawBuffer.length,
      path,
      ref,
    });
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Failed to fetch file content" },
      { status: 500 },
    );
  }
}
