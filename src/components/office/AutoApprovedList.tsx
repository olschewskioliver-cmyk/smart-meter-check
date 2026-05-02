import { Installation } from "@/lib/types";
import { InstallationCard } from "./InstallationCard";

interface AutoApprovedListProps {
  installations: Installation[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function AutoApprovedList({ installations, selectedId, onSelect }: AutoApprovedListProps) {
  const items = installations.filter(
    (i) => i.status === "auto_approved" || i.status === "approved"
  );
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-office px-5 py-4">
        <h2 className="text-base font-bold text-office-fg">Auto-Freigaben</h2>
        <p className="mt-0.5 text-xs text-office-muted">
          Automatisch erfolgreich geprüfte Installationen.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-office-muted">
            Keine Auto-Freigaben vorhanden.
          </div>
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
