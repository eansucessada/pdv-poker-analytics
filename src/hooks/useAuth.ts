import { useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../services/supabaseClient";

export interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  lastError: string | null;
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  clearError: () => void;
}

export function useAuth(): AuthState & AuthActions {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setLastError(error.message);
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const actions: AuthActions = useMemo(
    () => ({
      clearError: () => setLastError(null),

      async signIn(email: string, password: string) {
        setLastError(null);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setLastError(error.message);
          return false;
        }
        return true;
      },

      async signUp(email: string, password: string) {
        setLastError(null);
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setLastError(error.message);
          return false;
        }
        return true;
      },

      async signOut() {
        setLastError(null);
        const { error } = await supabase.auth.signOut();
        if (error) setLastError(error.message);
      },

      async sendPasswordReset(email: string) {
        setLastError(null);
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) {
          setLastError(error.message);
          return false;
        }
        return true;
      },
    }),
    []
  );

  return { loading, session, user, lastError, ...actions };
}
