import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { getUserId } from "../../services/auth";
import type { FilterState, MetricFilter } from "../../types/common";
import type { ConsolidatedStats, SelectionDetailRow } from "../../types/deepdive";
import DeepDiveTable from "./DeepDiveTable";
import { useDatasetCounts } from "../../hooks/useDatasetCounts";

export interface DeepDiveViewProps {
  dataVersion: number;
  datasetId: number;
}

const STATIC_SUGGESTIONS = ["Bounty", "Mystery", "Vanilla", "Hunter", "PKO"];
const INITIAL_METRIC_FILTER: MetricFilter = { operator: "none", val1: "", val2: "" };

const makeTournamentKey = (rede: string, nome: string) => `${rede}::${nome}`;
const parseTournamentKey = (key: string) => {
  const idx = key.indexOf("::");
  if (idx === -1) return { rede: "", nome: key };
  return { rede: key.slice(0, idx), nome: key.slice(idx + 2) };
};

// =====================
// Tipos do Supabase
// =====================
type TournamentAggRow = {
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

  velocidade?: string | null;

  first_played_at: string | null;
  last_played_at: string | null;
  updated_at: string;
};

type PlayerOption = { id: string; jogador: string; rede: string };

// =====================
// Helpers anti-crash
// =====================
const safeStr = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const safeNum = (v: unknown, fallback = 0) => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
};

