/**
 * Processes raw GitHub release data into the install-panel contract.
 * Server-only — filters assets by installable whitelist, detects platforms,
 * and extracts trust signals (checksums, verified publisher).
 */
import "server-only";

import type {
  ReleaseAsset,
  ReleaseInfo,
  ReleaseTrustSignals,
} from "@/lib/types";
import type { GithubRelease } from "@/lib/github/client";

/* ========================= Extension Whitelist ========================= */

/** Extensions that qualify as real installable binaries. */
const INSTALLABLE_EXTENSIONS = new Set([
  ".exe", ".msi", ".dmg", ".pkg", ".deb", ".rpm",
  ".appimage", ".snap", ".apk", ".ipa", ".flatpak",
  ".run", ".bin",
]);

/**
 * Archive extensions — only counted as installable when they appear as
 * explicit release assets (GitHub's auto-generated source archives are
 * filtered out by checking the download URL pattern).
 */
const ARCHIVE_EXTENSIONS = new Set([
  ".zip", ".tar.gz", ".tar.bz2", ".tar.xz", ".7z",
]);

const GITHUB_AUTO_ARCHIVE_PATTERN = /\/archive\/refs\/(tags|heads)\//;

/* ========================= Platform Detection ========================= */

const PLATFORM_HINTS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /win(dows|64|32|[-_]x64|[-_]x86|[-_]amd64)?/i, label: "Windows" },
  { pattern: /mac(os|osx|[-_]arm64|[-_]x64)?|darwin/i, label: "macOS" },
  { pattern: /linux|ubuntu|debian|fedora|centos|rhel/i, label: "Linux" },
  { pattern: /android/i, label: "Android" },
  { pattern: /ios|iphone|ipad/i, label: "iOS" },
];

/** Secondary architecture hints — appended to platform if detected. */
const ARCH_HINTS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /arm64|aarch64/i, label: "ARM64" },
  { pattern: /amd64|x86[-_]64|x64/i, label: "x64" },
  { pattern: /x86|i[36]86|ia32/i, label: "x86" },
];

/* ========================= Helpers ========================= */

function getExtension(filename: string): string {
  const lower = filename.toLowerCase();
  // Check compound extensions first
  for (const ext of [".tar.gz", ".tar.bz2", ".tar.xz"]) {
    if (lower.endsWith(ext)) return ext;
  }
  const dot = lower.lastIndexOf(".");
  return dot >= 0 ? lower.slice(dot) : "";
}

function isInstallableAsset(name: string, downloadUrl: string): boolean {
  if (GITHUB_AUTO_ARCHIVE_PATTERN.test(downloadUrl)) return false;
  const ext = getExtension(name);
  if (INSTALLABLE_EXTENSIONS.has(ext)) return true;
  if (ARCHIVE_EXTENSIONS.has(ext)) return true;
  return false;
}

function isChecksumFile(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.endsWith(".sha256") ||
    lower.endsWith(".sha256sum") ||
    lower.endsWith(".sha256sums") ||
    lower === "sha256sums.txt" ||
    lower === "checksums.txt" ||
    lower.includes("checksum")
  );
}

function detectPlatform(filename: string): string | null {
  let platform: string | null = null;
  for (const { pattern, label } of PLATFORM_HINTS) {
    if (pattern.test(filename)) {
      platform = label;
      break;
    }
  }

  // Try to append architecture if we found a platform
  if (platform) {
    for (const { pattern, label } of ARCH_HINTS) {
      if (pattern.test(filename)) {
        return `${platform} (${label})`;
      }
    }
  }

  return platform;
}

/**
 * Format a file size from bytes to a human-readable string.
 * Exported for use by UI components.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/* ========================= Checksum Parsing ========================= */

/**
 * Parse SHA-256 checksum content.
 * Supports common formats:
 *   sha256hash  filename
 *   sha256hash *filename
 *   filename: sha256hash
 */
function parseChecksumContent(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split("\n").filter((l) => l.trim().length > 0);

  for (const line of lines) {
    const trimmed = line.trim();

    // Format: "hash  filename" or "hash *filename"
    const standard = trimmed.match(/^([a-f0-9]{64})\s+\*?(.+)$/i);
    if (standard) {
      result[standard[2].trim()] = standard[1].toLowerCase();
      continue;
    }

    // Format: "filename: hash"
    const reversed = trimmed.match(/^(.+?):\s*([a-f0-9]{64})$/i);
    if (reversed) {
      result[reversed[1].trim()] = reversed[2].toLowerCase();
    }
  }

  return result;
}

/**
 * Fetch and parse SHA-256 checksum files from release assets.
 * Best-effort: returns an empty record if anything fails.
 */
async function fetchChecksums(
  checksumAssets: GithubRelease["assets"],
): Promise<Record<string, string>> {
  const merged: Record<string, string> = {};

  for (const asset of checksumAssets) {
    try {
      const res = await fetch(asset.browser_download_url, {
        next: { revalidate: 3600 }, // Cache checksum files for 1 hour
      });
      if (!res.ok) continue;
      const text = await res.text();
      const parsed = parseChecksumContent(text);
      Object.assign(merged, parsed);
    } catch {
      // Best-effort — skip this checksum file
    }
  }

  return merged;
}

/* ========================= Main Processing ========================= */

/**
 * Find the latest STABLE release (not draft, not prerelease).
 * Falls back to the latest prerelease if no stable release exists.
 */
function findLatestStable(releases: GithubRelease[]): GithubRelease | null {
  const stable = releases.find((r) => !r.draft && !r.prerelease);
  if (stable) return stable;
  // Fallback: latest non-draft prerelease
  return releases.find((r) => !r.draft) ?? null;
}

/**
 * Main entry: process a list of GitHub releases into an install panel payload.
 * Returns null if no installable assets are found — the panel should be hidden.
 */
export async function processReleases(
  releases: GithubRelease[] | null,
  isVerifiedPublisher: boolean = false,
): Promise<ReleaseInfo | null> {
  if (!releases || releases.length === 0) return null;

  const release = findLatestStable(releases);
  if (!release) return null;

  // Separate installable assets from checksum files
  const installableAssets: ReleaseAsset[] = [];
  const checksumAssets: GithubRelease["assets"] = [];

  for (const asset of release.assets) {
    if (isChecksumFile(asset.name)) {
      checksumAssets.push(asset);
    } else if (isInstallableAsset(asset.name, asset.browser_download_url)) {
      installableAssets.push({
        name: asset.name,
        size: asset.size,
        downloadCount: asset.download_count,
        downloadUrl: asset.browser_download_url,
        contentType: asset.content_type,
        platform: detectPlatform(asset.name),
      });
    }
  }

  // If no installable assets → panel stays hidden
  if (installableAssets.length === 0) return null;

  // Fetch checksums from any companion .sha256 files
  const sha256 = checksumAssets.length > 0
    ? await fetchChecksums(checksumAssets)
    : {};

  const trustSignals: ReleaseTrustSignals = {
    sha256,
    isVerifiedPublisher,
  };

  return {
    tagName: release.tag_name,
    name: release.name,
    publishedAt: release.published_at,
    isPrerelease: release.prerelease,
    htmlUrl: release.html_url,
    assets: installableAssets,
    trustSignals,
  };
}
