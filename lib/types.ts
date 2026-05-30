/**
 * Shared TS types for the RepoContext API contract.
 * Imported directly by both server (route handler) and client (UI) — no codegen.
 */

export type LocationConfidence = "high" | "medium" | "low" | "none";

export type RepoMeta = {
  owner: string;
  repo: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  defaultBranch: string;
  isForked: boolean;
  isMock: boolean;

  /**
   * Inferred owner-location fields. Derived from the public `location` string
   * on the repository owner's GitHub profile via deterministic mapping
   * (no external geocoding). NEVER claims the repository is "from" anywhere —
   * UI must surface this as the OWNER'S country, not the repo's.
   */
  ownerLocationRaw: string | null;
  ownerCountry: string | null;
  ownerCountryCode: string | null;
  locationConfidence: LocationConfidence;

  /** The branch being explored (may differ from defaultBranch when a URL includes /tree/<branch>). */
  exploredBranch?: string;
  /** Subdirectory being explored (only set if a subpath was requested). */
  exploredSubpath?: string;
};

export type TreeEntry = {
  path: string;
  type: "blob" | "tree";
  size: number | null;
  importanceScore: number;
};

export type ProjectTypeConfidence = "high" | "medium" | "low";

/**
 * Heuristically-detected project / framework type for the repo.
 * Built from the file tree alone — no GitHub API contents read.
 */
export type ProjectType = {
  label: string;
  confidence: ProjectTypeConfidence;
  reason: string;
  hint: string;
};

export type OnboardingItem = {
  path: string;
  reason: string;
  /** 1-indexed reading order. */
  order: number;
};

/**
 * Deterministic developer-onboarding brief: which file is the entry
 * point, which directories matter, and what to read first.
 */
export type OnboardingBrief = {
  entryPoint: string | null;
  importantDirs: string[];
  readingList: OnboardingItem[];
};

/** A single downloadable asset from a GitHub Release. */
export type ReleaseAsset = {
  name: string;
  size: number;
  downloadCount: number;
  downloadUrl: string;
  contentType: string;
  /** Detected platform from filename heuristics (e.g. "Windows", "macOS", "Linux"). */
  platform: string | null;
};

/** Trust signals associated with a release. */
export type ReleaseTrustSignals = {
  /** SHA-256 hash if a companion .sha256 asset exists in the release. */
  sha256: Record<string, string>;
  /** Whether the GitHub org that owns the repo is verified. */
  isVerifiedPublisher: boolean;
};

/** Processed release data for the install panel. */
export type ReleaseInfo = {
  tagName: string;
  name: string | null;
  publishedAt: string | null;
  isPrerelease: boolean;
  htmlUrl: string;
  assets: ReleaseAsset[];
  trustSignals: ReleaseTrustSignals;
};

export type BriefResponse = {
  meta: RepoMeta;
  tree: TreeEntry[];
  topFiles: TreeEntry[];
  /** Detected project / framework type (null if no signal matched). */
  projectType: ProjectType | null;
  /** Where to start reading and what directories matter. */
  onboarding: OnboardingBrief;
  /**
   * True when GitHub returned a partial tree (the recursive tree endpoint
   * truncates above ~100k entries or 7MB). The UI surfaces a warning so the
   * user knows the file list isn't exhaustive.
   */
  treeTruncated: boolean;
  /** Release info — only present when the latest stable release has installable assets. */
  release: ReleaseInfo | null;
  /** Latest pre-release (if it has installable assets and is newer than stable). */
  prerelease?: ReleaseInfo | null;
  /** Rate limit info from the last GitHub API response — used for the UI indicator. */
  rateLimit?: { remaining: number; limit: number } | null;

  // --- Phase 3.2 Additions ---
  health?: RepoHealth;
  openIssues?: RepoWorkItem[];
  openPullRequests?: RepoWorkItem[];

  // --- Phase 5 Additions ---
  dependencyFiles?: DependencyFileEvidence[];
  dependencySummary?: EcosystemDependencySummary[];
  dependencyRiskSignals?: DependencyRiskSignal[];
  dependencyRiskSummary?: DependencyRiskSummary | null;
};

/* ========================= Phase 5: Dependency & Risk ========================= */

export type DependencyEcosystem = "node" | "python" | "go" | "rust";

export type DependencyFileEvidence = {
  path: string;
  kind: "manifest" | "lockfile";
  ecosystem: DependencyEcosystem;
};

export type EcosystemDependencySummary = {
  ecosystem: DependencyEcosystem;
  manifests: string[];
  lockfiles: string[];
  directDependencyCount: number | null;
  hasLockfile: boolean;
};

export type DependencyRiskSignalCode =
  | "manifest_without_lockfile"
  | "multiple_ecosystems"
  | "broad_version_ranges"
  | "known_vulnerability_indicator"
  | "dependency_data_unavailable"
  | "no_dependency_manifests";

export type DependencyRiskSignal = {
  code: DependencyRiskSignalCode;
  severity: "info" | "warning" | "high";
  message: string;
};

export type DependencyHygiene = "strong" | "mixed" | "weak";
export type SupplyChainExposure = "low" | "moderate" | "high";

export type DependencyRiskSummary = {
  hygiene: DependencyHygiene | null;
  supplyChainExposure: SupplyChainExposure | null;
};

/* ========================= Health Types ========================= */

export type HealthStatus = "active" | "slowing" | "stale";
export type ReviewPressure = "low" | "moderate" | "high";
export type CommunityBreadth = "solo" | "small-team" | "broad";

export type RepoHealth = {
  lastPushAt: string | null;
  defaultBranchLastCommitAt: string | null;
  openIssuesCount: number | null;
  openPullRequestsCount: number | null;
  contributorCount: number | null;
  recentCommitCount4w: number | null;
  activityStatus: HealthStatus | null;
  reviewPressure: ReviewPressure | null;
  communityBreadth: CommunityBreadth | null;
};

export type RepoWorkItem = {
  number: number;
  title: string;
  author: string | null;
  comments: number;
  createdAt: string;
  updatedAt: string;
  url: string;
  isDraft?: boolean;
};

export type RepoAccessErrorCode =
  | "repo_not_found"
  | "private_repo_requires_token"
  | "invalid_token"
  | "insufficient_scope"
  | "forbidden"
  | "rate_limited";

export type ApiError = {
  error: string;
  code?: RepoAccessErrorCode;
};

/** Status codes the route handler may return. */
export type ApiStatus = 200 | 400 | 401 | 403 | 404 | 429 | 502;

