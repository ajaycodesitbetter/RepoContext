/**
 * POST /api/download
 * Accepts { repo, paths, ref? } and returns a ZIP archive of the requested files.
 * Uses raw.githubusercontent.com for efficient binary-safe downloads.
 */
import "server-only";

import JSZip from "jszip";
import { NextResponse } from "next/server";
import type { ApiError } from "@/lib/types";

export const runtime = "nodejs";

const MAX_FILES = 50;

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

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as Record<string, unknown>).repo !== "string" ||
    !Array.isArray((body as Record<string, unknown>).paths)
  ) {
    return NextResponse.json<ApiError>(
      { error: "Invalid request body. Expected { repo: string, paths: string[], ref?: string }" },
      { status: 400 },
    );
  }

  const { repo, paths, ref = "HEAD" } = body as {
    repo: string;
    paths: string[];
    ref?: string;
  };

  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    return NextResponse.json<ApiError>(
      { error: "Invalid repo format. Expected owner/repo" },
      { status: 400 },
    );
  }

  // Filter out empty strings.
  const validPaths = paths.filter((p) => typeof p === "string" && p.length > 0);

  if (validPaths.length === 0) {
    return NextResponse.json<ApiError>(
      { error: "paths array must not be empty" },
      { status: 400 },
    );
  }

  if (validPaths.length > MAX_FILES) {
    return NextResponse.json<ApiError>(
      { error: `Maximum ${MAX_FILES} files per download request` },
      { status: 400 },
    );
  }

  const reqToken = request.headers.get("x-github-token");
  const zip = new JSZip();
  const headers = authHeaders(reqToken);

  const results = await Promise.allSettled(
    validPaths.map(async (filePath) => {
      const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/${encodeURIComponent(ref)}/${filePath}`;
      const res = await fetch(rawUrl, { headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${filePath}`);
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      zip.file(filePath, buffer);
    }),
  );

  const failures = results
    .map((r, i) => (r.status === "rejected" ? validPaths[i] : null))
    .filter((p): p is string => p !== null);

  if (failures.length === validPaths.length) {
    return NextResponse.json<ApiError>(
      { error: "All requested files failed to fetch" },
      { status: 500 },
    );
  }

  const zipArrayBuffer = await zip.generateAsync({
    type: "arraybuffer",
    compression: "DEFLATE",
  });

  const responseHeaders: Record<string, string> = {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${repoName}-files.zip"`,
    "Content-Length": String(zipArrayBuffer.byteLength),
  };

  if (failures.length > 0) {
    responseHeaders["X-Skipped-Paths"] = JSON.stringify(failures);
  }

  return new NextResponse(new Uint8Array(zipArrayBuffer), { headers: responseHeaders });
}
