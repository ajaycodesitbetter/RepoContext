"use client";

import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";
import { addRecentToQueryList, removeRecentFromQueryList } from "@/lib/recents";

const RECENTS_KEY = "repocontext_recent_searches";

export function useRecentSearches() {
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENTS_KEY);
      if (stored) {
        setRecents(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  const addRecent = (query: string) => {
    setRecents((prev) => {
      const next = addRecentToQueryList(prev, query);
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const removeRecent = (query: string) => {
    setRecents((prev) => {
      const next = removeRecentFromQueryList(prev, query);
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  return { recents, addRecent, removeRecent };
}

export function RecentSearches({
  recents,
  onSelect,
  onRemove,
}: {
  recents: string[];
  onSelect: (q: string) => void;
  onRemove: (q: string) => void;
}) {
  if (recents.length === 0) return null;

  return (
    <div className="w-full max-w-2xl space-y-3 mt-8">
      <div className="flex items-center gap-2 text-white/40">
        <Clock aria-hidden="true" className="h-3 w-3" />
        <p className="font-mono text-[10px] uppercase tracking-[0.22em]">
          Recent Searches
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {recents.map((q) => (
          <div
            key={q}
            className="group flex items-center rounded-lg border border-white/10 bg-white/[0.02] backdrop-blur-md transition-all hover:border-primary/40 hover:bg-white/[0.05]"
          >
            <button
              type="button"
              onClick={() => onSelect(q)}
              className="px-3 py-2 text-left font-mono text-xs font-medium text-white/85 transition-colors group-hover:text-primary focus-visible:outline-none"
            >
              {q}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(q);
              }}
              className="px-2 py-2 text-white/30 hover:text-white/80 focus-visible:outline-none"
              aria-label="Remove from recents"
            >
              <X aria-hidden="true" className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
