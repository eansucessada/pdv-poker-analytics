// grade/GradeImportModal.tsx
import React from 'react';

interface Props {
  show: boolean;
  activeSlotName: string;
  onAppend: () => void;
  onReplace: () => void;
  onCancel: () => void;
}

const GradeImportModal: React.FC<Props> = ({ show, activeSlotName, onAppend, onReplace, onCancel }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
        <h4 className="text-xl font-black text-white text-center mb-6 uppercase tracking-widest">Importar Grade</h4>
        <p className="text-sm text-slate-400 text-center mb-8 font-medium">
          Como deseja aplicar o arquivo importado na aba <span className="text-white font-bold">{activeSlotName}</span>?
        </p>

        <div className="space-y-4">
          <button
            onClick={onAppend}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all text-[10px] uppercase tracking-[0.2em] border border-slate-700 flex flex-col items-center justify-center text-center"
          >
            <span>Mesclar com a grade atual</span>
            <span className="text-[8px] text-slate-500 mt-1">Mantém seus ajustes e adiciona os novos</span>
          </button>

          <button
            onClick={onReplace}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all text-[10px] uppercase tracking-[0.2em] border border-blue-400/30 flex flex-col items-center justify-center text-center"
          >
            <span>Substituir Grade Atual</span>
            <span className="text-[8px] text-blue-200/50 mt-1">Limpa a aba e carrega apenas este arquivo</span>
          </button>

          <button
            onClick={onCancel}
            className="w-full py-3 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-colors text-center"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradeImportModal;
