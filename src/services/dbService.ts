import { supabase } from "./supabaseClient";

export type TournamentRow = {
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

export async function fetchTournaments(): Promise<TournamentRow[]> {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
