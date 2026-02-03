// utils/tournamentKey.ts

export type TournamentKey = string;

/**
 * Padrão único: `${rede}::${nome}`
 */
export const makeTournamentKey = (rede: string, nome: string): TournamentKey => `${rede}::${nome}`;

export const parseTournamentKey = (key: TournamentKey) => {
  const idx = key.indexOf('::');
  if (idx === -1) return { rede: '', nome: key };
  return { rede: key.slice(0, idx), nome: key.slice(idx + 2) };
};
