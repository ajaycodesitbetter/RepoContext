import { test, before, after } from "node:test";
import assert from "node:assert/strict";

// Force the service to take the live-data branch instead of the mock fallback.
process.env.GITHUB_TOKEN = "test-token-for-service-tests";

const originalFetch = globalThis.fetch;
let stubTruncated = false;
let stubOwnerLocation: string | null = "Menlo Park, CA";
let stubOwnerProfileStatus = 200;
let lastUrls: string[] = [];

function stubRepoBody() {
  return {
    name: "react",
    full_name: "facebook/react",
    description: "A JavaScript library for building user interfaces",
    stargazers_count: 244723,
    forks_count: 50986,
    language: "JavaScript",
    default_branch: "main",
    fork: false,
    private: false,
    owner: { login: "facebook" },
  };
}

function stubTreeBody() {
  return {
    sha: "deadbeef",
    truncated: stubTruncated,
    tree: [
      { path: "README.md", type: "blob", size: 1024 },
      { path: "package.json", type: "blob", size: 512 },
      { path: "src", type: "tree" },
      { path: "src/index.ts", type: "blob", size: 256 },
      { path: "src/utils.ts", type: "blob", size: 128 },
    ],
  };
}

function stubOwnerProfileBody() {
  return {
    login: "facebook",
    type: "Organization",
    location: stubOwnerLocation,
    name: "Meta",
    blog: "https://opensource.fb.com",
  };
}

before(() => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    lastUrls.push(url);
    if (url.includes("/git/trees/")) {
      return new Response(JSON.stringify(stubTreeBody()), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("/users/")) {
      return new Response(JSON.stringify(stubOwnerProfileBody()), {
        status: stubOwnerProfileStatus,
        headers: { "content-type": "application/json" },
      });
    }
    // Releases endpoint — return empty array (no installable assets).
    if (url.includes("/releases")) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    // Org verification — return non-verified.
    if (url.includes("/orgs/")) {
      return new Response(JSON.stringify({ login: "facebook", is_verified: false }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    // Issues, PRs, etc (Phase 3.2 Additions)
    if (url.includes("/issues")) {
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.includes("/contributors")) {
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.includes("/stats/participation")) {
      return new Response(JSON.stringify({ all: [], owner: [] }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.includes("/commits/")) {
      return new Response(JSON.stringify({ commit: { author: { date: "2026-05-25T10:00:00Z" } } }), { status: 200, headers: { "content-type": "application/json" } });
    }

    if (url.includes("/repos/")) {
      return new Response(JSON.stringify({ ...stubRepoBody(), open_issues_count: 0, pushed_at: "2026-05-25T10:00:00Z" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    throw new Error(`unexpected fetch url: ${url}`);
  }) as typeof fetch;
});

after(() => {
  globalThis.fetch = originalFetch;
});

test("service maps tree.truncated=true → treeTruncated=true", async () => {
  stubTruncated = true;
  stubOwnerLocation = "Menlo Park, CA";
  stubOwnerProfileStatus = 200;
  lastUrls = [];
  const { getBriefForUrl } = await import("../lib/github/service");
  const result = await getBriefForUrl("facebook/react");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.treeTruncated, true);
  assert.equal(result.data.meta.owner, "facebook");
  assert.equal(result.data.meta.repo, "react");
  assert.equal(result.data.meta.isMock, false);
  assert.ok(result.data.tree.length > 0);
  // Should have hit all three endpoints.
  assert.ok(lastUrls.some((u) => u.includes("/repos/facebook/react")));
  assert.ok(lastUrls.some((u) => u.includes("/git/trees/main")));
  assert.ok(lastUrls.some((u) => u.includes("/users/facebook")));
});

test("service maps tree.truncated=false → treeTruncated=false", async () => {
  stubTruncated = false;
  stubOwnerLocation = "Menlo Park, CA";
  stubOwnerProfileStatus = 200;
  const { getBriefForUrl } = await import("../lib/github/service");
  const result = await getBriefForUrl("facebook/react");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.treeTruncated, false);
});

test("service maps absent truncated field → treeTruncated=false", async () => {
  const fetchBackup = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/git/trees/")) {
      const body = stubTreeBody();
      // @ts-expect-error - intentionally remove the field
      delete body.truncated;
      return new Response(JSON.stringify(body), { status: 200 });
    }
    if (url.includes("/users/")) {
      return new Response(JSON.stringify(stubOwnerProfileBody()), { status: 200 });
    }
    if (url.includes("/releases")) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (url.includes("/orgs/")) {
      return new Response(JSON.stringify({ login: "facebook", is_verified: false }), { status: 200 });
    }
    if (url.includes("/issues")) return new Response("[]", { status: 200 });
    if (url.includes("/contributors")) return new Response("[]", { status: 200 });
    if (url.includes("/stats/participation")) return new Response(JSON.stringify({ all: [], owner: [] }), { status: 200 });
    if (url.includes("/commits/")) return new Response(JSON.stringify({ commit: { author: { date: "2026-05-25T10:00:00Z" } } }), { status: 200 });

    return new Response(JSON.stringify({ ...stubRepoBody(), open_issues_count: 0, pushed_at: "2026-05-25T10:00:00Z" }), { status: 200 });
  }) as typeof fetch;
  try {
    const { getBriefForUrl } = await import("../lib/github/service");
    const result = await getBriefForUrl("facebook/react");
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.data.treeTruncated, false);
  } finally {
    globalThis.fetch = fetchBackup;
  }
});

test("service returns 400 for unparseable input without hitting GitHub", async () => {
  const callsBefore = lastUrls.length;
  const { getBriefForUrl } = await import("../lib/github/service");
  const result = await getBriefForUrl("not a repo");
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 400);
  assert.match(result.error, /parse/i);
  assert.equal(lastUrls.length, callsBefore, "should not call GitHub on parse failure");
});

