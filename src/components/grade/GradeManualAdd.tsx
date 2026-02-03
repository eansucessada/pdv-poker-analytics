// grade/GradeManualAdd.tsx
import React from 'react';

interface Suggestion {
  key: string;
  nome: string;
  rede: string;
}

interface Props {
  manualSearch: string;
  setManualSearch: (v: string) => void;

  showManualSuggestions: boolean;
  manualSuggestions: Suggestion[];
  activeSuggestionIdx: number;
  setActiveSuggestionIdx: (v: number) => void;

  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;

  onPickSuggestion: (s: Suggestion) => void;
  onCreateCustom: (name: string) => void;
}

const GradeManualAdd: React.FC<Props> = ({
  manualSearch,
  showManualSuggestions,
  manualSuggestions,
  activeSuggestionIdx,
  setActiveSuggestionIdx,
  onSearchChange,
  onKeyDown,
  onPickSuggestion,
  onCreateCustom
}) => {
  return (
    <div className="max-w-md mx-auto w-full relative group pb-10">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-0.5 flex items-center shadow-xl group-focus-within:border-blue-500/50 transition-all">
        <input
          type="text"
          placeholder="Pesquisar ou Adicionar..."
          className="flex-1 bg-transparent border-none text-white text-[11px] font-bold py-3 focus:ring-0 placeholder:text-slate-700 uppercase tracking-widest text-center"
          value={manualSearch}
          onChange={onSearchChange}
          onKeyDown={onKeyDown}
        />
      </div>
      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-2 text-center opacity-60">
        Você pode adicionar qualquer torneio, mesmo fora do CSV
      </p>

      {showManualSuggestions && (
        <div className="absolute bottom-full left-0 right-0 mb-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden">
          {manualSuggestions.length > 0 ? (
            <div className="max-h-48 overflow-y-auto">
              <p className="px-4 py-2 bg-slate-950/50 text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                Sugestões do Banco
              </p>

              {manualSuggestions.map((suggestion, idx) => (
                <button
                  key={suggestion.key}
                  onClick={() => onPickSuggestion(suggestion)}
                  onMouseEnter={() => setActiveSuggestionIdx(idx)}
                  className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${
                    idx === activeSuggestionIdx ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-black truncate">
                    {suggestion.nome}
                    <span className="ml-2 text-[8px] font-black opacity-60 uppercase">({suggestion.rede})</span>
                  </span>
                  <span className="text-[8px] uppercase opacity-50 font-black">CSV</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center bg-slate-900">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nenhum torneio encontrado</p>
              <p className="text-[8px] text-slate-700 font-bold uppercase">Crie um registro customizado abaixo</p>
            </div>
          )}

          {manualSearch.trim() && (
            <div className="p-2 bg-slate-950/80 border-t border-slate-800">
              <button
                onClick={() => onCreateCustom(manualSearch.trim())}
                onMouseEnter={() => setActiveSuggestionIdx(manualSuggestions.length)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all shadow-lg border ${
                  activeSuggestionIdx === manualSuggestions.length ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900 border-slate-700 text-indigo-400'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-widest">Criar: "{manualSearch}"</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GradeManualAdd;
