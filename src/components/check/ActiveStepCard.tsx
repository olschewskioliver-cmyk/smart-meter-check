import { Camera } from "lucide-react";
import { useRef } from "react";
import { StepDefinition } from "@/lib/types";

interface ActiveStepCardProps {
  step: StepDefinition;
  totalSteps: number;
  onPhotoSelected: (file: File, dataUrl: string) => void;
}

export function ActiveStepCard({ step, totalSteps, onPhotoSelected }: ActiveStepCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onPhotoSelected(file, reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm animate-fade-in">
      <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
        Schritt {step.index} von {totalSteps}
      </div>
      <h2 className="mt-1 text-xl font-bold leading-tight text-foreground">
        {step.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {step.description}
      </p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-4 flex min-h-[180px] w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-accent/40 px-4 py-8 text-primary transition-colors active:bg-accent"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Camera className="h-7 w-7" />
        </div>
        <span className="text-sm font-semibold">Tippen zum Fotografieren</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
