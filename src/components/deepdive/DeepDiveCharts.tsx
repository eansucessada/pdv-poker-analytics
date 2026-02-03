// components/deepdive/DeepDiveCharts.tsx

import React from 'react';
import type { ConsolidatedStats } from '../../types/deepdive';

interface DeepDiveChartsProps {
  consolidatedStats: ConsolidatedStats | null;
}

const DeepDiveCharts: React.FC<DeepDiveChartsProps> = ({ consolidatedStats }) => {
  return (
    <section className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col items-center">
      {!consolidatedStats ? (
        <div className="py-20 text-center space-y-4">
          <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest">
            Defina os filtros acima para consolidar os resultados da amostra
          </p>
          <div className="w-12 h-1 bg-slate-800 mx-auto rounded-full"></div>
        </div>
      ) : (
        <div className="w-full space-y-10 animate-in zoom-in-95">
          <div className="text-center flex flex-col items-center">
            <div className="h-px w-20 bg-gradient-to-r from-transparent via-blue-500 to-transparent mb-6"></div>
            <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{consolidatedStats.nome}</h4>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-3">
              Relatório Consolidado de Amostra
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/40 p-8 rounded-[2rem] border border-slate-700/50 flex flex-col items-center text-center transition-all hover:bg-slate-800/60 shadow-lg">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Lucro Total</span>
              <span className={`text-3xl font-black ${consolidatedStats.retornoTotal >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                ${consolidatedStats.retornoTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2">USD Líquido</span>
            </div>

            <div className="bg-slate-800/40 p-8 rounded-[2rem] border border-slate-700/50 flex flex-col items-center text-center transition-all hover:bg-slate-800/60 shadow-lg">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">ROI Global</span>
              <span className={`text-3xl font-black ${consolidatedStats.roiTotal >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                {consolidatedStats.roiTotal.toFixed(1)}%
              </span>
              <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2">Retorno Médio</span>
            </div>

            <div className="bg-slate-800/40 p-8 rounded-[2rem] border border-slate-700/50 flex flex-col items-center text-center transition-all hover:bg-slate-800/60 shadow-lg">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Volume</span>
              <span className="text-3xl font-black text-white">{consolidatedStats.qtd}</span>
              <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2">Jogos Jogados</span>
            </div>

            <div className="bg-slate-800/40 p-8 rounded-[2rem] border border-slate-700/50 flex flex-col items-center text-center transition-all hover:bg-slate-800/60 shadow-lg">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Stake Média</span>
              <span className="text-3xl font-black text-white">${consolidatedStats.stakeMedia.toFixed(2)}</span>
              <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2">Buy-in Médio</span>
            </div>
          </div>

          <div className="bg-slate-800/20 p-6 rounded-2xl border border-slate-800/50 flex flex-col items-center text-center mx-auto max-w-md">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Impacto de Field</span>
            <span className="text-xl font-black text-slate-400">
              {consolidatedStats.mediaParticipantes.toLocaleString()}{' '}
              <span className="text-[10px] uppercase font-bold text-slate-600">Média de Players</span>
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

export default DeepDiveCharts;
