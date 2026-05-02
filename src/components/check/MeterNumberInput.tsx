import { useState } from "react";

interface MeterNumberInputProps {
  detected: string | null; // OCR result from nameplate photo, null if not detected
  value: string;
  onChange: (v: string) => void;
}

export function MeterNumberInput({ detected, value, onChange }: MeterNumberInputProps) {
  // Pre-fill the editable field with the OCR result (or any already-confirmed value)
  const [draft, setDraft] = useState(detected ?? value);

  const displayValue = detected ?? value;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm animate-fade-in">
      <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
        {detected ? "Erkannte Zählernummer" : "Zählernummer eingeben"}
      </div>
      {displayValue && (
        <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {displayValue}
        </div>
      )}
      {detected && (
        <div className="mt-1 text-xs text-muted-foreground">
          Automatisch erkannt – bitte prüfen und ggf. korrigieren.
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          inputMode="text"
          placeholder="Nummer manuell eingeben oder korrigieren"
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
