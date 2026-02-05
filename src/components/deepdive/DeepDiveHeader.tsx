// components/deepdive/DeepDiveHeader.tsx
import React from "react";

interface DeepDiveHeaderProps {
  onClearAll: () => void;

  /**
   * Totais do dataset (Supabase):
   * - raw = COUNT(*) em tournaments_raw
   * - unique = COUNT(*) em tournaments
   */
  datasetRawCount?: number;
  datasetUniqueCount?: number;

  /**
   * Amostra filtrada (o que está sendo mostrado/calculado no DeepDive):
   * - raw = soma de games_count (brutos na amostra)
   * - unique = quantidade de linhas (torneios únicos na amostra)
   */
  sampleRawCount?: number;
  sampleUniqueCount?: number;
}

const DeepDiveHeader: React.FC<DeepDiveHeaderProps> = ({
  onClearAll,
  datasetRawCount,
  datasetUniqueCount,
  sampleRawCount,
  sampleUniqueCount,
}) => {
  const showDatasetTotals =
    typeof datasetRawCount === "number" || typeof datasetUniqueCount === "number";
  const showSampleTotals =
    typeof sampleRawCount === "number" || typeof sampleUniqueCount === "number";

  return (
    <header className="flex items-center justify-between border-b border-slate-800 pb-6">
      <div className="flex flex-col">
        <h3 className="text-[12px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
          Configurar Análise Profunda
        </h3>

        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">
          Defina os parâmetros para consolidação de dados
        </p>

        {(showDatasetTotals || showSampleTotals) && (
          <div className="mt-3 flex flex-col gap-1">
            {showDatasetTotals && (
              <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                Totais do dataset{" "}
                <span className="text-slate-400">
                  {typeof datasetRawCount === "number" ? `Brutos ${datasetRawCount}` : ""}
                  {typeof datasetRawCount === "number" && typeof datasetUniqueCount === "number"
                    ? " · "
                    : ""}
                  {typeof datasetUniqueCount === "number" ? `Únicos ${datasetUniqueCount}` : ""}
                </span>
              </div>
            )}

            {showSampleTotals && (
              <div className="text-[8px] font-black uppercase tracking-widest text-slate-600">
                Amostra filtrada{" "}
                <span className="text-slate-400">
                  {typeof sampleRawCount === "number" ? `Brutos ${sampleRawCount}` : ""}
                  {typeof sampleRawCount === "number" && typeof sampleUniqueCount === "number"
                    ? " · "
                    : ""}
                  {typeof sampleUniqueCount === "number" ? `Únicos ${sampleUniqueCount}` : ""}
                </span>
              </div>
            )}
          </div>
        )}
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
