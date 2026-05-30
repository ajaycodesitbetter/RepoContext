/**
 * Deterministic mock response used when GITHUB_TOKEN is missing.
 * Exercises every UI state: description, stars/forks, mix of files+folders,
 * several "important" files, dark/light handling.
 */
import "server-only";

import type { BriefResponse, ReleaseInfo } from "@/lib/types";
import { rankFiles, pickTopFiles } from "@/lib/github/rank-files";
import { inferOwnerLocation } from "@/lib/github/infer-location";
import { detectProjectType } from "@/lib/analysis/detect-project-type";
import { buildOnboarding } from "@/lib/analysis/onboarding";

const MOCK_OWNER = "octocat";
const MOCK_REPO = "hello-world";

const MOCK_TREE_RAW: Array<{ path: string; type: "blob" | "tree"; size: number | null }> = [
  { path: "README.md", type: "blob", size: 4821 },
  { path: "LICENSE", type: "blob", size: 1071 },
  { path: "package.json", type: "blob", size: 1342 },
  { path: "tsconfig.json", type: "blob", size: 612 },
  { path: ".gitignore", type: "blob", size: 240 },
  { path: "next.config.ts", type: "blob", size: 198 },
  { path: "tailwind.config.ts", type: "blob", size: 412 },
  { path: ".env.example", type: "blob", size: 88 },
  { path: "docs", type: "tree", size: null },
  { path: "docs/ARCHITECTURE.md", type: "blob", size: 5210 },
  { path: "docs/CONTRIBUTING.md", type: "blob", size: 1820 },
  { path: "src", type: "tree", size: null },
  { path: "src/index.ts", type: "blob", size: 312 },
  { path: "src/server.ts", type: "blob", size: 2104 },
  { path: "src/utils", type: "tree", size: null },
  { path: "src/utils/format.ts", type: "blob", size: 822 },
  { path: "src/utils/log.ts", type: "blob", size: 510 },
  { path: "src/components", type: "tree", size: null },
  { path: "src/components/Button.tsx", type: "blob", size: 1430 },
  { path: "src/components/Card.tsx", type: "blob", size: 980 },
  { path: "src/components/Header.tsx", type: "blob", size: 1620 },
  { path: "tests", type: "tree", size: null },
  { path: "tests/server.test.ts", type: "blob", size: 1840 },
  { path: "tests/utils.test.ts", type: "blob", size: 740 },
  { path: "scripts", type: "tree", size: null },
  { path: "scripts/build.sh", type: "blob", size: 312 },
  { path: "public", type: "tree", size: null },
  { path: "public/logo.svg", type: "blob", size: 1180 },
];

/* ========================= Mock Release ========================= */

const MOCK_RELEASE: ReleaseInfo = {
  tagName: "v2.1.0",
  name: "v2.1.0 — Stable Release",
  publishedAt: "2026-04-15T10:30:00Z",
  isPrerelease: false,
  htmlUrl: "https://github.com/octocat/hello-world/releases/tag/v2.1.0",
  assets: [
    {
      name: "hello-world-2.1.0-win-x64.exe",
      size: 45_200_000,
      downloadCount: 12_840,
      downloadUrl:
        "https://github.com/octocat/hello-world/releases/download/v2.1.0/hello-world-2.1.0-win-x64.exe",
      contentType: "application/octet-stream",
      platform: "Windows (x64)",
    },
    {
      name: "hello-world-2.1.0-macos-arm64.dmg",
      size: 52_100_000,
      downloadCount: 8_320,
      downloadUrl:
        "https://github.com/octocat/hello-world/releases/download/v2.1.0/hello-world-2.1.0-macos-arm64.dmg",
      contentType: "application/octet-stream",
      platform: "macOS (ARM64)",
    },
    {
      name: "hello-world-2.1.0-linux-x64.AppImage",
      size: 48_700_000,
      downloadCount: 6_150,
      downloadUrl:
        "https://github.com/octocat/hello-world/releases/download/v2.1.0/hello-world-2.1.0-linux-x64.AppImage",
      contentType: "application/octet-stream",
      platform: "Linux (x64)",
    },
  ],
  trustSignals: {
    sha256: {
      "hello-world-2.1.0-win-x64.exe":
        "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
      "hello-world-2.1.0-macos-arm64.dmg":
        "f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
    },
    isVerifiedPublisher: true,
  },
};

export function buildMockResponse(
  ownerOverride?: string,
  repoOverride?: string,
): BriefResponse {
  const ranked = rankFiles(MOCK_TREE_RAW);
  const topFiles = pickTopFiles(ranked, 10);
  const projectType = detectProjectType(ranked);
  const onboarding = buildOnboarding(ranked, topFiles, projectType);
  // Sample owner location to exercise the inference + globe highlight UI.
  const inferred = inferOwnerLocation("San Francisco, CA");

  return {
    meta: {
      owner: ownerOverride ?? MOCK_OWNER,
      repo: repoOverride ?? MOCK_REPO,
      description:
        "Mock repository used when GITHUB_TOKEN is not configured. Demonstrates the full RepoContext UI without hitting the GitHub API.",
      stars: 12483,
      forks: 1924,
      language: "TypeScript",
      defaultBranch: "main",
      isForked: false,
      isMock: true,
      ownerLocationRaw: inferred.ownerLocationRaw,
      ownerCountry: inferred.ownerCountry,
      ownerCountryCode: inferred.ownerCountryCode,
      locationConfidence: inferred.locationConfidence,
    },
    tree: ranked,
    topFiles,
    projectType,
    onboarding,
    treeTruncated: false,
    release: MOCK_RELEASE,
    health: {
      lastPushAt: "2026-05-29T10:00:00Z",
      defaultBranchLastCommitAt: "2026-05-29T09:58:12Z",
      openIssuesCount: 42,
      openPullRequestsCount: 5,
      contributorCount: 15,
      recentCommitCount4w: 32,
      activityStatus: "active",
      reviewPressure: "moderate",
      communityBreadth: "broad",
    },
    openIssues: [
      {
        number: 101,
        title: "Mock issue 1",
        author: "mockuser",
        comments: 12,
        createdAt: "2026-05-20T10:00:00Z",
        updatedAt: "2026-05-28T10:00:00Z",
        url: "#",
      },
      {
        number: 102,
        title: "Mock issue 2",
        author: "mockuser2",
        comments: 2,
        createdAt: "2026-05-25T10:00:00Z",
        updatedAt: "2026-05-26T10:00:00Z",
        url: "#",
      },
    ],
    openPullRequests: [
      {
        number: 103,
        title: "Mock PR 1",
        author: "mockuser3",
        comments: 5,
        createdAt: "2026-05-28T10:00:00Z",
        updatedAt: "2026-05-29T10:00:00Z",
        url: "#",
      },
    ],
  };
}
