/**
 * Orchestrates the parse → fetch → rank pipeline used by the route handler.
 * Server-only.
 */
import "server-only";

import { parseRepoUrl } from "@/lib/github/parse-url";
import {
  fetchRepo,
  fetchTree,
  fetchOwnerProfile,
  fetchReleases,
  fetchOrgVerification,
  hasGithubToken,
  GithubError,
  getLastRateLimit,
} from "@/lib/github/client";
import { buildMockResponse } from "@/lib/github/mock";
import { rankFiles, pickTopFiles } from "@/lib/github/rank-files";
import { inferOwnerLocation } from "@/lib/github/infer-location";
import { detectProjectType } from "@/lib/analysis/detect-project-type";
import { buildOnboarding } from "@/lib/analysis/onboarding";
import { processReleases } from "@/lib/analysis/releases";
import type { BriefResponse } from "@/lib/types";

export type ServiceResult =
  | { ok: true; data: BriefResponse }
  | { ok: false; status: 400 | 404 | 429 | 502; error: string };

export async function getBriefForUrl(input: string): Promise<ServiceResult> {
  const parsed = parseRepoUrl(input);
  if (!parsed) {
    return {
      ok: false,
      status: 400,
      error:
        "Could not parse that as a GitHub repo. Try `owner/repo` or a full https://github.com/owner/repo URL.",
    };
  }

  // Mock fallback when no token is configured.
  if (!hasGithubToken()) {
    return { ok: true, data: buildMockResponse(parsed.owner, parsed.repo) };
  }

  try {
    const repo = await fetchRepo(parsed.owner, parsed.repo);

    // Use explicit branch from URL if provided, otherwise default.
    const effectiveBranch = parsed.branch ?? repo.default_branch;

    // Fetch tree (required) and enhancements (best-effort) in parallel.
    // Owner profile / releases / org verification failures must NEVER
    // fail the whole brief — we degrade gracefully instead.
    const [tree, ownerProfileResult, releasesResult, isVerifiedOrg] = await Promise.all([
      fetchTree(parsed.owner, parsed.repo, effectiveBranch),
      fetchOwnerProfile(repo.owner.login).catch(() => null),
      fetchReleases(parsed.owner, parsed.repo),
      fetchOrgVerification(repo.owner.login),
    ]);

    const inferred = inferOwnerLocation(ownerProfileResult?.location ?? null);

    let rawNodes = tree.tree
      .filter((n) => n.type === "blob" || n.type === "tree")
      .map((n) => ({
        path: n.path,
        type: n.type as "blob" | "tree",
        size: typeof n.size === "number" ? n.size : null,
      }));

    // If a subpath was requested, filter to only entries under that prefix
    // and strip the prefix so paths are relative to the explored directory.
    if (parsed.subpath) {
      const prefix = parsed.subpath.endsWith("/")
        ? parsed.subpath
        : parsed.subpath + "/";
      rawNodes = rawNodes
        .filter((n) => n.path === parsed.subpath || n.path.startsWith(prefix))
        .map((n) => ({
          ...n,
          path: n.path === parsed.subpath ? n.path : n.path.slice(prefix.length),
        }))
        .filter((n) => n.path.length > 0);

      if (rawNodes.length === 0) {
        return {
          ok: false,
          status: 404,
          error: `Path '${parsed.subpath}' not found on branch '${effectiveBranch}'.`,
        };
      }
    }

    const ranked = rankFiles(rawNodes);
    const topFiles = pickTopFiles(ranked, 12);
    const projectType = detectProjectType(ranked);
    const onboarding = buildOnboarding(ranked, topFiles, projectType);
    const releaseInfo = await processReleases(releasesResult, isVerifiedOrg);

    return {
      ok: true,
      data: {
        meta: {
          owner: repo.owner.login,
          repo: repo.name,
          description: repo.description,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          defaultBranch: repo.default_branch,
          isForked: repo.fork,
          isMock: false,
          ownerLocationRaw: inferred.ownerLocationRaw,
          ownerCountry: inferred.ownerCountry,
          ownerCountryCode: inferred.ownerCountryCode,
          locationConfidence: inferred.locationConfidence,
          ...(parsed.branch ? { exploredBranch: effectiveBranch } : {}),
          ...(parsed.subpath ? { exploredSubpath: parsed.subpath } : {}),
        },
        tree: ranked,
        topFiles,
        projectType,
        onboarding,
        treeTruncated: tree.truncated === true,
        release: releaseInfo?.stable ?? null,
        prerelease: releaseInfo?.prerelease ?? null,
        rateLimit: getLastRateLimit(),
      },
    };
  } catch (e) {
    if (e instanceof GithubError) {
      const status = (e.status === 404 || e.status === 429 || e.status === 502)
        ? e.status
        : 502;
      return { ok: false, status, error: e.message };
    }
    return {
      ok: false,
      status: 502,
      error: "Unexpected error contacting GitHub.",
    };
  }
}
