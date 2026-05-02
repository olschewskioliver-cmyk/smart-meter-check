interface SubmitButtonProps {
  remaining: number; // 0..4
  isAnalyzing: boolean;
  ready: boolean;
  onSubmit: () => void;
}

export function SubmitButton({ remaining, isAnalyzing, ready, onSubmit }: SubmitButtonProps) {
  if (!ready) {
    let label: string;
    if (remaining > 0) {
      label = `Noch ${remaining} ${remaining === 1 ? "Foto" : "Fotos"} ausstehend`;
    } else if (isAnalyzing) {
      label = "KI-Analyse läuft…";
    } else {
      label = "Zählernummer eingeben";
    }
    return (
      <button
        type="button"
        disabled
        className="min-h-[56px] w-full cursor-not-allowed rounded-xl bg-muted text-base font-semibold text-muted-foreground"
      >
        {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onSubmit}
      className="min-h-[56px] w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-colors hover:bg-primary-hover active:scale-[0.99]"
    >
      Abschließen &amp; Speichern
    </button>
  );
}
