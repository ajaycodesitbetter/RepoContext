import { test, before } from "node:test";
import assert from "node:assert/strict";
import { GET } from "../app/api/brief/route";
import type { NextResponse } from "next/server";

// Force the service to take the live-data branch instead of the mock fallback,
// but we intercept it.
process.env.GITHUB_TOKEN = "test-token-for-api-tests";

const originalFetch = globalThis.fetch;
let lastUrls: string[] = [];

before(() => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    lastUrls.push(url);
    if (url.includes("/git/trees/")) {
      return new Response(JSON.stringify({
        sha: "deadbeef",
        truncated: false,
        tree: [
          { path: "README.md", type: "blob", size: 1024 },
        ],
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.includes("/releases")) {
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.includes("/repos/")) {
      return new Response(JSON.stringify({
        name: "react",
        full_name: "facebook/react",
        default_branch: "main",
        owner: { login: "facebook" },
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
});

test("API /api/brief", async (t) => {
  await t.test("returns 400 when repo is missing", async () => {
    const req = new Request("http://localhost/api/brief");
    const res = await GET(req) as NextResponse;
    assert.equal(res.status, 400);
    
    const body = await res.json();
    assert.equal(body.error, "Missing required query param `repo`. Expected format: owner/repo");
  });

  await t.test("returns 400 when repo format is bad", async () => {
    const req = new Request("http://localhost/api/brief?repo=justowner");
    const res = await GET(req) as NextResponse;
    assert.equal(res.status, 400);
  });

  await t.test("returns 200 and BriefResponse for valid repo", async () => {
    lastUrls = [];
    const req = new Request("http://localhost/api/brief?repo=facebook/react");
    const res = await GET(req) as NextResponse;
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.meta.owner, "facebook");
    assert.equal(body.meta.repo, "react");
  });
});
