"use client";

/**
 * "Export for LLM" button — downloads a .md file containing the top ranked
 * files' actual content, formatted for pasting into an LLM context window.
 */

import { useCallback, useEffect, useState } from "react";
import { Download, Check, Loader2 } from "lucide-react";
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

function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
    py: "python", rb: "ruby", go: "go", rs: "rust",
    java: "java", cs: "csharp", cpp: "cpp", c: "c", h: "c",
    html: "html", css: "css", scss: "scss", json: "json",
    yaml: "yaml", yml: "yaml", toml: "toml", xml: "xml",
    md: "markdown", sh: "bash", bash: "bash", zsh: "bash",
    sql: "sql", dockerfile: "dockerfile",
  };
  return map[ext] ?? "";
}

const MAX_TOTAL_SIZE = 500 * 1024; // 500KB

export function ExportLlmButton({
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
      .slice(0, 10);

    const parts: string[] = [
      `# RepoContext Export — ${meta.owner}/${meta.repo}`,
      `Generated: ${new Date().toISOString().split("T")[0]}`,
      "",
      "***",
    ];

    let totalSize = 0;
    let truncatedAtLimit = false;

    for (const file of filesToFetch) {
      if (truncatedAtLimit) break;

      if (isBinaryFile(file.path)) {
        parts.push("", `## ${file.path}`, "", `[Binary file — skipped]`, "", "***");
        continue;
      }

      try {
        const res = await fetch(
          `/api/file-content?owner=${encodeURIComponent(meta.owner)}&repo=${encodeURIComponent(meta.repo)}&branch=${encodeURIComponent(branch)}&path=${encodeURIComponent(file.path)}`,
        );

        if (!res.ok) {
          parts.push("", `## ${file.path}`, "", `[Could not fetch — HTTP ${res.status}]`, "", "***");
          continue;
        }

        const wasTruncated = res.headers.get("X-Truncated") === "true";
        const content = await res.text();

        // Check total size limit
        if (totalSize + content.length > MAX_TOTAL_SIZE) {
          parts.push("", `---`, "", `> Export truncated at 500KB. ${filesToFetch.length - filesToFetch.indexOf(file)} file(s) omitted.`);
          truncatedAtLimit = true;
          break;
        }

        totalSize += content.length;
        const lang = getLanguage(file.path);

        parts.push(
          "",
          `## ${file.path}`,
          "",
          "```" + lang,
          wasTruncated ? content + "\n[Truncated at 100KB]" : content,
          "```",
          "",
          "***",
        );
      } catch {
        parts.push("", `## ${file.path}`, "", `[Fetch error — skipped]`, "", "***");
      }
    }

    const markdown = parts.join("\n");

    // Trigger download
    try {
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `repocontext-${meta.owner}-${meta.repo}.md`;
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
      ? "Exporting…"
      : status === "done"
        ? "Downloaded!"
        : status === "error"
          ? "Export failed"
          : "Export for LLM";

  const Icon =
    status === "loading" ? Loader2 : status === "done" ? Check : Download;

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={status === "loading"}
      title="Download top files as a Markdown context pack for LLM"
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
