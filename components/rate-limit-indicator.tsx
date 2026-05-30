"use client";

/**
 * Fixed-position bottom-right indicator showing GitHub API rate limit status.
 * Shows green/amber/red based on remaining requests.
 */

import { Gauge } from "lucide-react";

function getColor(remaining: number, limit: number): string {
  const pct = limit > 0 ? remaining / limit : 1;
  if (pct > 0.2) return "text-emerald-400";
  if (pct > 0.1) return "text-amber-400";
  return "text-red-400";
}

function getBgColor(remaining: number, limit: number): string {
  const pct = limit > 0 ? remaining / limit : 1;
  if (pct > 0.2) return "border-emerald-500/20 bg-emerald-500/5";
  if (pct > 0.1) return "border-amber-500/20 bg-amber-500/5";
  return "border-red-500/20 bg-red-500/5";
}

export function RateLimitIndicator({
  rateLimit,
}: {
  rateLimit?: { remaining: number; limit: number } | null;
}) {
  if (!rateLimit) return null;

  const color = getColor(rateLimit.remaining, rateLimit.limit);
  const bgColor = getBgColor(rateLimit.remaining, rateLimit.limit);

  return (
    <div
      aria-label={`GitHub API rate limit: ${rateLimit.remaining} of ${rateLimit.limit} remaining`}
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[10px] backdrop-blur-md ${bgColor}`}
    >
      <Gauge aria-hidden="true" className={`h-3 w-3 ${color}`} />
      <span className="text-muted-foreground">GitHub API</span>
      <span className="text-muted-foreground/40">·</span>
      <span className={color}>
        {rateLimit.remaining}/{rateLimit.limit}
      </span>
      <span className="text-muted-foreground/60">remaining</span>
    </div>
  );
}
