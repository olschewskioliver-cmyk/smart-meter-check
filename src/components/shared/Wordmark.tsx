interface WordmarkProps {
  variant?: "light" | "dark";
  subtitle?: string;
  className?: string;
}

export function Wordmark({ variant = "light", subtitle, className = "" }: WordmarkProps) {
  const colorMain = variant === "light" ? "text-white" : "text-foreground";
  const colorSub = variant === "light" ? "text-white/60" : "text-muted-foreground";
  return (
    <div className={className}>
      <div className={`flex items-baseline gap-1.5 ${colorMain}`}>
        <span className="text-xl font-extrabold tracking-tight">OVAG</span>
        <span className="text-xl font-light tracking-wide">Netz</span>
      </div>
      {subtitle && (
        <div className={`mt-0.5 text-[11px] font-medium uppercase tracking-wider ${colorSub}`}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
