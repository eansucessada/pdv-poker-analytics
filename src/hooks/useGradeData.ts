import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { getUserId } from "../services/auth";
import { useDatasetTabs } from "./useDatasetTabs";

// Tipagem do que vem da tabela public.tournaments (agregada)
export type TournamentAggRow = {
  user_id: string;
  dataset_id: number;
  tournament_key: string;

  rede: string;
  nome: string;
  velocidade: string | null; // ✅ agora vem do agregado

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
  last_played_at: string | null; // date
  updated_at: string; // timestamptz
};

// ⚠️ Por enquanto mantemos "any" para não quebrar seu app.
// Depois encaixamos seu FilterState oficial.
type FilterState = any;

export function useGradeData() {
  const [rowsRaw, setRowsRaw] = useState<TournamentAggRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [ready, setReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Mantém contrato atual do app
  const [filters, setFilters] = useState<FilterState>({});

  // Aba de Base de Dados (dataset) selecionada pelo usuário
  const { activeId: datasetId, ready: datasetReady } = useDatasetTabs();

  // Opções úteis para filtros (se você quiser usar direto do hook)
  const [allRedes, setAllRedes] = useState<string[]>([]);
  const [uniqueVelocidades, setUniqueVelocidades] = useState<string[]>([]);

  const refresh = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    const userId = await getUserId();

    // Sem login => não carrega nada (evita erro e vazamento)
    // (Quando o usuário logar, a gente recarrega via onAuthStateChange)
    if (!userId) {
      setRowsRaw([]);
      setAllRedes([]);
      setUniqueVelocidades([]);
      return;
    }

    if (!datasetReady) {
      setRowsRaw([]);
      setAllRedes([]);
      setUniqueVelocidades([]);
      setLoading(false);
      setReady(false);
      return;
    }

    const { data, error: dbErr } = await supabase
      .from("tournaments")
      .select("*")
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
}, [datasetId, datasetReady]);
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

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // 🔹 Por enquanto sem filtros (apenas retorna tudo).
  // Depois a gente aplica os filtros reais aqui usando FilterState.
  const filteredRows = useMemo(() => {
  return rowsRaw.map((r) => ({
  horario: (r as any).horario ?? "00:00",
horarioManual: "",
  tournamentKey: r.tournament_key,
  rede: r.rede,
  nome: r.nome,
  velocidade: r.velocidade ?? "Normal",
  qtd: r.games_count,
  stakeMedia: r.avg_stake,
  stakeTotal: r.total_stake,
  lucroTotal: r.total_profit,
  lucroMedio: r.avg_profit,
  itm: r.itm_count,
  itmPercentual: r.itm_pct,
  roiTotal: r.roi_total_pct,
  roiMedio: r.roi_avg_pct,
  fieldMedio: r.field_avg ?? 0,
  firstPlayedAt: r.first_played_at,
  lastPlayedAt: r.last_played_at,

  // ✅ faltavam estes:
  retornoTotal: r.total_profit + r.total_stake,
  velocidadePredominante: r.velocidade ?? "Normal",
  mediaParticipantes: r.field_avg ?? 0,
  bandeiras: "",
}));

}, [rowsRaw]);


  // Aliases de compatibilidade (evita tela preta)
const rows = filteredRows;
const items = filteredRows;
const gradeItems = filteredRows;


  return {
    // dados
    rows,
    items,
    gradeItems,

    // extras úteis
    allRedes,
    uniqueVelocidades,
 count: filteredRows.reduce((acc: number, x: any) => acc + (x.qtd || 0), 0),


    // estado
    loading,
    ready,
    error,

    // filtros
    filters,
    setFilters,

    // ações
    refresh,
  };
}
