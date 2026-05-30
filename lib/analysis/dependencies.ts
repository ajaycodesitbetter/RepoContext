/**
 * Deterministic dependency manifest detection, parsing, and risk classification.
 * No AI, no build execution, no transitive resolution.
 */

import type {
  DependencyEcosystem,
  DependencyFileEvidence,
  EcosystemDependencySummary,
  DependencyRiskSignal,
  DependencyRiskSummary,
  DependencyHygiene,
  SupplyChainExposure,
  TreeEntry,
} from "@/lib/types";

/* ========================= File Detection Map ========================= */

type ManifestDef = {
  ecosystem: DependencyEcosystem;
  kind: "manifest" | "lockfile";
};

const KNOWN_FILES: Record<string, ManifestDef> = {
  "package.json":       { ecosystem: "node",   kind: "manifest" },
  "package-lock.json":  { ecosystem: "node",   kind: "lockfile" },
  "pnpm-lock.yaml":     { ecosystem: "node",   kind: "lockfile" },
  "yarn.lock":          { ecosystem: "node",   kind: "lockfile" },
  "requirements.txt":   { ecosystem: "python", kind: "manifest" },
  "pyproject.toml":     { ecosystem: "python", kind: "manifest" },
  "Pipfile":            { ecosystem: "python", kind: "manifest" },
  "poetry.lock":        { ecosystem: "python", kind: "lockfile" },
  "Pipfile.lock":       { ecosystem: "python", kind: "lockfile" },
  "go.mod":             { ecosystem: "go",     kind: "manifest" },
  "go.sum":             { ecosystem: "go",     kind: "lockfile" },
  "Cargo.toml":         { ecosystem: "rust",   kind: "manifest" },
  "Cargo.lock":         { ecosystem: "rust",   kind: "lockfile" },
};

/** File basenames that we will fetch content for to parse dependency counts. */
const PARSEABLE_MANIFESTS = new Set([
  "package.json",
  "requirements.txt",
  "pyproject.toml",
  "Pipfile",
  "go.mod",
  "Cargo.toml",
]);

/* ========================= Detection ========================= */

/**
 * Scan the tree for known dependency files. Returns only root-level
 * or first-level files to avoid deep monorepo noise in V1.
 */
export function detectDependencyFiles(tree: TreeEntry[]): DependencyFileEvidence[] {
  const results: DependencyFileEvidence[] = [];
  for (const entry of tree) {
    if (entry.type !== "blob") continue;
    const basename = entry.path.split("/").pop() ?? "";
    const def = KNOWN_FILES[basename];
    if (!def) continue;
    // Limit to root or one level deep to avoid monorepo explosion.
    const depth = entry.path.split("/").length;
    if (depth > 2) continue;
    results.push({ path: entry.path, kind: def.kind, ecosystem: def.ecosystem });
  }
  return results;
}

/**
 * Returns the set of manifest file paths we should fetch content for.
 * Caps at MAX_FETCH_FILES to limit API calls.
 */
const MAX_FETCH_FILES = 6;

export function selectFilesToFetch(files: DependencyFileEvidence[]): string[] {
  const paths: string[] = [];
  for (const f of files) {
    const basename = f.path.split("/").pop() ?? "";
    if (PARSEABLE_MANIFESTS.has(basename) && f.kind === "manifest") {
      paths.push(f.path);
      if (paths.length >= MAX_FETCH_FILES) break;
    }
  }
  return paths;
}

/* ========================= Parsing ========================= */

/** Count unique direct dependencies from a package.json body. */
export function parseNodeDeps(content: string): number | null {
  try {
    const pkg = JSON.parse(content);
    const names = new Set<string>();
    for (const section of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
      const deps = pkg[section];
      if (deps && typeof deps === "object") {
        for (const name of Object.keys(deps)) names.add(name);
      }
    }
    return names.size;
  } catch {
    return null;
  }
}

/** Count non-comment, non-empty lines in requirements.txt. */
export function parsePythonRequirementsTxt(content: string): number | null {
  try {
    const lines = content.split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith("#") && !l.startsWith("-"));
    return lines.length;
  } catch {
    return null;
  }
}

