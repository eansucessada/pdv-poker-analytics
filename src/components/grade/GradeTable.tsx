// grade/GradeTable.tsx
import React from 'react';
import GradeRow from './GradeRow';
import type { GradeItem, GradeRowProps } from '../../types';


export const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface Props {
  gradeData: GradeItem[];
  getRedeColor: (rede: string) => string;
  grindMode: boolean;
  currentTimeStr: string;
  manuallyAddedKeys: string[];
  onManualTimeCommit: (key: string, value: string) => void;
  onRemove: (key: string) => void;
}

const GradeTable: React.FC<Props> = ({
  gradeData,
  getRedeColor,
  grindMode,
  currentTimeStr,
  manuallyAddedKeys,
  onManualTimeCommit,
  onRemove
}) => {
  return (
    <div className="bg-slate-900/80 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-center border-separate border-spacing-0">
          <thead className="sticky top-0 z-20 bg-slate-800">
            <tr>
              <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">CSV</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Manual</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Torneio</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Stake</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">ROI</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">QTD</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Field</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Estrutura</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Rede</th>
              <th className="px-4 py-4 w-16"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/50">
            {gradeData.map(item => (
              <GradeRow
                key={item.tournamentKey}
                item={item}
                onManualTimeCommit={onManualTimeCommit}
                getRedeColor={getRedeColor}
                isPassed={grindMode && (item.horarioManual || item.horario || '00:00') < currentTimeStr}
                isManualEntry={manuallyAddedKeys.includes(item.tournamentKey)}
                onRemove={onRemove}
              />
            ))}

            {gradeData.length === 0 && (
              <tr>
                <td colSpan={10} className="px-8 py-20 text-center text-slate-700 font-black uppercase tracking-[0.3em] text-[10px]">
                  Grade Vazia
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GradeTable;
