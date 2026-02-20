// src/hooks/useGradeData.ts
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import type { GradeItem } from '../types';

type TournamentsRow = {
  tournament_key: string;
  nome: string | null;
  rede: string | null;
  velocidade: string | null;
  horario: string | null;

  games_count: number | null;
  avg_stake: number | null;

  total_profit: number | null;
  itm_count: number | null;
  itm_pct: number | null;

  roi_total_pct: number | null;
  roi_avg_pct: number | null;

  field_avg: number | null;
};


const PAGE_SIZE = 1000;

async function fetchAllTournaments(datasetId: number): Promise<TournamentsRow[]> {
  const all: TournamentsRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('tournaments')
      .select(
        'tournament_key,nome,rede,velocidade,horario,games_count,avg_stake,total_profit,itm_count,itm_pct,roi_total_pct,roi_avg_pct,field_avg'
      )
      .eq('dataset_id', datasetId)
      .order('updated_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const batch = (data ?? []) as unknown as TournamentsRow[];
    all.push(...batch);

    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}


export interface UseGradeDataResult {
  items: GradeItem[];
  gradeItems: GradeItem[];
  loading: boolean;
  ready: boolean;
  error: string | null;
  allRedes: string[];
  uniqueVelocidades: string[];
}

export function useGradeData(datasetId: number, dataVersion: number): UseGradeDataResult {
  const [rows, setRows] = useState<TournamentsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const myFetchId = ++fetchIdRef.current;

    async function run() {
      if (!datasetId) {
        setRows([]);
        setLoading(false);
        setReady(true);
        setError(null);
        return;
      }

      setLoading(true);
      setReady(false);
      setError(null);

      try {
        const all = await fetchAllTournaments(datasetId);
        if (cancelled || fetchIdRef.current !== myFetchId) return;

        setRows(all);
        setReady(true);
      } catch (e: any) {
        if (cancelled || fetchIdRef.current !== myFetchId) return;
        setError(e?.message ?? 'Erro ao carregar tournaments');
        setRows([]);
        setReady(true);
      } finally {
        if (cancelled || fetchIdRef.current !== myFetchId) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [datasetId, dataVersion]);

  const items: GradeItem[] = useMemo(() => {
    return rows.map((r) => {
      const qtd = Number(r.games_count ?? 0);
      const stakeMedia = Number(r.avg_stake ?? 0);
      const retornoTotal = Number(r.total_profit ?? 0);
      const itm = Number(r.itm_count ?? 0);
      const itmPercentual = Number(r.itm_pct ?? 0);
      const roiTotal = Number(r.roi_total_pct ?? 0);
      const roiMedio = Number(r.roi_avg_pct ?? 0);
      const mediaParticipantes = Number(r.field_avg ?? 0);


      return {
        tournamentKey: r.tournament_key,
        nome: r.nome ?? "",
        rede: r.rede ?? "",
        horario: r.horario ?? "",
        // "Estrutura" na Grade = velocidade consolidada (NORMAL/TURBO/SUPER TURBO)
        velocidadePredominante: r.velocidade ?? "",

        qtd,
        stakeMedia,
        retornoTotal,
        itm,
        itmPercentual,
        roiTotal,
        roiMedio,
        mediaParticipantes,

        // Campos auxiliares da Grade
        bandeiras: "",
        horarioManual: "",
        isFromCache: false,
        isFullyManual: false,
      };
    });
  }, [rows]);

  // A base para montagem da grade usa o pool completo (sem limite de 100/1000)
  const gradeItems = items;
  const allRedes = useMemo(() => {
    const set = new Set<string>();
    for (const it of items as any[]) {
      const r = String(it?.rede ?? "").trim();
      if (r) set.add(r);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const uniqueVelocidades = useMemo(() => {
    const set = new Set<string>();
    for (const it of items as any[]) {
      const v = String(it?.velocidadePredominante ?? "").trim();
      if (v) set.add(v);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);


  return { gradeItems, items, loading, ready, error, allRedes, uniqueVelocidades };
}