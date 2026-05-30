/**
 * Server-only thin wrapper around the GitHub REST API.
 *
 * Uses GITHUB_TOKEN when present to raise rate limits.
 * Never imported into a client component.
 */
import "server-only";

const GITHUB_API = "https://api.github.com";
const REVALIDATE_SECONDS = 300;

export type GithubFetchError = {
  status: number;
  message: string;
};

export class GithubError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "GithubError";
    this.status = status;
  }
}

function authHeaders(userToken?: string): Record<string, string> {
  const token = userToken || process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "RepoContext/0.1 (+https://repocontext.local)",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/* ========================= Rate Limit Tracking ========================= */

/** Module-scoped capture of the last seen rate limit headers. */
let lastRateLimit: { remaining: number; limit: number } | null = null;

/** Returns the most recent rate limit values extracted from GitHub responses. */
export function getLastRateLimit(): { remaining: number; limit: number } | null {
  return lastRateLimit;
}

export type GithubRequestOptions = {
  token?: string | null;
};

async function gh<T>(path: string, options?: GithubRequestOptions): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: authHeaders(options?.token || undefined),
    next: { revalidate: REVALIDATE_SECONDS },
  });

  // Capture rate limit headers from every response (success or error).
  const remaining = res.headers.get("x-ratelimit-remaining");
  const limit = res.headers.get("x-ratelimit-limit");
  if (remaining && limit) {
    lastRateLimit = { remaining: Number(remaining), limit: Number(limit) };
  }

  if (res.status === 200) {
    return (await res.json()) as T;
  }

  if (res.status === 404) {
    if (options?.token) {
      throw new GithubError(404, "Repository not found. It may not exist, or your token may lack the required permissions.");
    }
    throw new GithubError(404, "Repository not found. It may be private (add a GitHub token to access it), or it may not exist.");
  }
  
  if (res.status === 401) {
    throw new GithubError(401, "Your GitHub token appears invalid or expired.");
  }

  if (res.status === 403 && remaining && Number(remaining) > 0) {
    throw new GithubError(403, "Your token does not have permission to access this repository.");
  }

  if (res.status === 403 || res.status === 429) {
    throw new GithubError(429, buildRateLimitMessage(res, !!options?.token));
  }

  let detail = `GitHub returned ${res.status}.`;
  try {
    const body = (await res.json()) as { message?: string };
    if (body?.message) detail = `GitHub: ${body.message}`;
  } catch {
    // ignore parse errors
  }
  throw new GithubError(502, detail);
}

/**
 * Build a human-readable rate-limit message from GitHub's response headers.
 * Handles both primary rate limits (x-ratelimit-* headers) and secondary
 * rate limits (retry-after header).
 *
 * Exported for unit tests; not part of the public module surface.
 */
export function buildRateLimitMessage(res: Response, usedUserToken: boolean = false): string {
  const remaining = res.headers.get("x-ratelimit-remaining");
  const resetHeader = res.headers.get("x-ratelimit-reset");
  const retryAfter = res.headers.get("retry-after");
  const tokenHint = (usedUserToken || process.env.GITHUB_TOKEN)
    ? " Try again later or use a different token."
    : " Set a GitHub token to raise the limit from 60 to 5,000 requests per hour.";

  // Primary rate limit: budget exhausted, x-ratelimit-reset is a Unix timestamp.
  if (remaining === "0" && resetHeader) {
    const resetSec = Number(resetHeader);
    if (Number.isFinite(resetSec)) {
      const waitSec = Math.max(0, resetSec - Math.floor(Date.now() / 1000));
      return `GitHub API rate limit exceeded. ${formatWait(waitSec)}${tokenHint}`;
    }
  }

  // Secondary / abuse rate limit: GitHub returns Retry-After in seconds.
  if (retryAfter) {
    const waitSec = Number(retryAfter);
    if (Number.isFinite(waitSec)) {
      return `GitHub asked us to slow down. ${formatWait(waitSec)}`;
    }
  }

  if (remaining === "0") {
    return `GitHub API rate limit exceeded. Try again later.${tokenHint}`;
  }

  return `GitHub denied the request (HTTP ${res.status}).${tokenHint}`;
}

function formatWait(seconds: number): string {
  if (seconds <= 0) return "Try again now.";
  if (seconds < 60) return `Try again in ${seconds} second${seconds === 1 ? "" : "s"}.`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
  const hours = Math.ceil(minutes / 60);
  return `Try again in ${hours} hour${hours === 1 ? "" : "s"}.`;
}

export type GithubRepoResponse = {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  default_branch: string;
  fork: boolean;
  private: boolean;
  owner: { login: string };
  open_issues_count: number;
  pushed_at: string | null;
};

export type GithubTreeNode = {
  path: string;
  type: "blob" | "tree" | "commit";
  size?: number;
};

export type GithubTreeResponse = {
  sha: string;
  truncated: boolean;
  tree: GithubTreeNode[];
};

