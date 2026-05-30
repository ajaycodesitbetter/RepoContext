/**
 * GET /api/brief?repo=<owner/repo>
 * JSON endpoint for external use, returning the BriefResponse payload.
 */
import "server-only";

import { NextResponse } from "next/server";
import { getBriefForUrl } from "@/lib/github/service";
import type { ApiError, BriefResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  request: Request,
): Promise<NextResponse<BriefResponse | ApiError>> {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo");

  if (!repo) {
    return NextResponse.json<ApiError>(
      { error: "Missing required query param `repo`. Expected format: owner/repo" },
      { status: 400 },
    );
  }

  const token = request.headers.get("x-github-token");
  const result = await getBriefForUrl(repo, token);

  if (!result.ok) {
    return NextResponse.json<ApiError>({ error: result.error, code: result.code }, { status: result.status });
  }

  return NextResponse.json<BriefResponse>(result.data, { status: 200 });
}
