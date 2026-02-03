import React, { useState, useMemo, useEffect } from 'react';
import { DatabaseService } from './services/dbService';

// Tipos
import type { FilterState, MetricFilter } from './types';

// Componentes
import CSVUploader from './components/CSVUploader/CSVUploader';

// ⚠️ Import direto dos arquivos para evitar erro de "barrel export"
import DeepDiveView from './components/deepdive/DeepDiveView';
import GradeView from './components/grade/GradeView';

const INITIAL_METRIC_FILTER: MetricFilter = { operator: 'none', val1: '', val2: '' };

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'deep-dive' | 'grade'>('deep-dive');
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    console.log('PDV Poker Analytics: Local Hosting Mode Active');
  }, []);

  // ✅ Ajuste: se seu FilterState usa rede/velocidade como string[],
  // então aqui precisa ser array, não string.
  const [filters] = useState<FilterState>({
    search: '',
    rede: [],            // ✅ era ''
    velocidade: [],      // ✅ era ''
    bandeiras: '',
    metrics: {
      stakeMedia: { ...INITIAL_METRIC_FILTER },
      qtd: { ...INITIAL_METRIC_FILTER },
      itmPercentual: { ...INITIAL_METRIC_FILTER },
      retornoTotal: { ...INITIAL_METRIC_FILTER },
      roiMedio: { ...INITIAL_METRIC_FILTER },
      mediaParticipantes: { ...INITIAL_METRIC_FILTER },
    },
  });

  const allRedes = useMemo(() => DatabaseService.getUniqueValues('rede'), [dataVersion]);
  const uniqueVelocidades = useMemo(() => DatabaseService.getUniqueValues('velocidade'), [dataVersion]);

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <header className="max-w-7xl mx-auto mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl font-black text-white tracking-tighter flex items-center justify-center lg:justify-start gap-3">
            <span className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
            PDV POKER<span className="text-blue-500">ANALYTICS</span>
          </h1>
          <p className="text-slate-500 mt-2 font-black uppercase tracking-[0.3em] text-[10px] text-center lg:text-left">
            Professional Data Visualization Engine
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <nav className="bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 flex gap-1">
            <button
              onClick={() => setActiveTab('deep-dive')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'deep-dive' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
              }`}
            >
              Análise Profunda
            </button>

            <button
              onClick={() => setActiveTab('grade')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'grade' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
              }`}
            >
              Grade
            </button>
          </nav>

          <CSVUploader onUploadComplete={() => setDataVersion((v) => v + 1)} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className={activeTab === 'deep-dive' ? 'block' : 'hidden'}>
          {/* ✅ Agora o DeepDiveView importado é o componente correto */}
          <DeepDiveView dataVersion={dataVersion} />
        </div>

        <div className={activeTab === 'grade' ? 'block' : 'hidden'}>
          <GradeView
            dataVersion={dataVersion}
            filters={filters}
            allRedes={allRedes}
            uniqueVelocidades={uniqueVelocidades}
          />
        </div>
      </main>

      <footer className="mt-20 text-center py-12 border-t border-slate-900">
        <p className="text-slate-700 text-[9px] font-black uppercase tracking-[0.5em] text-center">
          &copy; {new Date().getFullYear()} professional analytics engine &bull; built for performance
        </p>
      </footer>
    </div>
  );
};

export default App;
