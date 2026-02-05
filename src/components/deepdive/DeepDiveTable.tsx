// src/components/deepdive/DeepDiveTable.tsx

import React, { useRef, useState, useEffect } from 'react';
import type { ConsolidatedStats, SelectionDetailRow } from '../../types/deepdive';
import type { FilterState, MetricFilter, NumericOperator } from '../../types/common';

const INITIAL_METRIC_FILTER: MetricFilter = { operator: 'none', val1: '', val2: '' };

interface MetricFilterGroupProps {
  label: string;
  metricKey: keyof FilterState['metrics'];
  unit?: string;
  filters: { metrics: FilterState['metrics'] };
  onUpdate: (key: keyof FilterState['metrics'], updates: Partial<MetricFilter>) => void;
}

const MetricFilterGroup: React.FC<MetricFilterGroupProps> = ({
  label,
  metricKey,
  unit = '',
  filters,
  onUpdate,
}) => {
  const filter = filters.metrics[metricKey];

  return (
    <div className="space-y-1.5 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 flex flex-col items-center">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter text-center">
        {label} {unit && `(${unit})`}
      </label>

      <div className="flex flex-col gap-2 w-full">
        <select
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-[10px] focus:ring-1 focus:ring-blue-500 focus:outline-none text-center"
          value={filter.operator}
          onChange={(e) => onUpdate(metricKey, { operator: e.target.value as NumericOperator })}
        >
          <option value="none">Sem Filtro</option>
          <option value="gte">Maior ou igual</option>
          <option value="lte">Menor ou igual</option>
          <option value="between">Entre</option>
        </select>

        {filter.operator !== 'none' && (
          <div className="flex gap-2">
            <input
              type="number"
              placeholder={filter.operator === 'between' ? 'De' : 'Valor'}
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-white text-[10px] text-center"
              value={filter.val1}
              onChange={(e) => onUpdate(metricKey, { val1: e.target.value })}
            />
            {filter.operator === 'between' && (
              <input
                type="number"
                placeholder="Até"
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-white text-[10px] text-center"
                value={filter.val2}
                onChange={(e) => onUpdate(metricKey, { val2: e.target.value })}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export interface DeepDiveTableProps {
  consolidatedStats: ConsolidatedStats | null;
  filteredDetailedResults: SelectionDetailRow[];

  uniqueRedes: string[];
  uniqueVelocities: string[];

  detailedFilters: {
    search: string;
    rede: string[];
    velocidade: string[];
    metrics: FilterState['metrics'];
  };

  setDetailedFilters: React.Dispatch<
    React.SetStateAction<{
      search: string;
      rede: string[];
      velocidade: string[];
      metrics: FilterState['metrics'];
    }>
  >;

  toggleRedeFilter: (rede: string) => void;
  toggleSpeedFilter: (speed: string) => void;
  updateDetailedMetricFilter: (key: keyof FilterState['metrics'], updates: Partial<MetricFilter>) => void;
  getNetworkColor?: (rede: string) => string;

  onExportToGrade?: () => void;
}

const DeepDiveTable: React.FC<DeepDiveTableProps> = ({
  consolidatedStats,
  filteredDetailedResults,
  uniqueRedes,
  uniqueVelocities,
  detailedFilters,
  setDetailedFilters,
  toggleRedeFilter,
  toggleSpeedFilter,
  updateDetailedMetricFilter,
  getNetworkColor = () => '',
  onExportToGrade = () => {},
}) => {
  const [showRedeFilterDropdown, setShowRedeFilterDropdown] = useState(false);
  const [showSpeedFilterDropdown, setShowSpeedFilterDropdown] = useState(false);

  const redeFilterRef = useRef<HTMLDivElement>(null);
  const speedFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (redeFilterRef.current && !redeFilterRef.current.contains(e.target as Node)) {
        setShowRedeFilterDropdown(false);
      }
      if (speedFilterRef.current && !speedFilterRef.current.contains(e.target as Node)) {
        setShowSpeedFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  if (!consolidatedStats) return null;

  return (
    <section className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-700">
      <header className="px-10 py-6 border-b border-slate-800 bg-slate-800/40 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h4 className="text-[12px] font-black text-slate-300 uppercase tracking-[0.3em]">
              Detalhamento Técnico
            </h4>
            <div className="h-4 w-px bg-slate-700"></div>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
              {filteredDetailedResults.length} Torneios Individuais
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={onExportToGrade}
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
              Exportar como Grade
            </button>

            <div className="h-4 w-px bg-slate-700"></div>

            <button
              onClick={() =>
                setDetailedFilters({
                  search: '',
                  rede: [],
                  velocidade: [],
                  metrics: {
                    stakeMedia: { ...INITIAL_METRIC_FILTER },
                    qtd: { ...INITIAL_METRIC_FILTER },
                    itmPercentual: { ...INITIAL_METRIC_FILTER },
                    retornoTotal: { ...INITIAL_METRIC_FILTER },
                    roiMedio: { ...INITIAL_METRIC_FILTER },
                    mediaParticipantes: { ...INITIAL_METRIC_FILTER },
                  },
                })
              }
              className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
            >
              Resetar Filtros Técnicos
            </button>
          </div>
        </div>

        {/* filtros técnicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
              Nome do Jogo
            </label>
            <input
              type="text"
              placeholder="Pesquisar..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-[10px] text-center outline-none focus:ring-1 focus:ring-blue-500"
              value={detailedFilters.search}
              onChange={(e) => setDetailedFilters({ ...detailedFilters, search: e.target.value })}
            />
          </div>

          {/* redes */}
          <div className="space-y-1.5 relative" ref={redeFilterRef}>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
              Redes
            </label>
            <button
              onClick={() => setShowRedeFilterDropdown((v) => !v)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-between hover:border-slate-700 transition-colors"
            >
              <span className="truncate">
                {detailedFilters.rede.length === 0
                  ? 'Todas as Redes'
                  : `${detailedFilters.rede.length} selecionadas`}
              </span>
              <svg
                className={`h-3 w-3 transition-transform ${showRedeFilterDropdown ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </button>

            {showRedeFilterDropdown && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-[70] p-3 max-h-48 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                {uniqueRedes.map((rede) => (
                  <label
                    key={rede}
                    className="flex items-center gap-3 px-2 py-2 hover:bg-slate-800 rounded-lg cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 checked:bg-blue-600 transition-all"
                      checked={detailedFilters.rede.includes(rede)}
                      onChange={() => toggleRedeFilter(rede)}
                    />
                    <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-white">
                      {rede}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* velocidade */}
          <div className="space-y-1.5 relative" ref={speedFilterRef}>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
              Estrutura
            </label>
            <button
              onClick={() => setShowSpeedFilterDropdown((v) => !v)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-between hover:border-slate-700 transition-colors"
            >
              <span className="truncate">
                {detailedFilters.velocidade.length === 0
                  ? 'Todas Velocidades'
                  : `${detailedFilters.velocidade.length} selecionadas`}
              </span>
              <svg
                className={`h-3 w-3 transition-transform ${showSpeedFilterDropdown ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </button>

            {showSpeedFilterDropdown && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-[70] p-3 max-h-48 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                {uniqueVelocities.map((vel) => (
                  <label
                    key={vel}
                    className="flex items-center gap-3 px-2 py-2 hover:bg-slate-800 rounded-lg cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 checked:bg-blue-600 transition-all"
                      checked={detailedFilters.velocidade.includes(vel)}
                      onChange={() => toggleSpeedFilter(vel)}
                    />
                    <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-white">
                      {vel}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* filtros numéricos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 border-t border-slate-800/50 pt-4">
          <MetricFilterGroup
            label="Stake"
            metricKey="stakeMedia"
            unit="$"
            filters={detailedFilters}
            onUpdate={updateDetailedMetricFilter}
          />
          <MetricFilterGroup
            label="Volume"
            metricKey="qtd"
            filters={detailedFilters}
            onUpdate={updateDetailedMetricFilter}
          />
          <MetricFilterGroup
            label="ITM %"
            metricKey="itmPercentual"
            unit="%"
            filters={detailedFilters}
            onUpdate={updateDetailedMetricFilter}
          />
          <MetricFilterGroup
            label="Lucro"
            metricKey="retornoTotal"
            unit="$"
            filters={detailedFilters}
            onUpdate={updateDetailedMetricFilter}
          />
          <MetricFilterGroup
            label="ROI Médio"
            metricKey="roiMedio"
            unit="%"
            filters={detailedFilters}
            onUpdate={updateDetailedMetricFilter}
          />
          <MetricFilterGroup
            label="Participantes"
            metricKey="mediaParticipantes"
            filters={detailedFilters}
            onUpdate={updateDetailedMetricFilter}
          />
        </div>
      </header>

      <div className="max-h-[600px] overflow-y-auto custom-scrollbar relative">
        <table className="w-full text-center border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur-md border-b border-slate-700">
            <tr>
              <th className="px-10 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
                Torneio
              </th>
              <th className="px-4 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
                Stake
              </th>
              <th className="px-4 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
                QTD
              </th>
              <th className="px-4 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
                ITM%
              </th>
              <th className="px-4 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
                Lucro
              </th>
              <th className="px-4 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
                ROI Total
              </th>
              <th className="px-4 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
                Field Médio
              </th>
              <th className="px-4 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
                Velocidade
              </th>
              <th className="px-10 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
                Rede
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/50">
            {filteredDetailedResults.map((item, idx) => {
              const rede = (item.rede ?? item.site ?? '') as string;

              return (
                <tr key={`${item.nome}-${rede}-${idx}`} className="hover:bg-slate-800/30 transition-all group">
                  <td className="px-10 py-5 text-center">
                    <span className="text-[11px] font-black text-white group-hover:text-blue-400 transition-colors truncate max-w-[250px] block mx-auto uppercase tracking-tighter">
                      {item.nome}
                    </span>
                  </td>

                  <td className="px-4 py-5 text-center">
                    <span className="text-[10px] font-bold text-slate-400 mono">${item.stakeMedia.toFixed(2)}</span>
                  </td>

                  <td className="px-4 py-5 text-center">
                    <span className="text-sm font-black text-slate-300">{item.qtd}</span>
                  </td>

                  <td className="px-4 py-5 text-center">
                    <span className="text-[10px] font-bold text-blue-400/80">{item.itmPercentual.toFixed(1)}%</span>
                  </td>

                  <td className="px-4 py-5 text-center">
                    <span className={`text-[12px] font-black ${item.retornoTotal >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                      ${item.retornoTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </td>

                  <td className="px-4 py-5 text-center">
                    <span className={`text-[12px] font-black ${item.roiTotal >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                      {item.roiTotal.toFixed(1)}%
                    </span>
                  </td>

                  <td className="px-4 py-5 text-center">
                    <span className="text-[11px] font-black text-slate-500">
                      {item.mediaParticipantes.toLocaleString()}
                    </span>
                  </td>

                  <td className="px-4 py-5 text-center">
                    <span className="text-[8px] font-black bg-slate-800/50 px-2 py-0.5 rounded text-slate-500 uppercase tracking-widest text-center mx-auto block w-fit">
                      {item.velocidadePredominante}
                    </span>
                  </td>

                  <td className="px-10 py-5 text-center">
                    <span className={`text-[8px] font-black border px-3 py-1 rounded uppercase tracking-widest mx-auto block w-fit ${getNetworkColor(rede)}`}>
                      {rede}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default DeepDiveTable;
