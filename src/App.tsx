import { AuthGate } from "./components/auth";
import React, { useEffect, useMemo, useState } from "react";
import type { FilterState, MetricFilter } from "./types";

import CSVUploader from "./components/CSVUploader/CSVUploader";
import DeepDiveView from "./components/deepdive/DeepDiveView";
import GradeView from "./components/grade/GradeView";

const INITIAL_METRIC_FILTER: MetricFilter = { operator: "none", val1: "", val2: "" };

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"deep-dive" | "grade">("deep-dive");

  // Incrementa para forçar recarregamento de queries após import/purge
  const [dataVersion, setDataVersion] = useState(0);

  // ✅ Dataset global: só 2 bases fixas (1 e 2)
  const [datasetId, setDatasetId] = useState<number>(1);

  // Filters globais (mantém comportamento atual do app)
  const [filters] = useState<FilterState>({});

  // DeepDive: filtros do Explain/Chart (mantém como estava)
  const [metricFilter] = useState<MetricFilter>(INITIAL_METRIC_FILTER);

  useEffect(() => {
    console.log("PDV Poker Analytics: Local Hosting Mode Active");
  }, []);

  const onUploadComplete = () => setDataVersion((v) => v + 1);

  // Compat: alguns componentes esperam arrays memoizados
  const memoFilters = useMemo(() => filters, [filters]);

  return (
    <AuthGate>
      <div className="min-h-screen bg-[#070b15] text-white">
        <div className="max-w-7xl mx-auto px-6 pt-6">
          {/* Tabs principais */}
          <div className="flex items-center gap-2 mb-6">
            <button
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === "deep-dive" ? "bg-[#2b6cff]" : "bg-[#121a2f] hover:bg-[#182246]"
              }`}
              onClick={() => setActiveTab("deep-dive")}
            >
              Análise Profunda
            </button>
            <button
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === "grade" ? "bg-[#2b6cff]" : "bg-[#121a2f] hover:bg-[#182246]"
              }`}
              onClick={() => setActiveTab("grade")}
            >
              Grade
            </button>
          </div>

          {/* Importação sempre visível no topo (usa dataset global) */}
          <CSVUploader
            datasetId={datasetId}
            onDatasetChange={(id) => setDatasetId(id === 2 ? 2 : 1)}
            onUploadComplete={onUploadComplete}
          />

          <div className="mt-6">
            {activeTab === "deep-dive" ? (
              <DeepDiveView dataVersion={dataVersion} datasetId={datasetId} />
            ) : (
              <GradeView dataVersion={dataVersion} datasetId={datasetId} filters={memoFilters} />
            )}
          </div>
        </div>
      </div>
    </AuthGate>
  );
};

export default App;
