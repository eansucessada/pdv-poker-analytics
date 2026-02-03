// grade/GradeManualModal.tsx
import React, { useRef } from 'react';
import { makeTournamentKey } from '../../utils/tournamentKey';

interface Props {
  open: boolean;
  pendingTournamentName: string;
  pendingTournamentTime: string;
  pendingTournamentField: string;
  pendingTournamentSpeed: string;
  pendingTournamentRede: string;

  setPendingTournamentTime: (v: string) => void;
  setPendingTournamentField: (v: string) => void;
  setPendingTournamentSpeed: (v: string) => void;
  setPendingTournamentRede: (v: string) => void;

  onClose: () => void;
  onConfirm: () => void;
  isConfirmDisabled: boolean;

  // opcional: se você quiser recalcular key lá fora
  onRedeOrNameChanged?: (key: string) => void;
}

const GradeManualModal: React.FC<Props> = ({
  open,
  pendingTournamentName,
  pendingTournamentTime,
  pendingTournamentField,
  pendingTournamentSpeed,
  pendingTournamentRede,
  setPendingTournamentTime,
  setPendingTournamentField,
  setPendingTournamentSpeed,
  setPendingTournamentRede,
  onClose,
  onConfirm,
  isConfirmDisabled,
  onRedeOrNameChanged
}) => {
  const manualTimeInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-300">
        <h4 className="text-xl font-black text-white text-center mb-1 uppercase tracking-widest">Adicionar Torneio</h4>
        <p className="text-[10px] text-slate-500 text-center mb-8 font-black uppercase tracking-[0.2em] truncate px-4">
          {pendingTournamentName}
        </p>

        <div className="bg-slate-950/50 border border-slate-800 rounded-[2rem] p-8 space-y-6 shadow-inner">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">Horário (Obrigatório)*</label>
              <input
                ref={manualTimeInputRef}
                type="text"
                maxLength={5}
                placeholder="00:00"
                value={pendingTournamentTime}
                onChange={(e) => setPendingTournamentTime(e.target.value.slice(0, 5))}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-2xl font-black text-white focus:ring-2 focus:ring-blue-600 focus:outline-none text-center mono shadow-sm placeholder:text-slate-800 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">Field (Opcional)</label>
              <input
                type="number"
                placeholder="0"
                value={pendingTournamentField}
                onChange={(e) => setPendingTournamentField(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-2xl font-black text-white focus:ring-2 focus:ring-blue-600 focus:outline-none text-center mono shadow-sm placeholder:text-slate-800 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">Velocidade</label>
              <select
                value={pendingTournamentSpeed}
                onChange={(e) => setPendingTournamentSpeed(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm font-black text-white focus:ring-2 focus:ring-blue-600 focus:outline-none text-center uppercase tracking-widest shadow-sm transition-all appearance-none cursor-pointer"
              >
                {['Normal', 'Turbo', 'Super Turbo'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">Rede</label>
              <select
                value={pendingTournamentRede}
                onChange={(e) => {
                  const rede = e.target.value;
                  setPendingTournamentRede(rede);
                  onRedeOrNameChanged?.(makeTournamentKey(rede, pendingTournamentName));
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm font-black text-white focus:ring-2 focus:ring-blue-600 focus:outline-none text-center uppercase tracking-widest shadow-sm transition-all appearance-none cursor-pointer"
              >
                {['GGNetwork', 'Chico', 'PartyPoker', 'PokerStars', 'iPoker', 'WPN', 'Winamax', 'Bodog'].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isConfirmDisabled}
              className={`flex-[2] py-4 font-black rounded-2xl transition-all shadow-lg text-[10px] uppercase tracking-[0.2em] border ${
                isConfirmDisabled
                  ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed opacity-50'
                  : 'bg-blue-600 hover:bg-blue-500 border-blue-400/30 text-white transform hover:scale-[1.02]'
              }`}
            >
              Confirmar Adição
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeManualModal;