test("service maps GitHub 404 → ServiceResult status 404", async () => {
  const fetchBackup = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ message: "Not Found" }), {
      status: 404,
    })) as typeof fetch;
  try {
    const { getBriefForUrl } = await import("../lib/github/service");
    const result = await getBriefForUrl("ghost/repo");
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 404);
    assert.match(result.error, /not found/i);
  } finally {
    globalThis.fetch = fetchBackup;
  }
});

/* ============== Owner-location fields plumbed end-to-end ============== */

test("service maps owner profile location → meta.ownerCountry/Code/confidence", async () => {
  stubTruncated = false;
  stubOwnerLocation = "Bangalore, India";
  stubOwnerProfileStatus = 200;
  const { getBriefForUrl } = await import("../lib/github/service");
  const result = await getBriefForUrl("facebook/react");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.meta.ownerLocationRaw, "Bangalore, India");
  assert.equal(result.data.meta.ownerCountry, "India");
  assert.equal(result.data.meta.ownerCountryCode, "IN");
  assert.equal(result.data.meta.locationConfidence, "high");
});

test("service maps null owner location → confidence none, country null", async () => {
  stubOwnerLocation = null;
  stubOwnerProfileStatus = 200;
  const { getBriefForUrl } = await import("../lib/github/service");
  const result = await getBriefForUrl("facebook/react");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.meta.ownerLocationRaw, null);
  assert.equal(result.data.meta.ownerCountry, null);
  assert.equal(result.data.meta.ownerCountryCode, null);
  assert.equal(result.data.meta.locationConfidence, "none");
});

test("service maps unmappable owner location → raw preserved, confidence none", async () => {
  stubOwnerLocation = "the third moon of jupiter";
  stubOwnerProfileStatus = 200;
  const { getBriefForUrl } = await import("../lib/github/service");
  const result = await getBriefForUrl("facebook/react");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.meta.ownerLocationRaw, "the third moon of jupiter");
  assert.equal(result.data.meta.ownerCountry, null);
  assert.equal(result.data.meta.ownerCountryCode, null);
  assert.equal(result.data.meta.locationConfidence, "none");
});

