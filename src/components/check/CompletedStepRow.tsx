import { Check, X, Loader2 } from "lucide-react";

interface CompletedStepRowProps {
  thumbnail: string;
  title: string;
  aiStatus?: "passed" | "failed";
  isAnalyzing?: boolean;
  reasoning?: string;
  /** True when this step is actively waiting for the electrician to decide retake/continue */
  awaitingDecision?: boolean;
  onRetake?: () => void;
  onContinue?: () => void;
}

export function CompletedStepRow({
  thumbnail,
  title,
  aiStatus,
  isAnalyzing,
  reasoning,
  awaitingDecision,
  onRetake,
  onContinue,
}: CompletedStepRowProps) {
  const borderClass = awaitingDecision
    ? aiStatus === "passed"
      ? "border-primary"
      : "border-destructive"
    : "border-border";

  return (
    <div className={`rounded-xl border bg-card overflow-hidden ${borderClass}`}>
      {/* Main row */}
      <div className="flex items-center gap-3 p-2.5">
        <img
          src={thumbnail}
          alt={title}
          className="h-12 w-12 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{title}</div>
          {isAnalyzing ? (
            <div className="text-xs text-muted-foreground">KI-Analyse läuft…</div>
          ) : aiStatus === "passed" ? (
            <div className="text-xs text-success">KI: Bestanden ✓</div>
          ) : aiStatus === "failed" ? (
            <div className="text-xs text-destructive">KI: Fehler gefunden ✗</div>
          ) : (
            <div className="text-xs text-muted-foreground">Aufgenommen</div>
          )}
        </div>

        {isAnalyzing ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
        ) : aiStatus === "passed" ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
            <Check className="h-4 w-4" strokeWidth={3} />
          </div>
        ) : aiStatus === "failed" ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <X className="h-4 w-4" strokeWidth={3} />
          </div>
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Check className="h-4 w-4" strokeWidth={3} />
          </div>
        )}

        {/* Go-back "Neu" link — only available on decided steps, not while analyzing or deciding */}
        {!awaitingDecision && !isAnalyzing && onRetake && (
          <button
            type="button"
            onClick={onRetake}
            className="ml-1 shrink-0 text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            Neu
          </button>
        )}
      </div>

      {/* AI reasoning — shown for failed photos (in decision mode and after deciding) */}
      {!isAnalyzing && aiStatus === "failed" && reasoning && (
        <div className="border-t border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {reasoning}
        </div>
      )}

      {/* Decision buttons — retake or continue */}
      {awaitingDecision && (
        <div className="flex gap-2 border-t border-border p-2.5">
          <button
            type="button"
            onClick={onRetake}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              aiStatus === "failed"
                ? "bg-destructive text-white hover:bg-destructive/90"
                : "border border-border bg-background text-foreground hover:bg-secondary"
            }`}
          >
            Neu aufnehmen
          </button>
          <button
            type="button"
            onClick={onContinue}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              aiStatus === "passed"
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-border bg-background text-foreground hover:bg-secondary"
            }`}
          >
            Weiter →
          </button>
        </div>
      )}
    </div>
  );
}
