// hooks/useGradeImportExport.ts
import { useRef, useState } from 'react';
import type { CachedTournamentData, GradeConfig, GradeSlot } from '../types/grade';
import { makeTournamentKey } from './../utils/tournamentKey';

// Não exportamos/importamos filtros; mantemos a lógica toda aqui.

const IMPORT_ONLY_SENTINEL = '__GRADE_IMPORT_ONLY__';

type PendingImportData = {
  manualTimes: Record<string, string>;
  manuallyAddedKeys: string[];
  statsCache: Record<string, CachedTournamentData>;
  filesCount: number;
};

export const useGradeImportExport = (args: {
  activeSlot: GradeSlot;
  updateActiveSlot: (updates: Partial<GradeSlot>) => void;
  setPendingConfig: (cfg: GradeConfig) => void;
  setAppliedConfig: (cfg: GradeConfig) => void;
}) => {
  const { activeSlot, updateActiveSlot } = args;

  const importInputRef = useRef<HTMLInputElement>(null);

  const [showImportOptions, setShowImportOptions] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<PendingImportData | null>(null);

  /**
   * EXPORT (schema v3):
   * - arquivo independente do CSV / Supabase
   * - contém SOMENTE os torneios exibidos (snapshot completo)
   * - não inclui filtros/config/dias/exclusões
   */
  const handleExportGrade = (gradeData: any[]) => {
    const tournaments: CachedTournamentData[] = (gradeData ?? []).map((item: any) => {
      const nome = String(item?.nome ?? '').trim();
      const rede = String(item?.rede ?? '').trim() || 'Manual';
      const key = String(item?.tournamentKey ?? item?.key ?? '').trim() || makeTournamentKey(rede, nome);
      const horario = String(item?.horarioManual || item?.horario || '00:00').slice(0, 5);

      return {
        key,
        nome,
        rede,
        horario,
        stakeMedia: Number(item?.stakeMedia ?? 0),
        roiTotal: Number(item?.roiTotal ?? 0),
        qtd: Number(item?.qtd ?? 0),
        velocidadePredominante: String(item?.velocidadePredominante ?? 'Normal'),
        mediaParticipantes: Number(item?.mediaParticipantes ?? 0),
        bandeiras: String(item?.bandeiras ?? ''),
        // Importado = "pinado" (bypass filtros numéricos no GradeView)
        isFullyManual: true
      };
    });

    const dataToExport = {
      schemaVersion: 3,
      exportedAt: new Date().toISOString(),
      tournaments
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `poker-grade-tournaments-${String(activeSlot?.name ?? 'grade')
      .replace(/\s+/g, '-')
      .toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportGrade = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let importedManualTimes: Record<string, string> = {};
    const importedManuallyAddedKeys: Set<string> = new Set();
    const importedStats: Record<string, CachedTournamentData> = {};
    let filesCount = 0;

    // helper: converte formatos antigos/variados para o padrão "rede::nome"
    const toTournamentKey = (value: string, fallbackRede = 'Manual', fallbackNome = '') => {
      const raw = String(value || '').trim();
      if (!raw) return makeTournamentKey(fallbackRede, fallbackNome);
      if (raw.includes('::')) return raw;
      if (raw.includes('||')) {
        const [nome, rede] = raw.split('||');
        return makeTournamentKey((rede || fallbackRede).trim(), (nome || fallbackNome).trim());
      }
      // se vier só o nome
      return makeTournamentKey(fallbackRede, raw);
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        filesCount++;

        // ✅ NOVO: schema v3 (independente)
        if (Number(json?.schemaVersion) >= 3 && Array.isArray(json?.tournaments)) {
          (json.tournaments as any[]).forEach((t) => {
            const nome = String(t?.nome ?? '').trim();
            const rede = String(t?.rede ?? 'Manual').trim() || 'Manual';
            const key = toTournamentKey(String(t?.key ?? ''), rede, nome);
            const horario = String(t?.horario ?? '00:00').slice(0, 5);

            importedManuallyAddedKeys.add(key);
            importedManualTimes[key] = horario;

            importedStats[key] = {
              key,
              nome,
              rede,
              horario,
              stakeMedia: Number(t?.stakeMedia ?? 0),
              roiTotal: Number(t?.roiTotal ?? 0),
              qtd: Number(t?.qtd ?? 0),
              velocidadePredominante: String(t?.velocidadePredominante ?? 'Normal'),
              mediaParticipantes: Number(t?.mediaParticipantes ?? 0),
              bandeiras: String(t?.bandeiras ?? ''),
              isFullyManual: true
            };
          });
          continue;
        }

        // ✅ COMPAT: schema antigo com slot completo
        // OBS: ignoramos config/dias/excluídos — import/export agora é só torneios.
        const incomingSlot = json.slot || (json.slots ? json.slots[0] : null);
        if (!incomingSlot) continue;

        // manualTimes
        const incomingManualTimes = incomingSlot.manualTimes || {};
        Object.entries(incomingManualTimes).forEach(([k, v]) => {
          const nk = toTournamentKey(k, 'Manual');
          importedManualTimes[nk] = String(v || '').slice(0, 5);
        });

        // manuallyAddedKeys (ou compat names)
        const incomingManuallyAddedKeys: string[] =
          incomingSlot.manuallyAddedKeys ||
          (incomingSlot.manuallyAddedNames
            ? (incomingSlot.manuallyAddedNames as string[]).map((n: string) => makeTournamentKey('Manual', n))
            : []);

        incomingManuallyAddedKeys
          .map((k) => toTournamentKey(k, 'Manual'))
          .forEach((k) => importedManuallyAddedKeys.add(k));

        // statsCache
        if (incomingSlot.statsCache) {
          Object.entries(incomingSlot.statsCache).forEach(([k, val]) => {
            const v: any = val as any;
            const nk = toTournamentKey(k, v?.rede || 'Manual', v?.nome || '');

            importedStats[nk] = {
              ...(v ?? {}),
              key: nk,
              rede: v?.rede || 'Manual',
              nome: v?.nome || '',
              // garante independência
              isFullyManual: true
            };

            if (!importedManualTimes[nk] && v?.horario) {
              importedManualTimes[nk] = String(v.horario).slice(0, 5);
            }
          });
        }
      } catch (err) {
        console.error(`Erro ao processar arquivo ${file.name}:`, err);
      }
    }

    setPendingImportData({
      manualTimes: importedManualTimes,
      manuallyAddedKeys: Array.from(importedManuallyAddedKeys),
      statsCache: importedStats,
      filesCount
    });

    setShowImportOptions(true);

    if (importInputRef.current) importInputRef.current.value = '';
  };

  /**
   * CONFIRM IMPORT
   * - append: adiciona torneios no slot atual SEM mexer em filtros/config/dias/exclusões
   * - replace: substitui SOMENTE a lista de torneios (manuais + cache) SEM mexer em filtros
   */
  const confirmImport = (append: boolean) => {
    if (!pendingImportData) return;

    if (append) {
      const mergedManualTimes = { ...activeSlot.manualTimes, ...pendingImportData.manualTimes };
      const mergedManuallyAdded = Array.from(
        new Set([...(activeSlot.manuallyAddedKeys ?? []), ...(pendingImportData.manuallyAddedKeys ?? [])])
      );
      const mergedStatsCache = { ...(activeSlot.statsCache ?? {}), ...(pendingImportData.statsCache ?? {}) };

      updateActiveSlot({
        manualTimes: mergedManualTimes,
        manuallyAddedKeys: mergedManuallyAdded,
        statsCache: mergedStatsCache
      });
    } else {
      updateActiveSlot({
        manualTimes: pendingImportData.manualTimes,
        manuallyAddedKeys: pendingImportData.manuallyAddedKeys,
        statsCache: pendingImportData.statsCache,
        // ✅ modo "substituir": exibir APENAS importados (independente dos filtros)
        excludedKeys: Array.from(new Set([...(activeSlot.excludedKeys ?? []), IMPORT_ONLY_SENTINEL]))
      });
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
