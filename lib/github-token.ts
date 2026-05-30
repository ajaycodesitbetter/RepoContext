const STORAGE_KEY = "repocontext_github_token";
const STORAGE_MODE_KEY = "repocontext_github_token_mode"; // 'local' or 'session'

export function getStoredGithubToken(): string | null {
  if (typeof window === "undefined") return null;
  const mode = window.localStorage.getItem(STORAGE_MODE_KEY) || "session";
  if (mode === "local") {
    return window.localStorage.getItem(STORAGE_KEY);
  }
  return window.sessionStorage.getItem(STORAGE_KEY);
}

export function setStoredGithubToken(token: string, remember: boolean): void {
  if (typeof window === "undefined") return;
  if (remember) {
    window.localStorage.setItem(STORAGE_MODE_KEY, "local");
    window.localStorage.setItem(STORAGE_KEY, token);
    window.sessionStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_MODE_KEY, "session");
    window.sessionStorage.setItem(STORAGE_KEY, token);
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function clearStoredGithubToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(STORAGE_MODE_KEY);
}

export function maskGithubToken(token: string): string {
  if (!token || token.length < 8) return "••••••••";
  return `••••••••${token.slice(-4)}`;
}
