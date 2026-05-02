import { Check } from "lucide-react";

interface StepProgressProps {
  currentStep: number; // 1..4
  completed: boolean[];  // length 4
}

export function StepProgress({ currentStep, completed }: StepProgressProps) {
  return (
    <div className="flex items-center justify-between gap-1 px-2">
      {completed.map((done, idx) => {
        const stepNum = idx + 1;
        const active = stepNum === currentStep;
        const isLast = idx === completed.length - 1;
        return (
          <div key={idx} className="flex flex-1 items-center last:flex-none">
            <div
              className={[
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                done
                  ? "bg-success text-success-foreground"
                  : active
                  ? "bg-white text-primary ring-2 ring-white"
                  : "bg-white/15 text-white/70",
              ].join(" ")}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : stepNum}
            </div>
            {!isLast && (
              <div className="mx-1 h-0.5 flex-1 rounded bg-white/20">
                <div
                  className="h-full rounded bg-success transition-all"
                  style={{ width: done ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