/** Parse pyproject.toml dependencies (simplified — handles common formats). */
export function parsePyprojectToml(content: string): number | null {
  try {
    // Look for [project] dependencies = [...] or [tool.poetry.dependencies]
    const names = new Set<string>();

    // Simple regex for dependencies = ["pkg>=1.0", ...] (PEP 621)
    const depsMatch = content.match(/\[project\][\s\S]*?dependencies\s*=\s*\[([\s\S]*?)\]/);
    if (depsMatch) {
      const items = depsMatch[1].match(/"([^"]+)"/g) || [];
      for (const item of items) {
        const pkgName = item.replace(/"/g, "").split(/[><=!~;\s\[]/)[0].trim();
        if (pkgName) names.add(pkgName.toLowerCase());
      }
    }

    // Poetry format: [tool.poetry.dependencies] / [tool.poetry.dev-dependencies]
    const poetrySections = content.matchAll(/\[tool\.poetry(?:\.dev)?[-.]?dependencies\]([\s\S]*?)(?=\n\[|$)/g);
    for (const match of poetrySections) {
      const lines = match[1].split("\n");
      for (const line of lines) {
        const kv = line.match(/^([a-zA-Z0-9_-]+)\s*=/);
        if (kv && kv[1].toLowerCase() !== "python") {
          names.add(kv[1].toLowerCase());
        }
      }
    }

    return names.size > 0 ? names.size : null;
  } catch {
    return null;
  }
}

/** Parse Pipfile packages (simplified). */
export function parsePipfile(content: string): number | null {
  try {
    const names = new Set<string>();
    const sections = content.matchAll(/\[(packages|dev-packages)\]([\s\S]*?)(?=\n\[|$)/g);
    for (const match of sections) {
      const lines = match[2].split("\n");
      for (const line of lines) {
        const kv = line.match(/^([a-zA-Z0-9_-]+)\s*=/);
        if (kv) names.add(kv[1].toLowerCase());
      }
    }
    return names.size > 0 ? names.size : null;
  } catch {
    return null;
  }
}

/** Count require directives in go.mod. */
export function parseGoMod(content: string): number | null {
  try {
    let count = 0;
    // Single-line: require github.com/foo/bar v1.0.0
    const singleLines = content.matchAll(/^require[ \t]+\S+[ \t]+\S+/gm);
    for (const _ of singleLines) count++;

    // Block: require ( ... )
    const blocks = content.matchAll(/require\s*\(([\s\S]*?)\)/g);
    for (const block of blocks) {
      const lines = block[1].split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith("//"));
      count += lines.length;
    }
    return count;
  } catch {
    return null;
  }
}

/** Count dependencies in Cargo.toml. */
export function parseCargoToml(content: string): number | null {
  try {
    const names = new Set<string>();
    const sections = content.matchAll(/\[((?:dev-|build-)?dependencies)(?:\.[^\]]+)?\]([\s\S]*?)(?=\n\[|$)/g);
    for (const match of sections) {
      const lines = match[2].split("\n");
      for (const line of lines) {
        const kv = line.match(/^([a-zA-Z0-9_-]+)\s*=/);
        if (kv) names.add(kv[1].toLowerCase());
      }
    }
    return names.size > 0 ? names.size : null;
  } catch {
    return null;
  }
}

/**
 * Parse a manifest file and return the direct dependency count.
 */
export function parseManifest(basename: string, content: string): number | null {
  switch (basename) {
    case "package.json": return parseNodeDeps(content);
    case "requirements.txt": return parsePythonRequirementsTxt(content);
    case "pyproject.toml": return parsePyprojectToml(content);
    case "Pipfile": return parsePipfile(content);
    case "go.mod": return parseGoMod(content);
    case "Cargo.toml": return parseCargoToml(content);
    default: return null;
  }
}

/* ========================= Broad Version Range Detection ========================= */

/** Check if a package.json has many broad version ranges (*, latest, >=). */
export function detectBroadVersionRanges(content: string): boolean {
  try {
    const pkg = JSON.parse(content);
    let total = 0;
    let broad = 0;
    for (const section of ["dependencies", "devDependencies"]) {
      const deps = pkg[section];
      if (!deps || typeof deps !== "object") continue;
      for (const v of Object.values(deps)) {
        total++;
        if (typeof v === "string" && (v === "*" || v === "latest" || v.startsWith(">="))) {
          broad++;
        }
      }
    }
    // Flag if >30% of deps use broad ranges and there are at least 3.
    return total >= 3 && broad / total > 0.3;
  } catch {
    return false;
  }
}

/** Check if requirements.txt has many unpinned deps (no ==). */
export function detectUnpinnedPythonDeps(content: string): boolean {
  try {
    const lines = content.split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith("#") && !l.startsWith("-"));
    if (lines.length < 3) return false;
    const unpinned = lines.filter(l => !l.includes("==")).length;
    return unpinned / lines.length > 0.5;
  } catch {
    return false;
  }
}

/* ========================= Summary Builder ========================= */

/**
 * Build per-ecosystem summaries from file evidence and parsed dependency counts.
 */
