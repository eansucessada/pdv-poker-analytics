// grade/GradeHeader.tsx
import React from "react";
import { DAYS_OF_WEEK } from "./GradeTable";
import type { GradeSlot } from "../../types/grade";

interface Props {
  slots: GradeSlot[];
  activeSlotId: string | number;
  activeSlot: GradeSlot;
  onSwitchSlot: (id: string | number) => void;
  onAddSlot: () => void;
  onRemoveSlot: (id: string | number) => void;

  onToggleDay: (idx: number) => void;

  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  importInputRef: React.RefObject<HTMLInputElement | null>;

  // OBS: esses props ainda existem porque o componente é chamado com eles,
  // mas os controles ficam no GradeFiltersPanel (pra não duplicar).
  alertsEnabled: boolean;
  grindMode: boolean;
  setAlertsEnabled: (v: boolean) => void;
  setGrindMode: (v: boolean) => void;

  alertVolume: number;
  setAlertVolume: (v: number) => void;
  playAlertSound: () => void;

  isRenaming: boolean;
  setIsRenaming: (v: boolean) => void;
  tempName: string;
  setTempName: (v: string) => void;
  commitRename: () => void;

  /**
   * Clarificação de números na UI:
   * - Totais do dataset: contam o dataset inteiro (Supabase), independente dos filtros locais da Grade.
   * - Amostra filtrada: o que está sendo mostrado na Grade após filtros/exclusões/manuais.
   *
   * São opcionais para não quebrar chamadas antigas.
   */
  datasetRawCount?: number; // rows em tournaments_raw
  datasetUniqueCount?: number; // rows em tournaments
  sampleRawCount?: number; // soma de games_count na amostra
  sampleUniqueCount?: number; // quantidade de torneios únicos na amostra
}

const GradeHeader: React.FC<Props> = ({
  slots,
  activeSlotId,
  activeSlot,
  onSwitchSlot,
  onAddSlot,
  onRemoveSlot,
  onToggleDay,
  onExport,
  onImport,
  importInputRef,
  isRenaming,
  setIsRenaming,
  tempName,
  setTempName,
  commitRename,
  datasetRawCount,
  datasetUniqueCount,
  sampleRawCount,
  sampleUniqueCount,
}) => {
  const showDatasetTotals =
    typeof datasetRawCount === "number" || typeof datasetUniqueCount === "number";
  const showSampleTotals =
    typeof sampleRawCount === "number" || typeof sampleUniqueCount === "number";

  return (
    <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-2 px-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
      <div className="flex items-center gap-1.5 flex-wrap">
        {slots.map((slot, idx) => (
          <div key={slot.id} className="relative group">
            <button
              onClick={() => onSwitchSlot(slot.id)}
              className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all border flex items-center justify-center ${
                activeSlotId === slot.id
                  ? "bg-blue-600 border-blue-400 text-white shadow-lg"
                  : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              {idx + 1}
            </button>

            {slots.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSlot(slot.id);
                }}
                className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] font-black shadow-lg z-10"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {slots.length < 8 && (
          <button
            onClick={onAddSlot}
            className="w-8 h-8 rounded-lg text-slate-500 border border-dashed border-slate-700 hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center text-base font-bold bg-slate-950/30"
          >
            +
          </button>
        )}

        <div className="h-6 w-px bg-slate-800 mx-2" />

        {isRenaming ? (
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitRename()}
            className="bg-slate-950 border border-blue-600 rounded-md px-2 py-1 text-[10px] font-black text-white focus:outline-none w-24"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white uppercase tracking-tight truncate max-w-[100px]">
              {activeSlot.name}
            </span>
            <button
              onClick={() => setIsRenaming(true)}
              className="text-slate-600 hover:text-blue-400 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {(showDatasetTotals || showSampleTotals) && (
        <div className="flex flex-col items-end gap-1 sm:mr-2">
          {showDatasetTotals && (
            <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">
              Totais do dataset{" "}
              <span className="text-slate-400">
                {typeof datasetRawCount === "number" ? `Brutos ${datasetRawCount}` : ""}
                {typeof datasetRawCount === "number" && typeof datasetUniqueCount === "number"
                  ? " · "
                  : ""}
                {typeof datasetUniqueCount === "number" ? `Únicos ${datasetUniqueCount}` : ""}
              </span>
            </div>
          )}

          {showSampleTotals && (
            <div className="text-[8px] font-black uppercase tracking-widest text-slate-600">
              Amostra filtrada{" "}
              <span className="text-slate-400">
                {typeof sampleRawCount === "number" ? `Brutos ${sampleRawCount}` : ""}
                {typeof sampleRawCount === "number" && typeof sampleUniqueCount === "number"
                  ? " · "
                  : ""}
                {typeof sampleUniqueCount === "number" ? `Únicos ${sampleUniqueCount}` : ""}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 mr-4">
          {DAYS_OF_WEEK.map((day, idx) => (
            <button
              key={day}
              onClick={() => onToggleDay(idx)}
              className={`w-8 h-6 rounded flex items-center justify-center text-[8px] font-black uppercase transition-all border ${
                activeSlot.days.includes(idx)
                  ? "bg-blue-600/30 border-blue-500 text-blue-400"
                  : "bg-slate-950 border-slate-800 text-slate-700 hover:border-slate-700"
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
          <button
            onClick={onExport}
            className="text-[9px] font-black text-slate-400 hover:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm5-6V2a1 1 0 112 0v9l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L8 11z"
                clipRule="evenodd"
              />
            </svg>
            Exportar
          </button>

          <label className="cursor-pointer text-[9px] font-black text-slate-400 hover:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9.293 3.293a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L11 6.414V13a1 1 0 11-2 0V6.414L5.707 9.707a1 1 0 01-1.414-1.414l5-5z"
                clipRule="evenodd"
              />
            </svg>
            Importar
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              multiple
              onChange={onImport}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default GradeHeader;
