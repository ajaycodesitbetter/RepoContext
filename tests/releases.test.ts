/**
 * Unit tests for lib/analysis/releases.ts — asset filtering logic.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { processReleases } from "../lib/analysis/releases";
import type { GithubRelease } from "../lib/github/client";

/** Helper: create a minimal GithubRelease with the given asset filenames. */
function fakeRelease(
  assets: Array<{ name: string; url?: string }>,
  overrides?: Partial<GithubRelease>,
): GithubRelease {
  return {
    tag_name: "v1.0.0",
    name: "v1.0.0",
    published_at: "2026-01-01T00:00:00Z",
    prerelease: false,
    draft: false,
    html_url: "https://github.com/test/repo/releases/tag/v1.0.0",
    assets: assets.map((a) => ({
      name: a.name,
      size: 1024,
      download_count: 100,
      browser_download_url:
        a.url ?? `https://github.com/test/repo/releases/download/v1.0.0/${a.name}`,
      content_type: "application/octet-stream",
    })),
    ...overrides,
  };
}

describe("release asset filtering", () => {
  it(".dmg asset is included", async () => {
    const result = await processReleases([
      fakeRelease([{ name: "App-1.0-macos.dmg" }]),
    ]);
    assert.ok(result, "Expected a non-null result");
    assert.strictEqual(result.assets.length, 1);
    assert.strictEqual(result.assets[0].name, "App-1.0-macos.dmg");
  });

  it(".AppImage asset is included", async () => {
    const result = await processReleases([
      fakeRelease([{ name: "App-1.0-linux-x86_64.AppImage" }]),
    ]);
    assert.ok(result);
    assert.strictEqual(result.assets.length, 1);
    assert.strictEqual(result.assets[0].name, "App-1.0-linux-x86_64.AppImage");
  });

  it(".exe asset is included", async () => {
    const result = await processReleases([
      fakeRelease([{ name: "Installer.exe" }]),
    ]);
    assert.ok(result);
    assert.strictEqual(result.assets.length, 1);
  });

  it(".deb asset is included", async () => {
    const result = await processReleases([
      fakeRelease([{ name: "app_1.0_amd64.deb" }]),
    ]);
    assert.ok(result);
    assert.strictEqual(result.assets.length, 1);
  });

  it(".tar.gz asset is EXCLUDED", async () => {
    const result = await processReleases([
      fakeRelease([
        { name: "App-1.0-macos.dmg" },
        { name: "App-1.0-linux-x86_64.tar.gz" },
      ]),
    ]);
    assert.ok(result);
    assert.strictEqual(result.assets.length, 1, "tar.gz should be filtered out");
    assert.strictEqual(result.assets[0].name, "App-1.0-macos.dmg");
  });

  it(".zip asset is EXCLUDED", async () => {
    const result = await processReleases([
      fakeRelease([
        { name: "App-1.0-win.exe" },
        { name: "NHQM_v1.0.zip" },
      ]),
    ]);
    assert.ok(result);
    assert.strictEqual(result.assets.length, 1, "zip should be filtered out");
    assert.strictEqual(result.assets[0].name, "App-1.0-win.exe");
  });

  it(".tar.xz asset is EXCLUDED", async () => {
    const result = await processReleases([
      fakeRelease([
        { name: "App.deb" },
        { name: "source.tar.xz" },
      ]),
    ]);
    assert.ok(result);
    assert.strictEqual(result.assets.length, 1);
  });

  it("checksum .sha256 file is excluded from assets", async () => {
    const result = await processReleases([
      fakeRelease([
        { name: "App.dmg" },
        { name: "checksums.txt" },
        { name: "App.dmg.sha256" },
      ]),
    ]);
    assert.ok(result);
    assert.strictEqual(result.assets.length, 1);
    assert.strictEqual(result.assets[0].name, "App.dmg");
  });

  it("release with ONLY .tar.gz returns null (panel hidden)", async () => {
    const result = await processReleases([
      fakeRelease([
        { name: "source.tar.gz" },
        { name: "source.zip" },
      ]),
    ]);
    assert.strictEqual(result, null, "Should return null when no installable assets");
  });

  it("empty release list returns null", async () => {
    const result = await processReleases([]);
    assert.strictEqual(result, null);
  });

  it("null release list returns null", async () => {
    const result = await processReleases(null);
    assert.strictEqual(result, null);
  });

  it("mixed assets — only installables survive", async () => {
    const result = await processReleases([
      fakeRelease([
        { name: "App-v2-macos-arm64.dmg" },
        { name: "App-v2-linux-x86_64.AppImage" },
        { name: "App-v2-linux-x86_64.deb" },
        { name: "App-v2-linux-x86_64.rpm" },
        { name: "App-v2-linux-x86_64.tar.gz" },
        { name: "App-v2-android.apk" },
        { name: "Source.code.zip" },
        { name: "SHA256SUMS.txt" },
      ]),
    ]);
    assert.ok(result);
    assert.strictEqual(result.assets.length, 5, "dmg + AppImage + deb + rpm + apk");
    const names = result.assets.map((a) => a.name);
    assert.ok(!names.some((n) => n.endsWith(".tar.gz")), "no tar.gz");
    assert.ok(!names.some((n) => n.endsWith(".zip")), "no zip");
  });
});
