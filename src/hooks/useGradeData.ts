import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { getUserId } from "../services/auth";

// Tipagem do que vem da tabela public.tournaments (agregada)
export type TournamentAggRow = {
  user_id: string;
  dataset_id: number;
  tournament_key: string;

  rede: string;
  nome: string;

  velocidade: string | null;
  horario: string | null;

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
  first_played_at: string | null;
  last_played_at: string | null;
  updated_at: string;
};

// ⚠️ Mantido por compatibilidade (se você usa isso em algum lugar)
type FilterState = any;

export function useGradeData(datasetId: number, dataVersion: number) {
  const [rowsRaw, setRowsRaw] = useState<TournamentAggRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [ready, setReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Mantém contrato atual do app (se você quiser aplicar filtros no hook no futuro)
  const [filters, setFilters] = useState<FilterState>({});

  // Opções úteis para filtros
  const [allRedes, setAllRedes] = useState<string[]>([]);
  const [uniqueVelocidades, setUniqueVelocidades] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = await getUserId();

      // Sem login => não carrega nada
      if (!userId) {
        setRowsRaw([]);
        setAllRedes([]);
        setUniqueVelocidades([]);
        return;
      }

      // ✅ Fonte única: tabela agregada `public.tournaments`
      const { data, error: dbErr } = await supabase
        .from("tournaments")
        .select(
          [
            "user_id",
            "dataset_id",
            "tournament_key",
            "rede",
            "nome",
            "velocidade",
            "horario",
            "games_count",
            "total_profit",
            "avg_profit",
            "total_stake",
            "avg_stake",
            "itm_count",
            "itm_pct",
            "roi_total_pct",
            "roi_avg_pct",
            "field_avg",
            "first_played_at",
            "last_played_at",
            "updated_at",
          ].join(",")
        )
        .eq("user_id", userId)
        .eq("dataset_id", datasetId)
        .order("updated_at", { ascending: false });

      if (dbErr) throw dbErr;

      const rows = (data ?? []) as TournamentAggRow[];
      setRowsRaw(rows);

      const redes = Array.from(new Set(rows.map((r) => r.rede).filter(Boolean)));
      redes.sort((a, b) => a.localeCompare(b));
      setAllRedes(redes);

      const velocidades = Array.from(
        new Set(rows.map((r) => (r.velocidade ?? "").trim()).filter(Boolean))
      );
      velocidades.sort((a, b) => a.localeCompare(b));
      setUniqueVelocidades(velocidades);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar tournaments do Supabase");
      setRowsRaw([]);
      setAllRedes([]);
      setUniqueVelocidades([]);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, [datasetId]);

  // Recarrega automaticamente quando o usuário faz login/logout
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        void refresh();
      } else {
        setRowsRaw([]);
        setAllRedes([]);
        setUniqueVelocidades([]);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [refresh]);

  // ✅ Recarrega quando:
  // - muda datasetId
  // - muda dataVersion (import/purge)
  useEffect(() => {
    void refresh();
  }, [refresh, dataVersion]);

  // Aqui a gente NÃO recalcula métricas. Só entrega o que veio do Supabase.
  const rows = rowsRaw;
  const items = rowsRaw;      // pool para sugestões na Grade
  const gradeItems = rowsRaw; // base para montar gradeData no GradeView

  const count = useMemo(() => {
    return rowsRaw.reduce((acc, r) => acc + (Number.isFinite(r.games_count) ? r.games_count : 0), 0);
  }, [rowsRaw]);

  return {
    // dados (Supabase source of truth)
    rows,
    items,
    gradeItems,

    // extras úteis
    allRedes,
    uniqueVelocidades,
    count,

    // estado
    loading,
    ready,
    error,

    // filtros (reservado)
    filters,
    setFilters,

    // ações
    refresh,
  };
}
