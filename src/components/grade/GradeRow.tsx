// grade/GradeRow.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { GradeRowProps } from '../../types/grade';
import { formatTimeInput } from '../../utils/format';

function clampName(value: string): string {
  // evita que o usuário deixe nome vazio
  const s = String(value ?? '').replace(/\s+/g, ' ').trim();
  return s;
}

const GradeRow: React.FC<GradeRowProps> = ({
  item,
  onManualTimeCommit,
  onNameCommit,
  getRedeColor,
  isPassed,
  isManualEntry,
  onRemove
}) => {
  const [localTime, setLocalTime] = useState(item.horarioManual);

  useEffect(() => {
    setLocalTime(item.horarioManual);
  }, [item.horarioManual]);

  const isConfirmed = item.horarioManual !== '' && localTime === item.horarioManual;

  const estruturaDisplay = (() => {
    const e = (item as any).estruturaPredominante ?? (item as any).estrutura ?? (item as any).estruturaManual ?? '';
    const s = String(e || '').trim();
    if (s) return s;
    const fallback = String((item as any).velocidadePredominante || '').trim();
    return fallback || '—';
  })();

  const tournamentName = useMemo(() => String(item.nome || ''), [item.nome]);

  // copiar nome
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const copyName = async () => {
    if (!tournamentName) return;
    try {
      await navigator.clipboard.writeText(tournamentName);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = tournamentName;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(ta);
      }
    }

    setCopied(true);
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 900);
  };

  // editar nome
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(tournamentName);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isEditingName) {
      setDraftName(tournamentName);
    }
  }, [tournamentName, isEditingName]);

  useEffect(() => {
    if (isEditingName) {
      // aguarda render
      window.setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 0);
    }
  }, [isEditingName]);

  const commitName = () => {
    if (!onNameCommit) {
      setIsEditingName(false);
      return;
    }
    const next = clampName(draftName);
    if (!next) {
      setIsEditingName(false);
      return;
    }
    onNameCommit(item.tournamentKey, next);
    setIsEditingName(false);
  };

  const cancelNameEdit = () => {
    setDraftName(tournamentName);
    setIsEditingName(false);
  };

  const rowOpacityClass = isPassed ? 'opacity-35 grayscale' : 'opacity-100';

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
    <tr
      className={`group transition-all ${rowOpacityClass} ${bgClass} ${borderClass} ${item.isFromCache ? 'border-b border-dashed border-slate-800/20' : ''}`}
    >
      {/* Horário (do CSV / consolidado) */}
      <td className="px-6 py-4 text-center">
        <span
          className={`text-base font-black mono tracking-tighter ${
            item.isFullyManual ? 'text-indigo-300' : item.isFromCache ? 'text-slate-500' : 'text-blue-400'
          }`}
        >
          {item.horario}
        </span>
      </td>

      {/* Manual (override de horário) */}
      <td className="px-4 py-4 text-center">
        <input
          type="text"
          maxLength={5}
          placeholder="00:00"
          className={`w-20 bg-slate-950/50 border border-slate-800/60 rounded-xl px-3 py-2 outline-none focus:border-blue-500/40 transition-all hover:border-slate-700 mono tracking-tighter ${
            isConfirmed ? 'text-base font-black text-blue-400 border-blue-500/30' : 'text-[10px] font-bold text-slate-400'
          }`}
          value={localTime}
          onChange={(e) => setLocalTime(formatTimeInput(e.target.value))}
          onBlur={() => {
            const next = formatTimeInput(localTime);
            setLocalTime(next);
            onManualTimeCommit(item.tournamentKey, next);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
      </td>

      {/* Torneio */}
      <td className="px-6 py-4">
        <div className="flex flex-col items-center gap-1">
          <div className="relative flex items-center justify-center max-w-[360px]">
            {isEditingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitName();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelNameEdit();
                  }
                }}
                className="w-[340px] max-w-[340px] bg-slate-950/60 border border-slate-800/70 rounded-xl px-3 py-2 text-sm font-black text-slate-100 outline-none focus:border-blue-500/40"
              />
            ) : (
              <span className="text-sm font-black text-slate-100 text-center leading-tight">{tournamentName}</span>
            )}

            {/* Copiar */}
            <button
              type="button"
              onClick={copyName}
              className={`ml-2 inline-flex items-center justify-center rounded-md border border-slate-700/60 bg-slate-950/40 px-1.5 py-1 text-slate-200 transition-all opacity-0 group-hover:opacity-100 hover:border-slate-600 hover:bg-slate-900/60 ${
                copied ? 'opacity-100 border-emerald-500/40 text-emerald-300' : ''
              }`}
              title={copied ? 'Copiado!' : 'Copiar nome'}
              aria-label="Copiar nome do torneio"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414l2.793 2.793 6.793-6.793a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 2a2 2 0 00-2 2v9a2 2 0 002 2h6a2 2 0 002-2V7.414A2 2 0 0013.414 6L11 3.586A2 2 0 009.586 3H6z" />
                  <path d="M14 7v8a3 3 0 01-3 3H7a1 1 0 110-2h4a1 1 0 001-1V7a1 1 0 112 0z" />
                </svg>
              )}
            </button>

            {/* Editar */}
            <button
              type="button"
              onClick={() => {
                if (!onNameCommit) return;
                setIsEditingName(true);
              }}
              className={`ml-1 inline-flex items-center justify-center rounded-md border border-slate-700/60 bg-slate-950/40 px-1.5 py-1 text-slate-200 transition-all opacity-0 group-hover:opacity-100 hover:border-slate-600 hover:bg-slate-900/60 ${
                !onNameCommit ? 'cursor-not-allowed opacity-0 group-hover:opacity-0' : ''
              }`}
              title={onNameCommit ? 'Editar nome' : ''}
              aria-label="Editar nome do torneio"
            >
              {/* pencil */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-9.9 9.9a1 1 0 01-.39.242l-3.2 1.067a1 1 0 01-1.266-1.266l1.067-3.2a1 1 0 01.242-.39l9.9-9.9z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {item.isFullyManual && (
              <span className="text-[7px] font-black bg-indigo-700/40 text-indigo-200 px-2 py-0.5 rounded uppercase tracking-tighter border border-indigo-500/30">
                Manual
              </span>
            )}
            {(isManualEntry || item.isFromCache) && !item.isFullyManual && (
              <span className="text-[7px] font-black bg-blue-700/30 text-blue-200 px-2 py-0.5 rounded uppercase tracking-tighter border border-blue-500/20">
                Fixado
              </span>
            )}
            {item.isFromCache && (
              <span className="text-[7px] font-black bg-slate-800/50 text-slate-300 px-2 py-0.5 rounded uppercase tracking-tighter border border-slate-700">
                Importado
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Rede */}
      <td className="px-6 py-4 text-center">
        <span
          className={`text-[8px] font-black border px-2 py-0.5 rounded uppercase tracking-widest block mx-auto w-fit ${getRedeColor(
            item.rede
          )}`}
        >
          {item.rede}
        </span>
      </td>

      {/* Estrutura */}
      <td className="px-4 py-4 text-center">
        <span className="text-[8px] font-black bg-slate-800/50 px-2 py-1 rounded-lg text-slate-200 border border-slate-700 uppercase tracking-widest mx-auto block w-fit">
          {estruturaDisplay}
        </span>
      </td>

      {/* Qtd */}
      <td className="px-4 py-4 text-center">
        <span className="text-[11px] font-black text-slate-400 mono">{item.qtd}</span>
      </td>

      {/* Stake */}
      <td className="px-4 py-4 text-center">
        <span className="text-xs font-black text-slate-300 mono text-center">${item.stakeMedia.toFixed(2)}</span>
      </td>

      {/* ROI Total */}
      <td className="px-4 py-4 text-center">
        <span className={`text-xs font-black ${item.roiTotal >= 0 ? 'text-green-400' : 'text-red-500'}`}>
          {item.roiTotal.toFixed(1)}%
        </span>
      </td>

      {/* Field */}
      <td className="px-4 py-4 text-center">
        <span className="text-[10px] font-black text-slate-200 text-center">{item.mediaParticipantes.toLocaleString()}</span>
      </td>

      {/* Ações */}
      <td className="px-4 py-4 text-center w-16">
        <button
          onClick={() => onRemove(item.tournamentKey)}
          className="text-red-500 hover:text-red-400 transition-colors opacity-70 hover:opacity-100"
          title="Remover"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zm-1 6a1 1 0 112 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </td>
    </tr>
  );
};

export default GradeRow;