export function buildEcosystemSummaries(
  files: DependencyFileEvidence[],
  depCounts: Map<string, number | null>,
): EcosystemDependencySummary[] {
  const ecosystems = new Map<DependencyEcosystem, { manifests: string[]; lockfiles: string[]; count: number | null }>();

  for (const f of files) {
    if (!ecosystems.has(f.ecosystem)) {
      ecosystems.set(f.ecosystem, { manifests: [], lockfiles: [], count: null });
    }
    const entry = ecosystems.get(f.ecosystem)!;
    if (f.kind === "manifest") {
      entry.manifests.push(f.path);
      // Use the first available count for this ecosystem.
      if (entry.count === null) {
        const parsed = depCounts.get(f.path);
        if (parsed !== undefined && parsed !== null) entry.count = parsed;
      }
    } else {
      entry.lockfiles.push(f.path);
    }
  }

  const order: DependencyEcosystem[] = ["node", "python", "go", "rust"];
  return order
    .filter(e => ecosystems.has(e))
    .map(e => {
      const d = ecosystems.get(e)!;
      return {
        ecosystem: e,
        manifests: d.manifests,
        lockfiles: d.lockfiles,
        directDependencyCount: d.count,
        hasLockfile: d.lockfiles.length > 0,
      };
    });
}

/* ========================= Risk Signal Generation ========================= */

/**
 * Generate deterministic risk signals from file evidence and parsed data.
 */
export function generateRiskSignals(
  files: DependencyFileEvidence[],
  summaries: EcosystemDependencySummary[],
  broadRangeDetected: boolean,
): DependencyRiskSignal[] {
  const signals: DependencyRiskSignal[] = [];

  if (files.length === 0) {
    signals.push({
      code: "no_dependency_manifests",
      severity: "info",
      message: "No supported dependency manifests detected in this repository.",
    });
    return signals;
  }

  // Manifest without lockfile
  for (const s of summaries) {
    if (s.manifests.length > 0 && !s.hasLockfile) {
      // Rust libraries often intentionally omit Cargo.lock — softer wording.
      const isRust = s.ecosystem === "rust";
      signals.push({
        code: "manifest_without_lockfile",
        severity: isRust ? "info" : "warning",
        message: isRust
          ? `${ecosystemLabel(s.ecosystem)}: Cargo.lock not present. This is normal for library crates but may indicate risk for applications.`
          : `${ecosystemLabel(s.ecosystem)}: dependency manifest found without a lockfile. Builds may not be reproducible.`,
      });
    }
  }

  // Multiple ecosystems
  if (summaries.length > 1) {
    signals.push({
      code: "multiple_ecosystems",
      severity: "info",
      message: `${summaries.length} package ecosystems detected (${summaries.map(s => ecosystemLabel(s.ecosystem)).join(", ")}). Multi-ecosystem repos have a wider supply-chain surface.`,
    });
  }

  // Broad version ranges
  if (broadRangeDetected) {
    signals.push({
      code: "broad_version_ranges",
      severity: "warning",
      message: "Many dependencies use broad or unpinned version ranges, increasing risk of unexpected updates.",
    });
  }

  return signals;
}

/* ========================= Risk Summary Classification ========================= */

/**
 * Classify dependency hygiene from signals and summaries.
 */
export function classifyHygiene(
  summaries: EcosystemDependencySummary[],
  signals: DependencyRiskSignal[],
): DependencyHygiene | null {
  if (summaries.length === 0) return null;

  const hasHighSignal = signals.some(s => s.severity === "high");
  const warningCount = signals.filter(s => s.severity === "warning").length;
  const allHaveLockfile = summaries.every(s => s.hasLockfile);

  if (hasHighSignal || warningCount >= 2) return "weak";
  if (allHaveLockfile && warningCount === 0) return "strong";
  return "mixed";
}

/**
 * Classify supply-chain exposure from summaries and signals.
 */
export function classifyExposure(
  summaries: EcosystemDependencySummary[],
  signals: DependencyRiskSignal[],
): SupplyChainExposure | null {
  if (summaries.length === 0) return null;

  const hasHighSignal = signals.some(s => s.severity === "high");
  const totalDeps = summaries.reduce((sum, s) => sum + (s.directDependencyCount ?? 0), 0);
  const missingLockfiles = summaries.filter(s => !s.hasLockfile && s.manifests.length > 0).length;

  if (hasHighSignal || (missingLockfiles >= 2 && totalDeps > 30)) return "high";
  if (summaries.length > 1 || missingLockfiles >= 1 || totalDeps > 50) return "moderate";
  return "low";
}

/**
 * Build the full dependency risk summary.
 */
export function buildRiskSummary(
  summaries: EcosystemDependencySummary[],
  signals: DependencyRiskSignal[],
): DependencyRiskSummary | null {
  if (summaries.length === 0) return null;
  return {
    hygiene: classifyHygiene(summaries, signals),
    supplyChainExposure: classifyExposure(summaries, signals),
  };
}

/* ========================= Helpers ========================= */

export function ecosystemLabel(eco: DependencyEcosystem): string {
  switch (eco) {
    case "node": return "Node.js";
    case "python": return "Python";
    case "go": return "Go";
    case "rust": return "Rust";
  }
}
