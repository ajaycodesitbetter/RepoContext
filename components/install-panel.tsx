"use client";

/**
 * Conditional install panel for repos that ship real installable binaries.
 * Only rendered when the latest stable GitHub Release contains at least one
 * asset matching the installable whitelist. Hidden entirely otherwise.
 *
 * Design: editorial/utilitarian aesthetic matching the rest of RepoContext.
 * Features staggered entrance animations and platform-grouped asset cards.
 */

import * as React from "react";
import {
  Download,
  ExternalLink,
  Shield,
  ShieldCheck,
  Copy,
  Check,
  Tag,
  Monitor,
  Apple,
  Smartphone,
  HardDrive,
  Package,
} from "lucide-react";
import type { ReleaseInfo, ReleaseAsset } from "@/lib/types";

/* ========================= Helpers ========================= */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

/** Get the file extension for display. */
function getExtBadge(name: string): string {
  const lower = name.toLowerCase();
  for (const ext of [".tar.gz", ".tar.bz2", ".tar.xz"]) {
    if (lower.endsWith(ext)) return ext;
  }
  const dot = lower.lastIndexOf(".");
  return dot >= 0 ? lower.slice(dot) : "";
}

/** Map platform label to an icon. */
function PlatformIcon({
  platform,
  className,
}: {
  platform: string | null;
  className?: string;
}) {
  const cls = className ?? "h-4 w-4";
  if (!platform) return <Package aria-hidden="true" className={cls} />;
  const p = platform.toLowerCase();
  if (p.includes("windows")) return <Monitor aria-hidden="true" className={cls} />;
  if (p.includes("macos") || p.includes("darwin"))
    return <Apple aria-hidden="true" className={cls} />;
  if (p.includes("linux")) return <HardDrive aria-hidden="true" className={cls} />;
  if (p.includes("android") || p.includes("ios"))
    return <Smartphone aria-hidden="true" className={cls} />;
  return <Package aria-hidden="true" className={cls} />;
}

/* ========================= Sub-components ========================= */

function CopyHashButton({ hash }: { hash: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(() => {
    void navigator.clipboard.writeText(hash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [hash]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy SHA-256 hash"
      className="group/copy inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 font-mono text-[10px] text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Shield aria-hidden="true" className="h-3 w-3 text-emerald-500" />
      <span className="max-w-[80px] truncate sm:max-w-[120px]">{hash}</span>
      {copied ? (
        <Check aria-hidden="true" className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy
          aria-hidden="true"
          className="h-3 w-3 opacity-0 transition-opacity group-hover/copy:opacity-100"
        />
      )}
    </button>
  );
}

function AssetCard({
  asset,
  sha256,
  index,
}: {
  asset: ReleaseAsset;
  sha256: string | null;
  index: number;
}) {
  const ext = getExtBadge(asset.name);

  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-border bg-card/10 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card/20"
      style={{
        animationDelay: `${index * 60}ms`,
        animationDuration: "400ms",
        animationFillMode: "both",
        animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Subtle shimmer on hover */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent transition-transform duration-700 group-hover:translate-x-full" />

      <div className="relative flex items-center gap-3 px-4 py-3">
        {/* Platform icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          <PlatformIcon platform={asset.platform} className="h-4.5 w-4.5" />
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="truncate font-mono text-xs font-semibold text-foreground">
              {asset.name}
            </span>
            {ext && (
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
                {ext}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            {asset.platform && (
              <span>{asset.platform}</span>
            )}
            <span className="tabular-nums">{formatBytes(asset.size)}</span>
            <span className="tabular-nums">
              {formatDownloads(asset.downloadCount)} downloads
            </span>
          </div>
        </div>

        {/* Download button */}
        <a
          href={asset.downloadUrl}
          download
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 font-mono text-[11px] font-medium text-primary-foreground transition-all hover:brightness-110 hover:shadow-[0_0_12px_rgba(var(--color-primary)/0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
        >
          <Download aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Download</span>
        </a>
      </div>

      {/* SHA-256 row */}
      {sha256 && (
        <div className="border-t border-border/50 px-4 py-2">
          <CopyHashButton hash={sha256} />
        </div>
      )}
    </div>
  );
}

/* ========================= Main Panel ========================= */

export function InstallPanel({
  release,
  owner,
  repo,
}: {
  release: ReleaseInfo;
  owner: string;
  repo: string;
}) {
  const publishDate = formatDate(release.publishedAt);
  const totalDownloads = release.assets.reduce(
    (sum, a) => sum + a.downloadCount,
    0,
  );

  return (
    <section
      aria-label="Install panel"
      className="animate-in fade-in slide-in-from-bottom-3 overflow-hidden rounded-xl border border-border bg-card/10 backdrop-blur-sm duration-500"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-border bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/15">
            <Download
              aria-hidden="true"
              className="h-3 w-3 text-emerald-600 dark:text-emerald-400"
            />
          </div>
          <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Install
          </h2>
        </div>

        {/* Tag name */}
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground">
          <Tag aria-hidden="true" className="h-2.5 w-2.5" />
          {release.tagName}
        </span>

        {release.isPrerelease && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300">
            pre-release
          </span>
        )}

        {/* Verified badge */}
        {release.trustSignals.isVerifiedPublisher && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300">
            <ShieldCheck aria-hidden="true" className="h-3 w-3" />
            Verified
          </span>
        )}

        {/* Meta */}
        <div className="ml-auto flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
          {publishDate && <span>{publishDate}</span>}
          {totalDownloads > 0 && (
            <span className="tabular-nums">
              {formatDownloads(totalDownloads)} total
            </span>
          )}
          <a
            href={release.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            Release
            <ExternalLink aria-hidden="true" className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>

      {/* Asset grid */}
      <div className="space-y-2 p-3">
        {release.assets.map((asset, i) => (
          <AssetCard
            key={asset.name}
            asset={asset}
            sha256={release.trustSignals.sha256[asset.name] ?? null}
            index={i}
          />
        ))}
      </div>

      {/* Footer hint */}
      <div className="border-t border-border/50 px-4 py-2">
        <p className="text-[10px] text-muted-foreground">
          Binaries are served directly from GitHub Releases for{" "}
          <span className="font-mono text-foreground/80">
            {owner}/{repo}
          </span>
          . Verify checksums before installing.
        </p>
      </div>
    </section>
  );
}
