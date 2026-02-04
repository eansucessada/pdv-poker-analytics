import { useCallback, useEffect, useMemo, useState } from "react";
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
  refreshSession: () => Promise<void>;
}

function normalizeError(e: unknown): string {
  if (!e) return "Erro inesperado.";
  if (typeof e === "string") return e;
  if (typeof e === "object" && e && "message" in e) return String((e as any).message);
  return "Erro inesperado.";
}

/**
 * useAuth
 * - Mantém o estado de sessão do Supabase
 * - Oferece ações de login/cadastro/logout/reset
 */
export function useAuth(): AuthState & AuthActions {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const clearError = useCallback(() => setLastError(null), []);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
    } catch (e) {
      setSession(null);
      setUser(null);
      setLastError(normalizeError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mounted) return;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      } catch (e) {
        if (!mounted) return;
        setSession(null);
        setUser(null);
        setLastError(normalizeError(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLastError(null);
    const e = email.trim();
    if (!e || !password) {
      setLastError("Preencha email e senha.");
      return false;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: e, password });
    if (error) {
      setLastError(error.message);
      return false;
    }
    return true;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setLastError(null);
    const e = email.trim();
    if (!e || !password) {
      setLastError("Preencha email e senha.");
      return false;
    }
    const { error } = await supabase.auth.signUp({ email: e, password });
    if (error) {
      setLastError(error.message);
      return false;
    }
    return true;
  }, []);

  const signOut = useCallback(async () => {
    setLastError(null);
    const { error } = await supabase.auth.signOut();
    if (error) setLastError(error.message);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    setLastError(null);
    const e = email.trim();
    if (!e) {
      setLastError("Preencha o email.");
      return false;
    }
    // Se você tiver uma rota de reset no futuro, pode setar redirectTo.
    const { error } = await supabase.auth.resetPasswordForEmail(e);
    if (error) {
      setLastError(error.message);
      return false;
    }
    return true;
  }, []);

  return useMemo(
    () => ({
      loading,
      session,
      user,
      lastError,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      clearError,
      refreshSession
    }),
    [loading, session, user, lastError, signIn, signUp, signOut, sendPasswordReset, clearError, refreshSession]
  );
}
