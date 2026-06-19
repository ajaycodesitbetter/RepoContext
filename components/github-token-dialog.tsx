"use client";

import * as React from "react";
import { KeyRound, X, Check, Eye, EyeOff } from "lucide-react";
import { getStoredGithubToken, setStoredGithubToken, clearStoredGithubToken, maskGithubToken } from "@/lib/github-token";

export function GithubTokenDialog({ onTokenChange }: { onTokenChange?: () => void }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [token, setToken] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [hasToken, setHasToken] = React.useState(false);
  const [masked, setMasked] = React.useState("");
  const [showToken, setShowToken] = React.useState(false);

  const checkToken = React.useCallback(() => {
    const stored = getStoredGithubToken();
    setHasToken(!!stored);
    setMasked(stored ? maskGithubToken(stored) : "");
  }, []);

  React.useEffect(() => {
    checkToken();
  }, [checkToken]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setStoredGithubToken(token.trim(), remember);
    setToken("");
    setIsOpen(false);
    checkToken();
    onTokenChange?.();
  };

  const handleClear = () => {
    clearStoredGithubToken();
    setIsOpen(false);
    checkToken();
    onTokenChange?.();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card/30 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground transition-colors hover:bg-card/50 hover:text-foreground"
      >
        <KeyRound className="h-3.5 w-3.5" />
        {hasToken ? "Token Active" : "Private Repo Access"}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-[9999] mt-2 w-72 rounded-lg border border-border bg-card p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-serif text-sm font-medium text-foreground">GitHub Access</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {hasToken ? (
            <div className="space-y-4">
              <div className="rounded-md border border-border/50 bg-muted/20 p-3">
                <div className="mb-1 text-xs text-muted-foreground">Active Token</div>
                <div className="font-mono text-sm text-foreground">{masked}</div>
              </div>
              <div className="text-xs text-muted-foreground">
                Your token is stored locally on this device and is only used to access GitHub repositories.
              </div>
              <button
                onClick={handleClear}
                className="w-full rounded-md bg-destructive/10 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
              >
                Clear Token
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3">
              <div className="text-xs text-muted-foreground">
                Add a Personal Access Token (PAT) to analyze private repositories. It stays in your browser.
              </div>
              
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-input bg-background accent-primary"
                />
                Remember on this device
              </label>

              <button
                type="submit"
                disabled={!token.trim()}
                className="w-full rounded-md bg-primary py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                Save Token
              </button>
            </form>
          )}
        </div>
        </>
      )}
    </div>
  );
}