const DeepDiveView: React.FC<DeepDiveViewProps> = ({ dataVersion, datasetId }) => {
  // seleção por chave (rede::nome)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [activeKeywords, setActiveKeywords] = useState<string[]>([]);
  const [selectedRedes, setSelectedRedes] = useState<string[]>([]);
  const [selectedJogadores, setSelectedJogadores] = useState<string[]>([]);
  const [tournamentSearch, setTournamentSearch] = useState("");
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [redeSearchQuery, setRedeSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ value: string; type: string }[]>([]);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
  const [showRedeDropdown, setShowRedeDropdown] = useState(false);

  // ✅ NOVO: contagens oficiais do dataset (sem baixar rows)
  const {
    raw: rawTotal,
    unique: uniqueTotal,
    loading: countsLoading,
    error: countsError,
  } = useDatasetCounts(datasetId);

  // Dados vindos do Supabase
  const [tournamentsAgg, setTournamentsAgg] = useState<TournamentAggRow[]>([]);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);

  // Filtros locais da tabela técnica
  const [detailedFilters, setDetailedFilters] = useState<{
    search: string;
    rede: string[];
    velocidade: string[];
    metrics: FilterState["metrics"];
  }>({
    search: "",
    rede: [],
    velocidade: [],
    metrics: {
      stakeMedia: { ...INITIAL_METRIC_FILTER },
      qtd: { ...INITIAL_METRIC_FILTER },
      itmPercentual: { ...INITIAL_METRIC_FILTER },
      retornoTotal: { ...INITIAL_METRIC_FILTER },
      roiMedio: { ...INITIAL_METRIC_FILTER },
      mediaParticipantes: { ...INITIAL_METRIC_FILTER },
    },
  });

  const [visibleSummaryCount, setVisibleSummaryCount] = useState(30);

  const suggestionRef = useRef<HTMLDivElement>(null);
  const playerDropdownRef = useRef<HTMLDivElement>(null);
  const redeDropdownRef = useRef<HTMLDivElement>(null);
  const summaryListRef = useRef<HTMLDivElement>(null);

  // =====================
  // Carregar dados do Supabase
  // =====================
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFatalError(null);

      try {
        // Pega o usuário logado
        const userId = await getUserId();

        // Sem usuário => não carrega nada (evita erro e vazamento)
        if (!userId) {
          setTournamentsAgg([]);
          setPlayers([]);
          setLoading(false);
          return;
        }

        // 1) Tournaments agregada (para DeepDive)
        // ⚠️ Observação: isso pode vir limitado por paginação default em algumas configs,
        // mas o "Torneios Totais" agora NÃO depende disso (vem do RPC).
        const aggResp = await supabase
          .from("tournaments")
          .select("*")
          .eq("user_id", userId)
          .eq("dataset_id", datasetId)
          .order("updated_at", { ascending: false });

        if (aggResp.error) throw new Error(aggResp.error.message);
        setTournamentsAgg((aggResp.data ?? []) as TournamentAggRow[]);

        // 2) Players: deriva do raw (apenas para preencher dropdown)
        const rawResp = await supabase
          .from("tournaments_raw")
          .select(`"Rede","Jogador"`)
          .eq("user_id", userId)
          .limit(5000);

        if (rawResp.error) {
          console.warn("Não foi possível carregar players do tournaments_raw:", rawResp.error.message);
          setPlayers([]);
        } else {
          const seen = new Set<string>();
          const list: PlayerOption[] = [];

          for (const r of rawResp.data ?? []) {
            const rede = safeStr((r as any).Rede).trim();
            const jogador = safeStr((r as any).Jogador).trim();
            if (!rede || !jogador) continue;

            const id = `${rede}::${jogador}`;
            if (seen.has(id)) continue;
            seen.add(id);

            list.push({ id, rede, jogador });
          }

          list.sort((a, b) => (a.jogador + a.rede).localeCompare(b.jogador + b.rede));
          setPlayers(list);
        }
      } catch (e: any) {
        console.error(e);
        setFatalError(e?.message ?? "Erro inesperado ao carregar dados do Supabase");
        setTournamentsAgg([]);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [dataVersion, datasetId]);

  // =====================
  // Uniques
  // =====================
  const uniqueVelocities = useMemo(() => {
    const vels = Array.from(
      new Set(tournamentsAgg.map((t) => safeStr(t.velocidade).trim()).filter((v) => v !== ""))
    );
    vels.sort((a, b) => a.localeCompare(b));
    return vels;
  }, [tournamentsAgg]);

  const uniqueRedes = useMemo(() => {
    const redes = Array.from(new Set(tournamentsAgg.map((t) => safeStr(t.rede).trim()).filter(Boolean)));
    redes.sort((a, b) => a.localeCompare(b));
    return redes;
  }, [tournamentsAgg]);

  const uniquePlayers = useMemo(() => players, [players]);

  // =====================
  // UI helpers
  // =====================
  const getNetworkColor = useCallback((rede: string) => {
    const s = (rede || "").toLowerCase();
    if (s.includes("gg") || s.includes("network")) return "bg-slate-700/20 border-slate-700/50 text-slate-400";
    if (s.includes("party")) return "bg-orange-600/20 border-orange-600/50 text-orange-400";
    if (s.includes("888")) return "bg-sky-600/20 border-sky-600/50 text-sky-400";
    if (s.includes("ipoker")) return "bg-amber-500/20 border-amber-500/50 text-amber-500";
    if (s.includes("stars")) return "bg-red-600/20 border-red-600/50 text-red-500";
    if (s.includes("wpn") || s.includes("winning") || s.includes("acr")) return "bg-indigo-600/20 border-indigo-600/50 text-indigo-400";
    if (s.includes("chico") || s.includes("betonline") || s.includes("sportsbetting"))
      return "bg-emerald-600/20 border-emerald-600/50 text-emerald-400";
    if (s.includes("winamax")) return "bg-fuchsia-600/20 border-fuchsia-600/50 text-fuchsia-400";
    if (s.includes("bodog") || s.includes("ignition")) return "bg-zinc-700/20 border-zinc-700/50 text-zinc-400";
    return "bg-cyan-600/10 border-cyan-600/20 text-cyan-400";
  }, []);

  const addKeyword = (kw: string) => {
    const kws = kw
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k !== "");
    if (kws.length === 0) return;

    let newKeywords = [...activeKeywords];
    let changed = false;

    kws.forEach((k) => {
      if (!newKeywords.includes(k)) {
        newKeywords.push(k);
        changed = true;
      }
    });

    if (changed) setActiveKeywords(newKeywords);
    setKeywordInput("");
    setShowSuggestions(false);
  };

  const removeKeyword = (kw: string) => setActiveKeywords(activeKeywords.filter((k) => k !== kw));

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeywordInput(val);

    if (val.includes(",")) {
      addKeyword(val);
      return;
    }

    if (val.trim().length >= 1) {
      const searchVal = val.toLowerCase();

      const tMatches = STATIC_SUGGESTIONS
        .filter((t) => t.toLowerCase().includes(searchVal) && !activeKeywords.includes(t))
        .map((t) => ({ value: t, type: "Tag" }));

      const vMatches = uniqueVelocities
        .filter((v: string) => v.toLowerCase().includes(searchVal) && !activeKeywords.includes(v))
        .map((v: string) => ({ value: v, type: "Estrutura" }));

      const rMatches = uniqueRedes
        .filter((r: string) => r.toLowerCase().includes(searchVal) && !activeKeywords.includes(r))
        .map((r: string) => ({ value: r, type: "Rede" }));

      const matches = [...tMatches, ...rMatches, ...vMatches].slice(0, 8);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
      setActiveSuggestionIdx(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" && showSuggestions) {
      e.preventDefault();
      setActiveSuggestionIdx((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && showSuggestions) {
      e.preventDefault();
      setActiveSuggestionIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (showSuggestions && suggestions.length > 0) {
        e.preventDefault();
        addKeyword(suggestions[activeSuggestionIdx].value);
      } else if (keywordInput.trim()) {
        e.preventDefault();
        addKeyword(keywordInput);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // redes derivadas das contas selecionadas (dropdown)
  const activeNetworksForSearch = useMemo(() => {
    const sel = new Set(selectedJogadores);
    const networksFromPlayers = players.filter((p) => sel.has(p.id)).map((p) => p.rede);
    return Array.from(new Set([...networksFromPlayers, ...selectedRedes]));
  }, [players, selectedJogadores, selectedRedes]);

  // summaries base
  const summaries = useMemo(() => {
    let list = tournamentsAgg;

    if (activeNetworksForSearch.length > 0) {
      const set = new Set(activeNetworksForSearch);
      list = list.filter((t) => set.has(safeStr(t.rede)));
    }

    return list.map((t) => ({
      rede: safeStr(t.rede),
      nome: safeStr(t.nome),
      qtd: safeNum(t.games_count, 0),
    }));
  }, [tournamentsAgg, activeNetworksForSearch, dataVersion]);

  // lista do meio (filtro por texto)
  const filteredSummariesList = useMemo(() => {
    let list = summaries as any[];

    if (tournamentSearch) {
      const searchStr = tournamentSearch.toLowerCase();
      list = list.filter((summary) => {
        const nome = safeStr(summary.nome).toLowerCase();
        const rede = safeStr(summary.rede).toLowerCase();
        return nome.includes(searchStr) || rede.includes(searchStr);
      });
    }

    return list;
  }, [summaries, tournamentSearch]);

  const visibleSummaries = useMemo(
    () => filteredSummariesList.slice(0, visibleSummaryCount),
    [filteredSummariesList, visibleSummaryCount]
  );

  const handleSummaryScroll = () => {
    if (!summaryListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = summaryListRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      if (visibleSummaryCount < filteredSummariesList.length) setVisibleSummaryCount((prev) => prev + 30);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (playerDropdownRef.current && !playerDropdownRef.current.contains(e.target as Node)) setShowPlayerDropdown(false);
      if (redeDropdownRef.current && !redeDropdownRef.current.contains(e.target as Node)) setShowRedeDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // compat com versão antiga
  const selectedNamesForService = useMemo(() => selectedKeys.map((k) => parseTournamentKey(k).nome), [selectedKeys]);

  // evita colisões em nomes repetidos (manda redes das chaves também)
  const selectedRedesFromKeys = useMemo(() => {
    const redes = selectedKeys.map((k) => parseTournamentKey(k).rede).filter((r) => r && r.trim() !== "");
    return Array.from(new Set(redes));
  }, [selectedKeys]);

  const selectedRedesForService = useMemo(() => {
    return Array.from(new Set([...(selectedRedes || []), ...selectedRedesFromKeys]));
  }, [selectedRedes, selectedRedesFromKeys]);

  // =====================
  // Base detailed results
  // =====================
  const baseDetailedResults = useMemo(() => {
    const kwString = activeKeywords.join(",").toLowerCase();
    const kws = kwString ? kwString.split(",").map((k) => k.trim()).filter(Boolean) : [];

    let list = tournamentsAgg;

    // filtra por redes selecionadas (inclui redes vindas das keys)
    if (selectedRedesForService.length > 0) {
      const set = new Set(selectedRedesForService);
      list = list.filter((t) => set.has(safeStr(t.rede)));
    }

    // 1) seleção manual por tournament_key
    if (selectedKeys.length > 0) {
      const set = new Set(selectedKeys);
      list = list.filter((t) => set.has(safeStr(t.tournament_key)));
    }

    // 2) keywords/tags
    if (kws.length > 0) {
      list = list.filter((t) => {
        const nome = safeStr(t.nome).toLowerCase();
        const rede = safeStr(t.rede).toLowerCase();
        const vel = safeStr(t.velocidade).toLowerCase();
        return kws.some((k) => nome.includes(k) || rede.includes(k) || vel.includes(k));
      });
    }

    // 3) fallback por nome
    if (selectedNamesForService.length > 0) {
      const set = new Set(selectedNamesForService.map((n) => n.toLowerCase()));
      list = list.filter((t) => set.has(safeStr(t.nome).toLowerCase()));
    }

    const rows: any[] = list.map((t) => {
      const qtd = safeNum(t.games_count, 0);
      const stakeMedia = safeNum(t.avg_stake, 0);
      const retornoTotal = safeNum(t.total_profit, 0);

      return {
        nome: safeStr(t.nome),
        rede: safeStr(t.rede),

        stakeMedia,
        stakeTotal: safeNum(t.total_stake, stakeMedia * qtd),

        qtd,
        itm: safeNum(t.itm_count, 0),
        itmPercentual: safeNum(t.itm_pct, 0),

        retornoTotal,

        roiTotal: safeNum(t.roi_total_pct, 0),
        roiMedio: safeNum(t.roi_avg_pct, safeNum(t.roi_total_pct, 0)),

        mediaParticipantes: safeNum(t.field_avg, 0),
        velocidadePredominante: safeStr(t.velocidade),

        horario: "00:00",
        bandeiras: "",
      };
    });

    return rows as SelectionDetailRow[];
  }, [tournamentsAgg, selectedNamesForService, activeKeywords, selectedRedesForService, selectedKeys, dataVersion]);

  const applyNumericFilter = (val: number, filter: MetricFilter): boolean => {
    if (filter.operator === "none") return true;

    const v1 = parseFloat(filter.val1);
    const v2 = parseFloat(filter.val2);

    if (filter.operator === "gte") {
      if (isNaN(v1) || filter.val1.trim() === "") return true;
      return val >= v1;
    }
    if (filter.operator === "lte") {
      if (isNaN(v1) || filter.val1.trim() === "") return true;
      return val <= v1;
    }
    if (filter.operator === "between") {
      const hasV1 = !isNaN(v1) && filter.val1.trim() !== "";
      const hasV2 = !isNaN(v2) && filter.val2.trim() !== "";
      if (!hasV1 || !hasV2) return true;
      return val >= v1 && val <= v2;
    }
    return true;
  };

  const filteredDetailedResults = useMemo(() => {
    const f = detailedFilters;

    return (baseDetailedResults as any[]).filter((item) => {
      const nome = safeStr(item.nome).toLowerCase();
      const rede = safeStr(item.rede);
      const velocidade = safeStr(item.velocidadePredominante);

      if (f.search && !nome.includes(f.search.toLowerCase())) return false;
      if (f.rede.length > 0 && !f.rede.includes(rede)) return false;
      if (f.velocidade.length > 0 && !f.velocidade.includes(velocidade)) return false;

      if (!applyNumericFilter(safeNum(item.stakeMedia, 0), f.metrics.stakeMedia)) return false;
      if (!applyNumericFilter(safeNum(item.qtd, 0), f.metrics.qtd)) return false;
      if (!applyNumericFilter(safeNum(item.itmPercentual, 0), f.metrics.itmPercentual)) return false;
      if (!applyNumericFilter(safeNum(item.retornoTotal, 0), f.metrics.retornoTotal)) return false;

      // mantém o seu comportamento: "roiMedio" aplicado em roiTotal
      if (!applyNumericFilter(safeNum(item.roiTotal, 0), f.metrics.roiMedio)) return false;

      if (!applyNumericFilter(safeNum(item.mediaParticipantes, 0), f.metrics.mediaParticipantes)) return false;

      return true;
    }) as SelectionDetailRow[];
  }, [baseDetailedResults, detailedFilters]);

  // ✅ Amostra filtrada (útil pra DeepDive)
  const sampleBrutos = useMemo(() => {
    return (filteredDetailedResults as any[]).reduce((acc, r: any) => acc + safeNum(r.qtd, 0), 0);
  }, [filteredDetailedResults]);

  const sampleUnicos = useMemo(() => (filteredDetailedResults as any[]).length, [filteredDetailedResults]);

  const consolidatedStats = useMemo<ConsolidatedStats | null>(() => {
    if ((filteredDetailedResults as any[]).length === 0) return null;

    let totalQtd = 0;
    let totalRetorno = 0;
    let totalItmCount = 0;
    let weightedStakeSum = 0;
    let sumCustoTotal = 0;
    let totalParts = 0;

    (filteredDetailedResults as any[]).forEach((r) => {
      const qtd = safeNum(r.qtd, 0);
      const stakeMedia = safeNum(r.stakeMedia, 0);
      const retorno = safeNum(r.retornoTotal, 0);
      const itm = safeNum(r.itm, 0);
      const parts = safeNum(r.mediaParticipantes, 0);

      totalQtd += qtd;
      totalRetorno += retorno;
      totalItmCount += itm;
      weightedStakeSum += stakeMedia * qtd;
      sumCustoTotal += stakeMedia * 1.1 * qtd;
      totalParts += parts * qtd;
    });

    return {
      nome:
        activeKeywords.length > 0
          ? selectedKeys.length > 0
            ? `${activeKeywords.join(" + ")} & Custom`
            : activeKeywords.join(" + ")
          : selectedKeys[0]
          ? parseTournamentKey(selectedKeys[0]).nome
          : "Filtro Selecionado",
      stakeMedia: totalQtd > 0 ? weightedStakeSum / totalQtd : 0,
      qtd: totalQtd,
      itmPercentual: totalQtd > 0 ? (totalItmCount / totalQtd) * 100 : 0,
      retornoTotal: totalRetorno,
      roiTotal: sumCustoTotal > 0 ? (totalRetorno / sumCustoTotal) * 100 : 0,
      mediaParticipantes: totalQtd > 0 ? Math.round(totalParts / totalQtd) : 0,
    };
  }, [filteredDetailedResults, selectedKeys, activeKeywords]);

  const updateDetailedMetricFilter = (key: keyof FilterState["metrics"], updates: Partial<MetricFilter>) => {
    setDetailedFilters((prev) => ({
      ...prev,
      metrics: { ...prev.metrics, [key]: { ...prev.metrics[key], ...updates } },
    }));
  };

  const toggleRedeFilter = (rede: string) => {
    setDetailedFilters((prev) => ({
      ...prev,
      rede: prev.rede.includes(rede) ? prev.rede.filter((r) => r !== rede) : [...prev.rede, rede],
    }));
  };

  const toggleSpeedFilter = (speed: string) => {
    setDetailedFilters((prev) => ({
      ...prev,
      velocidade: prev.velocidade.includes(speed)
        ? prev.velocidade.filter((s) => s !== speed)
        : [...prev.velocidade, speed],
    }));
  };

  // =====================
  // Fallback visual
  // =====================
  if (fatalError) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center text-white">
        <h2 className="text-xl font-black mb-4">Erro carregando Deep Dive</h2>
        <p className="text-slate-400 text-sm">{fatalError}</p>
        <p className="text-slate-600 text-xs mt-4">Abra o console (F12) para detalhes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* 1) CONFIGURAR ANÁLISE */}
      {/* ... SEU BLOCO GIGANTE DE UI (inalterado) ... */}

      {/* 2) RESUMO */}
      <section className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col items-center">
        {!consolidatedStats ? (
          <div className="py-20 text-center space-y-4">
            <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest">
              {loading ? "Carregando dados do Supabase..." : "Defina os filtros acima para consolidar os resultados da amostra"}
            </p>
            <div className="w-12 h-1 bg-slate-800 mx-auto rounded-full"></div>
          </div>
        ) : (
          <div className="w-full space-y-10 animate-in zoom-in-95">
            <div className="text-center flex flex-col items-center">
              <div className="h-px w-20 bg-gradient-to-r from-transparent via-blue-500 to-transparent mb-6"></div>
              <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{consolidatedStats.nome}</h4>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-3">
                Relatório Consolidado de Amostra
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-800/40 p-8 rounded-[2rem] border border-slate-700/50 flex flex-col items-center text-center transition-all hover:bg-slate-800/60 shadow-lg">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Lucro Total</span>
                <span className={`text-3xl font-black ${consolidatedStats.retornoTotal >= 0 ? "text-green-400" : "text-red-500"}`}>
                  ${consolidatedStats.retornoTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2">USD Líquido</span>
              </div>

              <div className="bg-slate-800/40 p-8 rounded-[2rem] border border-slate-700/50 flex flex-col items-center text-center transition-all hover:bg-slate-800/60 shadow-lg">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">ROI Global</span>
                <span className={`text-3xl font-black ${consolidatedStats.roiTotal >= 0 ? "text-green-400" : "text-red-500"}`}>
                  {consolidatedStats.roiTotal.toFixed(1)}%
                </span>
                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2">Retorno Médio</span>
              </div>

              {/* ✅ AQUI FOI A MUDANÇA PRINCIPAL */}
              <div className="bg-slate-800/40 p-8 rounded-[2rem] border border-slate-700/50 flex flex-col items-center text-center transition-all hover:bg-slate-800/60 shadow-lg">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Torneios Totais</span>

                <div className="flex items-end justify-center gap-6">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-black text-white">
                      {countsLoading ? "…" : rawTotal.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2">Brutos</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-slate-300">
                      {countsLoading ? "…" : uniqueTotal.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2">Únicos</span>
                  </div>
                </div>

                {/* opcional: mostra a contagem da amostra filtrada */}
                <div className="mt-4 text-[8px] text-slate-600 font-black uppercase tracking-widest">
                  Amostra: {sampleBrutos.toLocaleString()} brutos • {sampleUnicos.toLocaleString()} únicos
                </div>

                {/* opcional: mostra erro do RPC sem quebrar UI */}
                {countsError && (
                  <div className="mt-3 text-[8px] text-red-400 font-black uppercase tracking-widest">
                    Erro contagem: {countsError}
                  </div>
                )}
              </div>

              <div className="bg-slate-800/40 p-8 rounded-[2rem] border border-slate-700/50 flex flex-col items-center text-center transition-all hover:bg-slate-800/60 shadow-lg">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Stake Média</span>
                <span className="text-3xl font-black text-white">${consolidatedStats.stakeMedia.toFixed(2)}</span>
                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2">Buy-in Médio</span>
              </div>
            </div>

            <div className="bg-slate-800/20 p-6 rounded-2xl border border-slate-800/50 flex flex-col items-center text-center mx-auto max-w-md">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Impacto de Field</span>
              <span className="text-xl font-black text-slate-400">
                {consolidatedStats.mediaParticipantes.toLocaleString()}{" "}
                <span className="text-[10px] uppercase font-bold text-slate-600">Média de Players</span>
              </span>
            </div>
          </div>
        )}
      </section>

      {/* 3) TABELA TÉCNICA */}
      <DeepDiveTable
        consolidatedStats={consolidatedStats}
        filteredDetailedResults={filteredDetailedResults}
        uniqueRedes={uniqueRedes}
        uniqueVelocities={uniqueVelocities}
        detailedFilters={detailedFilters}
        setDetailedFilters={setDetailedFilters}
        toggleRedeFilter={toggleRedeFilter}
        toggleSpeedFilter={toggleSpeedFilter}
        updateDetailedMetricFilter={updateDetailedMetricFilter}
      />
    </div>
  );
};

export default DeepDiveView;
