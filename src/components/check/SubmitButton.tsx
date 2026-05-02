interface SubmitButtonProps {
  remaining: number; // 0..4
  ready: boolean;
  onSubmit: () => void;
}

export function SubmitButton({ remaining, ready, onSubmit }: SubmitButtonProps) {
  if (!ready) {
    return (
      <button
        type="button"
        disabled
        className="min-h-[56px] w-full cursor-not-allowed rounded-xl bg-muted text-base font-semibold text-muted-foreground"
      >
        Noch {remaining} {remaining === 1 ? "Foto" : "Fotos"} ausstehend
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onSubmit}
      className="min-h-[56px] w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-colors hover:bg-primary-hover active:scale-[0.99]"
    >
      Alle Fotos bereit – Jetzt prüfen lassen
    </button>
  );
}
