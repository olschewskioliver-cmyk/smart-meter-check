import { useState } from "react";

interface MeterNumberInputProps {
  detected: string | null; // null = not yet detected → show "–"
  value: string;
  onChange: (v: string) => void;
}

export function MeterNumberInput({ detected, value, onChange }: MeterNumberInputProps) {
  const [draft, setDraft] = useState(value);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm animate-fade-in">
      <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
        Erkannte Zählernummer
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
        {detected ?? value || "–"}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          inputMode="text"
          placeholder="Nummer manuell eingeben"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-h-[48px] flex-1 rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={() => onChange(draft.trim())}
          disabled={!draft.trim()}
          className="min-h-[48px] rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          OK
        </button>
      </div>
    </div>
  );
}
