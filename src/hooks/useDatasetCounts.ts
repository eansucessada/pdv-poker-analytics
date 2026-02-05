import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

type Result = {
  raw: number;
  unique: number;
  loading: boolean;
  error: string | null;
};

export function useDatasetCounts(datasetId: number, refreshKey: number = 0): Result {
  const [raw, setRaw] = useState(0);
  const [unique, setUnique] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!datasetId) return;

      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc("get_dataset_counts", {
        p_dataset_id: datasetId,
      });

      if (cancelled) return;

      if (error) {
        setError(error.message ?? "Erro ao buscar contagens do dataset");
        setRaw(0);
        setUnique(0);
        setLoading(false);
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      const rawN = parseInt(String(row?.raw_count ?? "0"), 10);
      const uniqueN = parseInt(String(row?.unique_count ?? "0"), 10);

      setRaw(Number.isFinite(rawN) ? rawN : 0);
      setUnique(Number.isFinite(uniqueN) ? uniqueN : 0);
      setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [datasetId, refreshKey]);

  return { raw, unique, loading, error };
}
