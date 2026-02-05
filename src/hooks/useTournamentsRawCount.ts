import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabaseClient";

type UseTournamentsRawCountArgs = {
  datasetId: number;
  tournamentKeys: string[];
  enabled?: boolean;
};

type UseTournamentsRawCountResult = {
  count: number;
  loading: boolean;
  error: string | null;
};

export function useTournamentsRawCount({
  datasetId,
  tournamentKeys,
  enabled = true,
}: UseTournamentsRawCountArgs): UseTournamentsRawCountResult {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // estabiliza referência (evita refetch desnecessário)
  const keysStable = useMemo(() => {
    const clean = (tournamentKeys || []).map((k) => k.trim()).filter(Boolean);
    return Array.from(new Set(clean));
  }, [datasetId, keysStable, enabled]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!enabled) {
        setCount(0);
        setLoading(false);
        setError(null);
        return;
      }

      // Se não tem torneios na tela, count = 0
      if (!keysStable || keysStable.length === 0) {
        setCount(0);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc("count_tournaments_raw_rows", {
        p_dataset_id: datasetId,
        p_keys: keysStable,
      });

      if (cancelled) return;

      if (error) {
        setError(error.message ?? "Erro ao contar tournaments_raw");
        setCount(0);
      } else {
        // RPC retorna bigint -> supabase-js normalmente entrega como number/string dependendo do driver
        const n = typeof data === "number" ? data : parseInt(String(data ?? "0"), 10);
        setCount(Number.isFinite(n) ? n : 0);
      }

      setLoading(false);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [datasetId, enabled, keysStable]);

  return { count, loading, error };
}
