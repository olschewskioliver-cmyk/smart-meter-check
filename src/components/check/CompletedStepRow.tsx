import { Check } from "lucide-react";

interface CompletedStepRowProps {
  thumbnail: string;
  title: string;
  onRetake?: () => void;
}

export function CompletedStepRow({ thumbnail, title, onRetake }: CompletedStepRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5">
      <img
        src={thumbnail}
        alt={title}
        className="h-12 w-12 shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">{title}</div>
        <div className="text-xs text-success">Aufgenommen ✓</div>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/15 text-success">
        <Check className="h-4 w-4" strokeWidth={3} />
      </div>
      {onRetake && (
        <button
          type="button"
          onClick={onRetake}
          className="ml-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          Neu
        </button>
      )}
    </div>
  );
}
