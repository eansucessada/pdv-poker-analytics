// grade/GradeRow.tsx
import React, { useEffect, useState } from 'react';
import type { GradeRowProps } from '../../types/grade';
import { formatTimeInput } from '../../utils/format';

const GradeRow: React.FC<GradeRowProps> = ({
  item,
  onManualTimeCommit,
  getRedeColor,
  isPassed,
  isManualEntry,
  onRemove
}) => {
  const [localTime, setLocalTime] = useState(item.horarioManual);

  useEffect(() => {
    setLocalTime(item.horarioManual);
  }, [item.horarioManual]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onManualTimeCommit(item.tournamentKey, localTime);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTime(formatTimeInput(e.target.value));
  };

  const isConfirmed = item.horarioManual !== '' && localTime === item.horarioManual;
  const rowOpacityClass = isPassed ? 'opacity-25 grayscale pointer-events-none' : 'opacity-100';

  let bgClass = 'hover:bg-slate-800/30';
  let borderClass = 'border-l-4 border-l-transparent';

  if (item.isFullyManual) {
    bgClass = 'bg-indigo-600/10 hover:bg-indigo-600/20';
    borderClass = 'border-l-4 border-l-indigo-500 shadow-[inset_4px_0_0_0_rgba(99,102,241,0.2)]';
  } else if (isManualEntry || item.isFromCache) {
    bgClass = item.isFromCache ? 'bg-slate-900/40 hover:bg-slate-800/40' : 'bg-blue-600/5 hover:bg-blue-600/10';
    borderClass = item.isFromCache ? 'border-l-4 border-l-slate-700' : 'border-l-4 border-l-blue-500';
  }

  return (
    <tr className={`group transition-all ${rowOpacityClass} ${bgClass} ${borderClass} ${item.isFromCache ? 'border-b border-dashed border-slate-800/20' : ''}`}>
      <td className="px-6 py-4 text-center">
        <span className={`text-base font-black mono tracking-tighter text-center transition-opacity ${item.horarioManual ? 'opacity-20' : (item.isFromCache ? 'text-slate-500' : 'text-blue-400')}`}>
          {item.horario}
        </span>
      </td>

      <td className="px-4 py-4 text-center">
        <input
          type="text"
          maxLength={5}
          placeholder="00:00"
          className={`w-20 bg-slate-950/50 border border-slate-800 rounded-lg px-2 py-1 text-center focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-slate-800 transition-all hover:border-slate-700 mono tracking-tighter ${
            isConfirmed ? 'text-base font-black text-blue-400 border-blue-500/30' : 'text-[10px] font-bold text-slate-400'
          }`}
          value={localTime}
          onChange={handleTimeChange}
          onKeyDown={handleKeyDown}
        />
      </td>

      <td className="px-6 py-4 text-center">
        <div className="flex flex-col items-center relative">
          <div className="flex items-center gap-2">
            <span className={`text-[13px] font-black group-hover:text-blue-300 transition-colors text-center ${item.isFromCache ? 'text-slate-400' : 'text-white'}`}>
              {item.nome}
            </span>
            {item.isFullyManual && (
              <span className="text-[7px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">Manual</span>
            )}
            {item.isFromCache && !item.isFullyManual && (
              <span className="text-[7px] font-black bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-slate-700">Importado</span>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-4 text-center">
        <span className="text-xs font-black text-slate-300 mono text-center">${item.stakeMedia.toFixed(2)}</span>
      </td>

      <td className="px-4 py-4 text-center">
        <span className={`text-xs font-black ${item.roiTotal >= 0 ? 'text-green-400' : 'text-red-500'}`}>
          {item.roiTotal.toFixed(1)}%
        </span>
      </td>

      <td className="px-4 py-4 text-center">
        <span className="text-[11px] font-black text-slate-400 mono">{item.qtd}</span>
      </td>

      <td className="px-4 py-4 text-center">
        <span className="text-[10px] font-black text-slate-200 text-center">{item.mediaParticipantes.toLocaleString()}</span>
      </td>

      <td className="px-4 py-4 text-center">
        <span className="text-[8px] font-black bg-slate-800/50 px-2 py-0.5 rounded text-slate-500 uppercase tracking-widest text-center mx-auto block w-fit">
          {item.velocidadePredominante}
        </span>
      </td>

      <td className="px-6 py-4 text-center">
        <span className={`text-[8px] font-black border px-2 py-0.5 rounded uppercase tracking-widest block mx-auto w-fit ${getRedeColor(item.rede)}`}>
          {item.rede}
        </span>
      </td>

      <td className="px-4 py-4 text-center w-16">
        <button
          onClick={() => onRemove(item.tournamentKey)}
          className="text-red-500 hover:text-red-400 p-1 transition-all transform hover:scale-110 shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </td>
    </tr>
  );
};

export default GradeRow;
