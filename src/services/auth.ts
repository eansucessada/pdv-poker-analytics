// src/services/auth.ts
import { supabase } from "./supabaseClient";

/**
 * Retorna o userId do usuário logado.
 * Se não houver usuário logado, retorna null.
 */
export async function getUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Erro ao obter usuário:", error.message);
    return null;
  }
  return data.user?.id ?? null;
}
