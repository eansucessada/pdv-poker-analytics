// types/deepdive.ts

/**
 * Tipos específicos do DeepDiveView.
 * Aqui ficam coisas que o GradeView não precisa.
 */

import type { TournamentAggregated, TournamentKey } from './common';

/**
 * Usado no DeepDive para listar "torneios únicos" (por chave).
 * Ex.: lista de summaries do meio, seleção etc.
 */
export interface TournamentSummary {
  tournamentKey: TournamentKey;

  nome: string;
  qtd: number;

  roiTotal: number;
  retornoTotal: number; // <- alinhado com o seu código original
  mediaParticipantes: number;

  rede: string;
}

/**
 * Identidade única do jogador (jogador + rede).
 */
export interface PlayerIdentity {
  jogador: string;
  rede: string;
  id: string; // ex: "jogador|rede"
}

/**
 * Linha do DeepDive quando você quiser garantir tournamentKey presente.
 */
export type DeepDiveRow = TournamentAggregated & {
  tournamentKey: TournamentKey;
};

/**
 * Estado típico de seleção do DeepDive.
 */
export interface DeepDiveSelectionState {
  selectedTournamentKeys: TournamentKey[];
  selectedPlayerIds: string[]; // "jogador|rede"
  keyword: string; // ex: "vanilla, turbo"
}
// src/types/deepdive.ts


/**
 * Uma linha do detalhamento técnico (tabela de baixo).
 * Isso é o que o DatabaseService.getSelectionDetails retorna (ou equivalente).
 */
export interface SelectionDetailRow {
  nome: string;

  // pode vir como "rede" ou "site" dependendo do seu dbService legado
  rede?: string;
  site?: string;

  velocidadePredominante: string;

  stakeMedia: number;
  qtd: number;
  itm: number;
  itmPercentual: number;

  retornoTotal: number;
  roiTotal: number;

  mediaParticipantes: number;

  horario?: string;
  bandeiras?: string;

  // se algum lugar usa chave (rede::nome), deixa opcional
  tournamentKey?: TournamentKey;
}

/**
 * O “resumo consolidado” que aparece no card do meio.
 * (No seu código antigo era o objeto "consolidatedStats".)
 */
export interface ConsolidatedStats {
  nome: string;

  stakeMedia: number;
  qtd: number;
  itmPercentual: number;

  retornoTotal: number;
  roiTotal: number;

  mediaParticipantes: number;
}
/**
 * Item do dropdown de contas/jogadores no DeepDive.
 * (No seu código antigo isso vinha do DatabaseService.getUniquePlayers()).
 */
export interface DeepDivePlayer {
  id: string;       // ex: "jogador|rede" OU id interno
  jogador: string;  // nick
  rede: string;     // rede/site
}

/**
 * Item de sugestão do autocomplete de keywords/tags/rede/estrutura.
 */
export interface DeepDiveSuggestion {
  value: string;
  type: 'Tag' | 'Estrutura' | 'Rede' | string;
}

