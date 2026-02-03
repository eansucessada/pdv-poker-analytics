// src/types/common.ts

/**
 * Tipos compartilhados pelo projeto inteiro.
 * Aqui ficam:
 * - dados base (raw e aggregated)
 * - filtros padronizados
 * - tipos utilitários de ordenação/operadores
 */

/**
 * Chave única do torneio para evitar colisões entre redes.
 * Padrão: `${rede}::${nome}`
 */
export type TournamentKey = string;

export interface TournamentRaw {
  rede: string;
  id_do_jogo: string;
  jogador: string;

  stake: number;
  rake: number;
  data: string;
  participantes: number;
  velocidade: string;

  resultado_base: number;
  moeda: string;
  premio: number;
  nome: string;

  premio_recompensa: number;
  reentradas: number;

  lucro_usd: number;
  stake_usd: number;
  rake_usd: number;

  roi_individual: number;
  is_itm: boolean;
  bandeiras: string;

  /**
   * Opcional (mas recomendado).
   * Se você gerar isso no DatabaseService, facilita tudo.
   */
  tournamentKey?: TournamentKey;
}

export interface TournamentAggregated {
  /**
   * Chave única do torneio (ex: `${rede}::${nome}`).
   * Opcional para compat, mas recomendado preencher sempre.
   */
  tournamentKey?: TournamentKey;

  nome: string;
  stakeMedia: number;
  qtd: number;

  itm: number;
  itmPercentual: number;

  retornoTotal: number;
  roiTotal: number;
  roiMedio: number;

  /**
   * Padrão do projeto: sempre usar "rede".
   */
  rede: string;

  velocidadePredominante: string;
  mediaParticipantes: number;
  bandeiras: string;

  // usado em telas específicas (ex: Grade)
  horario?: string;
  horarioManual?: string;
}

export interface GlobalStats {
  totalVolume: number;
  totalLucro: number;
  stakeMedio: number;
  itmPercentual: number;
  mediaParticipantes: number;

  bountyCount: number;
  vanillaCount: number;

  networkDistribution: Record<string, number>;
}

export type SortField = keyof TournamentAggregated;
export type SortOrder = 'asc' | 'desc';

export type NumericOperator = 'none' | 'gte' | 'lte' | 'between';

export interface MetricFilter {
  operator: NumericOperator;
  val1: string;
  val2: string;
}

/**
 * Filtro padronizado do projeto (coerente com multi-select).
 * Observação: rede e velocidade são arrays.
 */
export interface FilterState {
  search: string;

  rede: string[];
  velocidade: string[];

  bandeiras: string;

  metrics: {
    stakeMedia: MetricFilter;
    qtd: MetricFilter;
    itmPercentual: MetricFilter;
    retornoTotal: MetricFilter;
    roiMedio: MetricFilter;
    mediaParticipantes: MetricFilter;
  };
}
