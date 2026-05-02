import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Wordmark } from "@/components/shared/Wordmark";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"electrician" | "office">("office");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate(role === "electrician" ? "/check" : "/office");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-office px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Wordmark variant="light" subtitle="Smart Meter Prüfsystem" className="text-center" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-office-panel p-6 shadow-2xl border border-office"
        >
          <h1 className="mb-1 text-xl font-bold text-office-fg">Anmelden</h1>
          <p className="mb-5 text-sm text-office-muted">
            Bitte mit Ihren Zugangsdaten anmelden.
          </p>

          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-office-muted">
              E-Mail
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@ovag.de"
              className="min-h-[44px] w-full rounded-lg border border-office bg-office-elevated px-3 text-sm text-office-fg placeholder:text-office-muted/60 outline-none focus:border-office-accent focus:ring-2 focus:ring-office-accent/30"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-office-muted">
              Passwort
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="min-h-[44px] w-full rounded-lg border border-office bg-office-elevated px-3 text-sm text-office-fg placeholder:text-office-muted/60 outline-none focus:border-office-accent focus:ring-2 focus:ring-office-accent/30"
            />
          </label>

          <div className="mb-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-office-muted">
              Rolle (Demo)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "electrician", l: "Elektriker" },
                { v: "office", l: "Innendienst" },
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setRole(opt.v as typeof role)}
                  className={[
                    "min-h-[40px] rounded-lg border text-sm font-medium transition-colors",
                    role === opt.v
                      ? "border-office-accent bg-office-accent/15 text-office-fg"
                      : "border-office bg-office-elevated text-office-muted hover:text-office-fg",
                  ].join(" ")}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="min-h-[48px] w-full rounded-lg bg-office-accent text-sm font-semibold text-white hover:opacity-90"
          >
            Anmelden
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-office-muted">
          © OVAG Netz GmbH
        </p>
      </div>
    </div>
  );
}
