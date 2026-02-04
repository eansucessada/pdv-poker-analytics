// grade/GradeHeader.tsx
import { supabase } from "../../services/supabaseClient";
import React, { useRef, useState } from 'react';
import { DAYS_OF_WEEK } from './GradeTable';
import type { GradeSlot } from '../../types/grade';

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
  alertsEnabled,
  grindMode,
  setAlertsEnabled,
  setGrindMode,
  alertVolume,
  setAlertVolume,
  playAlertSound,
  isRenaming,
  setIsRenaming,
  tempName,
  setTempName,
  commitRename
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);

  return (
    
    <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-2 px-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
      <div className="flex items-center gap-1.5 flex-wrap">
        {slots.map((slot, idx) => (
          <div key={slot.id} className="relative group">
            <button
              onClick={() => onSwitchSlot(slot.id)}
              className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all border flex items-center justify-center ${
                activeSlotId === slot.id ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
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
<button
  onClick={async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "teste@gmail.com",
      password: "ian123123"
    });
    console.log("login", data, error);
    alert(error ? error.message : "Logado!");
  }}
>
  Testar Login
</button>

        {slots.length < 8 && (
          <button
            onClick={onAddSlot}
            className="w-8 h-8 rounded-lg text-slate-500 border border-dashed border-slate-700 hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center text-base font-bold bg-slate-950/30"
          >
            +
          </button>
        )}

        <div className="h-6 w-px bg-slate-800 mx-2"></div>

        {isRenaming ? (
          <input
            type="text"
            value={tempName}
            onChange={e => setTempName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && commitRename()}
            className="bg-slate-950 border border-blue-600 rounded-md px-2 py-1 text-[10px] font-black text-white focus:outline-none w-24"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white uppercase tracking-tight truncate max-w-[100px]">{activeSlot.name}</span>
            <button onClick={() => setIsRenaming(true)} className="text-slate-600 hover:text-blue-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 mr-4">
          {DAYS_OF_WEEK.map((day, idx) => (
            <button
              key={day}
              onClick={() => onToggleDay(idx)}
              className={`w-8 h-6 rounded flex items-center justify-center text-[8px] font-black uppercase transition-all border ${
                activeSlot.days.includes(idx) ? 'bg-blue-600/30 border-blue-500 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-700 hover:border-slate-700'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
          <button onClick={onExport} className="text-[9px] font-black text-slate-400 hover:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm5-6V2a1 1 0 112 0v9l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L8 11z"
                clipRule="evenodd"
              />
            </svg>
            Exportar
          </button>

          <label className="cursor-pointer text-[9px] font-black text-slate-400 hover:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9.293 3.293a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L11 6.414V13a1 1 0 11-2 0V6.414L5.707 9.707a1 1 0 01-1.414-1.414l5-5z"
                clipRule="evenodd"
              />
            </svg>
            Importar
            <input ref={importInputRef} type="file" accept=".json" multiple onChange={onImport} className="hidden" />
          </label>
        </div>

        {/* toggles + volume */}
        <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Grind</span>
            <button
              onClick={() => setGrindMode(!grindMode)}
              className={`w-12 h-6 rounded-full transition-all border relative ${grindMode ? 'bg-blue-600 border-blue-400' : 'bg-slate-950 border-slate-800'}`}
            >
              <div className={`absolute top-1 w-3.5 h-3.5 bg-white rounded-full transition-all ${grindMode ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Alertas</span>
            <button
              onClick={() => setAlertsEnabled(!alertsEnabled)}
              className={`w-12 h-6 rounded-full transition-all border relative ${alertsEnabled ? 'bg-blue-600 border-blue-400' : 'bg-slate-950 border-slate-800'}`}
            >
              <div className={`absolute top-1 w-3.5 h-3.5 bg-white rounded-full transition-all ${alertsEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="relative" ref={volumeRef}>
            <button
              onClick={() => {
                setShowVolumeSlider(!showVolumeSlider);
                playAlertSound();
              }}
              className={`p-3 rounded-2xl border transition-all flex items-center gap-2 ${
                showVolumeSlider ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <span className="text-[9px] font-black uppercase tracking-widest">Vol</span>
            </button>

            {showVolumeSlider && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl z-[100] w-12 h-40 flex flex-col items-center">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={alertVolume}
                  onChange={(e) => setAlertVolume(parseFloat(e.target.value))}
                  className="h-32 accent-blue-500 appearance-none bg-slate-800 rounded-full w-2 cursor-pointer"
                  style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' } as any}
                />
                <span className="text-[8px] font-black text-white mt-2">{Math.round(alertVolume * 100)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeHeader;
