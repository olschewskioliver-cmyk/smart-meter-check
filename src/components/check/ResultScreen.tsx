import { Check, X, RotateCcw } from "lucide-react";
import { PhotoCheck, STEPS } from "@/lib/types";

interface ResultScreenProps {
  photos: PhotoCheck[];
  meterNumber: string;
  onRestart: () => void;
  queued?: boolean;
}

export function ResultScreen({ photos, meterNumber, onRestart, queued }: ResultScreenProps) {
  const allPassed = photos.every((p) => p.status === "passed");

  return (
    <div className="space-y-4 animate-fade-in">
      <div
        className={[
          "rounded-2xl p-5 text-center font-semibold",
          queued
            ? "bg-warning/10 text-warning border border-warning/30"
            : allPassed
            ? "bg-success/15 text-success border border-success/30"
            : "bg-muted text-muted-foreground border border-border",
        ].join(" ")}
      >
        {queued
          ? "Lokal gespeichert – wird hochgeladen sobald Verbindung besteht"
          : allPassed
          ? "Installation erfolgreich geprüft ✓"
          : "Fotos gespeichert – Innendienst prüft die Aufnahmen"}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
          Zählernummer
        </div>
        <div className="mt-1 text-lg font-bold text-foreground">{meterNumber}</div>
      </div>

      <div className="space-y-2">
        {photos.map((p) => {
          const def = STEPS.find((s) => s.key === p.step)!;
          const passed = p.status === "passed";
          return (
            <div
              key={p.step}
              className="flex gap-3 rounded-xl border border-border bg-card p-3"
            >
              <img
                src={p.imageUrl}
                alt={def.title}
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {def.title}
                  </div>
                  <div
                    className={[
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      passed
                        ? "bg-success/15 text-success"
                        : "bg-destructive/15 text-destructive",
                    ].join(" ")}
                  >
                    {passed ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : (
                      <X className="h-3.5 w-3.5" strokeWidth={3} />
                    )}
                  </div>
                </div>
                <div
                  className={[
                    "mt-1 text-xs leading-snug",
                    passed ? "text-muted-foreground" : "text-destructive",
                  ].join(" ")}
                >
                  {p.reasoning}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-semibold text-foreground hover:bg-secondary"
      >
        <RotateCcw className="h-4 w-4" />
        Neue Installation prüfen
      </button>
    </div>
  );
}
