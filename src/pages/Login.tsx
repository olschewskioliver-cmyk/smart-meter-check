import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wordmark } from "@/components/shared/Wordmark";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { user, profile, loading, signIn } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === "admin") navigate("/admin", { replace: true });
      else if (profile.role === "office") navigate("/office", { replace: true });
      else navigate("/check", { replace: true });
    }
  }, [user, profile, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error: authError } = await signIn(identifier, password);
    if (authError) {
      setError("Zugangsdaten ungültig.");
      setIsSubmitting(false);
    }
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
              E-Mail oder Benutzername
            </span>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="name@ovag.de oder benutzername"
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

          {error && (
            <p className="mb-4 rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[48px] w-full rounded-lg bg-office-accent text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? "Wird angemeldet…" : "Anmelden"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-office-muted">
          © OVAG Netz GmbH
        </p>
      </div>
    </div>
  );
}
