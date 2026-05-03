import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (emailOrUsername: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const profileCacheKey = (id: string) => `ovag_profile_${id}`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      setProfile(data);
      localStorage.setItem(profileCacheKey(userId), JSON.stringify(data));
    } catch {
      const cached = localStorage.getItem(profileCacheKey(userId));
      if (cached) {
        setProfile(JSON.parse(cached) as Profile);
      } else {
        setProfile(null);
      }
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(emailOrUsername: string, password: string) {
    // Resolve username → auth email if input doesn't look like an email
    let authEmail = emailOrUsername.trim();
    if (!authEmail.includes("@")) {
      const { data } = await supabase
        .from("profiles")
        .select("auth_email")
        .eq("username", authEmail)
        .single();
      if (!data?.auth_email) return { error: "Benutzername nicht gefunden." };
      authEmail = data.auth_email;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    if (user) localStorage.removeItem(profileCacheKey(user.id));
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
