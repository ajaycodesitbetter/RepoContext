"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Check, Loader2, Archive } from "lucide-react";
import JSZip from "jszip";
import type { TreeEntry, RepoMeta } from "@/lib/types";

type Status = "idle" | "loading" | "done" | "error";

/** Extensions that are binary — skip entirely. */
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".bmp", ".webp", ".svg",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".mp4", ".mp3", ".wav", ".ogg", ".webm",
  ".pdf", ".exe", ".dmg", ".deb", ".rpm", ".apk", ".msi", ".appimage",
  ".zip", ".tar", ".gz", ".bz2", ".xz", ".7z", ".rar",
  ".bin", ".dll", ".so", ".dylib", ".class", ".pyc", ".pyo",
  ".db", ".sqlite", ".lock",
]);

function isBinaryFile(path: string): boolean {
  const lower = path.toLowerCase();
  for (const ext of BINARY_EXTENSIONS) {
    if (lower.endsWith(ext)) return true;
  }
  return false;
}

const MAX_TOTAL_SIZE = 1024 * 1024 * 2; // 2MB zip content limit

export function QuickDownloadButton({
  meta,
  topFiles,
  branch,
}: {
  meta: RepoMeta;
  topFiles: TreeEntry[];
  branch: string;
}) {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status === "done" || status === "error") {
      const id = window.setTimeout(() => setStatus("idle"), 2500);
      return () => window.clearTimeout(id);
    }
  }, [status]);

  const handleExport = useCallback(async () => {
    setStatus("loading");

    const filesToFetch = topFiles
      .filter((f) => f.type === "blob")
      .slice(0, 15);

    const zip = new JSZip();
    let totalSize = 0;
    let truncatedAtLimit = false;

    for (const file of filesToFetch) {
      if (truncatedAtLimit) break;
      if (isBinaryFile(file.path)) continue;

      try {
        const res = await fetch(
          `/api/file-content?owner=${encodeURIComponent(meta.owner)}&repo=${encodeURIComponent(meta.repo)}&branch=${encodeURIComponent(branch)}&path=${encodeURIComponent(file.path)}`,
        );

        if (!res.ok) continue;

        const content = await res.text();

        if (totalSize + content.length > MAX_TOTAL_SIZE) {
          truncatedAtLimit = true;
          break;
        }

        totalSize += content.length;
        zip.file(file.path, content);
      } catch {
        // Skip on error
      }
    }

    try {
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${meta.repo}-top-files.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }, [meta, topFiles, branch]);

  const label =
    status === "loading"
      ? "Zipping…"
      : status === "done"
        ? "Downloaded!"
        : status === "error"
          ? "Bundle failed"
          : "Quick Download";

  const Icon =
    status === "loading" ? Loader2 : status === "done" ? Check : Archive;

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={status === "loading"}
      title="Download top files as a ZIP bundle"
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
    >
      <Icon
        aria-hidden="true"
        className={`h-3 w-3 ${status === "loading" ? "animate-spin" : ""}`}
      />
      <span>{label}</span>
    </button>
  );
}
