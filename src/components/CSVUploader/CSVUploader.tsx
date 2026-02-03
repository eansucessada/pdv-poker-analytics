import React, { useState, useRef, useEffect } from 'react';
import { DatabaseService } from '../../services/dbService';
import type { TournamentRaw } from '../../types';
import { makeTournamentKey } from '../../utils/tournamentKey';

interface CSVUploaderProps {
  onUploadComplete: () => void;
}

const CONVERSION_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.27,
  BRL: 0.18
};

const CSVUploader: React.FC<CSVUploaderProps> = ({ onUploadComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [pendingData, setPendingData] = useState<TournamentRaw[] | null>(null);
  const [totalFilesSelected, setTotalFilesSelected] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const parseCSVRow = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let curField = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === delimiter && !inQuotes) {
        result.push(curField.trim());
        curField = '';
      } else curField += char;
    }

    result.push(curField.trim());
    return result.map(val => val.replace(/^"|"$/g, '').trim());
  };

  const parsePokerFloat = (val: string | undefined): number => {
    if (!val || val === '-' || val === '' || val === '0') return 0;

    let cleaned = val.replace(/[^\d.,-]/g, '');
    if (cleaned.includes(',') && cleaned.includes('.')) {
      const lastComma = cleaned.lastIndexOf(',');
      const lastDot = cleaned.lastIndexOf('.');
      if (lastComma > lastDot) cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      else cleaned = cleaned.replace(/,/g, '');
    } else {
      if (cleaned.includes(',') && !cleaned.includes('.')) cleaned = cleaned.replace(',', '.');
    }

    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = e => reject(e);
      reader.readAsText(file);
    });
  };

  const processFiles = async (files: FileList) => {
    setIsProcessing(true);
    setSuccessMessage(null);

    const fileArray = Array.from(files);
    setTotalFilesSelected(fileArray.length);
    setCurrentFileIndex(0);

    const allParsedData: TournamentRaw[] = [];

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setCurrentFileIndex(i + 1);

        try {
          const text = await readFileAsText(file);
          const allLines = text.split(/\r?\n/).filter(line => line.trim().length > 0);

          if (allLines.length < 2) continue;

          const firstLine = allLines[0];
          const delimiter =
            (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

          for (let j = 1; j < allLines.length; j++) {
            const cols = parseCSVRow(allLines[j], delimiter);

            const rede = cols[0] || 'Unknown';
            const jogador = cols[1];
            const idJogo = cols[2];
            const nomeTorneio = cols[18];
            const bandeiras = cols[12] || '';

            if (
              !idJogo ||
              !nomeTorneio ||
              !jogador ||
              idJogo.toLowerCase().includes('total') ||
              nomeTorneio.toLowerCase().includes('total')
            ) {
              continue;
            }

            let moeda = (cols[13] || 'USD').toUpperCase();
            let rate = CONVERSION_RATES[moeda] || 1.0;

            let stakeBase = parsePokerFloat(cols[3]);
            let rakeBase = parsePokerFloat(cols[6]);
            let resultadoBase = parsePokerFloat(cols[10]);
            let premioRegular = parsePokerFloat(cols[17]);
            let premioBounty = parsePokerFloat(cols[20]);

            // Ajuste "Zodiac" (mantido como está no seu código)
            if (nomeTorneio.toLowerCase().includes('zodiac')) {
              const zodiacRate = 0.14;
              stakeBase *= zodiacRate;
              rakeBase *= zodiacRate;
              resultadoBase *= zodiacRate;
              premioRegular *= zodiacRate;
              premioBounty *= zodiacRate;
              rate = 1.0;
              moeda = 'USD (CNY ADJ)';
            }

            const custoTotalBase = stakeBase + rakeBase;
            const lucroLiquidoBase = resultadoBase - rakeBase;

            let roiIndividual = -100;
            if (custoTotalBase > 0) {
              roiIndividual = (lucroLiquidoBase / custoTotalBase) * 100;
            }

            // Regra oficial do checkpoint: ITM NÃO vem do CSV
            // (se hoje você está usando outra heurística, mantenho aqui como estava;
            // depois a gente alinha para lucro_usd > 0 quando você quiser)
            const lucroUsd = lucroLiquidoBase * rate;
            const isItm = lucroUsd > 0;

            // ✅ tournamentKey oficial do projeto: `${rede}::${nome}`
            const tournamentKey = makeTournamentKey(rede, nomeTorneio);

            allParsedData.push({
              rede,
              id_do_jogo: idJogo,
              jogador,
              stake: stakeBase,
              rake: rakeBase,
              data: cols[4] || '',
              participantes: parseInt((cols[5] || '').replace(/\D/g, ''), 10) || 0,
              velocidade: cols[9] || 'Normal',
              resultado_base: resultadoBase,
              moeda,
              premio: premioRegular,
              nome: nomeTorneio,
              premio_recompensa: premioBounty,
              reentradas: parseInt(cols[14] || '0', 10) || 0,
              lucro_usd: lucroUsd,
              stake_usd: stakeBase * rate,
              rake_usd: rakeBase * rate,
              roi_individual: roiIndividual,
              is_itm: isItm,
              bandeiras,
              tournamentKey
            } as TournamentRaw);
          }
        } catch (fileError) {
          console.error(`Erro ao ler o arquivo ${file.name}:`, fileError);
        }
      }

      if (allParsedData.length > 0) {
        setPendingData(allParsedData);
        setShowOptions(true);
      } else {
        alert('Nenhum registro de torneio válido encontrado.');
      }
    } catch (error) {
      console.error('Erro geral no processamento:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAction = async (append: boolean) => {
    if (!pendingData) return;
    if (!append) DatabaseService.clearData();
    const stats = await DatabaseService.insertRawData(pendingData);

    setPendingData(null);
    setShowOptions(false);
    onUploadComplete();

    setSuccessMessage(`${stats.added} jogos importados com sucesso!`);
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-lg relative">
      {/* ... (o resto do seu componente fica igual, sem mudanças) ... */}
      <div className="flex-1 text-center">
        <h3 className="text-lg font-black text-white mb-1 flex items-center justify-center gap-2 text-center">
          {isProcessing ? (
            <svg
              className="animate-spin h-5 w-5 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : successMessage ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
          Importação de Dados
        </h3>
        <p
          className={`text-xs font-black uppercase tracking-wider text-center ${
            successMessage ? 'text-green-400 animate-pulse' : 'text-slate-500'
          }`}
        >
          {isProcessing
            ? `Lendo arquivo ${currentFileIndex} de ${totalFilesSelected}...`
            : successMessage
              ? successMessage
              : 'Selecione múltiplos arquivos para consolidar tudo'}
        </p>
      </div>

      <label className={`cursor-pointer group ${isProcessing ? 'pointer-events-none opacity-50' : ''} mx-auto block w-fit`}>
        <div className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-lg text-xs uppercase tracking-[0.2em] border border-blue-400/30 flex items-center justify-center gap-2 text-center">
          {isProcessing ? (
            'Processando Lote...'
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              Importar CSVs
            </>
          )}
          <input ref={fileInputRef} type="file" className="hidden" accept=".csv" multiple onChange={handleFileChange} />
        </div>
      </label>

      {showOptions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
            <h4 className="text-xl font-black text-white text-center mb-6 uppercase tracking-widest text-center">Consolidação de Lote</h4>
            <p className="text-sm text-slate-400 text-center mb-8 font-medium text-center">
              Lidos <span className="text-blue-400 font-bold">{pendingData?.length}</span> registros de{' '}
              <span className="text-white font-bold">{totalFilesSelected}</span> arquivos. Como deseja salvar?
            </p>

            <div className="space-y-4">
              <button
                onClick={() => handleAction(true)}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all text-[10px] uppercase tracking-[0.2em] border border-slate-700 flex flex-col items-center justify-center text-center"
              >
                <span>Anexar aos dados atuais</span>
                <span className="text-[8px] text-slate-500 mt-1">Acrescenta apenas os novos registros</span>
              </button>

              <button
                onClick={() => handleAction(false)}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all text-[10px] uppercase tracking-[0.2em] border border-blue-400/30 flex flex-col items-center justify-center text-center"
              >
                <span>Substituir Base Completa</span>
                <span className="text-[8px] text-blue-200/50 mt-1">Limpa o banco e carrega este novo lote</span>
              </button>

              <button
                onClick={() => {
                  setShowOptions(false);
                  setPendingData(null);
                }}
                className="w-full py-3 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] text-center"
              >
                Cancelar Operação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVUploader;
