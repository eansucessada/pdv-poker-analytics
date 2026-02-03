// components/deepdive/DeepDiveFilters.tsx

import React, { useMemo, useRef, useState } from 'react';
import type { DeepDivePlayer, DeepDiveSuggestion, TournamentSummary } from '../../types/deepdive';
import { makeTournamentKey } from '../../utils/tournamentKey';

const STATIC_SUGGESTIONS = ['Bounty', 'Mystery', 'Vanilla', 'Hunter', 'PKO'];

interface DeepDiveFiltersProps {
  uniqueVelocities: string[];
  uniqueRedes: string[];
  uniquePlayers: DeepDivePlayer[];

  // keywords
  keywordInput: string;
  setKeywordInput: (v: string) => void;
  activeKeywords: string[];
  setActiveKeywords: (v: string[]) => void;

  // selection
  selectedKeys: string[];
  setSelectedKeys: (updater: (prev: string[]) => string[]) => void;

  selectedRedes: string[];
  setSelectedRedes: (updater: (prev: string[]) => string[]) => void;

  selectedJogadores: string[];
  setSelectedJogadores: (updater: (prev: string[]) => string[]) => void;

  // summaries list
  summaries: TournamentSummary[];
  visibleSummaries: TournamentSummary[];
  tournamentSearch: string;
  setTournamentSearch: (v: string) => void;
  onLoadMore: () => void;

  // UI helpers
  getNetworkColor: (rede: string) => string;
}

const DeepDiveFilters: React.FC<DeepDiveFiltersProps> = ({
  uniqueVelocities,
  uniqueRedes,
  uniquePlayers,

  keywordInput,
  setKeywordInput,
  activeKeywords,
  setActiveKeywords,

  selectedKeys,
  setSelectedKeys,

  selectedRedes,
  setSelectedRedes,

  selectedJogadores,
  setSelectedJogadores,

  summaries,
  visibleSummaries,
  tournamentSearch,
  setTournamentSearch,
  onLoadMore,

  getNetworkColor
}) => {
  // suggestions UI
  const [suggestions, setSuggestions] = useState<DeepDiveSuggestion[]>([]);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // dropdown UI
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
  const [showRedeDropdown, setShowRedeDropdown] = useState(false);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [redeSearchQuery, setRedeSearchQuery] = useState('');

  // refs
  const suggestionRef = useRef<HTMLDivElement>(null);
  const playerDropdownRef = useRef<HTMLDivElement>(null);
  const redeDropdownRef = useRef<HTMLDivElement>(null);
  const summaryListRef = useRef<HTMLDivElement>(null);

  // click outside (sem hook pra evitar dependência)
  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (playerDropdownRef.current && !playerDropdownRef.current.contains(e.target as Node)) setShowPlayerDropdown(false);
      if (redeDropdownRef.current && !redeDropdownRef.current.contains(e.target as Node)) setShowRedeDropdown(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const addKeyword = (kw: string) => {
    const kws = kw
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k !== '');
    if (kws.length === 0) return;

    const newKeywords = [...activeKeywords];
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
        .map((t) => ({ value: t, type: 'Tag' as const }));

      const vMatches = uniqueVelocities
        .filter((v) => v.toLowerCase().includes(searchVal) && !activeKeywords.includes(v))
        .map((v) => ({ value: v, type: 'Estrutura' as const }));

      const rMatches = uniqueRedes
        .filter((r) => r.toLowerCase().includes(searchVal) && !activeKeywords.includes(r))
        .map((r) => ({ value: r, type: 'Rede' as const }));

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

  const filteredSummariesList = useMemo(() => {
    let list = summaries;

    if (tournamentSearch) {
      const searchStr = tournamentSearch.toLowerCase();
      list = list.filter((summary) => {
        const nome = (summary.nome || '').toLowerCase();
        const rede = ((summary.rede ?? summary.rede) || '').toLowerCase();
        return nome.includes(searchStr) || rede.includes(searchStr);
      });
    }

    return list;
  }, [summaries, tournamentSearch]);

  const handleSummaryScroll = () => {
    if (!summaryListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = summaryListRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 50) onLoadMore();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Tags/Termos */}
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
            onChange={(e) => setTournamentSearch(e.target.value)}
          />
        </div>

        <div
          ref={summaryListRef}
          onScroll={handleSummaryScroll}
          className="h-80 overflow-y-auto bg-slate-950/40 rounded-2xl border border-slate-800 p-3 space-y-2 custom-scrollbar shadow-inner"
        >
          {visibleSummaries.map((s) => {
            const rede = (s.rede ?? s.rede ?? '') as string;
            const key = makeTournamentKey(rede, s.nome || '');
            const isSelected = selectedKeys.includes(key);

            return (
              <button
                key={key}
                onClick={() =>
                  setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
                }
                className={`w-full text-left px-5 py-3.5 rounded-xl transition-all font-medium flex items-center justify-between group border ${
                  isSelected
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                    : 'bg-slate-900/50 border-slate-800/50 hover:bg-slate-800 text-slate-400'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-black truncate max-w-[320px] uppercase tracking-wide">{s.nome}</span>
                  <span className="text-[8px] opacity-50 font-black uppercase tracking-tighter mt-1">
                    {(s.rede ?? s.rede ?? 'Rede')} • {s.qtd} jogos registrados
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

          {filteredSummariesList.length === 0 && (
            <div className="py-10 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest">
              Nenhum torneio encontrado
            </div>
          )}
        </div>
      </div>

      {/* Redes/Contas */}
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
                    .filter((r) => r.toLowerCase().includes(redeSearchQuery.toLowerCase()))
                    .map((rede) => (
                      <label key={rede} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg cursor-pointer group transition-colors">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded bg-slate-950 border-slate-700 checked:bg-blue-600 transition-all"
                          checked={selectedRedes.includes(rede)}
                          onChange={() =>
                            setSelectedRedes((prev) => (prev.includes(rede) ? prev.filter((p) => p !== rede) : [...prev, rede]))
                          }
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
                    .filter((p) => p.jogador.toLowerCase().includes(playerSearchQuery.toLowerCase()))
                    .map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-slate-800 rounded-lg cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded bg-slate-950 border-slate-700 checked:bg-blue-600 transition-all"
                            checked={selectedJogadores.includes(p.id)}
                            onChange={() =>
                              setSelectedJogadores((prev) => (prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]))
                            }
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
  );
};

export default DeepDiveFilters;