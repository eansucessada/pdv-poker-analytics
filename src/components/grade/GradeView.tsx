// grade/GradeView.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { FilterState } from '../../types/common';
import type { GradeConfig, GradeViewProps } from '../../types/grade';
import { useGradeSlots, DEFAULT_GRADE_CONFIG } from '../../hooks/useGradeSlots';
import { useGradeData } from '../../hooks/useGradeData';
import { useGradeImportExport } from '../../hooks/useGradeImportExport';
import { useGradeAlerts } from '../../hooks/useGradeAlerts';
import { getHHMM, subtractMinutes } from '../../utils/time';
import { makeTournamentKey } from '../../utils/tournamentKey';

import GradeHeader from './GradeHeader';
import GradeFiltersPanel from './GradeFiltersPanel';
import GradeTable from './GradeTable';
import GradeManualAdd from './GradeManualAdd';
import GradeManualModal from './GradeManualModal';
import GradeImportModal from './GradeImportModal';


const ALERT_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3';

const GradeView: React.FC<GradeViewProps> = ({ dataVersion, filters, allRedes, uniqueVelocidades }) => {
  // slots
  const { slots, activeSlotId, activeSlot, updateActiveSlot, switchSlot, addSlot, removeSlot } = useGradeSlots();

  // audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [alertVolume, setAlertVolume] = useState<number>(0.5);

  const playAlertSound = () => {
    if (!audioRef.current) return;
    audioRef.current.volume = alertVolume;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(e => console.warn('Audio error', e));
  };

  useEffect(() => {
    audioRef.current = new Audio(ALERT_SOUND_URL);
    audioRef.current.load();
  }, []);

  // UI states
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(false);
  const [grindMode, setGrindMode] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('00:00');
  const [cutoffTimeStr, setCutoffTimeStr] = useState<string>('00:00');

  // rename
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState(activeSlot.name);
  const commitRename = () => {
    if (tempName.trim()) updateActiveSlot({ name: tempName.trim() });
    setIsRenaming(false);
  };

  // slot switch housekeeping
  useEffect(() => {
    setTempName(activeSlot.name);
  }, [activeSlot.name]);

  // normalize filters (rede/velocidade arrays)
  const normalizedFilters: FilterState = useMemo(() => {
    const anyFilters: any = filters as any;

    const normalizedRede: string[] = Array.isArray(anyFilters?.rede)
      ? anyFilters.rede
      : (typeof anyFilters?.rede === 'string' && anyFilters.rede.trim() ? [anyFilters.rede] : []);

    const normalizedVelocidade: string[] = Array.isArray(anyFilters?.velocidade)
      ? anyFilters.velocidade
      : (typeof anyFilters?.velocidade === 'string' && anyFilters.velocidade.trim() ? [anyFilters.velocidade] : []);

    const normalized: any = {
      ...anyFilters,
      rede: normalizedRede,
      velocidade: normalizedVelocidade
    };

    if (typeof normalized.search !== 'string') normalized.search = '';
    if (typeof normalized.bandeiras !== 'string') normalized.bandeiras = '';
    if (!normalized.metrics) {
      normalized.metrics = {
        stakeMedia: { operator: 'none', val1: '', val2: '' },
        qtd: { operator: 'none', val1: '', val2: '' },
        itmPercentual: { operator: 'none', val1: '', val2: '' },
        retornoTotal: { operator: 'none', val1: '', val2: '' },
        roiMedio: { operator: 'none', val1: '', val2: '' },
        mediaParticipantes: { operator: 'none', val1: '', val2: '' }
      };
    }

    return normalized as FilterState;
  }, [filters]);

  // configs
  const [pendingConfig, setPendingConfig] = useState<GradeConfig>(activeSlot.config);
  const [appliedConfig, setAppliedConfig] = useState<GradeConfig>(activeSlot.config);

  useEffect(() => {
    setPendingConfig(activeSlot.config);
    setAppliedConfig(activeSlot.config);
    setIsRenaming(false);
    setTempName(activeSlot.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlotId]);

  const applyFilters = () => {
    const finalConfig = {
      ...pendingConfig,
      startTime: pendingConfig.startTime.trim() === '' ? '00:00' : pendingConfig.startTime,
      endTime: pendingConfig.endTime.trim() === '' ? '23:59' : pendingConfig.endTime
    };
    setPendingConfig(finalConfig);
    setAppliedConfig(finalConfig);
    updateActiveSlot({ config: finalConfig });
  };

  const resetFilters = () => {
    setPendingConfig(DEFAULT_GRADE_CONFIG);
    setAppliedConfig(DEFAULT_GRADE_CONFIG);
    updateActiveSlot({ config: DEFAULT_GRADE_CONFIG });
  };

  const toggleDay = (dayIdx: number) => {
    const newDays = activeSlot.days.includes(dayIdx) ? activeSlot.days.filter(d => d !== dayIdx) : [...activeSlot.days, dayIdx];
    updateActiveSlot({ days: newDays });
  };

  // time ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(getHHMM(now));

      const cutoff = subtractMinutes(now, 10);
      setCutoffTimeStr(getHHMM(cutoff));
    };

    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // data
  const { gradeData, fullGradeDataPool } = useGradeData({
    dataVersion,
    filters: normalizedFilters,
    appliedConfig,
    activeSlot,
    grindMode,
    cutoffTimeStr
  });

  // alerts
  useGradeAlerts({
    enabled: alertsEnabled,
    gradeData,
    currentTimeStr,
    onPlay: playAlertSound
  });

  // import/export hook
  const {
    importInputRef,
    showImportOptions,
    setShowImportOptions,
    handleExportGrade,
    handleImportGrade,
    confirmImport
  } = useGradeImportExport({
    activeSlot,
    updateActiveSlot,
    setPendingConfig,
    setAppliedConfig
  });

  // manual add states
  const [manualSearch, setManualSearch] = useState('');
  const [manualSuggestions, setManualSuggestions] = useState<{ key: string; nome: string; rede: string }[]>([]);
  const [showManualSuggestions, setShowManualSuggestions] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);

  // modal manual
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [pendingTournamentName, setPendingTournamentName] = useState('');
  const [pendingTournamentTime, setPendingTournamentTime] = useState('');
  const [pendingTournamentField, setPendingTournamentField] = useState('');
  const [pendingTournamentSpeed, setPendingTournamentSpeed] = useState('Normal');
  const [pendingTournamentRede, setPendingTournamentRede] = useState('GGNetwork');

  // pool pra sugestão (csv)
  const allTournamentPairs = useMemo(() => {
    const set = new Map<string, { key: string; nome: string; rede: string }>();
    (fullGradeDataPool as any[]).forEach((t: any) => {
      const key = makeTournamentKey(t.rede, t.nome);
      if (!set.has(key)) set.set(key, { key, nome: t.nome, rede: t.rede });
    });
    return Array.from(set.values()).sort((a, b) => (a.nome + a.rede).localeCompare(b.nome + b.rede));
  }, [fullGradeDataPool]);

  const handleManualSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setManualSearch(val);

    if (val.trim().length >= 1) {
      const term = val.toLowerCase();
      const matches = allTournamentPairs
        .filter(p => (p.nome.toLowerCase().includes(term) || p.rede.toLowerCase().includes(term)) && !activeSlot.manuallyAddedKeys.includes(p.key))
        .slice(0, 25);
      setManualSuggestions(matches);
      setShowManualSuggestions(true);
      setActiveSuggestionIdx(0);
    } else {
      setShowManualSuggestions(false);
      setManualSuggestions([]);
    }
  };

  const handleManualAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && showManualSuggestions) {
      e.preventDefault();
      setActiveSuggestionIdx(prev => (prev + 1) % (manualSuggestions.length + (manualSearch.trim() ? 1 : 0)));
    } else if (e.key === 'ArrowUp' && showManualSuggestions) {
      e.preventDefault();
      setActiveSuggestionIdx(prev => (prev - 1 + (manualSuggestions.length + (manualSearch.trim() ? 1 : 0))) % (manualSuggestions.length + (manualSearch.trim() ? 1 : 0)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showManualSuggestions && activeSuggestionIdx < manualSuggestions.length) {
        startManualTournamentAdditionFromPair(manualSuggestions[activeSuggestionIdx]);
      } else if (manualSearch.trim()) {
        startManualTournamentAdditionCustom(manualSearch.trim());
      }
    }
  };

  const startManualTournamentAdditionFromPair = (pair: { key: string; nome: string; rede: string }) => {
    setPendingTournamentName(pair.nome);
    setPendingTournamentRede(pair.rede || 'GGNetwork');
    setPendingTournamentTime('');
    setPendingTournamentField('');
    setPendingTournamentSpeed('Normal');
    setIsManualModalOpen(true);
    setShowManualSuggestions(false);
    setManualSearch('');
  };

  const startManualTournamentAdditionCustom = (name: string) => {
    const rede = pendingTournamentRede || 'GGNetwork';
    setPendingTournamentName(name);
    setPendingTournamentRede(rede);
    setPendingTournamentTime('');
    setPendingTournamentField('');
    setPendingTournamentSpeed('Normal');
    setIsManualModalOpen(true);
    setShowManualSuggestions(false);
    setManualSearch('');
  };

  const confirmManualAddition = () => {
    const key = makeTournamentKey(pendingTournamentRede, pendingTournamentName);
    const time = pendingTournamentTime || '--:--';

    const manualStats = {
      key,
      nome: pendingTournamentName,
      stakeMedia: 0,
      roiTotal: 0,
      qtd: 0,
      rede: pendingTournamentRede,
      velocidadePredominante: pendingTournamentSpeed,
      mediaParticipantes: parseInt(pendingTournamentField) || 0,
      horario: time,
      bandeiras: '',
      isFullyManual: true
    };

    const nextExcluded = activeSlot.excludedKeys.filter(k => k !== key);
    const nextAdded = Array.from(new Set([...activeSlot.manuallyAddedKeys, key]));
    const nextTimes = { ...activeSlot.manualTimes, [key]: time };
    const nextStats = { ...activeSlot.statsCache, [key]: manualStats };

    updateActiveSlot({
      excludedKeys: nextExcluded,
      manuallyAddedKeys: nextAdded,
      manualTimes: nextTimes,
      statsCache: nextStats
    });

    setIsManualModalOpen(false);
    setPendingTournamentName('');
    setPendingTournamentTime('');
    setPendingTournamentField('');
    setPendingTournamentSpeed('Normal');
    setPendingTournamentRede('GGNetwork');
  };

  const handleRemoveTournament = (tournamentKey: string) => {
    const nextAdded = activeSlot.manuallyAddedKeys.filter(k => k !== tournamentKey);
    const nextExcluded = Array.from(new Set([...activeSlot.excludedKeys, tournamentKey]));
    const nextTimes = { ...activeSlot.manualTimes };
    delete nextTimes[tournamentKey];

    updateActiveSlot({
      manuallyAddedKeys: nextAdded,
      excludedKeys: nextExcluded,
      manualTimes: nextTimes
    });
  };

  const handleManualTimeCommit = (tournamentKey: string, value: string) => {
    updateActiveSlot({
      manualTimes: { ...activeSlot.manualTimes, [tournamentKey]: value }
    });
  };

  const getRedeColor = (rede: string) => {
    if (rede === 'Manual') return 'bg-indigo-600/20 border-indigo-600/50 text-indigo-400';
    const s = rede.toLowerCase();
    if (s.includes('gg') || s.includes('network')) return 'bg-slate-700/20 border-slate-700/50 text-slate-400';
    if (s.includes('party')) return 'bg-orange-600/20 border-orange-600/50 text-orange-400';
    if (s.includes('888')) return 'bg-sky-600/20 border-sky-600/50 text-sky-400';
    if (s.includes('ipoker')) return 'bg-amber-500/20 border-amber-500/50 text-amber-500';
    if (s.includes('stars')) return 'bg-red-600/20 border-red-600/50 text-red-500';
    if (s.includes('wpn')) return 'bg-indigo-600/20 border-indigo-600/50 text-indigo-400';
    if (s.includes('chico')) return 'bg-emerald-600/20 border-emerald-600/50 text-emerald-400';
    if (s.includes('winamax')) return 'bg-fuchsia-600/20 border-fuchsia-600/50 text-fuchsia-400';
    if (s.includes('bodog')) return 'bg-zinc-700/20 border-zinc-700/50 text-zinc-400';
    return 'bg-cyan-600/10 border-cyan-600/20 text-cyan-400';
  };

  const isManualConfirmationDisabled = pendingTournamentTime.length < 5;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-7xl mx-auto">

      <GradeManualModal
        open={isManualModalOpen}
        pendingTournamentName={pendingTournamentName}
        pendingTournamentTime={pendingTournamentTime}
        pendingTournamentField={pendingTournamentField}
        pendingTournamentSpeed={pendingTournamentSpeed}
        pendingTournamentRede={pendingTournamentRede}
        setPendingTournamentTime={setPendingTournamentTime}
        setPendingTournamentField={setPendingTournamentField}
        setPendingTournamentSpeed={setPendingTournamentSpeed}
        setPendingTournamentRede={setPendingTournamentRede}
        onClose={() => setIsManualModalOpen(false)}
        onConfirm={confirmManualAddition}
        isConfirmDisabled={isManualConfirmationDisabled}
      />

      <GradeImportModal
        show={showImportOptions}
        activeSlotName={activeSlot.name}
        onAppend={() => confirmImport(true)}
        onReplace={() => confirmImport(false)}
        onCancel={() => setShowImportOptions(false)}
      />

      <GradeHeader
        slots={slots}
        activeSlotId={activeSlotId}
        activeSlot={activeSlot}
        onSwitchSlot={(id) => switchSlot(id)}
        onAddSlot={addSlot}
        onRemoveSlot={(id) => removeSlot(id)}
        onToggleDay={toggleDay}
        onExport={() => handleExportGrade(gradeData, alertsEnabled, grindMode, alertVolume)}
        onImport={handleImportGrade}
        importInputRef={importInputRef}
        alertsEnabled={alertsEnabled}
        grindMode={grindMode}
        setAlertsEnabled={setAlertsEnabled}
        setGrindMode={setGrindMode}
        alertVolume={alertVolume}
        setAlertVolume={setAlertVolume}
        playAlertSound={playAlertSound}
        isRenaming={isRenaming}
        setIsRenaming={setIsRenaming}
        tempName={tempName}
        setTempName={setTempName}
        commitRename={commitRename}
      />

      <GradeFiltersPanel
        pendingConfig={pendingConfig}
        setPendingConfig={setPendingConfig}
        allRedes={allRedes}
        uniqueVelocidades={uniqueVelocidades}
        grindMode={grindMode}
        setGrindMode={setGrindMode}
        alertsEnabled={alertsEnabled}
        setAlertsEnabled={setAlertsEnabled}
        alertVolume={alertVolume}
        setAlertVolume={setAlertVolume}
        playAlertSound={playAlertSound}
        resetFilters={resetFilters}
        applyFilters={applyFilters}
      />

      <GradeTable
        gradeData={gradeData}
        getRedeColor={getRedeColor}
        grindMode={grindMode}
        currentTimeStr={currentTimeStr}
        manuallyAddedKeys={activeSlot.manuallyAddedKeys}
        onManualTimeCommit={handleManualTimeCommit}
        onRemove={handleRemoveTournament}
      />

      <GradeManualAdd
        manualSearch={manualSearch}
        setManualSearch={setManualSearch}
        showManualSuggestions={showManualSuggestions}
        manualSuggestions={manualSuggestions}
        activeSuggestionIdx={activeSuggestionIdx}
        setActiveSuggestionIdx={setActiveSuggestionIdx}
        onSearchChange={handleManualSearchChange}
        onKeyDown={handleManualAddKeyDown}
        onPickSuggestion={startManualTournamentAdditionFromPair}
        onCreateCustom={startManualTournamentAdditionCustom}
      />
    </div>
  );
};

export default GradeView;
