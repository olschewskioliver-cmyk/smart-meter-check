import { InstallationStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: InstallationStatus;
  size?: "sm" | "md";
}

const LABELS: Record<InstallationStatus, string> = {
  edge_case: "Edge Case",
  warning: "Warnung",
  auto_approved: "Auto-Freigabe",
  approved: "Freigegeben",
  rejected: "Abgelehnt",
};

const STYLES: Record<InstallationStatus, string> = {
  edge_case: "bg-destructive/15 text-destructive border border-destructive/30",
  warning: "bg-warning/20 text-warning border border-warning/40",
  auto_approved: "bg-success/15 text-success border border-success/30",
  approved: "bg-success/15 text-success border border-success/30",
  rejected: "bg-destructive/15 text-destructive border border-destructive/30",
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const sz = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${sz} ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
