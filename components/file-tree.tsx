"use client";

import * as React from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Eye,
  Download,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFileIconInfo } from "@/lib/file-icons";
import type { TreeEntry } from "@/lib/types";

type Node = {
  name: string;
  path: string;
  type: "blob" | "tree";
  size: number | null;
  importanceScore: number;
  children: Node[];
};

function buildNodes(entries: TreeEntry[]): Node[] {
  const sorted = [...entries].sort((a, b) => {
    if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  const map = new Map<string, Node>();
  const roots: Node[] = [];

  for (const e of sorted) {
    const parts = e.path.split("/");
    const node: Node = {
      name: parts[parts.length - 1]!,
      path: e.path,
      type: e.type,
      size: e.size,
      importanceScore: e.importanceScore,
      children: [],
    };
    map.set(e.path, node);

    if (parts.length === 1) {
      roots.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join("/");
      const parent = map.get(parentPath);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
  }
  return roots;
}

function formatSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Collect all blob paths from a node subtree. */
function collectBlobPaths(node: Node): string[] {
  if (node.type === "blob") return [node.path];
  return node.children.flatMap(collectBlobPaths);
}

function Row({
  node,
  depth,
  importantSet,
  selectedPaths,
  repoSlug,
  branch,
  onToggleSelect,
  onPreview,
}: {
  node: Node;
  depth: number;
  importantSet: Set<string>;
  selectedPaths: Set<string>;
  repoSlug: string;
  branch: string;
  onToggleSelect: (path: string, isDir: boolean, blobPaths?: string[]) => void;
  onPreview: (path: string) => void;
}) {
  const [open, setOpen] = React.useState(depth < 2);
  const isDir = node.type === "tree";
  const isImportant = importantSet.has(node.path);
  const fileIcon = !isDir ? getFileIconInfo(node.path) : null;
  const FileIcon = fileIcon?.Icon;

  const isChecked = isDir
    ? (() => {
        const blobs = collectBlobPaths(node);
        return blobs.length > 0 && blobs.every((p) => selectedPaths.has(p));
      })()
    : selectedPaths.has(node.path);

  const isIndeterminate = isDir && !isChecked && (() => {
    const blobs = collectBlobPaths(node);
    return blobs.some((p) => selectedPaths.has(p));
  })();

  const checkboxRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = !!isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (isDir) {
      const blobs = collectBlobPaths(node);
      onToggleSelect(node.path, true, blobs);
    } else {
      onToggleSelect(node.path, false);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview(node.path);
  };

  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-1.5 rounded-md py-0.5 pr-2 text-sm transition-colors",
          isDir ? "cursor-pointer hover:bg-muted/60" : "hover:bg-muted/40",
          isImportant && !isDir && "bg-amber-50/40 dark:bg-amber-950/10",
          !isDir && isChecked && "bg-primary/5",
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => isDir && setOpen((v) => !v)}
        role={isDir ? "button" : undefined}
        aria-expanded={isDir ? open : undefined}
        tabIndex={isDir ? 0 : -1}
        onKeyDown={(e) => {
          if (isDir && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setOpen((v) => !v);
          }
          // 'p' key opens preview for files
          if (!isDir && e.key === "p") {
            e.preventDefault();
            onPreview(node.path);
          }
        }}
      >
        {/* Checkbox */}
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={isChecked}
          onChange={handleCheckbox}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${node.name}`}
          className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-muted-foreground/40 accent-primary opacity-60 transition-opacity group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 sm:has-[:checked]:opacity-100"
          style={isChecked || isIndeterminate ? { opacity: 1 } : undefined}
        />

        <span
          aria-hidden="true"
          className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center text-muted-foreground"
        >
          {isDir ? (
            open ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )
          ) : null}
        </span>

        {isDir ? (
          open ? (
            <FolderOpen aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-500" />
          ) : (
            <Folder aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-500" />
          )
        ) : (
          FileIcon && (
            <FileIcon
              aria-hidden="true"
              className={cn("h-4 w-4 shrink-0", fileIcon.colorClass)}
            />
          )
        )}

        <span
          className={cn(
            "min-w-0 flex-1 truncate font-mono text-[13px] leading-tight",
            isImportant && !isDir
              ? "font-semibold text-foreground"
              : isDir
                ? "text-foreground"
                : "text-foreground/85",
          )}
        >
          {node.name}
          {isDir && <span className="text-muted-foreground">/</span>}
        </span>

        {isImportant && !isDir && node.importanceScore > 0 && (
          <span
            title={`Importance score: ${node.importanceScore}`}
            className="shrink-0 rounded border border-amber-200 bg-amber-50 px-1.5 py-0 font-mono text-[10px] font-medium tabular-nums text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300"
          >
            {node.importanceScore}
          </span>
        )}

        {/* Preview button — files only */}
        {!isDir && (
          <button
            type="button"
            onClick={handlePreviewClick}
            title="Preview file (p)"
            aria-label={`Preview ${node.name}`}
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/60 opacity-70 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Eye className="h-3 w-3" />
          </button>
        )}

        {/* Direct Download button — files only */}
        {!isDir && (
          <a
            href={`/api/file?repo=${encodeURIComponent(repoSlug)}&path=${encodeURIComponent(node.path)}&ref=${encodeURIComponent(branch)}&download=true`}
            download={node.name}
            title="Download file"
            aria-label={`Download ${node.name}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/60 opacity-70 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download className="h-3 w-3" />
          </a>
        )}

        {!isDir && node.size != null && (
          <span className="hidden shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:inline">
            {formatSize(node.size)}
          </span>
        )}
      </div>

      {isDir && open && node.children.length > 0 && (
        <ul>
          {node.children.map((c) => (
            <Row
              key={c.path}
              node={c}
              depth={depth + 1}
              importantSet={importantSet}
              selectedPaths={selectedPaths}
              repoSlug={repoSlug}
              branch={branch}
              onToggleSelect={onToggleSelect}
              onPreview={onPreview}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function FileTree({
  entries,
  topFiles,
  selectedPaths,
  repoSlug,
  branch,
  onToggleSelect,
  onPreview,
}: {
  entries: TreeEntry[];
  topFiles: TreeEntry[];
  selectedPaths: Set<string>;
  repoSlug: string;
  branch: string;
  onToggleSelect: (path: string, isDir: boolean, blobPaths?: string[]) => void;
  onPreview: (path: string) => void;
}) {
  const tree = React.useMemo(() => buildNodes(entries), [entries]);
  const importantSet = React.useMemo(
    () => new Set(topFiles.map((f) => f.path)),
    [topFiles],
  );

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No files found in this repository.
      </p>
    );
  }

  return (
    <ul className="py-1">
      {tree.map((n) => (
        <Row
          key={n.path}
          node={n}
          depth={0}
          importantSet={importantSet}
          selectedPaths={selectedPaths}
          repoSlug={repoSlug}
          branch={branch}
          onToggleSelect={onToggleSelect}
          onPreview={onPreview}
        />
      ))}
    </ul>
  );
}

/* ====================== Download Selected Toolbar ====================== */

export function DownloadToolbar({
  selectedCount,
  loading,
  onDownload,
  onClearSelection,
}: {
  selectedCount: number;
  loading: boolean;
  onDownload: () => void;
  onClearSelection: () => void;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-lg border border-primary/30 bg-background/95 p-3 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:w-auto">
      <span className="font-mono text-xs text-foreground">
        <span className="font-semibold tabular-nums">{selectedCount}</span> file
        {selectedCount !== 1 ? "s" : ""} selected
      </span>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onClearSelection}
        className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        clear
      </button>
      <button
        type="button"
        onClick={onDownload}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors",
          "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        Download Selected ({selectedCount})
      </button>
    </div>
  );
}
