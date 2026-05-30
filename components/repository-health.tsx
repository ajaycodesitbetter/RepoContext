import { Activity, Users, GitPullRequest, CircleDot, Clock, ExternalLink } from "lucide-react";
import type { RepoHealth, RepoWorkItem } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDaysAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
}

export function RepositoryHealthPanel({
  health,
  openIssues,
  openPullRequests,
}: {
  health?: RepoHealth | null;
  openIssues?: RepoWorkItem[] | null;
  openPullRequests?: RepoWorkItem[] | null;
}) {
  if (!health && !openIssues && !openPullRequests) {
    return (
      <div className="rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Health data unavailable. This is usually due to GitHub API rate limits.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Repository Health
          </h2>
        </div>
        
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-medium text-foreground">Maintenance Signals</h3>
            
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Activity Status</dt>
                <dd className="font-medium capitalize">{health?.activityStatus || "Unknown"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Review Pressure</dt>
                <dd className="font-medium capitalize">{health?.reviewPressure || "Unknown"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Community Breadth</dt>
                <dd className="font-medium capitalize">{health?.communityBreadth ? health.communityBreadth.replace("-", " ") : "Unknown"}</dd>
              </div>
            </dl>
          </div>

          <div className="p-4 space-y-4">
            <h3 className="text-sm font-medium text-foreground">Stats & Activity</h3>
            
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last Push</dt>
                <dd>{health?.lastPushAt ? formatDaysAgo(health.lastPushAt) : "Unknown"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Contributors</dt>
                <dd>{health?.contributorCount !== null ? health?.contributorCount : "Unknown"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Commits (4w)</dt>
                <dd>{health?.recentCommitCount4w !== null ? health?.recentCommitCount4w : "Unavailable"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WorkItemList 
          title="Top Open Issues" 
          icon={<CircleDot className="h-4 w-4 text-green-500" />} 
          items={openIssues} 
        />
        <WorkItemList 
          title="Top Open PRs" 
          icon={<GitPullRequest className="h-4 w-4 text-purple-500" />} 
          items={openPullRequests} 
        />
      </div>
    </div>
  );
}

function WorkItemList({ title, icon, items }: { title: string; icon: React.ReactNode; items?: RepoWorkItem[] | null }) {
  if (!items) {
    return (
      <div className="rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {title} unavailable
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No open items found
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <div className="border-b border-border bg-muted/40 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          {icon}
          {title}
        </h3>
      </div>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.number} className="p-3 hover:bg-muted/30 transition-colors">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="block group">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-amber-500 transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>#{item.number}</span>
                    <span>·</span>
                    <span>by {item.author || "ghost"}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDaysAgo(item.updatedAt)}
                    </span>
                  </div>
                </div>
                {item.comments > 0 && (
                  <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {item.comments} {item.comments === 1 ? "comment" : "comments"}
                  </div>
                )}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
