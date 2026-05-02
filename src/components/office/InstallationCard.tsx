import { Installation } from "@/lib/types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatRelative } from "@/lib/format";

interface InstallationCardProps {
  installation: Installation;
  selected?: boolean;
  onClick: () => void;
}

export function InstallationCard({ installation, selected, onClick }: InstallationCardProps) {
  const first = installation.photos[0];
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
        selected
          ? "border-office-accent bg-office-elevated"
          : "border-office bg-office-panel hover:border-office-accent/50 hover:bg-office-elevated",
      ].join(" ")}
    >
      {first ? (
        <img src={first.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="h-14 w-14 shrink-0 rounded-lg bg-office-elevated" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-bold text-office-fg">
            {installation.id}
          </span>
          <StatusBadge status={installation.status} />
        </div>
        <div className="mt-0.5 truncate text-xs text-office-muted">
          {installation.electrician}
        </div>
        <div className="mt-0.5 text-[11px] text-office-muted/80">
          {formatRelative(installation.createdAt)}
        </div>
      </div>
    </button>
  );
}
