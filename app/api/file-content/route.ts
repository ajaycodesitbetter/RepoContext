/**
 * GET /api/file-content?owner=X&repo=Y&branch=Z&path=file.ts
 * Fetches raw file content from GitHub for the export-for-LLM feature.
 */
import "server-only";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_SIZE = 100 * 1024; // 100KB

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

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const branch = searchParams.get("branch");
  const path = searchParams.get("path");

  if (!owner || !repo || !branch || !path) {
    return NextResponse.json(
      { error: "Missing required query params: owner, repo, branch, path." },
      { status: 400 },
    );
  }

  try {
    const reqToken = request.headers.get("x-github-token");
    const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}/${path}`;
    const res = await fetch(rawUrl, {
      headers: authHeaders(reqToken),
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `File not found (HTTP ${res.status}).` },
        { status: res.status === 404 ? 404 : 502 },
      );
    }

    const text = await res.text();
    const truncated = text.length > MAX_SIZE;
    const content = truncated ? text.slice(0, MAX_SIZE) : text;

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        ...(truncated ? { "X-Truncated": "true" } : {}),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch file content from GitHub." },
      { status: 502 },
    );
  }
}
