import { useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { Installation } from "@/lib/types";
import { InstallationCard } from "./InstallationCard";

interface EdgeCaseQueueProps {
  installations: Installation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onRefresh: () => void;
}

export function EdgeCaseQueue({
  installations,
  selectedId,
  onSelect,
  onRefresh,
}: EdgeCaseQueueProps) {
  const [tab, setTab] = useState<"all" | "installation">("all");
  const items = installations.filter((i) =>
    i.status === "edge_case" || i.status === "warning"
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-office px-5 py-4">
        <h2 className="text-base font-bold text-office-fg">Edge Case Queue</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs font-medium text-office-accent hover:underline"
        >
          <RotateCcw className="h-3 w-3" />
          Aktualisieren
        </button>
      </div>

      <div className="flex gap-1 border-b border-office px-3 pt-2">
        <TabButton active={tab === "all"} onClick={() => setTab("all")}>
          Alle
        </TabButton>
        <TabButton active={tab === "installation"} onClick={() => setTab("installation")}>
          Installation
        </TabButton>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {items.map((i) => (
              <InstallationCard
                key={i.id}
                installation={i}
                selected={selectedId === i.id}
                onClick={() => onSelect(i.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-t-md px-3 py-2 text-xs font-semibold transition-colors",
        active
          ? "border-b-2 border-office-accent text-office-fg"
          : "text-office-muted hover:text-office-fg",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <div className="text-sm font-semibold text-office-fg">
        Keine offenen Edge Cases 🎉
      </div>
      <div className="mt-1 text-xs text-office-muted">
        Alles automatisch geprüft.
      </div>
    </div>
  );
}
