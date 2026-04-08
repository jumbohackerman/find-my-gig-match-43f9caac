import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContext {
  user: User | null;
  session: Session | null;
  profile: { role: string; full_name: string; avatar: string | null } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthContext>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthCtx);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthContext["profile"]>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        setLoading(false);
      }
      // if user exists, loading will be set to false after profile fetch
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile when user changes — keep loading=true until profile is resolved
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      setLoading(false);
      return;
    }
    setProfileLoading(true);
    let cancelled = false;
    const fetchProfile = async () => {
      // Retry a few times for newly created accounts (trigger may not have finished)
      let attempts = 0;
      let data = null;
      while (attempts < 5) {
        const res = await supabase
          .from("profiles")
          .select("role, full_name, avatar")
          .eq("user_id", user.id)
          .maybeSingle();
        data = res.data;
        if (data) break;
        attempts++;
        await new Promise((r) => setTimeout(r, 500));
      }
      if (!cancelled) {
        setProfile(data);
        setProfileLoading(false);
        setLoading(false);
      }
    };
    fetchProfile();
    return () => { cancelled = true; };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthCtx.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
};
