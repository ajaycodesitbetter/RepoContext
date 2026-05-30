export const MAX_RECENTS = 6;

export function addRecentToQueryList(prev: string[], query: string): string[] {
  const filtered = prev.filter((q) => q.toLowerCase() !== query.toLowerCase());
  return [query, ...filtered].slice(0, MAX_RECENTS);
}

export function removeRecentFromQueryList(prev: string[], query: string): string[] {
  return prev.filter((q) => q.toLowerCase() !== query.toLowerCase());
}
