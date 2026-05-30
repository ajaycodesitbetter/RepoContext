import type { HealthStatus, ReviewPressure, CommunityBreadth, RepoWorkItem } from "@/lib/types";

export function classifyActivityStatus(lastPushAt: string | null, now = new Date()): HealthStatus | null {
  if (!lastPushAt) return null;
  const pushDate = new Date(lastPushAt);
  if (isNaN(pushDate.getTime())) return null;

  const diffMs = now.getTime() - pushDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 14) return "active";
  if (diffDays <= 60) return "slowing";
  return "stale";
}

export function classifyReviewPressure(openIssuesCount: number | null, openPullRequestsCount: number | null): ReviewPressure | null {
  if (openIssuesCount === null && openPullRequestsCount === null) return null;
  
  const total = (openIssuesCount || 0) + (openPullRequestsCount || 0);

  if (total < 25) return "low";
  if (total < 200) return "moderate";
  return "high";
}

export function classifyCommunityBreadth(contributorCount: number | string | null): CommunityBreadth | null {
  if (contributorCount === null) return null;
  if (typeof contributorCount === "string") return "broad";
  
  if (contributorCount === 1) return "solo";
  if (contributorCount <= 5) return "small-team";
  return "broad";
}

export function sortOpenIssues(items: RepoWorkItem[]): RepoWorkItem[] {
  return [...items].sort((a, b) => {
    if (b.comments !== a.comments) {
      return b.comments - a.comments;
    }
    const aTime = new Date(a.updatedAt).getTime();
    const bTime = new Date(b.updatedAt).getTime();
    return bTime - aTime;
  });
}

export function sortOpenPullRequests(items: RepoWorkItem[]): RepoWorkItem[] {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.updatedAt).getTime();
    const bTime = new Date(b.updatedAt).getTime();
    return bTime - aTime;
  });
}

export function trimWorkItems(items: RepoWorkItem[], limit = 5): RepoWorkItem[] {
  return items.slice(0, limit);
}
