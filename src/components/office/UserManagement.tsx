import { useState } from "react";
import { Plus, KeyRound, ShieldCheck, ShieldOff } from "lucide-react";
import {
  useAdminUsers, useCreateUser, useDeactivateUser,
  useReactivateUser, useChangeRole, useResetPassword,
  type AdminUser,
} from "@/lib/useAdminQuery";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

function isInternalEmail(email: string | null) {
  return !email || email.endsWith("@intern.ovag-netz.de");
}

export function UserManagement() {
  const { profile } = useAuth();
  const { data: users = [], isLoading } = useAdminUsers();
  const { toast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState({ username: "", fullName: "", password: "", email: "", role: "electrician" });

  const createUser = useCreateUser();
  const deactivate = useDeactivateUser();
  const reactivate = useReactivateUser();
  const changeRole = useChangeRole();
  const resetPassword = useResetPassword();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createUser.mutate(
      { username: form.username, fullName: form.fullName, password: form.password, email: form.email || undefined, role: form.role },
      {
        onSuccess: () => {
          setShowCreate(false);
          setForm({ username: "", fullName: "", password: "", email: "", role: "electrician" });
          toast({ title: "Benutzer erstellt", description: `${form.fullName} wurde angelegt.` });
        },
        onError: () => toast({ title: "Fehler", description: "Benutzer konnte nicht erstellt werden.", variant: "destructive" }),
      }
    );
  }

  function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    resetPassword.mutate(
      { userId: resetTarget.id, password: newPassword },
      {
        onSuccess: () => {
          setResetTarget(null);
          setNewPassword("");
          toast({ title: "Passwort geändert", description: `Passwort für ${resetTarget.full_name} wurde zurückgesetzt.` });
        },
        onError: () => toast({ title: "Fehler", description: "Passwort konnte nicht geändert werden.", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-office px-8 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-office-fg">Benutzerverwaltung</h1>
            <p className="mt-0.5 text-sm text-office-muted">{users.length} Benutzer</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-office-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Neuer Benutzer
          </button>
        </div>

        <div className="rounded-xl border border-office bg-office-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-office text-left">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-office-muted">Name</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-office-muted">Benutzername</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-office-muted">Rolle</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-office-muted">E-Mail</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-office-muted">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-office-muted">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-office">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-office-muted">Lädt…</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className={u.is_active ? "" : "opacity-50"}>
                  <td className="px-4 py-3 font-medium text-office-fg">{u.full_name || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-office-muted">{u.username ?? "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole.mutate({ userId: u.id, role: e.target.value })}
                      disabled={u.id === profile?.id}
                      className="rounded border border-office bg-office-elevated px-2 py-1 text-xs text-office-fg disabled:opacity-50"
                    >
                      <option value="electrician">Elektriker</option>
                      <option value="office">Innendienst</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-office-muted">
                    {isInternalEmail(u.auth_email) ? "—" : u.auth_email}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${u.is_active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                      {u.is_active ? "Aktiv" : "Deaktiviert"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title="Passwort zurücksetzen"
                        onClick={() => { setResetTarget(u); setNewPassword(""); }}
                        className="rounded p-1.5 text-office-muted hover:bg-office-elevated hover:text-office-fg"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      {u.id !== profile?.id && (
                        u.is_active ? (
                          <button type="button" title="Deaktivieren" onClick={() => deactivate.mutate(u.id)} className="rounded p-1.5 text-office-muted hover:bg-destructive/15 hover:text-destructive">
                            <ShieldOff className="h-4 w-4" />
                          </button>
                        ) : (
                          <button type="button" title="Reaktivieren" onClick={() => reactivate.mutate(u.id)} className="rounded p-1.5 text-office-muted hover:bg-success/15 hover:text-success">
                            <ShieldCheck className="h-4 w-4" />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-office bg-office-panel p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold text-office-fg">Neuen Benutzer anlegen</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              {[
                { label: "Vollständiger Name", key: "fullName", placeholder: "Max Mustermann", required: true },
                { label: "Benutzername", key: "username", placeholder: "max.mustermann", required: true },
                { label: "Passwort", key: "password", placeholder: "Mindestens 8 Zeichen", required: true, type: "password" },
                { label: "E-Mail (optional)", key: "email", placeholder: "max@ovag.de", required: false, type: "email" },
              ].map(({ label, key, placeholder, required, type = "text" }) => (
                <label key={key} className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-office-muted">{label}</span>
                  <input
                    type={type}
                    required={required}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-office bg-office-elevated px-3 py-2 text-sm text-office-fg placeholder:text-office-muted/50 focus:border-office-accent focus:outline-none"
                  />
                </label>
              ))}
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-office-muted">Rolle</span>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full rounded-lg border border-office bg-office-elevated px-3 py-2 text-sm text-office-fg focus:border-office-accent focus:outline-none"
                >
                  <option value="electrician">Elektriker</option>
                  <option value="office">Innendienst</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-office px-4 py-2 text-sm text-office-muted hover:border-office-accent/50">Abbrechen</button>
                <button type="submit" disabled={createUser.isPending} className="rounded-lg bg-office-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                  {createUser.isPending ? "Wird erstellt…" : "Erstellen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-office bg-office-panel p-6 shadow-2xl">
            <h2 className="mb-1 text-lg font-bold text-office-fg">Passwort zurücksetzen</h2>
            <p className="mb-4 text-sm text-office-muted">{resetTarget.full_name}</p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-office-muted">Neues Passwort</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mindestens 8 Zeichen"
                  className="w-full rounded-lg border border-office bg-office-elevated px-3 py-2 text-sm text-office-fg placeholder:text-office-muted/50 focus:border-office-accent focus:outline-none"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setResetTarget(null)} className="rounded-lg border border-office px-4 py-2 text-sm text-office-muted hover:border-office-accent/50">Abbrechen</button>
                <button type="submit" disabled={resetPassword.isPending} className="rounded-lg bg-office-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                  {resetPassword.isPending ? "Wird gespeichert…" : "Speichern"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
