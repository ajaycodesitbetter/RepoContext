/**
 * Parse a user-supplied repo identifier into { owner, repo, branch?, subpath? }.
 *
 * Accepts:
 *   - "owner/repo"
 *   - "owner/repo.git"
 *   - "owner/repo@branch"
 *   - "github.com/owner/repo"
 *   - "https://github.com/owner/repo"            (also http://)
 *   - "https://www.github.com/owner/repo"        (case-insensitive host)
 *   - "https://github.com/owner/repo/"           (trailing slash)
 *   - "https://github.com/owner/repo.git"
 *   - "https://github.com/owner/repo/tree/<branch>"
 *   - "https://github.com/owner/repo/tree/<branch>/path/to/dir"
 *   - "https://github.com/owner/repo/blob/<branch>/<path>"
 *   - URLs with ?query and/or #fragment on any of the above
 *
 * Returns null on invalid input.
 */

export type ParsedRepo = {
  owner: string;
  repo: string;
  /** Explicit branch from the URL (undefined = use default branch). */
  branch?: string;
  /** Subdirectory path within the repo (undefined = repo root). */
  subpath?: string;
};

const OWNER_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/;
const REPO_RE = /^[a-zA-Z0-9._-]{1,100}$/;

// GitHub paths that look like /owner/repo but are reserved namespaces.
// We reject these early so the user gets a clearer error than a 404.
const RESERVED_OWNERS = new Set([
  "orgs",
  "topics",
  "marketplace",
  "sponsors",
  "settings",
  "notifications",
  "search",
  "explore",
  "trending",
  "pulls",
  "issues",
  "login",
  "logout",
  "signup",
  "new",
  "about",
  "contact",
  "pricing",
  "features",
  "security",
  "codespaces",
  "collections",
]);

export function parseRepoUrl(input: string): ParsedRepo | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Strip query/fragment up front so they don't contaminate any path segment.
  const withoutQuery = trimmed.split(/[?#]/, 1)[0]!;

  let owner: string | undefined;
  let repo: string | undefined;
  let branch: string | undefined;
  let subpath: string | undefined;

  // Detect a github.com URL case-insensitively, with or without protocol or www.
  const looksLikeUrl = /github\.com/i.test(withoutQuery);

  if (looksLikeUrl) {
    // Strip protocol, then optional "www." prefix.
    const withoutProto = withoutQuery.replace(/^https?:\/\//i, "");
    const withoutWww = withoutProto.replace(/^www\./i, "");
    const parts = withoutWww.split("/").filter(Boolean);
    // parts[0] should now be "github.com" (case-insensitive)
    if (!parts[0] || parts[0].toLowerCase() !== "github.com" || parts.length < 3) {
      return null;
    }
    owner = parts[1];
    repo = parts[2];

    // Extract branch and subpath from /tree/<branch>/... or /blob/<branch>/...
    if (parts.length >= 5 && (parts[3] === "tree" || parts[3] === "blob")) {
      branch = parts[4];
      if (parts.length > 5) {
        subpath = parts.slice(5).join("/");
      }
    }
  } else {
    // Shorthand parsing
    // Check for owner/repo@branch syntax first
    const atIdx = withoutQuery.indexOf("@");
    let toParse = withoutQuery;
    if (atIdx > 0) {
      branch = withoutQuery.slice(atIdx + 1);
      toParse = withoutQuery.slice(0, atIdx);
    }

    const parts = toParse.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    owner = parts[0];
    repo = parts[1];

    // If no @ branch but has /tree/<branch>/... in shorthand
    if (!branch && parts.length >= 4 && parts[2] === "tree") {
      branch = parts[3];
      if (parts.length > 4) {
        subpath = parts.slice(4).join("/");
      }
    }
  }

  if (!owner || !repo) return null;

  // Strip ".git" suffix on the repo segment.
  repo = repo.replace(/\.git$/i, "");

  if (RESERVED_OWNERS.has(owner.toLowerCase())) return null;
  if (!OWNER_RE.test(owner)) return null;
  if (!REPO_RE.test(repo)) return null;

  const result: ParsedRepo = { owner, repo };
  if (branch) result.branch = branch;
  if (subpath) result.subpath = subpath;
  return result;
}
