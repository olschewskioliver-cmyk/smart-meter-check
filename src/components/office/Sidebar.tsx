import { AlertCircle, CheckCircle2, ListChecks, Users } from "lucide-react";
import { Wordmark } from "@/components/shared/Wordmark";

export type OfficeView = "edge" | "auto" | "all" | "users";

interface SidebarProps {
  active: OfficeView;
  onChange: (v: OfficeView) => void;
  counts: { edge: number; auto: number; all: number };
  stats: { todayChecked: number; autoApproved: number; edgeCases: number };
  isAdmin?: boolean;
}

export function Sidebar({ active, onChange, counts, stats, isAdmin }: SidebarProps) {
  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col bg-office border-r border-office">
      <div className="px-5 pt-6 pb-8">
        <Wordmark variant="light" subtitle="Smart Meter Prüfsystem" />
      </div>

      <nav className="flex-1 px-3">
        <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-office-muted">
          Prüfung
        </div>

        <NavItem
          icon={<AlertCircle className="h-4 w-4" />}
          label="Edge Case Queue"
          active={active === "edge"}
          onClick={() => onChange("edge")}
          badge={counts.edge}
          badgeTone="red"
        />
        <NavItem
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Auto-Freigaben"
          active={active === "auto"}
          onClick={() => onChange("auto")}
          badge={counts.auto}
          badgeTone="green"
        />
        <NavItem
          icon={<ListChecks className="h-4 w-4" />}
          label="Alle Aufträge"
          active={active === "all"}
          onClick={() => onChange("all")}
        />

        {isAdmin && (
          <>
            <div className="mt-4 px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-office-muted">
              Administration
            </div>
            <NavItem
              icon={<Users className="h-4 w-4" />}
              label="Benutzerverwaltung"
              active={active === "users"}
              onClick={() => onChange("users")}
            />
          </>
        )}
      </nav>

      <div className="m-3 rounded-xl border border-office bg-office-panel p-4 text-xs">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-office-muted">
          Statistik
        </div>
        <Stat label="Heute geprüft" value={stats.todayChecked} />
        <Stat label="Auto-Freigabe" value={stats.autoApproved} tone="green" />
        <Stat label="Edge Cases" value={stats.edgeCases} tone="red" />
      </div>

      <div className="px-3 pb-4 text-[10px] text-office-muted/60">
      </div>
    </aside>
  );
}

function NavItem({
  icon, label, active, onClick, badge, badgeTone,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
  badgeTone?: "red" | "green";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-office-elevated text-office-fg"
          : "text-office-muted hover:bg-office-elevated/60 hover:text-office-fg",
      ].join(" ")}
    >
      <span className={active ? "text-office-accent" : "text-office-muted"}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={[
          "rounded-full px-2 py-0.5 text-[10px] font-bold",
          badgeTone === "red" ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground",
        ].join(" ")}>
          {badge}
        </span>
      )}
    </button>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "red" | "green" }) {
  const valueColor = tone === "red" ? "text-destructive" : tone === "green" ? "text-success" : "text-office-fg";
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-office-muted">{label}</span>
      <span className={`text-sm font-bold ${valueColor}`}>{value}</span>
    </div>
  );
}
