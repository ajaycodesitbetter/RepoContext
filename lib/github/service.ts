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
import {
  classifyActivityStatus,
  classifyReviewPressure,
  classifyCommunityBreadth,
  sortOpenIssues,
  sortOpenPullRequests,
  trimWorkItems,
} from "@/lib/analysis/health";
import {
  detectDependencyFiles,
  selectFilesToFetch,
  parseManifest,
  detectBroadVersionRanges,
  detectUnpinnedPythonDeps,
  buildEcosystemSummaries,
  generateRiskSignals,
  buildRiskSummary,
} from "@/lib/analysis/dependencies";
import type { BriefResponse, RepoHealth, RepoWorkItem, RepoAccessErrorCode } from "@/lib/types";

export type ServiceResult =
  | { ok: true; data: BriefResponse }
  | { ok: false; status: 400 | 401 | 403 | 404 | 429 | 502; error: string; code?: RepoAccessErrorCode };

export async function getBriefForUrl(input: string, token?: string | null): Promise<ServiceResult> {
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
  if (!hasGithubToken() && !token) {
    return { ok: true, data: buildMockResponse(parsed.owner, parsed.repo) };
  }

  try {
    const repo = await fetchRepo(parsed.owner, parsed.repo, { token });

    // ── Security gate: private repos require an explicit user token. ──
    // The server's GITHUB_TOKEN is used only for public-repo rate-limit
    // relief. It must NEVER silently authorize private repo access.
    if (repo.private && !token) {
      return {
        ok: false,
        status: 403,
        error: "This is a private repository. Add a GitHub token to access it.",
        code: "private_repo_requires_token",
      };
    }

    // Use explicit branch from URL if provided, otherwise default.
    const effectiveBranch = parsed.branch ?? repo.default_branch;

    // Fetch tree (required) and enhancements (best-effort) in parallel.
    // Owner profile / releases / org verification failures must NEVER
    // fail the whole brief — we degrade gracefully instead.
    const [
      tree,
      ownerProfileResult,
      releasesResult,
      isVerifiedOrg,
      issuesAndPrs,
      contributors,
      stats,
      latestCommit,
    ] = await Promise.all([
      fetchTree(parsed.owner, parsed.repo, effectiveBranch, { token }),
      fetchOwnerProfile(repo.owner.login, { token }).catch(() => null),
      fetchReleases(parsed.owner, parsed.repo, { token }),
      fetchOrgVerification(repo.owner.login, { token }),
      import("@/lib/github/client").then((m) => m.fetchIssuesAndPrs(parsed.owner, parsed.repo, { token })),
      import("@/lib/github/client").then((m) => m.fetchContributors(parsed.owner, parsed.repo, { token })),
      import("@/lib/github/client").then((m) => m.fetchParticipationStats(parsed.owner, parsed.repo, { token })),
      import("@/lib/github/client").then((m) => m.fetchCommit(parsed.owner, parsed.repo, repo.default_branch, { token })),
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

    // Health logic
    const rawItems = issuesAndPrs || [];
    const openIssuesRaw = rawItems.filter((i) => !i.pull_request);
    const openPrsRaw = rawItems.filter((i) => !!i.pull_request);

    const mapToWorkItem = (i: any): RepoWorkItem => ({
      number: i.number,
      title: i.title,
      author: i.user?.login || null,
      comments: i.comments,
      createdAt: i.created_at,
      updatedAt: i.updated_at,
      url: i.html_url,
      isDraft: i.draft,
    });

    const openIssues = trimWorkItems(sortOpenIssues(openIssuesRaw.map(mapToWorkItem)));
    const openPullRequests = trimWorkItems(sortOpenPullRequests(openPrsRaw.map(mapToWorkItem)));

    const lastPushAt = repo.pushed_at ?? null;
    const defaultBranchLastCommitAt = latestCommit?.commit.author.date ?? null;
    const fallbackCount = typeof repo.open_issues_count === "number" ? repo.open_issues_count : null;
    const openIssuesCount = issuesAndPrs ? openIssuesRaw.length : fallbackCount;
    const openPullRequestsCount = issuesAndPrs ? openPrsRaw.length : null;
    const contributorCount = contributors ? (contributors.length === 100 ? "100+" : contributors.length) : null;
    
    // For stats, we just sum the last 4 weeks of 'all' commits
    const recentCommitCount4w = stats && stats.all && stats.all.length >= 4
      ? stats.all.slice(-4).reduce((sum, n) => sum + n, 0)
      : null;

    const health: RepoHealth = {
      lastPushAt,
      defaultBranchLastCommitAt,
      openIssuesCount,
      openPullRequestsCount,
      contributorCount,
      recentCommitCount4w,
      activityStatus: classifyActivityStatus(lastPushAt),
      reviewPressure: classifyReviewPressure(openIssuesCount, openPullRequestsCount),
      communityBreadth: classifyCommunityBreadth(contributorCount),
    };

    // ── Phase 5: Dependency & Risk analysis ──
    const dependencyData = await (async () => {
      try {
        const depFiles = detectDependencyFiles(ranked);
        if (depFiles.length === 0) {
          return {
            dependencyFiles: [],
            dependencySummary: [],
            dependencyRiskSignals: generateRiskSignals([], [], false),
            dependencyRiskSummary: null,
          };
        }

        // Fetch manifest content for dependency counting.
        const filesToFetch = selectFilesToFetch(depFiles);
        const { fetchRawFileContent } = await import("@/lib/github/client");
        const contentResults = await Promise.all(
          filesToFetch.map(async (path) => {
            const content = await fetchRawFileContent(parsed.owner, parsed.repo, effectiveBranch, path, { token });
            return { path, content };
          }),
        );

        // Parse dependency counts.
        const depCounts = new Map<string, number | null>();
        let broadRangeDetected = false;
        for (const { path, content } of contentResults) {
          if (!content) continue;
          const basename = path.split("/").pop() ?? "";
          depCounts.set(path, parseManifest(basename, content));
          // Check for broad version ranges.
          if (basename === "package.json" && detectBroadVersionRanges(content)) {
            broadRangeDetected = true;
          }
          if (basename === "requirements.txt" && detectUnpinnedPythonDeps(content)) {
            broadRangeDetected = true;
          }
        }

        const summaries = buildEcosystemSummaries(depFiles, depCounts);
        const signals = generateRiskSignals(depFiles, summaries, broadRangeDetected);
        const riskSummary = buildRiskSummary(summaries, signals);

        return {
          dependencyFiles: depFiles,
          dependencySummary: summaries,
          dependencyRiskSignals: signals,
          dependencyRiskSummary: riskSummary,
        };
      } catch {
        // Dependency analysis must never fail the brief.
        return {
          dependencyFiles: [],
          dependencySummary: [],
          dependencyRiskSignals: [{
            code: "dependency_data_unavailable" as const,
            severity: "info" as const,
            message: "Dependency analysis encountered an error and is unavailable.",
          }],
          dependencyRiskSummary: null,
        };
      }
    })();

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
        health,
        openIssues,
        openPullRequests,
        ...dependencyData,
      },
    };
  } catch (e: any) {
    if (e instanceof GithubError) {
      const status = (e.status === 401 || e.status === 403 || e.status === 404 || e.status === 429 || e.status === 502)
        ? e.status
        : 502;
        
      let code: RepoAccessErrorCode | undefined = undefined;
      
      if (status === 404 && !token) code = "private_repo_requires_token";
      else if (status === 404 && token) code = "repo_not_found";
      else if (status === 401) code = "invalid_token";
      else if (status === 403) {
        if (e.message.includes("permission")) code = "insufficient_scope";
        else code = "forbidden";
      }
      else if (status === 429) code = "rate_limited";
      
      return { ok: false, status, error: e.message, code };
    }
    return {
      ok: false,
      status: 502,
      error: "Unexpected error contacting GitHub.",
    };
  }
}