export async function fetchRepo(owner: string, repo: string, options?: GithubRequestOptions): Promise<GithubRepoResponse> {
  return gh<GithubRepoResponse>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, options);
}

export async function fetchTree(
  owner: string,
  repo: string,
  branch: string,
  options?: GithubRequestOptions
): Promise<GithubTreeResponse> {
  return gh<GithubTreeResponse>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    options
  );
}

/**
 * Public profile for a GitHub user OR organization. Both account types are
 * served by /users/{login} and both expose a public `location` string.
 */
export type GithubOwnerProfile = {
  login: string;
  type: "User" | "Organization" | string;
  location: string | null;
  name?: string | null;
  blog?: string | null;
};

export async function fetchOwnerProfile(login: string, options?: GithubRequestOptions): Promise<GithubOwnerProfile> {
  return gh<GithubOwnerProfile>(`/users/${encodeURIComponent(login)}`, options);
}

export function hasGithubToken(): boolean {
  return !!process.env.GITHUB_TOKEN;
}

/* ========================= Releases ========================= */

export type GithubReleaseAsset = {
  name: string;
  size: number;
  download_count: number;
  browser_download_url: string;
  content_type: string;
};

export type GithubRelease = {
  tag_name: string;
  name: string | null;
  published_at: string | null;
  prerelease: boolean;
  draft: boolean;
  html_url: string;
  assets: GithubReleaseAsset[];
};

/**
 * Fetch releases for a repo, sorted by creation date (newest first).
 * Returns up to 10 releases to find the latest stable one.
 * Returns null (not throws) if the repo has no releases — this is
 * a non-critical, best-effort enhancement.
 */
export async function fetchReleases(
  owner: string,
  repo: string,
  options?: GithubRequestOptions
): Promise<GithubRelease[] | null> {
  try {
    return await gh<GithubRelease[]>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases?per_page=10`,
      options
    );
  } catch {
    // Releases are best-effort. A 404 (no releases) or any other
    // error should never fail the main brief.
    return null;
  }
}

/* ========================= Organization Verification ========================= */

export type GithubOrg = {
  login: string;
  is_verified?: boolean;
};

/**
 * Check if a GitHub organization is verified. Returns false for user accounts
 * or if the API call fails — never throws.
 */
export async function fetchOrgVerification(login: string, options?: GithubRequestOptions): Promise<boolean> {
  try {
    const org = await gh<GithubOrg>(`/orgs/${encodeURIComponent(login)}`, options);
    return org.is_verified === true;
  } catch {
    return false;
  }
}

/* ========================= Phase 3.2 Additions ========================= */

export type GithubIssue = {
  number: number;
  title: string;
  user: { login: string } | null;
  comments: number;
  created_at: string;
  updated_at: string;
  html_url: string;
  pull_request?: any;
  draft?: boolean;
};

export async function fetchIssuesAndPrs(owner: string, repo: string, options?: GithubRequestOptions): Promise<GithubIssue[] | null> {
  try {
    return await gh<GithubIssue[]>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=open&sort=updated&direction=desc&per_page=100`, options);
  } catch {
    return null;
  }
}

export type GithubContributor = {
  login: string;
};

export async function fetchContributors(owner: string, repo: string, options?: GithubRequestOptions): Promise<GithubContributor[] | null> {
  try {
    return await gh<GithubContributor[]>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contributors?per_page=100`, options);
  } catch {
    return null;
  }
}

export type GithubParticipationStats = {
  all: number[];
  owner: number[];
};

export async function fetchParticipationStats(owner: string, repo: string, options?: GithubRequestOptions): Promise<GithubParticipationStats | null> {
  try {
    return await gh<GithubParticipationStats>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/stats/participation`, options);
  } catch {
    return null;
  }
}

export type GithubCommitResponse = {
  commit: {
    author: {
      date: string;
    };
  };
};

export async function fetchCommit(owner: string, repo: string, ref: string, options?: GithubRequestOptions): Promise<GithubCommitResponse | null> {
  try {
    return await gh<GithubCommitResponse>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(ref)}`, options);
  } catch {
    return null;
  }
}

/* ========================= Phase 5: Raw File Content ========================= */

const MAX_MANIFEST_SIZE = 256 * 1024; // 256KB — generous for any manifest.

/**
 * Fetch raw file content from GitHub. Best-effort: returns null on any
 * failure. Used for dependency manifest parsing.
 */
export async function fetchRawFileContent(
  owner: string,
  repo: string,
  branch: string,
  path: string,
  options?: GithubRequestOptions,
): Promise<string | null> {
  try {
    const token = options?.token || process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
      "User-Agent": "RepoContext/0.1 (+https://repocontext.local)",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const url = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}/${path}`;
    const res = await fetch(url, { headers, next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.length > MAX_MANIFEST_SIZE) return text.slice(0, MAX_MANIFEST_SIZE);
    return text;
  } catch {
    return null;
  }
}