/* =========== Project type + onboarding plumbed end-to-end =========== */

test("service populates projectType + onboarding from the tree", async () => {
  // Override fetch to return a tree with a clear Next.js (App Router) signature.
  const fetchBackup = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/git/trees/")) {
      return new Response(
        JSON.stringify({
          sha: "deadbeef",
          truncated: false,
          tree: [
            { path: "README.md", type: "blob", size: 1024 },
            { path: "package.json", type: "blob", size: 512 },
            { path: "next.config.ts", type: "blob", size: 256 },
            { path: "app", type: "tree" },
            { path: "app/layout.tsx", type: "blob", size: 1024 },
            { path: "app/page.tsx", type: "blob", size: 512 },
            { path: "src", type: "tree" },
            { path: "src/components", type: "tree" },
            { path: "src/components/Button.tsx", type: "blob", size: 512 },
            { path: "src/components/Card.tsx", type: "blob", size: 512 },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    if (url.includes("/users/")) {
      return new Response(JSON.stringify(stubOwnerProfileBody()), { status: 200 });
    }
    if (url.includes("/releases")) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (url.includes("/orgs/")) {
      return new Response(JSON.stringify({ login: "facebook", is_verified: false }), { status: 200 });
    }
    if (url.includes("/issues")) return new Response("[]", { status: 200 });
    if (url.includes("/contributors")) return new Response("[]", { status: 200 });
    if (url.includes("/stats/participation")) return new Response(JSON.stringify({ all: [], owner: [] }), { status: 200 });
    if (url.includes("/commits/")) return new Response(JSON.stringify({ commit: { author: { date: "2026-05-25T10:00:00Z" } } }), { status: 200 });

    return new Response(JSON.stringify({ ...stubRepoBody(), open_issues_count: 0, pushed_at: "2026-05-25T10:00:00Z" }), { status: 200 });
  }) as typeof fetch;
  try {
    const { getBriefForUrl } = await import("../lib/github/service");
    const result = await getBriefForUrl("facebook/react");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    // Project type detected.
    assert.ok(result.data.projectType, "projectType should not be null");
    assert.equal(result.data.projectType?.label, "Next.js (App Router)");
    assert.equal(result.data.projectType?.confidence, "high");
    // Onboarding present.
    assert.equal(result.data.onboarding.entryPoint, "app/layout.tsx");
    assert.ok(
      result.data.onboarding.readingList.length >= 3,
      "reading list should have at least 3 items",
    );
    // README is first.
    assert.equal(result.data.onboarding.readingList[0]?.path, "README.md");
    // Important dirs include app and src.
    assert.ok(result.data.onboarding.importantDirs.includes("app"));
    assert.ok(result.data.onboarding.importantDirs.includes("src"));
  } finally {
    globalThis.fetch = fetchBackup;
  }
});

test("service degrades to projectType=null + minimal onboarding for unknown stacks", async () => {
  const fetchBackup = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/git/trees/")) {
      return new Response(
        JSON.stringify({
          sha: "deadbeef",
          truncated: false,
          tree: [
            { path: "LICENSE", type: "blob", size: 1024 },
            { path: "notes.txt", type: "blob", size: 256 },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    if (url.includes("/users/")) {
      return new Response(JSON.stringify(stubOwnerProfileBody()), { status: 200 });
    }
    if (url.includes("/releases")) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (url.includes("/orgs/")) {
      return new Response(JSON.stringify({ login: "facebook", is_verified: false }), { status: 200 });
    }
    if (url.includes("/issues")) return new Response("[]", { status: 200 });
    if (url.includes("/contributors")) return new Response("[]", { status: 200 });
    if (url.includes("/stats/participation")) return new Response(JSON.stringify({ all: [], owner: [] }), { status: 200 });
    if (url.includes("/commits/")) return new Response(JSON.stringify({ commit: { author: { date: "2026-05-25T10:00:00Z" } } }), { status: 200 });

    return new Response(JSON.stringify({ ...stubRepoBody(), open_issues_count: 0, pushed_at: "2026-05-25T10:00:00Z" }), { status: 200 });
  }) as typeof fetch;
  try {
    const { getBriefForUrl } = await import("../lib/github/service");
    const result = await getBriefForUrl("facebook/react");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.data.projectType, null);
    assert.equal(result.data.onboarding.entryPoint, null);
    // Onboarding shape is still well-defined.
    assert.ok(Array.isArray(result.data.onboarding.readingList));
    assert.ok(Array.isArray(result.data.onboarding.importantDirs));
  } finally {
    globalThis.fetch = fetchBackup;
  }
});

test("owner profile fetch failure is NON-FATAL — brief still succeeds", async () => {
  stubTruncated = false;
  stubOwnerLocation = "Menlo Park, CA";
  stubOwnerProfileStatus = 404; // owner profile 404s but the brief should still succeed
  const { getBriefForUrl } = await import("../lib/github/service");
  const result = await getBriefForUrl("facebook/react");
  assert.equal(result.ok, true, "brief must NOT fail when /users/{login} 404s");
  if (!result.ok) return;
  // We degrade gracefully to "owner location unavailable".
  assert.equal(result.data.meta.ownerLocationRaw, null);
  assert.equal(result.data.meta.ownerCountry, null);
  assert.equal(result.data.meta.ownerCountryCode, null);
  assert.equal(result.data.meta.locationConfidence, "none");
  // Repo + tree fields are still populated.
  assert.equal(result.data.meta.owner, "facebook");
  assert.ok(result.data.tree.length > 0);
});

test("service health uses filtered issues and PRs for counts", async () => {
  const fetchBackup = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/git/trees/")) return new Response(JSON.stringify(stubTreeBody()), { status: 200 });
    if (url.includes("/users/")) return new Response(JSON.stringify(stubOwnerProfileBody()), { status: 200 });
    if (url.includes("/releases")) return new Response(JSON.stringify([]), { status: 200 });
    if (url.includes("/orgs/")) return new Response(JSON.stringify({ login: "facebook", is_verified: false }), { status: 200 });
    if (url.includes("/contributors")) return new Response("[]", { status: 200 });
    if (url.includes("/stats/participation")) return new Response(JSON.stringify({ all: [], owner: [] }), { status: 200 });
    if (url.includes("/commits/")) return new Response(JSON.stringify({ commit: { author: { date: "2026-05-25T10:00:00Z" } } }), { status: 200 });

    if (url.includes("/issues")) {
      // Return 2 issues and 3 PRs
      return new Response(JSON.stringify([
        { number: 1, pull_request: undefined },
        { number: 2, pull_request: undefined },
        { number: 3, pull_request: { url: "..." } },
        { number: 4, pull_request: { url: "..." } },
        { number: 5, pull_request: { url: "..." } },
      ]), { status: 200, headers: { "content-type": "application/json" } });
    }

    if (url.includes("/repos/")) {
      return new Response(JSON.stringify({ ...stubRepoBody(), open_issues_count: 99 }), { status: 200 });
    }
  }) as typeof fetch;

  try {
    const { getBriefForUrl } = await import("../lib/github/service");
    const result = await getBriefForUrl("facebook/react");
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.data.health?.openIssuesCount, 2, "Issues count should come from filtered list");
    assert.equal(result.data.health?.openPullRequestsCount, 3, "PRs count should come from filtered list");
    assert.equal(result.data.health?.reviewPressure, "low", "Review pressure should be based on 2+3=5 (low)");
  } finally {
    globalThis.fetch = fetchBackup;
  }
});

