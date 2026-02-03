import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DatabaseService } from '../../services/dbService';
import type { FilterState, MetricFilter, NumericOperator } from '../../types/common';
import type { ConsolidatedStats, SelectionDetailRow } from '../../types/deepdive';
import DeepDiveTable from './DeepDiveTable';

export interface DeepDiveViewProps {
  dataVersion: number;
}

const STATIC_SUGGESTIONS = ['Bounty', 'Mystery', 'Vanilla', 'Hunter', 'PKO'];
const INITIAL_METRIC_FILTER: MetricFilter = { operator: 'none', val1: '', val2: '' };

const makeTournamentKey = (rede: string, nome: string) => `${rede}::${nome}`;
const parseTournamentKey = (key: string) => {
  const idx = key.indexOf('::');
  if (idx === -1) return { rede: '', nome: key };
  return { rede: key.slice(0, idx), nome: key.slice(idx + 2) };
};

const DeepDiveView: React.FC<DeepDiveViewProps> = ({ dataVersion }) => {
  // seleção por chave (rede::nome)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [activeKeywords, setActiveKeywords] = useState<string[]>([]);
  const [selectedRedes, setSelectedRedes] = useState<string[]>([]);
  const [selectedJogadores, setSelectedJogadores] = useState<string[]>([]);
  const [tournamentSearch, setTournamentSearch] = useState('');
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [redeSearchQuery, setRedeSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ value: string; type: string }[]>([]);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
  const [showRedeDropdown, setShowRedeDropdown] = useState(false);

  // Filtros locais da tabela técnica
  const [detailedFilters, setDetailedFilters] = useState<{
    search: string;
    rede: string[];
    velocidade: string[];
    metrics: FilterState['metrics'];
  }>({
    search: '',
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

  const uniqueVelocities = useMemo(() => DatabaseService.getUniqueValues('velocidade'), [dataVersion]);
  const uniqueRedes = useMemo(() => DatabaseService.getUniqueValues('rede'), [dataVersion]);
  const uniquePlayers = useMemo(() => DatabaseService.getUniquePlayers(), [dataVersion]);

  const getNetworkColor = useCallback((rede: string) => {
    const s = (rede || '').toLowerCase();
    if (s.includes('gg') || s.includes('network')) return 'bg-slate-700/20 border-slate-700/50 text-slate-400';
    if (s.includes('party')) return 'bg-orange-600/20 border-orange-600/50 text-orange-400';
    if (s.includes('888')) return 'bg-sky-600/20 border-sky-600/50 text-sky-400';
    if (s.includes('ipoker')) return 'bg-amber-500/20 border-amber-500/50 text-amber-500';
    if (s.includes('stars')) return 'bg-red-600/20 border-red-600/50 text-red-500';
    if (s.includes('wpn') || s.includes('winning') || s.includes('acr')) return 'bg-indigo-600/20 border-indigo-600/50 text-indigo-400';
    if (s.includes('chico') || s.includes('betonline') || s.includes('sportsbetting')) return 'bg-emerald-600/20 border-emerald-600/50 text-emerald-400';
    if (s.includes('winamax')) return 'bg-fuchsia-600/20 border-fuchsia-600/50 text-fuchsia-400';
    if (s.includes('bodog') || s.includes('ignition')) return 'bg-zinc-700/20 border-zinc-700/50 text-zinc-400';
    return 'bg-cyan-600/10 border-cyan-600/20 text-cyan-400';
  }, []);

  const addKeyword = (kw: string) => {
    const kws = kw
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k !== '');
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
    setKeywordInput('');
    setShowSuggestions(false);
  };

  const removeKeyword = (kw: string) => setActiveKeywords(activeKeywords.filter((k) => k !== kw));

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeywordInput(val);

    if (val.includes(',')) {
      addKeyword(val);
      return;
    }

    if (val.trim().length >= 1) {
      const searchVal = val.toLowerCase();

      const tMatches = STATIC_SUGGESTIONS
        .filter((t) => t.toLowerCase().includes(searchVal) && !activeKeywords.includes(t))
        .map((t) => ({ value: t, type: 'Tag' }));

      const vMatches = uniqueVelocities
        .filter((v: string) => v.toLowerCase().includes(searchVal) && !activeKeywords.includes(v))
        .map((v: string) => ({ value: v, type: 'Estrutura' }));

      const rMatches = uniqueRedes
        .filter((r: string) => r.toLowerCase().includes(searchVal) && !activeKeywords.includes(r))
        .map((r: string) => ({ value: r, type: 'Rede' }));

      const matches = [...tMatches, ...rMatches, ...vMatches].slice(0, 8);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
      setActiveSuggestionIdx(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setActiveSuggestionIdx((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setActiveSuggestionIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (showSuggestions && suggestions.length > 0) {
        e.preventDefault();
        addKeyword(suggestions[activeSuggestionIdx].value);
      } else if (keywordInput.trim()) {
        e.preventDefault();
        addKeyword(keywordInput);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // redes derivadas das contas selecionadas
  const activeNetworksForSearch = useMemo(() => {
    const networksFromPlayers = DatabaseService.getNetworksForPlayers(selectedJogadores);
    return Array.from(new Set([...networksFromPlayers, ...selectedRedes]));
  }, [selectedJogadores, selectedRedes]);

  // summaries base
  const summaries = useMemo(
    () => DatabaseService.getTournamentSummaries(activeNetworksForSearch, [], selectedJogadores),
    [activeNetworksForSearch, selectedJogadores, dataVersion]
  );

  // lista do meio (filtro por texto)
  const filteredSummariesList = useMemo(() => {
    let list = summaries as any[];

    if (tournamentSearch) {
      const searchStr = tournamentSearch.toLowerCase();
      list = list.filter((summary) => {
        const nome = (summary.nome || '').toLowerCase();
        const rede = ((summary.rede ?? summary.site) || '').toLowerCase();
        return nome.includes(searchStr) || rede.includes(searchStr);
      });
    }

    return list;
  }, [summaries, tournamentSearch]);

  const visibleSummaries = useMemo(() => filteredSummariesList.slice(0, visibleSummaryCount), [filteredSummariesList, visibleSummaryCount]);

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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // compat com dbService atual
  const selectedNamesForService = useMemo(() => selectedKeys.map((k) => parseTournamentKey(k).nome), [selectedKeys]);

  // evita colisões em nomes repetidos (manda redes das chaves também)
  const selectedRedesFromKeys = useMemo(() => {
    const redes = selectedKeys.map((k) => parseTournamentKey(k).rede).filter((r) => r && r.trim() !== '');
    return Array.from(new Set(redes));
  }, [selectedKeys]);

  const selectedRedesForService = useMemo(() => {
    return Array.from(new Set([...(selectedRedes || []), ...selectedRedesFromKeys]));
  }, [selectedRedes, selectedRedesFromKeys]);

  const baseDetailedResults = useMemo(() => {
    const kwString = activeKeywords.join(',');
    return DatabaseService.getSelectionDetails(selectedNamesForService, kwString, selectedRedesForService, selectedJogadores) as SelectionDetailRow[];
  }, [selectedNamesForService, activeKeywords, selectedRedesForService, selectedJogadores, dataVersion]);

  const applyNumericFilter = (val: number, filter: MetricFilter): boolean => {
    if (filter.operator === 'none') return true;

    const v1 = parseFloat(filter.val1);
    const v2 = parseFloat(filter.val2);

    if (filter.operator === 'gte') {
      if (isNaN(v1) || filter.val1.trim() === '') return true;
      return val >= v1;
    }
    if (filter.operator === 'lte') {
      if (isNaN(v1) || filter.val1.trim() === '') return true;
      return val <= v1;
    }
    if (filter.operator === 'between') {
      const hasV1 = !isNaN(v1) && filter.val1.trim() !== '';
      const hasV2 = !isNaN(v2) && filter.val2.trim() !== '';
      if (!hasV1 || !hasV2) return true;
      return val >= v1 && val <= v2;
    }
    return true;
  };

  const filteredDetailedResults = useMemo(() => {
    const f = detailedFilters;

    return (baseDetailedResults as any[]).filter((item) => {
      const nome = (item.nome || '').toLowerCase();
      const rede = (item.rede ?? item.site ?? '') as string;
      const velocidade = (item.velocidadePredominante || '') as string;

      if (f.search && !nome.includes(f.search.toLowerCase())) return false;
      if (f.rede.length > 0 && !f.rede.includes(rede)) return false;
      if (f.velocidade.length > 0 && !f.velocidade.includes(velocidade)) return false;

      if (!applyNumericFilter(item.stakeMedia, f.metrics.stakeMedia)) return false;
      if (!applyNumericFilter(item.qtd, f.metrics.qtd)) return false;
      if (!applyNumericFilter(item.itmPercentual, f.metrics.itmPercentual)) return false;
      if (!applyNumericFilter(item.retornoTotal, f.metrics.retornoTotal)) return false;

      // mantém o seu comportamento: "roiMedio" aplicado em roiTotal
      if (!applyNumericFilter(item.roiTotal, f.metrics.roiMedio)) return false;

      if (!applyNumericFilter(item.mediaParticipantes, f.metrics.mediaParticipantes)) return false;

      return true;
    }) as SelectionDetailRow[];
  }, [baseDetailedResults, detailedFilters]);

  const consolidatedStats = useMemo<ConsolidatedStats | null>(() => {
    if ((baseDetailedResults as any[]).length === 0) return null;

    let totalQtd = 0;
    let totalRetorno = 0;
    let totalItmCount = 0;
    let weightedStakeSum = 0;
    let sumCustoTotal = 0;
    let totalParts = 0;

    (baseDetailedResults as any[]).forEach((r) => {
      totalQtd += r.qtd;
      totalRetorno += r.retornoTotal;
      totalItmCount += r.itm;
      weightedStakeSum += r.stakeMedia * r.qtd;
      sumCustoTotal += r.stakeMedia * 1.1 * r.qtd;
      totalParts += r.mediaParticipantes * r.qtd;
    });

    return {
      nome:
        activeKeywords.length > 0
          ? selectedKeys.length > 0
            ? `${activeKeywords.join(' + ')} & Custom`
            : activeKeywords.join(' + ')
          : selectedKeys[0]
          ? parseTournamentKey(selectedKeys[0]).nome
          : 'Filtro Selecionado',
      stakeMedia: totalQtd > 0 ? weightedStakeSum / totalQtd : 0,
      qtd: totalQtd,
      itmPercentual: totalQtd > 0 ? (totalItmCount / totalQtd) * 100 : 0,
      retornoTotal: totalRetorno,
      roiTotal: sumCustoTotal > 0 ? (totalRetorno / sumCustoTotal) * 100 : 0,
      mediaParticipantes: totalQtd > 0 ? Math.round(totalParts / totalQtd) : 0,
    };
  }, [baseDetailedResults, selectedKeys, activeKeywords]);

  const updateDetailedMetricFilter = (key: keyof FilterState['metrics'], updates: Partial<MetricFilter>) => {
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
      velocidade: prev.velocidade.includes(speed) ? prev.velocidade.filter((s) => s !== speed) : [...prev.velocidade, speed],
    }));
  };

  const handleExportToGrade = () => {
    const statsCache: Record<string, any> = {};
    const manuallyAddedKeys: string[] = [];

    filteredDetailedResults.forEach((item: any) => {
      const rede = (item.rede ?? item.site ?? '') as string;
      const key = makeTournamentKey(rede, item.nome);
      manuallyAddedKeys.push(key);

      statsCache[key] = {
        nome: item.nome,
        stakeMedia: item.stakeMedia,
        roiTotal: item.roiTotal,
        qtd: item.qtd,
        rede,
        velocidadePredominante: item.velocidadePredominante,
        mediaParticipantes: item.mediaParticipantes,
        horario: item.horario || '00:00',
        bandeiras: item.bandeiras || '',
        isFullyManual: false,
      };
    });

    const dataToExport = {
      slot: {
        id: Date.now(),
        name: `Export Análise ${new Date().toLocaleDateString()}`,
        days: [],
        config: {
          minSampling: 9999,
          minRoi: '',
          startTime: '00:00',
          endTime: '23:59',
          minStake: '',
          maxStake: '',
          minField: '',
          maxField: '',
          selRede: [],
          selSpeed: [],
          excludeKeywords: [],
        },
        manualTimes: {},
        manuallyAddedKeys,
        excludedKeys: [],
        statsCache,
        // compat antiga
        manuallyAddedNames: [],
        excludedNames: [],
      },
      alertVolume: 0.5,
      alertsEnabled: false,
      grindMode: false,
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deepdive-to-grade-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* 1) CONFIGURAR ANÁLISE */}
      <section className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-8">
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex flex-col">
            <h3 className="text-[12px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
              Configurar Análise Profunda
            </h3>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">
              Defina os parâmetros para consolidação de dados
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedKeys([]);
              setKeywordInput('');
              setActiveKeywords([]);
              setSelectedJogadores([]);
              setSelectedRedes([]);
            }}
            className="text-[9px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest transition-colors border border-slate-800 px-4 py-2 rounded-xl"
          >
            Limpar Tudo
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Termos & Tags */}
          <div className="lg:col-span-3 space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Termos & Tags
            </label>

            <div className="relative" ref={suggestionRef}>
              <input
                type="text"
                placeholder="Ex: Bounty, PKO, Turbo..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-white text-xs text-center focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                value={keywordInput}
                onChange={handleKeywordChange}
                onKeyDown={handleKeywordKeyDown}
              />

              {showSuggestions && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {suggestions.map((s, idx) => (
                    <button
                      key={`${s.value}-${idx}`}
                      onClick={() => addKeyword(s.value)}
                      className={`w-full text-left px-5 py-3 text-[10px] font-black flex items-center justify-between transition-colors border-b border-slate-800 last:border-none ${
                        idx === activeSuggestionIdx ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span>{s.value}</span>
                      <span
                        className={`opacity-50 text-[7px] uppercase px-1.5 py-0.5 rounded border ${
                          idx === activeSuggestionIdx ? 'border-white/30' : 'border-slate-700'
                        }`}
                      >
                        {s.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 justify-center max-h-40 overflow-y-auto pt-2">
              {activeKeywords.map((kw) => (
                <span
                  key={kw}
                  className="bg-blue-600/10 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-2 animate-in zoom-in-95"
                >
                  {kw}
                  <button onClick={() => removeKeyword(kw)}>×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Lista de torneios */}
          <div className="lg:col-span-6 space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Filtrar Torneios da Amostra
            </label>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 transition-all">
              <input
                type="text"
                placeholder="Pesquisar por nome do torneio na base de dados..."
                className="w-full bg-transparent border-none px-6 py-4 text-white text-xs text-center outline-none placeholder:text-slate-700 font-bold"
                value={tournamentSearch}
                onChange={(e) => {
                  setTournamentSearch(e.target.value);
                  setVisibleSummaryCount(30);
                }}
              />
            </div>

            <div
              ref={summaryListRef}
              onScroll={handleSummaryScroll}
              className="h-80 overflow-y-auto bg-slate-950/40 rounded-2xl border border-slate-800 p-3 space-y-2 custom-scrollbar shadow-inner"
            >
              {visibleSummaries.map((s: any) => {
                const rede = (s.rede ?? s.site ?? '') as string;
                const key = makeTournamentKey(rede, s.nome || '');
                const isSelected = selectedKeys.includes(key);

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))}
                    className={`w-full text-left px-5 py-3.5 rounded-xl transition-all font-medium flex items-center justify-between group border ${
                      isSelected
                        ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                        : 'bg-slate-900/50 border-slate-800/50 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black truncate max-w-[320px] uppercase tracking-wide">{s.nome}</span>
                      <span className="text-[8px] opacity-50 font-black uppercase tracking-tighter mt-1">
                        {(s.rede ?? s.site ?? 'Rede')} • {s.qtd} jogos registrados
                      </span>
                    </div>
                    {isSelected && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* redes + contas */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            {/* Redes */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Selecionar Redes
              </label>

              <div className="relative" ref={redeDropdownRef}>
                <button
                  onClick={() => setShowRedeDropdown(!showRedeDropdown)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-between shadow-sm hover:border-slate-700 transition-colors"
                >
                  <span>{selectedRedes.length === 0 ? 'Todas' : `${selectedRedes.length} redes`}</span>
                  <svg className={`h-4 w-4 transition-transform ${showRedeDropdown ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>

                {showRedeDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[60] p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <input
                      type="text"
                      placeholder="Pesquisar rede..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black text-white outline-none focus:ring-1 focus:ring-blue-600"
                      value={redeSearchQuery}
                      onChange={(e) => setRedeSearchQuery(e.target.value)}
                    />
                    <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                      {uniqueRedes
                        .filter((r: string) => r.toLowerCase().includes(redeSearchQuery.toLowerCase()))
                        .map((rede: string) => (
                          <label key={rede} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg cursor-pointer group transition-colors">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded bg-slate-950 border-slate-700 checked:bg-blue-600 transition-all"
                              checked={selectedRedes.includes(rede)}
                              onChange={() => setSelectedRedes((prev) => (prev.includes(rede) ? prev.filter((p) => p !== rede) : [...prev, rede]))}
                            />
                            <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-white">{rede}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contas */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Selecionar Contas
              </label>

              <div className="relative" ref={playerDropdownRef}>
                <button
                  onClick={() => setShowPlayerDropdown(!showPlayerDropdown)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-between shadow-sm hover:border-slate-700 transition-colors"
                >
                  <span>{selectedJogadores.length === 0 ? 'Todos' : `${selectedJogadores.length} contas`}</span>
                  <svg className={`h-4 w-4 transition-transform ${showPlayerDropdown ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>

                {showPlayerDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[60] p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <input
                      type="text"
                      placeholder="Filtrar nick..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black text-white outline-none focus:ring-1 focus:ring-blue-600"
                      value={playerSearchQuery}
                      onChange={(e) => setPlayerSearchQuery(e.target.value)}
                    />
                    <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                      {uniquePlayers
                        .filter((p: any) => p.jogador.toLowerCase().includes(playerSearchQuery.toLowerCase()))
                        .map((p: any) => (
                          <label
                            key={p.id}
                            className="flex items-center justify-between px-3 py-2 hover:bg-slate-800 rounded-lg cursor-pointer group transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded bg-slate-950 border-slate-700 checked:bg-blue-600 transition-all"
                                checked={selectedJogadores.includes(p.id)}
                                onChange={() => setSelectedJogadores((prev) => (prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]))}
                              />
                              <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-white truncate max-w-[120px]">
                                {p.jogador}
                              </span>
                            </div>
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter transition-colors ${getNetworkColor(p.rede)}`}>
                              {p.rede}
                            </span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2) RESUMO */}
      <section className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col items-center">
        {!consolidatedStats ? (
          <div className="py-20 text-center space-y-4">
            <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest">
              Defina os filtros acima para consolidar os resultados da amostra
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
                <span className={`text-3xl font-black ${consolidatedStats.retornoTotal >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                  ${consolidatedStats.retornoTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2">USD Líquido</span>
              </div>

              <div className="bg-slate-800/40 p-8 rounded-[2rem] border border-slate-700/50 flex flex-col items-center text-center transition-all hover:bg-slate-800/60 shadow-lg">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">ROI Global</span>
                <span className={`text-3xl font-black ${consolidatedStats.roiTotal >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                  {consolidatedStats.roiTotal.toFixed(1)}%
                </span>
                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2">Retorno Médio</span>
              </div>

              <div className="bg-slate-800/40 p-8 rounded-[2rem] border border-slate-700/50 flex flex-col items-center text-center transition-all hover:bg-slate-800/60 shadow-lg">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Volume</span>
                <span className="text-3xl font-black text-white">{consolidatedStats.qtd}</span>
                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2">Jogos Jogados</span>
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
                {consolidatedStats.mediaParticipantes.toLocaleString()}{' '}
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
        getNetworkColor={getNetworkColor}
        onExportToGrade={handleExportToGrade}
      />
    </div>
  );
};

export default DeepDiveView;
