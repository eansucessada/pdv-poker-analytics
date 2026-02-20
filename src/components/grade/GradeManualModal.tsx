// grade/GradeManualModal.tsx
import React, { useEffect, useRef } from 'react';
import { makeTournamentKey } from '../../utils/tournamentKey';

interface Props {
  open: boolean;

  pendingTournamentName: string;
  pendingTournamentRede: string;
  pendingTournamentTime: string;
  pendingTournamentStake: string;
  pendingTournamentField: string;
  pendingTournamentEstrutura: string;
  pendingTournamentSpeed: string;

  setPendingTournamentName: (v: string) => void;
  setPendingTournamentRede: (v: string) => void;
  setPendingTournamentTime: (v: string) => void;
  setPendingTournamentStake: (v: string) => void;
  setPendingTournamentField: (v: string) => void;
  setPendingTournamentEstrutura: (v: string) => void;
  setPendingTournamentSpeed: (v: string) => void;

  isConfirmDisabled: boolean;
  onConfirm: () => void;
  onClose: () => void;

  onRedeOrNameChanged?: (key: string) => void;
}

const NETWORK_SUGGESTIONS = [
  'GGNetwork',
  'iPoker',
  'PokerStars',
  'PartyPoker',
  'Chico',
  'WPN',
  '888',
  'ACR',
  'CoinPoker',
  'Bodog'
];

const SPEED_SUGGESTIONS = ['Normal', 'Turbo', 'Super Turbo', 'Hyper'];

const GradeManualModal: React.FC<Props> = ({
  open,

  pendingTournamentName,
  pendingTournamentRede,
  pendingTournamentTime,
  pendingTournamentStake,
  pendingTournamentField,
  pendingTournamentEstrutura,
  pendingTournamentSpeed,

  setPendingTournamentName,
  setPendingTournamentRede,
  setPendingTournamentTime,
  setPendingTournamentStake,
  setPendingTournamentField,
  setPendingTournamentEstrutura,
  setPendingTournamentSpeed,

  isConfirmDisabled,
  onConfirm,
  onClose,

  onRedeOrNameChanged
}) => {
  const manualTimeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => manualTimeInputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const keyPreview = makeTournamentKey((pendingTournamentRede || '').trim() || 'Manual', pendingTournamentName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.75rem] shadow-2xl overflow-hidden">
        <div className="px-10 pt-10 pb-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-[18px] font-black tracking-tight text-slate-100">Adicionar torneio</h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">
                preencha o horário e confirme
              </p>
            </div>

            <button
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-slate-950/60 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all flex items-center justify-center"
              aria-label="Fechar"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="mt-8 bg-slate-950/50 border border-slate-800 rounded-[2rem] p-8 space-y-6 shadow-inner">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">
                Nome do torneio
              </label>
              <input
                type="text"
                value={pendingTournamentName}
                onChange={(e) => {
                  const name = e.target.value;
                  setPendingTournamentName(name);
                  onRedeOrNameChanged?.(makeTournamentKey((pendingTournamentRede || '').trim() || 'Manual', name));
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-slate-600"
                placeholder="Nome do torneio"
              />
              <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest px-1">
                chave: <span className="text-slate-500">{keyPreview}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">
                  Horário (Obrigatório)*
                </label>
                <input
                  ref={manualTimeInputRef}
                  type="text"
                  maxLength={5}
                  placeholder="00:00"
                  value={pendingTournamentTime}
                  onChange={(e) => setPendingTournamentTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-slate-600 mono tracking-tighter"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">
                  Stake (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 10.50"
                  value={pendingTournamentStake}
                  onChange={(e) => setPendingTournamentStake(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-slate-600 mono tracking-tighter"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">
                  Field (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 800"
                  value={pendingTournamentField}
                  onChange={(e) => setPendingTournamentField(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-slate-600 mono tracking-tighter"
                />
              </div>


              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">
                  Velocidade (Opcional)
                </label>
                <select
                  value={pendingTournamentSpeed}
                  onChange={(e) => setPendingTournamentSpeed(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-slate-600 font-black uppercase tracking-widest shadow-sm transition-all appearance-none cursor-pointer"
                >
                  {SPEED_SUGGESTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">
                  Rede (Opcional)
                </label>
                <input
                  list="rede-suggestions"
                  type="text"
                  placeholder="Ex: iPoker"
                  value={pendingTournamentRede}
                  onChange={(e) => {
                    const rede = e.target.value;
                    setPendingTournamentRede(rede);
                    onRedeOrNameChanged?.(makeTournamentKey((rede || '').trim() || 'Manual', pendingTournamentName));
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-slate-600"
                />
                <datalist id="rede-suggestions">
                  {NETWORK_SUGGESTIONS.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all font-black uppercase tracking-widest text-[10px]"
              type="button"
            >
              Cancelar
            </button>

            <button
              onClick={onConfirm}
              disabled={isConfirmDisabled}
              className={`px-6 py-4 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all ${
                isConfirmDisabled
                  ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed opacity-50'
                  : 'bg-blue-600 hover:bg-blue-500 border-blue-400/30 text-white transform hover:scale-[1.02]'
              }`}
              type="button"
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