test("service health degrades to fallback repo count if issues fetch fails", async () => {
  const fetchBackup = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/git/trees/")) return new Response(JSON.stringify(stubTreeBody()), { status: 200 });
    if (url.includes("/users/")) return new Response(JSON.stringify(stubOwnerProfileBody()), { status: 200 });
    if (url.includes("/releases")) return new Response(JSON.stringify([]), { status: 200 });
    if (url.includes("/orgs/")) return new Response(JSON.stringify({ login: "facebook", is_verified: false }), { status: 200 });
    if (url.includes("/contributors")) return new Response("[]", { status: 200 });
    if (url.includes("/stats/participation")) return new Response(JSON.stringify({ all: [], owner: [] }), { status: 200 });
    if (url.includes("/commits/")) return new Response(JSON.stringify({ commit: { author: { date: "2026-05-25T10:00:00Z" } } }), { status: 200 });

    if (url.includes("/issues")) {
      return new Response("Not Found", { status: 404 });
    }

    if (url.includes("/repos/")) {
      return new Response(JSON.stringify({ ...stubRepoBody(), open_issues_count: 99 }), { status: 200 });
    }
  }) as typeof fetch;

  try {
    const { getBriefForUrl } = await import("../lib/github/service");
    const result = await getBriefForUrl("facebook/react");
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.data.health?.openIssuesCount, 99, "Issues count should fallback to repo.open_issues_count");
    assert.equal(result.data.health?.openPullRequestsCount, null, "PR count should be null on fallback");
    assert.equal(result.data.health?.reviewPressure, "moderate", "Review pressure should be based on 99+0=99 (moderate)");
  } finally {
    globalThis.fetch = fetchBackup;
  }
});

