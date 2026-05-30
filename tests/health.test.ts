import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyActivityStatus,
  classifyReviewPressure,
  classifyCommunityBreadth,
  sortOpenIssues,
  sortOpenPullRequests,
  trimWorkItems,
} from "../lib/analysis/health";

describe("Health Analysis Helpers", () => {
  describe("classifyActivityStatus", () => {
    const now = new Date("2026-05-30T10:00:00Z");

    it("returns null if no date provided", () => {
      assert.equal(classifyActivityStatus(null, now), null);
    });

    it("returns active for <= 14 days", () => {
      const activeDate = new Date("2026-05-20T10:00:00Z").toISOString();
      assert.equal(classifyActivityStatus(activeDate, now), "active");
    });

    it("returns slowing for 15-60 days", () => {
      const slowingDate = new Date("2026-04-10T10:00:00Z").toISOString();
      assert.equal(classifyActivityStatus(slowingDate, now), "slowing");
    });

    it("returns stale for > 60 days", () => {
      const staleDate = new Date("2025-01-01T10:00:00Z").toISOString();
      assert.equal(classifyActivityStatus(staleDate, now), "stale");
    });
  });

  describe("classifyReviewPressure", () => {
    it("returns null if both are null", () => {
      assert.equal(classifyReviewPressure(null, null), null);
    });

    it("returns low for < 25 total", () => {
      assert.equal(classifyReviewPressure(10, 14), "low");
      assert.equal(classifyReviewPressure(24, 0), "low");
    });

    it("returns moderate for 25-199 total", () => {
      assert.equal(classifyReviewPressure(20, 5), "moderate");
      assert.equal(classifyReviewPressure(100, 99), "moderate");
    });

    it("returns high for >= 200 total", () => {
      assert.equal(classifyReviewPressure(150, 50), "high");
      assert.equal(classifyReviewPressure(300, null), "high");
    });
  });

  describe("classifyCommunityBreadth", () => {
    it("returns null for null", () => {
      assert.equal(classifyCommunityBreadth(null), null);
    });

    it("returns solo for 1", () => {
      assert.equal(classifyCommunityBreadth(1), "solo");
    });

    it("returns small-team for 2-5", () => {
      assert.equal(classifyCommunityBreadth(2), "small-team");
      assert.equal(classifyCommunityBreadth(5), "small-team");
    });

    it("returns broad for > 5", () => {
      assert.equal(classifyCommunityBreadth(6), "broad");
      assert.equal(classifyCommunityBreadth(100), "broad");
    });
  });

  describe("sortOpenIssues", () => {
    it("sorts by comments descending, then updated_at descending", () => {
      const issues = [
        { number: 1, title: "", author: "", comments: 5, createdAt: "", updatedAt: "2026-05-20", url: "" },
        { number: 2, title: "", author: "", comments: 10, createdAt: "", updatedAt: "2026-05-19", url: "" },
        { number: 3, title: "", author: "", comments: 5, createdAt: "", updatedAt: "2026-05-25", url: "" },
      ];

      const sorted = sortOpenIssues(issues);
      assert.equal(sorted[0].number, 2); // 10 comments
      assert.equal(sorted[1].number, 3); // 5 comments, newer
      assert.equal(sorted[2].number, 1); // 5 comments, older
    });
  });

  describe("sortOpenPullRequests", () => {
    it("sorts by updated_at descending", () => {
      const prs = [
        { number: 1, title: "", author: "", comments: 5, createdAt: "", updatedAt: "2026-05-20", url: "" },
        { number: 2, title: "", author: "", comments: 10, createdAt: "", updatedAt: "2026-05-25", url: "" },
        { number: 3, title: "", author: "", comments: 5, createdAt: "", updatedAt: "2026-05-22", url: "" },
      ];

      const sorted = sortOpenPullRequests(prs);
      assert.equal(sorted[0].number, 2);
      assert.equal(sorted[1].number, 3);
      assert.equal(sorted[2].number, 1);
    });
  });

  describe("trimWorkItems", () => {
    it("trims to 5 by default", () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ number: i, title: "", author: "", comments: 0, createdAt: "", updatedAt: "", url: "" }));
      assert.equal(trimWorkItems(items).length, 5);
    });
  });
});
