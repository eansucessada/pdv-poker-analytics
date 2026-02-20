// grade/GradeTable.tsx
import React, { useMemo } from 'react';
import GradeRow from './GradeRow';
import type { GradeItem } from '../../types';

export const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface Props {
  gradeData: GradeItem[];
  getRedeColor: (rede: string) => string;
  grindMode: boolean;
  currentTimeStr: string; // HH:MM (horario atual)
  manuallyAddedKeys: string[];
  onManualTimeCommit: (key: string, value: string) => void;
  onNameCommit: (key: string, value: string) => void;
  onRemove: (key: string) => void;
}

function parseHHMMToMinutes(hhmm: string): number | null {
  const s = String(hhmm || '').trim();
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  return h * 60 + mi;
}

/**
 * Diferença (agora - programado) em minutos para o Grind Mode.
 *
 * Regra importante (o que você pediu):
 * - Em horário "normal" (ex: 22:33), um torneio "00:09" é considerado de madrugada HOJE,
 *   portanto é passado (diff grande e positivo) e deve ser ocultado.
 * - Só fazemos ajuste de virada de dia quando o horário atual é bem cedo (madrugada),
 *   para que 23:55 ainda seja interpretado como "ontem" (ex: agora 00:05, diff=10).
 */
function diffMinutesForGrind(nowMin: number, schedMin: number): number {
  let diff = nowMin - schedMin;

  // Se agora é madrugada (antes de 06:00) e o torneio é "noite" (depois de 18:00),
  // então o torneio foi ontem: ajusta para diff positivo.
  if (diff < 0 && nowMin < 360 && schedMin > 1080) {
    diff = nowMin + 1440 - schedMin;
  }

  return diff;
}

const GradeTable: React.FC<Props> = ({
  gradeData,
  getRedeColor,
  grindMode,
  currentTimeStr,
  manuallyAddedKeys,
  onManualTimeCommit,
  onNameCommit,
  onRemove
}) => {
  const nowMin = useMemo(() => parseHHMMToMinutes(currentTimeStr) ?? 0, [currentTimeStr]);

  const rows = useMemo(() => {
    const items = gradeData ?? [];
    if (!grindMode) {
      return items.map((item) => ({ item, diff: null as number | null }));
    }

    return items
      .map((item) => {
        const t = (item.horarioManual || item.horario || '00:00').trim();
        const schedMin = parseHHMMToMinutes(t);
        if (schedMin == null) return { item, diff: null as number | null };
        const diff = diffMinutesForGrind(nowMin, schedMin);
        return { item, diff };
      })
      // Grind mode:
      // - escurece nos primeiros 10 minutos após o horário (diff 0..10)
      // - some completamente ao passar de 11 minutos (diff >= 11)
      .filter(({ diff }) => diff == null || diff < 11);
  }, [gradeData, grindMode, nowMin]);

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950/30 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="max-h-[60vh] overflow-y-auto overflow-x-auto">
          <table className="min-w-full text-sm text-slate-200">
            <thead className="bg-slate-950/40 sticky top-0 z-10">
              <tr className="text-[10px] uppercase tracking-[0.25em] text-slate-300/60">
                <th className="px-6 py-3 text-center font-black">Horário</th>
                <th className="px-4 py-3 text-center font-black">Manual</th>
                <th className="px-6 py-3 text-center font-black">Torneio</th>
                <th className="px-6 py-3 text-center font-black">Rede</th>
                <th className="px-6 py-3 text-center font-black">Estrutura</th>
                <th className="px-6 py-3 text-center font-black">Qtd</th>
                <th className="px-6 py-3 text-center font-black">Stake</th>
                <th className="px-6 py-3 text-center font-black">ROI Total</th>
                <th className="px-6 py-3 text-center font-black">Field</th>
                <th className="px-6 py-3 text-center font-black"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/50">
              {rows.map(({ item, diff }) => (
                <GradeRow
                  key={item.tournamentKey}
                  item={item}
                  onManualTimeCommit={onManualTimeCommit}
                  onNameCommit={onNameCommit}
                  getRedeColor={getRedeColor}
                  isPassed={grindMode && diff != null && diff >= 0 && diff <= 10}
                  isManualEntry={(manuallyAddedKeys ?? []).includes(item.tournamentKey)}
                  onRemove={onRemove}
                />
              ))}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-8 py-20 text-center text-slate-700 font-black uppercase tracking-[0.3em] text-[10px]"
                  >
                    Grade Vazia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GradeTable;