/* ========================= Phase 4.1 Security Hardening ========================= */

test("public repo with no user token still works (server token provides rate-limit relief)", async () => {
  stubTruncated = false;
  stubOwnerLocation = "Menlo Park, CA";
  stubOwnerProfileStatus = 200;
  lastUrls = [];
  const { getBriefForUrl } = await import("../lib/github/service");
  // No user token — server GITHUB_TOKEN handles rate limits for public repos.
  const result = await getBriefForUrl("facebook/react");
  assert.equal(result.ok, true, "public repo must succeed without user token");
  if (!result.ok) return;
  assert.equal(result.data.meta.repo, "react");
  assert.equal(result.data.meta.isMock, false);
});

test("private repo with no user token is rejected with private_repo_requires_token", async () => {
  const fetchBackup = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    // The /repos endpoint returns private: true — server token CAN fetch it,
    // but the service layer must reject this when no user token is present.
    if (url.includes("/repos/")) {
      return new Response(JSON.stringify({
        ...stubRepoBody(),
        private: true,
        open_issues_count: 0,
        pushed_at: "2026-05-25T10:00:00Z",
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    // No other endpoints should be reached — the gate fires before tree fetch.
    throw new Error(`unexpected fetch url in private-repo test: ${url}`);
  }) as typeof fetch;

  try {
    const { getBriefForUrl } = await import("../lib/github/service");
    const result = await getBriefForUrl("secret-org/private-repo");
    assert.equal(result.ok, false, "private repo must NOT succeed without user token");
    if (result.ok) return;
    assert.equal(result.status, 403);
    assert.equal(result.code, "private_repo_requires_token");
    assert.match(result.error, /private/i);
  } finally {
    globalThis.fetch = fetchBackup;
  }
});

test("private repo with valid user token succeeds", async () => {
  const fetchBackup = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/git/trees/")) return new Response(JSON.stringify(stubTreeBody()), { status: 200 });
    if (url.includes("/users/")) return new Response(JSON.stringify(stubOwnerProfileBody()), { status: 200 });
    if (url.includes("/releases")) return new Response(JSON.stringify([]), { status: 200 });
    if (url.includes("/orgs/")) return new Response(JSON.stringify({ login: "secret-org", is_verified: false }), { status: 200 });
    if (url.includes("/issues")) return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    if (url.includes("/contributors")) return new Response("[]", { status: 200 });
    if (url.includes("/stats/participation")) return new Response(JSON.stringify({ all: [], owner: [] }), { status: 200 });
    if (url.includes("/commits/")) return new Response(JSON.stringify({ commit: { author: { date: "2026-05-25T10:00:00Z" } } }), { status: 200 });

    if (url.includes("/repos/")) {
      return new Response(JSON.stringify({
        ...stubRepoBody(),
        name: "private-repo",
        full_name: "secret-org/private-repo",
        private: true,
        open_issues_count: 0,
        pushed_at: "2026-05-25T10:00:00Z",
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    throw new Error(`unexpected fetch url: ${url}`);
  }) as typeof fetch;

  try {
    const { getBriefForUrl } = await import("../lib/github/service");
    const result = await getBriefForUrl("secret-org/private-repo", "ghp_user_provided_token");
    assert.equal(result.ok, true, "private repo must succeed with user token");
    if (!result.ok) return;
    assert.equal(result.data.meta.repo, "private-repo");
  } finally {
    globalThis.fetch = fetchBackup;
  }
});

test("404 without user token returns private_repo_requires_token code", async () => {
  const fetchBackup = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/repos/")) {
      return new Response(JSON.stringify({ message: "Not Found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    throw new Error(`unexpected fetch url: ${url}`);
  }) as typeof fetch;

  try {
    const { getBriefForUrl } = await import("../lib/github/service");
    const result = await getBriefForUrl("nonexistent/repo");
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 404);
    assert.equal(result.code, "private_repo_requires_token",
      "404 without token should suggest the repo may be private");
  } finally {
    globalThis.fetch = fetchBackup;
  }
});

test("Phase 5: Dependency & Risk Layer", async () => {
  const fetchBackup = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    
    // Exact route matching to prevent schema mismatches
    if (url.includes("/git/trees/")) {
      return new Response(JSON.stringify({
        sha: "def5678",
        tree: [
          { path: "package.json", type: "blob" },
          { path: "yarn.lock", type: "blob" },
        ]
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    
    if (url.includes("raw.githubusercontent.com")) {
      return new Response(JSON.stringify({
        dependencies: { "loose-envify": "^1.1.0" }
      }), { status: 200, headers: { "content-type": "text/plain" } });
    }
    
    if (url.includes("/commits/")) {
      return new Response(JSON.stringify({ sha: "abc1234", commit: { author: { date: "2026-05-30T00:00:00Z" } } }), { status: 200, headers: { "content-type": "application/json" } });
    }
    
    if (url.includes("/releases")) {
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    }

    if (url.includes("/commits")) {
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    }

    if (url.includes("/contributors")) {
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    }

    if (url.includes("/issues")) {
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    }

    if (url.includes("/users/")) {
      return new Response(JSON.stringify({ location: "Earth" }), { status: 200, headers: { "content-type": "application/json" } });
    }
    
    if (url.includes("/orgs/")) {
      return new Response(JSON.stringify({ is_verified: true }), { status: 200, headers: { "content-type": "application/json" } });
    }

    if (url.includes("/stats/participation")) {
      return new Response(JSON.stringify({ all: [0,0,0,10,20] }), { status: 200, headers: { "content-type": "application/json" } });
    }

    if (url.includes("/repos/")) {
      return new Response(JSON.stringify(stubRepoBody()), { status: 200, headers: { "content-type": "application/json" } });
    }

    throw new Error(`Unhandled mock url: ${url}`);
  }) as typeof fetch;

  try {
    const { getBriefForUrl } = await import("../lib/github/service");
    const result = await getBriefForUrl("facebook/react");
    if (!result.ok) {
      console.dir(result, { depth: null });
    }
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.ok(result.data.dependencyFiles);
    assert.equal(result.data.dependencyFiles.length, 2);
    
    assert.ok(result.data.dependencySummary);
    assert.equal(result.data.dependencySummary[0].ecosystem, "node");
    assert.equal(result.data.dependencySummary[0].directDependencyCount, 1);
    assert.equal(result.data.dependencySummary[0].hasLockfile, true);

    assert.ok(result.data.dependencyRiskSummary);
  } finally {
    globalThis.fetch = fetchBackup;
  }
});
