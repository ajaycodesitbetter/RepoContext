"use client";

/**
 * Per-file "Copy as LLM prompt" button — appears on hover in the top-files list.
 * Fetches file content from /api/file-content and formats it as an LLM-ready
 * code block, then copies to clipboard.
 */

import { useCallback, useEffect, useState } from "react";
import { Copy, Check, AlertTriangle, Loader2 } from "lucide-react";

type Status = "idle" | "loading" | "copied" | "error" | "binary";

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

export function CopyFileButton({
  owner,
  repo,
  branch,
  filePath,
}: {
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
}) {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status === "copied" || status === "error" || status === "binary") {
      const id = window.setTimeout(() => setStatus("idle"), 2000);
      return () => window.clearTimeout(id);
    }
  }, [status]);

  const handleCopy = useCallback(async () => {
    if (isBinaryFile(filePath)) {
      setStatus("binary");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(
        `/api/file-content?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}&path=${encodeURIComponent(filePath)}`,
      );

      if (!res.ok) {
        setStatus("error");
        return;
      }

      const wasTruncated = res.headers.get("X-Truncated") === "true";
      const content = await res.text();
      const lang = getLanguage(filePath);
      const filename = filePath.split("/").pop() ?? filePath;

      const prompt = [
        `File: ${filename}`,
        `Path: ${owner}/${repo}/${filePath}`,
        "",
        "```" + lang,
        wasTruncated ? content + "\n[Truncated at 100KB]" : content,
        "```",
      ].join("\n");

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(prompt);
        setStatus("copied");
      } else {
        // Legacy fallback
        const ta = document.createElement("textarea");
        ta.value = prompt;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        setStatus(ok ? "copied" : "error");
      }
    } catch {
      setStatus("error");
    }
  }, [owner, repo, branch, filePath]);

  const label =
    status === "loading"
      ? ""
      : status === "copied"
        ? "Copied!"
        : status === "binary"
          ? "Binary"
          : status === "error"
            ? "Failed"
            : "";

  const Icon =
    status === "loading"
      ? Loader2
      : status === "copied"
        ? Check
        : status === "binary" || status === "error"
          ? AlertTriangle
          : Copy;

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={status === "loading"}
      title="Copy file as LLM prompt"
      aria-label={`Copy ${filePath} as LLM prompt`}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-background/80 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground opacity-0 transition-all hover:bg-muted/60 hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
    >
      <Icon
        aria-hidden="true"
        className={`h-2.5 w-2.5 ${status === "loading" ? "animate-spin" : ""}`}
      />
      {label && <span>{label}</span>}
    </button>
  );
}
