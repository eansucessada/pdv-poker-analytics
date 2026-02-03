// components/deepdive/DeepDiveHeader.tsx

import React from 'react';

interface DeepDiveHeaderProps {
  onClearAll: () => void;
}

const DeepDiveHeader: React.FC<DeepDiveHeaderProps> = ({ onClearAll }) => {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 pb-6">
      <div className="flex flex-col">
        <h3 className="text-[12px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
          Configurar Análise Profunda
        </h3>
        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">
          Defina os parâmetros para consolidação de dados
        </p>
      </div>

      <button
        onClick={onClearAll}
        className="text-[9px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest transition-colors border border-slate-800 px-4 py-2 rounded-xl"
      >
        Limpar Tudo
      </button>
    </header>
  );
};

export default DeepDiveHeader;