// types/grade.ts
import type { TournamentAggregated, FilterState } from '../types/common';

export interface GradeConfig {
  minSampling: number;
  minRoi: string;
  startTime: string;
  endTime: string;
  minStake: string;
  maxStake: string;
  minField: string;
  maxField: string;
  selRede: string[];
  selSpeed: string[];
  excludeKeywords: string[];
}

// Snapshot completo do torneio para independência do CSV
export interface CachedTournamentData {
  key: string; // chave única (rede::nome)
  nome: string;
  stakeMedia: number;
  roiTotal: number;
  qtd: number;
  rede: string;
  velocidadePredominante: string;
  mediaParticipantes: number;
  horario: string;
  bandeiras?: string;
  isFullyManual?: boolean;
}

export interface GradeSlot {
  id: string | number;
  name: string;
  days: number[];
  config: GradeConfig;

  /**
   * Sobrescrita de nome por torneio (key -> nome exibido).
   * Importante: NÃO altera a key (rede::nome) — apenas o rótulo exibido.
   * Deve persistir em F5 e em export/import (via snapshot).
   */
  nameOverrides?: Record<string, string>;

  manualTimes: Record<string, string>; // key -> HH:MM
  manuallyAddedKeys: string[];         // keys
  excludedKeys: string[];              // keys
  statsCache: Record<string, CachedTournamentData>; // key -> snapshot
}

export type GradeItem = (TournamentAggregated & { horario: string }) & {
  tournamentKey: string;
  horarioManual: string;
  isFullyManual?: boolean;
  isFromCache?: boolean;
};

export interface GradeViewProps {
  dataVersion: number;
  datasetId: number;
  filters: FilterState;
}


export interface GradeRowProps {
  item: GradeItem;
  onManualTimeCommit: (tournamentKey: string, value: string) => void;
  onNameCommit?: (tournamentKey: string, value: string) => void;
  getRedeColor: (rede: string) => string;
  isPassed: boolean;
  isManualEntry: boolean;
  onRemove: (tournamentKey: string) => void;
}
// types/grade.ts
import type { TournamentAggregated, FilterState } from '../types/common';

export interface GradeConfig {
  minSampling: number;
  minRoi: string;
  startTime: string;
  endTime: string;
  minStake: string;
  maxStake: string;
  minField: string;
  maxField: string;
  selRede: string[];
  selSpeed: string[];
  excludeKeywords: string[];
}

// Snapshot completo do torneio para independência do CSV
export interface CachedTournamentData {
  key: string; // chave única (rede::nome)
  nome: string;
  stakeMedia: number;
  roiTotal: number;
  qtd: number;
  rede: string;
  velocidadePredominante: string;
  mediaParticipantes: number;
  horario: string;
  bandeiras?: string;
  isFullyManual?: boolean;
}

export interface GradeSlot {
  id: string | number;
  name: string;
  days: number[];
  config: GradeConfig;

  /**
   * Sobrescrita de nome por torneio (key -> nome exibido).
   * Importante: NÃO altera a key (rede::nome) — apenas o rótulo exibido.
   * Deve persistir em F5 e em export/import (via snapshot).
   */
  nameOverrides?: Record<string, string>;

  manualTimes: Record<string, string>; // key -> HH:MM
  manuallyAddedKeys: string[];         // keys
  excludedKeys: string[];              // keys
  statsCache: Record<string, CachedTournamentData>; // key -> snapshot
}

export type GradeItem = (TournamentAggregated & { horario: string }) & {
  tournamentKey: string;
  horarioManual: string;
  isFullyManual?: boolean;
  isFromCache?: boolean;
};

export interface GradeViewProps {
  dataVersion: number;
  datasetId: number;
  filters: FilterState;
}


export interface GradeRowProps {
  item: GradeItem;
  onManualTimeCommit: (tournamentKey: string, value: string) => void;
  onNameCommit?: (tournamentKey: string, value: string) => void;
  getRedeColor: (rede: string) => string;
  isPassed: boolean;
  isManualEntry: boolean;
  onRemove: (tournamentKey: string) => void;
}
