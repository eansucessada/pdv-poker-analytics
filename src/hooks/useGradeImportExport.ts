// hooks/useGradeImportExport.ts
import { useRef, useState } from 'react';
import type { CachedTournamentData, GradeConfig, GradeSlot } from '../types/grade';
import { makeTournamentKey } from './../utils/tournamentKey';

import { DEFAULT_GRADE_CONFIG, normalizeConfig } from './useGradeSlots';

export const useGradeImportExport = (args: {
  activeSlot: GradeSlot;
  updateActiveSlot: (updates: Partial<GradeSlot>) => void;
  setPendingConfig: (cfg: GradeConfig) => void;
  setAppliedConfig: (cfg: GradeConfig) => void;
}) => {
  const { activeSlot, updateActiveSlot, setPendingConfig, setAppliedConfig } = args;

  const importInputRef = useRef<HTMLInputElement>(null);

  const [showImportOptions, setShowImportOptions] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<{
    manualTimes: Record<string, string>;
    manuallyAddedKeys: string[];
    excludedKeys: string[];
    statsCache: Record<string, CachedTournamentData>;
    config: GradeConfig;
    days: number[];
    filesCount: number;
  } | null>(null);

  const handleExportGrade = (gradeData: any[], alertsEnabled: boolean, grindMode: boolean, alertVolume: number) => {
    const currentStatsCache: Record<string, CachedTournamentData> = { ...activeSlot.statsCache };

    gradeData.forEach((item: any) => {
      currentStatsCache[item.tournamentKey] = {
        key: item.tournamentKey,
        nome: item.nome,
        stakeMedia: item.stakeMedia,
        roiTotal: item.roiTotal,
        qtd: item.qtd,
        rede: item.rede,
        velocidadePredominante: item.velocidadePredominante,
        mediaParticipantes: item.mediaParticipantes,
        horario: item.horario || '--:--',
        bandeiras: item.bandeiras || '',
        isFullyManual: item.isFullyManual
      };
    });

    const dataToExport = {
      slot: {
        ...activeSlot,
        statsCache: currentStatsCache
      },
      alertVolume,
      alertsEnabled,
      grindMode,
      schemaVersion: 2
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `poker-grade-${activeSlot.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportGrade = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let importedManualTimes: Record<string, string> = {};
    let importedManuallyAddedKeys: Set<string> = new Set();
    let importedExcludedKeys: Set<string> = new Set();
    let importedStats: Record<string, CachedTournamentData> = {};
    let importedConfig: GradeConfig = { ...DEFAULT_GRADE_CONFIG };
    let importedDays: number[] = [];
    let filesCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        const json = JSON.parse(text);

        const incomingSlot = json.slot || (json.slots ? json.slots[0] : null);
        if (!incomingSlot) continue;

        filesCount++;

// helper local: converte formatos antigos/variados para o padrão "rede::nome"
const toTournamentKey = (value: string, fallbackRede = 'Manual') => {
  const raw = String(value || '').trim();

  // já está no padrão novo
  if (raw.includes('::')) return raw;

  // formato antigo encontrado no seu arquivo (nome||rede)
  if (raw.includes('||')) {
    const [nome, rede] = raw.split('||');
    return makeTournamentKey((rede || fallbackRede).trim(), (nome || '').trim());
  }

  // se vier só o nome
  return makeTournamentKey(fallbackRede, raw);
};

// manualTimes
const incomingManualTimes = incomingSlot.manualTimes || {};
Object.entries(incomingManualTimes).forEach(([k, v]) => {
  const nk = toTournamentKey(k, 'Manual');
  importedManualTimes[nk] = String(v || '').slice(0, 5);
});

// compat manuallyAddedNames/excludedNames
const incomingManuallyAddedKeys: string[] =
  incomingSlot.manuallyAddedKeys ||
  (incomingSlot.manuallyAddedNames
    ? (incomingSlot.manuallyAddedNames as string[]).map((n: string) => makeTournamentKey('Manual', n))
    : []);

const incomingExcludedKeys: string[] =
  incomingSlot.excludedKeys ||
  (incomingSlot.excludedNames
    ? (incomingSlot.excludedNames as string[]).map((n: string) => makeTournamentKey('Manual', n))
    : []);

// aqui pode vir key já no formato novo OU no formato antigo "nome||rede"
incomingManuallyAddedKeys.map(k => toTournamentKey(k, 'Manual')).forEach(k => importedManuallyAddedKeys.add(k));
incomingExcludedKeys.map(k => toTournamentKey(k, 'Manual')).forEach(k => importedExcludedKeys.add(k));

// statsCache
if (incomingSlot.statsCache) {
  Object.entries(incomingSlot.statsCache).forEach(([k, val]) => {
    const nk = toTournamentKey(k, 'Manual');
    importedStats[nk] = {
      ...(val as any),
      key: nk,
      rede: (val as any).rede || 'Manual',
      nome: (val as any).nome || ''
    };
  });
}


        // config/days
        if (incomingSlot.config) importedConfig = normalizeConfig(incomingSlot.config);
        if (incomingSlot.days) importedDays = incomingSlot.days;
      } catch (err) {
        console.error(`Erro ao processar arquivo ${file.name}:`, err);
      }
    }

    setPendingImportData({
      manualTimes: importedManualTimes,
      manuallyAddedKeys: Array.from(importedManuallyAddedKeys),
      excludedKeys: Array.from(importedExcludedKeys),
      statsCache: importedStats,
      config: importedConfig || { ...DEFAULT_GRADE_CONFIG },
      days: importedDays,
      filesCount
    });

    setShowImportOptions(true);

    if (importInputRef.current) importInputRef.current.value = '';
  };

  const confirmImport = (append: boolean) => {
    if (!pendingImportData) return;

    if (append) {
      const mergedManualTimes = { ...activeSlot.manualTimes, ...pendingImportData.manualTimes };
      const mergedManuallyAdded = Array.from(new Set([...activeSlot.manuallyAddedKeys, ...pendingImportData.manuallyAddedKeys]));
      const mergedExcluded = Array.from(new Set([...activeSlot.excludedKeys, ...pendingImportData.excludedKeys]));
      const mergedStatsCache = { ...activeSlot.statsCache, ...pendingImportData.statsCache };

      updateActiveSlot({
        manualTimes: mergedManualTimes,
        manuallyAddedKeys: mergedManuallyAdded,
        excludedKeys: mergedExcluded,
        statsCache: mergedStatsCache,
        config: pendingImportData.config
      });

      setPendingConfig(pendingImportData.config);
      setAppliedConfig(pendingImportData.config);
    } else {
      updateActiveSlot({
        manualTimes: pendingImportData.manualTimes,
        manuallyAddedKeys: pendingImportData.manuallyAddedKeys,
        excludedKeys: pendingImportData.excludedKeys,
        statsCache: pendingImportData.statsCache,
        config: pendingImportData.config,
        days: pendingImportData.days.length > 0 ? pendingImportData.days : activeSlot.days
      });

      setPendingConfig(pendingImportData.config);
      setAppliedConfig(pendingImportData.config);
    }

    setShowImportOptions(false);
    setPendingImportData(null);
  };

  return {
    importInputRef,
    showImportOptions,
    pendingImportData,
    setShowImportOptions,
    setPendingImportData,
    handleExportGrade,
    handleImportGrade,
    confirmImport
  };
};
