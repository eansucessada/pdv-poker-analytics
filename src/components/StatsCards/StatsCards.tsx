
import React from 'react';
import { GlobalStats } from '../../types';

interface StatsProps {
  stats: GlobalStats;
}

const StatsCards: React.FC<StatsProps> = ({ stats }) => {
  const { totalVolume, totalLucro, stakeMedio } = stats;

  const StatItem = ({ 
    label, 
    value, 
    sub, 
    disclaimer, 
    color = 'text-white' 
  }: { 
    label: string, 
    value: string | number, 
    sub?: string, 
    disclaimer?: string,
    color?: string 
  }) => (
    <div className="bg-slate-800/60 p-8 rounded-[2rem] border border-slate-700 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center transition-all hover:border-blue-500/50 hover:bg-slate-800/80 h-full">
      <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mb-4 text-center">{label}</p>
      <div className="flex flex-col items-center gap-1 flex-1 justify-center">
        <span className={`text-4xl font-black tracking-tighter ${color} text-center`}>{value}</span>
        {sub && <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2 text-center">{sub}</span>}
      </div>
      {disclaimer && (
        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-6 leading-relaxed max-w-[220px] text-center">
          {disclaimer}
        </p>
      )}
    </div>
  );

  return (
    <div className="mb-20">
      <div className="flex items-center justify-center gap-6 mb-10">
        <div className="h-px w-20 bg-gradient-to-r from-transparent to-slate-700"></div>
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] text-center">Visão Geral</h2>
        <div className="h-px w-20 bg-gradient-to-l from-transparent to-slate-700"></div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
        <StatItem 
          label="Lucro / Prejuízo" 
          value={`${totalLucro >= 0 ? '+' : ''}$${totalLucro.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="Resultado Final USD"
          disclaimer="Nota: O resultado pode variar devido aos cálculos de stake, rake e prêmios do arquivo CSV."
          color={totalLucro >= 0 ? 'text-green-400' : 'text-red-500'}
        />
        <StatItem 
          label="Total Torneios" 
          value={totalVolume.toLocaleString()} 
          sub="Jogos Registrados" 
        />
        <StatItem 
          label="Stake Média" 
          value={`$${stakeMedio.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          sub="Buy-in Médio USD" 
        />
      </div>
    </div>
  );
};

export default StatsCards;
