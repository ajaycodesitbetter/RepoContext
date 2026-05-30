import { Shield, ShieldAlert, ShieldCheck, FileText, AlertTriangle, AlertCircle, Info, Box } from "lucide-react";
import type {
  DependencyFileEvidence,
  EcosystemDependencySummary,
  DependencyRiskSignal,
  DependencyRiskSummary,
  DependencyHygiene,
  SupplyChainExposure,
  DependencyEcosystem,
} from "@/lib/types";

function ecosystemLabel(eco: DependencyEcosystem): string {
  switch (eco) {
    case "node": return "Node.js";
    case "python": return "Python";
    case "go": return "Go";
    case "rust": return "Rust";
  }
}

function HygieneBadge({ hygiene }: { hygiene: DependencyHygiene | null }) {
  if (!hygiene) return null;
  const config = {
    strong: { icon: ShieldCheck, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
    mixed: { icon: Shield, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    weak: { icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
  }[hygiene];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color} ${config.border}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="capitalize">{hygiene} Hygiene</span>
    </div>
  );
}

function ExposureBadge({ exposure }: { exposure: SupplyChainExposure | null }) {
  if (!exposure) return null;
  const config = {
    low: { color: "text-emerald-500" },
    moderate: { color: "text-amber-500" },
    high: { color: "text-red-500" },
  }[exposure];

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground">Exposure:</span>
      <span className={`font-semibold capitalize ${config.color}`}>{exposure}</span>
    </div>
  );
}

function SignalIcon({ severity }: { severity: DependencyRiskSignal["severity"] }) {
  switch (severity) {
    case "high": return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case "info": return <Info className="h-4 w-4 text-blue-500" />;
  }
}

export function DependencyRiskPanel({
  files,
  summary,
  signals,
  risk,
}: {
  files?: DependencyFileEvidence[];
  summary?: EcosystemDependencySummary[];
  signals?: DependencyRiskSignal[];
  risk?: DependencyRiskSummary | null;
}) {
  if (!files || files.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {signals?.find(s => s.code === "no_dependency_manifests")?.message || "No supported dependency manifests detected."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-4 py-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Box className="h-4 w-4" />
            Dependency & Risk
          </h2>
          <div className="flex items-center gap-3">
            <ExposureBadge exposure={risk?.supplyChainExposure ?? null} />
            <HygieneBadge hygiene={risk?.hygiene ?? null} />
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {/* Left Column: Ecosystems & Files */}
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-medium text-foreground">Detected Ecosystems</h3>
            {summary?.map((s) => (
              <div key={s.ecosystem} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{ecosystemLabel(s.ecosystem)}</span>
                  <span className="text-muted-foreground">
                    {s.directDependencyCount !== null ? `${s.directDependencyCount} direct deps` : "Unknown deps"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.manifests.map(m => (
                    <span key={m} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground font-mono">
                      <FileText className="h-3 w-3" />
                      {m.split("/").pop()}
                    </span>
                  ))}
                  {s.lockfiles.map(l => (
                    <span key={l} className="inline-flex items-center gap-1 rounded bg-muted/50 border border-border px-2 py-0.5 text-xs text-muted-foreground font-mono">
                      <FileText className="h-3 w-3" />
                      {l.split("/").pop()}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Risk Signals */}
          <div className="p-4 space-y-4 bg-muted/10">
            <h3 className="text-sm font-medium text-foreground">Risk Signals</h3>
            {signals && signals.length > 0 ? (
              <ul className="space-y-3">
                {signals.map((signal, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <div className="mt-0.5 shrink-0">
                      <SignalIcon severity={signal.severity} />
                    </div>
                    <span className={signal.severity === "high" ? "text-foreground font-medium" : "text-muted-foreground"}>
                      {signal.message}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                No concerning signals detected.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
