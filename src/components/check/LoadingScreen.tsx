import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  /** Total simulated duration in ms */
  durationMs?: number;
}

export function LoadingScreen({ durationMs = 6000 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(98, (elapsed / durationMs) * 100);
      setProgress(pct);
    }, 100);
    return () => clearInterval(id);
  }, [durationMs]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-12 text-center">
      <Loader2 className="h-14 w-14 animate-spin text-primary" />
      <div className="text-lg font-semibold text-foreground">
        Prüfung läuft… (bis zu 60 Sekunden)
      </div>
      <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
        <div
          className="h-full progress-stripes transition-[width] duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        Ihre Fotos werden mit KI analysiert.
      </div>
    </div>
  );
}
