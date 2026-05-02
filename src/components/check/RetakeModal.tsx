import { AlertTriangle } from "lucide-react";

interface RetakeModalProps {
  failedStepNumbers: number[];
  onRetake: () => void;
  onContinue: () => void;
}

export function RetakeModal({ failedStepNumbers, onRetake, onContinue }: RetakeModalProps) {
  const list = failedStepNumbers.join(", ");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl animate-fade-in">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warning/20 text-warning">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-center text-lg font-bold text-foreground">
          Foto {list} konnte nicht geprüft werden.
        </h3>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Neu aufnehmen oder trotzdem fortfahren?
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onRetake}
            className="min-h-[48px] rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Neu aufnehmen
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="min-h-[48px] rounded-xl border border-border bg-background text-sm font-semibold text-foreground hover:bg-secondary"
          >
            Trotzdem fortfahren
          </button>
        </div>
      </div>
    </div>
  );
}
