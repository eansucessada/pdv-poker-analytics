import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabaseClient";

// Tipagem mínima do que vem da tabela public.tournaments (agregada)
export type TournamentAggRow = {
  user_id: string;
  tournament_key: string;
  rede: string;
  nome: string;

  games_count: number;

  total_profit: number;
  avg_profit: number;

  total_stake: number;
  avg_stake: number;

  itm_count: number;
  itm_pct: number;

  roi_total_pct: number;
  roi_avg_pct: number;

  field_avg: number | null;
  first_played_at: string | null; // date
  last_played_at: string | null;  // date
  updated_at: string;             // timestamptz
};

// Se você já tem FilterState oficial em ../../types/common,
// depois eu encaixo aqui sem quebrar nada.
// Por enquanto, deixa “sem filtro” para validar a conexão.
type FilterState = any;

export function useGradeData() {
  const [rowsRaw, setRowsRaw] = useState<TournamentAggRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Se o seu hook já tinha filtros, você vai substituir este stub
  // pelo seu estado real (eu faço isso quando você colar o arquivo).
  const [filters, setFilters] = useState<FilterState>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // IMPORTANTE:
      // - Quando você ligar RLS (user_id = auth.uid()), esse select já vem “filtrado” por usuário.
      // - Enquanto RLS estiver desligado, ele retorna tudo (para teste).
      const { data, error: dbErr } = await supabase
        .from("tournaments")
        .select("*")
        .order("updated_at", { ascending: false });

      if (dbErr) throw dbErr;

      setRowsRaw((data ?? []) as TournamentAggRow[]);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar tournaments do Supabase");
      setRowsRaw([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Aqui você aplica os filtros reais quando eu integrar no seu arquivo.
  // Por enquanto retorna tudo para validar.
  const filteredRows = useMemo(() => {
    return rowsRaw;
  }, [rowsRaw /*, filters*/]);

  // Aliases de compatibilidade (evita tela preta)
  const rows = filteredRows;
  const items = filteredRows;
  const gradeItems = filteredRows;

  return {
    // dados
    rows,
    items,
    gradeItems,

    // estado
    loading,
    error,

    // filtros (mantém contrato comum)
    filters,
    setFilters,

    // ações
    refresh,
  };
}
