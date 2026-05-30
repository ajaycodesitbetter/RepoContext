import { test } from "node:test";
import assert from "node:assert";
import {
  parseNodeDeps,
  parsePythonRequirementsTxt,
  parsePyprojectToml,
  parsePipfile,
  parseGoMod,
  parseCargoToml,
  detectBroadVersionRanges,
  detectUnpinnedPythonDeps,
  buildEcosystemSummaries,
  generateRiskSignals,
  classifyHygiene,
  classifyExposure,
} from "../lib/analysis/dependencies";
import type { DependencyFileEvidence, EcosystemDependencySummary } from "../lib/types";

test("Dependency parser: Node", async (t) => {
  await t.test("counts dependencies across sections, deduplicating", () => {
    const pkg = JSON.stringify({
      dependencies: { a: "1", b: "2" },
      devDependencies: { b: "3", c: "4" },
    });
    assert.strictEqual(parseNodeDeps(pkg), 3);
  });

  await t.test("returns null for malformed JSON", () => {
    assert.strictEqual(parseNodeDeps("{ bad }"), null);
  });
});

test("Dependency parser: Python requirements.txt", async (t) => {
  await t.test("counts non-comment lines", () => {
    const reqs = `
# Some comment
requests==2.25.1
Flask>=1.1.2
-e .
    `;
    assert.strictEqual(parsePythonRequirementsTxt(reqs), 2);
  });
});

test("Dependency parser: pyproject.toml", async (t) => {
  await t.test("parses [project] dependencies", () => {
    const toml = `
[project]
name = "foo"
dependencies = [
    "requests>=2.25.1",
    "flask == 1.1.2"
]
    `;
    assert.strictEqual(parsePyprojectToml(toml), 2);
  });

  await t.test("parses poetry dependencies", () => {
    const toml = `
[tool.poetry.dependencies]
python = "^3.8"
requests = "^2.25.1"
flask = "^1.1.2"
    `;
    assert.strictEqual(parsePyprojectToml(toml), 2); // ignores python
  });
});

test("Dependency parser: Pipfile", async (t) => {
  await t.test("parses packages and dev-packages", () => {
    const pipfile = `
[packages]
requests = "*"
flask = "==1.1.2"

[dev-packages]
pytest = "*"
    `;
    assert.strictEqual(parsePipfile(pipfile), 3);
  });
});

test("Dependency parser: go.mod", async (t) => {
  await t.test("parses single and block requires", () => {
    const mod = `
module foo

require github.com/a/b v1.0.0

require (
    github.com/x/y v2.0.0 // indirect
    github.com/w/z v3.0.0
)
    `;
    assert.strictEqual(parseGoMod(mod), 3);
  });
});

test("Dependency parser: Cargo.toml", async (t) => {
  await t.test("parses [dependencies] and [dev-dependencies]", () => {
    const toml = `
[dependencies]
serde = "1.0"
reqwest = { version = "0.11", features = ["json"] }

[dev-dependencies]
tokio = "1.0"
    `;
    assert.strictEqual(parseCargoToml(toml), 3);
  });
});

test("Risk Signals: Broad Version Ranges", async (t) => {
  await t.test("detects unpinned Node deps", () => {
    const pkg = JSON.stringify({
      dependencies: { a: "*", b: "latest", c: ">=1.0.0" },
    });
    assert.strictEqual(detectBroadVersionRanges(pkg), true);
  });

  await t.test("does not flag if well pinned", () => {
    const pkg = JSON.stringify({
      dependencies: { a: "1.0.0", b: "^2.0.0", c: "~3.0.0" },
    });
    assert.strictEqual(detectBroadVersionRanges(pkg), false);
  });

  await t.test("detects unpinned Python deps", () => {
    const reqs = "requests\nflask>=1.0\npandas\n";
    assert.strictEqual(detectUnpinnedPythonDeps(reqs), true);
  });
});

test("Risk Classification", async (t) => {
  const nodeFiles: DependencyFileEvidence[] = [
    { path: "package.json", kind: "manifest", ecosystem: "node" },
    { path: "package-lock.json", kind: "lockfile", ecosystem: "node" },
  ];
  
  const pyFiles: DependencyFileEvidence[] = [
    { path: "requirements.txt", kind: "manifest", ecosystem: "python" },
  ];

  await t.test("strong hygiene for single ecosystem with lockfile", () => {
    const summaries = buildEcosystemSummaries(nodeFiles, new Map([["package.json", 10]]));
    const signals = generateRiskSignals(nodeFiles, summaries, false);
    assert.strictEqual(classifyHygiene(summaries, signals), "strong");
    assert.strictEqual(classifyExposure(summaries, signals), "low");
  });

  await t.test("weak hygiene for manifest without lockfile in multiple ecosystems", () => {
    const mixedFiles = [...nodeFiles, ...pyFiles];
    const summaries = buildEcosystemSummaries(mixedFiles, new Map([["package.json", 10], ["requirements.txt", 5]]));
    const signals = generateRiskSignals(mixedFiles, summaries, false);
    
    // multiple ecosystems (info), missing lockfile for python (warning)
    assert.strictEqual(classifyHygiene(summaries, signals), "mixed");
    assert.strictEqual(classifyExposure(summaries, signals), "moderate");
  });
});
