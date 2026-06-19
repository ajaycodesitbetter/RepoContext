"use client";

/**
 * File preview dialog — renders the first 16 KB of a file in a modal overlay.
 * Uses the native <dialog> element for accessibility (focus trap, ESC dismiss).
 */

import * as React from "react";
import { X, Loader2, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilePreviewResponse } from "@/lib/types";

type PreviewState = {
  isOpen: boolean;
  path: string | null;
  content: string | null;
  truncated: boolean;
  size: number | null;
  loading: boolean;
  error: string | null;
};

const initialState: PreviewState = {
  isOpen: false,
  path: null,
  content: null,
  truncated: false,
  size: null,
  loading: false,
  error: null,
};

export function useFilePreview(repo: string, ref: string) {
  const [state, setState] = React.useState<PreviewState>(initialState);

  const openPreview = React.useCallback(
    async (path: string) => {
      setState({
        isOpen: true,
        path,
        content: null,
        truncated: false,
        size: null,
        loading: true,
        error: null,
      });

      try {
        const params = new URLSearchParams({ repo, path, ref });
        const res = await fetch(`/api/file?${params.toString()}`);

        if (!res.ok) {
          const err = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err?.error ?? `Request failed (HTTP ${res.status})`,
          }));
          return;
        }

        const data: FilePreviewResponse = await res.json();
        setState((prev) => ({
          ...prev,
          loading: false,
          content: data.content,
          truncated: data.truncated,
          size: data.size,
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Network error — could not fetch file.",
        }));
      }
    },
    [repo, ref],
  );

  const closePreview = React.useCallback(() => {
    setState(initialState);
  }, []);

  return { previewState: state, openPreview, closePreview };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FilePreviewDialog({
  state,
  onClose,
}: {
  state: PreviewState;
  onClose: () => void;
}) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  // Sync dialog open/close with state.
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (state.isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!state.isOpen && dialog.open) {
      dialog.close();
    }
  }, [state.isOpen]);

  // Close on ESC (native dialog behaviour) — sync state.
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  // Close on backdrop click.
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // If the click target is the dialog itself (the backdrop area), close it.
    if (e.target === dialog) {
      onClose();
    }
  };

  const filename = state.path?.split("/").pop() ?? state.path ?? "";

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-label="File preview"
      onClick={handleBackdropClick}
      className={cn(
        "fixed inset-0 z-[9999] m-0 h-full w-full max-h-full max-w-full",
        "bg-transparent p-0",
        "backdrop:bg-black/70 backdrop:backdrop-blur-sm",
        // Override default dialog centering — we want a side panel
        "sm:inset-auto sm:right-0 sm:top-0 sm:m-0 sm:h-full sm:w-[min(720px,85vw)] sm:max-h-full sm:max-w-none",
      )}
    >
      <div className="flex h-full flex-col overflow-hidden border-l border-border bg-background text-foreground">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-muted/40 px-4 py-3">
          <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-sm font-medium text-foreground">
              {filename}
            </p>
            {state.path && state.path !== filename && (
              <p className="truncate font-mono text-[11px] text-muted-foreground">
                {state.path}
              </p>
            )}
          </div>
          {state.size != null && !state.loading && (
            <span className="shrink-0 rounded border border-border bg-background px-2 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
              {formatBytes(state.size)}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Truncation notice */}
        {state.truncated && !state.loading && (
          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
            <span>Showing first 16 KB — press ESC or click ✕ to close</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {state.loading && (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading preview…</span>
            </div>
          )}

          {state.error && (
            <div className="flex h-full items-center justify-center p-6">
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-foreground/80">{state.error}</p>
              </div>
            </div>
          )}

          {state.content != null && !state.loading && (
            <pre className="whitespace-pre-wrap break-all p-4 font-mono text-[13px] leading-relaxed text-foreground/90">
              {state.content}
            </pre>
          )}
        </div>

        {/* Footer hint */}
        <div className="shrink-0 border-t border-border bg-muted/20 px-4 py-2">
          <p className="font-mono text-[10px] text-muted-foreground">
            Press <kbd className="rounded bg-muted px-1 py-0.5 text-[10px] font-medium">ESC</kbd> to close
          </p>
        </div>
      </div>
    </dialog>
  );
}
