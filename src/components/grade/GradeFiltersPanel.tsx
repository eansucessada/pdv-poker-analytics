// src/components/grade/GradeFiltersPanel.tsx
import React, { useMemo, useRef, useState } from 'react';
import type { GradeConfig } from '../../types/grade';
import { formatTimeInput } from '../../utils/format';
import { useOutsideClick } from '../../hooks/useOutsideClick';

const EXCLUDE_SUGGESTIONS = [
  'Satellite',
  'Mystery',
  'Turbo',
  'Zodiac',
  'Deepstack',
  'Seats',
  'Daily',
  'Mini',
  '6-Max',
  '7-Max',
  'Rebuy'
];

interface Props {
  pendingConfig: GradeConfig;
  setPendingConfig: (v: GradeConfig) => void;

  allRedes: string[];
  uniqueVelocidades: string[];

  grindMode: boolean;
  setGrindMode: (v: boolean) => void;
  alertsEnabled: boolean;
  setAlertsEnabled: (v: boolean) => void;

  alertVolume: number;
  setAlertVolume: (v: number) => void;
  playAlertSound: () => void;

  resetFilters: () => void;
  applyFilters: () => void;
}

const GradeFiltersPanel: React.FC<Props> = ({
  pendingConfig,
  setPendingConfig,
  allRedes,
  uniqueVelocidades,
  grindMode,
  setGrindMode,
  alertsEnabled,
  setAlertsEnabled,
  alertVolume,
  setAlertVolume,
  playAlertSound,
  resetFilters,
  applyFilters
}) => {
  const [showRedeDropdown, setShowRedeDropdown] = useState(false);
  const [showSpeedDropdown, setShowSpeedDropdown] = useState(false);
  const redeDropdownRef = useRef<HTMLDivElement>(null);
  const speedDropdownRef = useRef<HTMLDivElement>(null);

  const [excludeInput, setExcludeInput] = useState('');
  const [excludeSuggestions, setExcludeSuggestions] = useState<string[]>([]);
  const [showExcludeSuggestions, setShowExcludeSuggestions] = useState(false);
  const [excludeSuggestionIdx, setExcludeSuggestionIdx] = useState(0);
  const excludeSuggestionRef = useRef<HTMLDivElement>(null);

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);

  useOutsideClick([redeDropdownRef, speedDropdownRef, excludeSuggestionRef, volumeRef], () => {
    setShowRedeDropdown(false);
    setShowSpeedDropdown(false);
    setShowExcludeSuggestions(false);
    setShowVolumeSlider(false);
  });

  const suggestionPool = useMemo(() => {
    const commonPokerKeywords = [
      ...EXCLUDE_SUGGESTIONS,
      'Progressive',
      'Hyper',
      'Deepstack',
      'High Roller',
      'Freezeout',
      'Rebuy',
      'Satellite',
      'Main Event',
      '6-Max',
      '8-Max',
      'Hunter',
      'Knockout',
      'Vanilla'
    ];
    const pool: string[] = [...uniqueVelocidades, ...allRedes, ...commonPokerKeywords];
    return Array.from(new Set(pool)).sort();
  }, [uniqueVelocidades, allRedes]);

  const handleExcludeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setExcludeInput(val);

    const terms = val.split(',');
    const lastTerm = terms[terms.length - 1].trim().toLowerCase();

    const baseSuggestions =
      lastTerm.length >= 2
        ? suggestionPool
            .filter(
              kw =>
                kw.toLowerCase().includes(lastTerm) &&
                !pendingConfig.excludeKeywords.some(eKw => eKw.toLowerCase() === kw.toLowerCase())
            )
            .slice(0, 8)
        : EXCLUDE_SUGGESTIONS.filter(
            kw => !pendingConfig.excludeKeywords.some(existing => existing.toLowerCase() === kw.toLowerCase())
          );

    setExcludeSuggestions(baseSuggestions);
    setExcludeSuggestionIdx(0);
    setShowExcludeSuggestions(baseSuggestions.length > 0);
  };

  const addExcludeKeyword = (kw: string) => {
    const trimmed = kw.trim();
    if (!trimmed) return;

    const termsToAdd = trimmed
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const uniqueNew = termsToAdd.filter(
      t => !pendingConfig.excludeKeywords.some(existing => existing.toLowerCase() === t.toLowerCase())
    );

    if (uniqueNew.length > 0) {
      setPendingConfig({
        ...pendingConfig,
        excludeKeywords: [...pendingConfig.excludeKeywords, ...uniqueNew]
      });
    }

    setExcludeInput('');
    setShowExcludeSuggestions(false);
  };

  const removeExcludeKeyword = (kw: string) => {
    setPendingConfig({ ...pendingConfig, excludeKeywords: pendingConfig.excludeKeywords.filter(k => k !== kw) });
  };

  const handleExcludeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showExcludeSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setExcludeSuggestionIdx(prev => (prev + 1) % excludeSuggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setExcludeSuggestionIdx(prev => (prev - 1 + excludeSuggestions.length) % excludeSuggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        addExcludeKeyword(excludeSuggestions[excludeSuggestionIdx]);
      } else if (e.key === 'Escape') {
        setShowExcludeSuggestions(false);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      addExcludeKeyword(excludeInput);
    }
  };

  return (
    <section className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Critérios Base */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4 text-center lg:text-left">
            Critérios Base
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">
                ROI Mínimo %
              </label>
              <input
                type="number"
                step="any"
                value={pendingConfig.minRoi}
                onChange={e => setPendingConfig({ ...pendingConfig, minRoi: e.target.value })}
                placeholder="0.0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[11px] font-black text-white focus:ring-1 focus:ring-blue-500 outline-none text-center"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">
                QTD Mínima
              </label>
              <input
                type="number"
                value={pendingConfig.minSampling}
                onChange={e => setPendingConfig({ ...pendingConfig, minSampling: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[11px] font-black text-white focus:ring-1 focus:ring-blue-500 outline-none text-center"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">
              Janela Horária
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={5}
                placeholder="00:00"
                value={pendingConfig.startTime}
                onChange={e => setPendingConfig({ ...pendingConfig, startTime: formatTimeInput(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[11px] font-black text-white focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                maxLength={5}
                placeholder="23:59"
                value={pendingConfig.endTime}
                onChange={e => setPendingConfig({ ...pendingConfig, endTime: formatTimeInput(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[11px] font-black text-white focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 pt-4 border-t border-slate-800/40">
            <div className="flex flex-wrap items-center justify-center gap-5">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Grind Mode</span>
                <button
                  onClick={() => setGrindMode(!grindMode)}
                  className={`w-12 h-6 rounded-full transition-all border relative ${
                    grindMode ? 'bg-blue-600 border-blue-400' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-3.5 h-3.5 bg-white rounded-full transition-all ${
                      grindMode ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Alertas</span>
                <button
                  onClick={() => setAlertsEnabled(!alertsEnabled)}
                  className={`w-12 h-6 rounded-full transition-all border relative ${
                    alertsEnabled ? 'bg-blue-600 border-blue-400' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-3.5 h-3.5 bg-white rounded-full transition-all ${
                      alertsEnabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="relative" ref={volumeRef}>
              <button
                onClick={() => {
                  setShowVolumeSlider(!showVolumeSlider);
                  playAlertSound();
                }}
                className={`p-4 rounded-2xl border transition-all flex items-center gap-3 ${
                  showVolumeSlider
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-widest">Volume</span>
              </button>

              {showVolumeSlider && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl z-[100] w-12 h-40 flex flex-col items-center">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={alertVolume}
                    onChange={e => setAlertVolume(parseFloat(e.target.value))}
                    className="h-32 accent-blue-500 appearance-none bg-slate-800 rounded-full w-2 cursor-pointer"
                    style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' } as any}
                  />
                  <span className="text-[8px] font-black text-white mt-2">{Math.round(alertVolume * 100)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dimensionamento */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4 text-center lg:text-left">
            Dimensionamento
          </h4>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">Buy-in ($)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={pendingConfig.minStake}
                  onChange={e => setPendingConfig({ ...pendingConfig, minStake: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[11px] font-black text-white focus:ring-1 focus:ring-blue-500 outline-none text-center"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={pendingConfig.maxStake}
                  onChange={e => setPendingConfig({ ...pendingConfig, maxStake: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[11px] font-black text-white focus:ring-1 focus:ring-blue-500 outline-none text-center"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">Field</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={pendingConfig.minField}
                  onChange={e => setPendingConfig({ ...pendingConfig, minField: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[11px] font-black text-white focus:ring-1 focus:ring-blue-500 outline-none text-center"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={pendingConfig.maxField}
                  onChange={e => setPendingConfig({ ...pendingConfig, maxField: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[11px] font-black text-white focus:ring-1 focus:ring-blue-500 outline-none text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Redes */}
              <div className="space-y-1.5 relative" ref={redeDropdownRef}>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">Redes</label>
                <button
                  onClick={() => setShowRedeDropdown(!showRedeDropdown)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-black text-white focus:ring-1 focus:ring-blue-500 flex items-center justify-between"
                >
                  <span className="truncate">
                    {pendingConfig.selRede.length === 0 ? 'Todas' : `${pendingConfig.selRede.length} sel.`}
                  </span>
                  <svg className={`h-3 w-3 transition-transform ${showRedeDropdown ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>

                {showRedeDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[110] p-3 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                    {allRedes.map(rede => (
                      <label key={rede} className="flex items-center gap-3 px-2 py-2 hover:bg-slate-800 rounded-lg cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded bg-slate-950 border-slate-700 checked:bg-blue-600 transition-all"
                          checked={pendingConfig.selRede.includes(rede)}
                          onChange={() => {
                            const next = pendingConfig.selRede.includes(rede)
                              ? pendingConfig.selRede.filter(r => r !== rede)
                              : [...pendingConfig.selRede, rede];
                            setPendingConfig({ ...pendingConfig, selRede: next });
                          }}
                        />
                        <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-white">{rede}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Estruturas */}
              <div className="space-y-1.5 relative" ref={speedDropdownRef}>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">Estrutura</label>
                <button
                  onClick={() => setShowSpeedDropdown(!showSpeedDropdown)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-black text-white focus:ring-1 focus:ring-blue-500 flex items-center justify-between"
                >
                  <span className="truncate">
                    {pendingConfig.selSpeed.length === 0 ? 'Todas' : `${pendingConfig.selSpeed.length} sel.`}
                  </span>
                  <svg className={`h-3 w-3 transition-transform ${showSpeedDropdown ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>

                {showSpeedDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[110] p-3 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                    {uniqueVelocidades.map(vel => (
                      <label key={vel} className="flex items-center gap-3 px-2 py-2 hover:bg-slate-800 rounded-lg cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded bg-slate-950 border-slate-700 checked:bg-blue-600 transition-all"
                          checked={pendingConfig.selSpeed.includes(vel)}
                          onChange={() => {
                            const next = pendingConfig.selSpeed.includes(vel)
                              ? pendingConfig.selSpeed.filter(v => v !== vel)
                              : [...pendingConfig.selSpeed, vel];
                            setPendingConfig({ ...pendingConfig, selSpeed: next });
                          }}
                        />
                        <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-white">{vel}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Exclusão */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-4 text-center lg:text-left">
            Exclusão de Termos
          </h4>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest w-full mb-1">
                Sugestões de Tags:
              </span>
              {EXCLUDE_SUGGESTIONS.map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => addExcludeKeyword(suggestion)}
                  className="text-[8px] font-black uppercase px-2 py-1 rounded bg-slate-800 text-slate-400 hover:bg-red-600/20 hover:text-red-400 border border-slate-700 transition-all"
                >
                  + {suggestion}
                </button>
              ))}
            </div>

            <div className="relative" ref={excludeSuggestionRef}>
              <input
                type="text"
                placeholder="Remover termos..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-[11px] font-black text-white focus:ring-2 focus:ring-red-600 outline-none text-center transition-all"
                value={excludeInput}
                onChange={handleExcludeChange}
                onKeyDown={handleExcludeKeyDown}
              />

              {showExcludeSuggestions && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto">
                  {excludeSuggestions.map((s, idx) => (
                    <button
                      key={`${s}-${idx}`}
                      onClick={() => addExcludeKeyword(s)}
                      className={`w-full text-center px-4 py-2.5 text-[10px] font-black ${
                        idx === excludeSuggestionIdx ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 justify-center max-h-24 overflow-y-auto pt-2 border-t border-slate-800/30">
              {pendingConfig.excludeKeywords.map((kw, idx) => (
                <span
                  key={`${kw}-${idx}`}
                  className="bg-red-500/10 border border-red-500/30 text-red-400 px-2 py-1 rounded text-[9px] font-black uppercase flex items-center gap-2"
                >
                  {kw}
                  <button onClick={() => removeExcludeKeyword(kw)}>×</button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={resetFilters}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl transition-all text-[10px] uppercase tracking-[0.2em] border border-slate-700"
              >
                Limpar Filtros
              </button>
              <button
                onClick={applyFilters}
                className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg text-[10px] uppercase tracking-[0.2em]"
              >
                Confirmar Grade
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GradeFiltersPanel;
