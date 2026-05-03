import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Search } from "lucide-react";
import { useElectricianStats, qualityRating, type ElectricianStat } from "@/lib/useAdminQuery";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const STATUS_LABELS: Record<string, string> = {
  auto_approved: "Auto-OK",
  approved: "Freigegeben",
  edge_case: "Rückfrage",
  rejected: "Abgelehnt",
  warning: "Warnung",
};

const STATUS_COLORS: Record<string, string> = {
  auto_approved: "bg-success/15 text-success",
  approved: "bg-success/15 text-success",
  edge_case: "bg-warning/15 text-warning",
  rejected: "bg-destructive/15 text-destructive",
  warning: "bg-warning/15 text-warning",
};

function RatingBadge({ stat }: { stat: ElectricianStat }) {
  const r = qualityRating(stat);
  if (r === "good") return (
    <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
      <TrendingUp className="h-3 w-3" /> Gut
    </span>
  );
  if (r === "attention") return (
    <span className="flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-semibold text-destructive">
      <TrendingDown className="h-3 w-3" /> Auffällig
    </span>
  );
  return (
    <span className="flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">
      <Minus className="h-3 w-3" /> Mittel
    </span>
  );
}

function pct(n: number, total: number) {
  if (total === 0) return "—";
  return `${Math.round((n / total) * 100)} %`;
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-success" : value >= 60 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-office-elevated">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs tabular-nums text-office-muted">{value} %</span>
    </div>
  );
}

function ElectricianRow({ stat, onSelectJob }: { stat: ElectricianStat; onSelectJob: (jobId: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className="cursor-pointer border-b border-office transition-colors hover:bg-office-elevated"
        onClick={() => setOpen((o) => !o)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 font-medium text-office-fg">
            {open ? <ChevronUp className="h-4 w-4 text-office-muted" /> : <ChevronDown className="h-4 w-4 text-office-muted" />}
            {stat.name}
          </div>
        </td>
        <td className="px-4 py-3 text-center tabular-nums text-office-muted">{stat.total}</td>
        <td className="px-4 py-3">
          <span className={`text-sm font-semibold tabular-nums ${stat.total > 0 && stat.autoApproved / stat.total >= 0.8 ? "text-success" : "text-office-fg"}`}>
            {pct(stat.autoApproved, stat.total)}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`text-sm tabular-nums ${stat.edgeCase > 0 ? "text-warning" : "text-office-muted"}`}>
            {pct(stat.edgeCase, stat.total)}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`text-sm tabular-nums ${stat.rejected > 0 ? "text-destructive" : "text-office-muted"}`}>
            {pct(stat.rejected, stat.total)}
          </span>
        </td>
        <td className="px-4 py-3"><ScoreBar value={stat.avgScore} /></td>
        <td className="px-4 py-3"><RatingBadge stat={stat} /></td>
      </tr>

      {open && (
        <tr className="border-b border-office bg-office-elevated/50">
          <td colSpan={7} className="px-6 py-3">
            {stat.recentJobs.length === 0 ? (
              <p className="text-xs text-office-muted">Noch keine Aufträge.</p>
            ) : (
              <div className="space-y-1.5">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-office-muted">
                  Letzte {stat.recentJobs.length} Aufträge
                </div>
                {stat.recentJobs.map((j) => (
                  <div
                    key={j.jobId}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-office-elevated"
                    onClick={(e) => { e.stopPropagation(); onSelectJob(j.jobId); }}
                  >
                    <span className="w-24 font-mono text-office-accent underline-offset-2 hover:underline">{j.jobId}</span>
                    <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[j.status] ?? "bg-office-elevated text-office-muted"}`}>
                      {STATUS_LABELS[j.status] ?? j.status}
                    </span>
                    <span className="text-office-muted">
                      {format(new Date(j.createdAt), "dd. MMM yyyy", { locale: de })}
                    </span>
                    <ScoreBar value={Math.round(j.aiScore * 100)} />
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export function ElectricianReport({ onSelectJob }: { onSelectJob: (jobId: string) => void }) {
  const { data: stats = [], isLoading } = useElectricianStats();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? stats.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : stats;

  const summary = {
    good: stats.filter((s) => qualityRating(s) === "good").length,
    mixed: stats.filter((s) => qualityRating(s) === "mixed").length,
    attention: stats.filter((s) => qualityRating(s) === "attention").length,
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Gut", value: summary.good, color: "border-success/30 bg-success/5 text-success" },
          { label: "Mittel", value: summary.mixed, color: "border-warning/30 bg-warning/5 text-warning" },
          { label: "Auffällig", value: summary.attention, color: "border-destructive/30 bg-destructive/5 text-destructive" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border p-4 ${color}`}>
            <div className="text-2xl font-bold">{value}</div>
            <div className="mt-0.5 text-xs font-semibold uppercase tracking-wider opacity-70">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-office-muted" />
        <input
          type="text"
          placeholder="Elektriker suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-office bg-office-panel py-2 pl-9 pr-4 text-sm text-office-fg placeholder:text-office-muted/50 focus:border-office-accent focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-office bg-office-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-office text-left">
              {["Elektriker", "Aufträge", "Auto-OK", "Rückfragen", "Abgelehnt", "Ø KI-Score", "Bewertung"].map((h) => (
                <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-office-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-office-muted">Lädt…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-office-muted">Kein Elektriker gefunden.</td></tr>
            ) : (
              filtered.map((s) => <ElectricianRow key={s.electricianId} stat={s} onSelectJob={onSelectJob} />)
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-office-muted">
        Bewertung: <span className="text-success font-medium">Gut</span> = &gt;= 80 % Auto-OK und &lt; 10 % Ablehnungen &middot;{" "}
        <span className="text-destructive font-medium">Auffällig</span> = &lt; 60 % Auto-OK oder &gt; 20 % Ablehnungen
      </p>
    </div>
  );
}
