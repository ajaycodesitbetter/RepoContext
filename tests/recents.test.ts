import { test } from "node:test";
import assert from "node:assert/strict";
import { addRecentToQueryList, removeRecentFromQueryList, MAX_RECENTS } from "../lib/recents";

test("addRecentToQueryList", async (t) => {
  await t.test("adds a new query to an empty list", () => {
    const list = addRecentToQueryList([], "facebook/react");
    assert.deepEqual(list, ["facebook/react"]);
  });

  await t.test("adds a new query to the front of the list", () => {
    const list = addRecentToQueryList(["vercel/next.js"], "facebook/react");
    assert.deepEqual(list, ["facebook/react", "vercel/next.js"]);
  });

  await t.test("deduplicates queries case-insensitively and moves them to front", () => {
    const list = addRecentToQueryList(["vuejs/core", "facebook/react"], "Facebook/React");
    assert.deepEqual(list, ["Facebook/React", "vuejs/core"]);
  });

  await t.test("limits the list size to MAX_RECENTS", () => {
    let list: string[] = [];
    for (let i = 0; i < MAX_RECENTS + 2; i++) {
      list = addRecentToQueryList(list, `owner/repo${i}`);
    }
    assert.equal(list.length, MAX_RECENTS);
    assert.equal(list[0], `owner/repo${MAX_RECENTS + 1}`);
  });
});

test("removeRecentFromQueryList", async (t) => {
  await t.test("removes a query case-insensitively", () => {
    const list = removeRecentFromQueryList(["facebook/react", "vercel/next.js"], "FaceBook/React");
    assert.deepEqual(list, ["vercel/next.js"]);
  });

  await t.test("does nothing if query is not in list", () => {
    const list = removeRecentFromQueryList(["facebook/react"], "vuejs/core");
    assert.deepEqual(list, ["facebook/react"]);
  });
});
