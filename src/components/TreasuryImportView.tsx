import React, { useState } from 'react';
import { TitleRecord } from '../types';
import { parseRelTitulosAPagar, formatBRL, formatCNPJ } from '../utils/spreadsheetParser';
import { DEFAULT_RAW_CSV } from '../data/initialCsv';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Search, 
  ArrowRight,
  Trash2
} from 'lucide-react';

interface TreasuryImportViewProps {
  titles: TitleRecord[];
  onImportTitles: (newTitles: TitleRecord[], mode: 'replace' | 'append') => void;
  onClearTitles: () => void;
  onRestoreDefault: () => void;
}

export const TreasuryImportView: React.FC<TreasuryImportViewProps> = ({
  titles,
  onImportTitles,
  onClearTitles,
  onRestoreDefault,
}) => {
  const [pasteContent, setPasteContent] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NO_PRAZO' | 'EM_ATRASO' | 'PAGO'>('ALL');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Statistics
  const totalCount = titles.length;
  const noPrazoCount = titles.filter((t) => t.statusPrevisao === 'NO_PRAZO').length;
  const atrasadosCount = titles.filter((t) => t.statusPrevisao === 'EM_ATRASO').length;
  const pagosCount = titles.filter((t) => t.statusPrevisao === 'PAGO').length;
  const totalValue = titles.reduce((acc, t) => acc + t.valor, 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        processAndImport(text, 'replace');
      }
    };
    reader.readAsText(file);
  };

  const processAndImport = (content: string, mode: 'replace' | 'append') => {
    const parsed = parseRelTitulosAPagar(content);
    if (parsed.length === 0) {
      alert('Nenhum título foi identificado. Verifique se o formato é CSV separado por ponto e vírgula (;).');
      return;
    }

    onImportTitles(parsed, mode);
    setSuccessMsg(
      `Planilha importada com sucesso! ${parsed.length} títulos processados.`
    );
    setPasteContent('');
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const filteredTitles = titles.filter((t) => {
    const q = filterQuery.toLowerCase();
    const matchText =
      t.fornecedorNome.toLowerCase().includes(q) ||
      t.fornecedorCnpj.includes(q) ||
      t.numeroDocumento.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'ALL' || t.statusPrevisao === statusFilter;
    return matchText && matchStatus;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-400" />
            <span>Tesouraria · Importação de Planilha & Previsões</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Área restrita para importação de relatórios de títulos a pagar (formato CSV/Excel).
          </p>
        </div>

        <button
          type="button"
          onClick={onRestoreDefault}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restaurar Planilha Padrão (Artplan)</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-slate-400 block text-[11px] uppercase">Total de Títulos</span>
          <span className="text-2xl font-bold text-white tabular-nums mt-1 block">
            {totalCount}
          </span>
          <span className="text-slate-500 text-[11px] block mt-1">
            {formatBRL(totalValue)}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-emerald-400 block text-[11px] uppercase flex items-center gap-1.5 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>No Prazo</span>
          </span>
          <span className="text-2xl font-bold text-emerald-400 tabular-nums mt-1 block">
            {noPrazoCount}
          </span>
          <span className="text-slate-400 text-[11px] block mt-1">
            Previsões a vencer
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-rose-400 block text-[11px] uppercase flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Em Atraso</span>
          </span>
          <span className="text-2xl font-bold text-rose-400 tabular-nums mt-1 block">
            {atrasadosCount}
          </span>
          <span className="text-slate-400 text-[11px] block mt-1">
            Títulos vencidos
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-blue-400 block text-[11px] uppercase flex items-center gap-1.5 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Pagos / Baixados</span>
          </span>
          <span className="text-2xl font-bold text-blue-400 tabular-nums mt-1 block">
            {pagosCount}
          </span>
          <span className="text-slate-400 text-[11px] block mt-1">
            Liquidados
          </span>
        </div>
      </div>

      {/* Import Form */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Importar Nova Planilha (REL TÍTULOS A PAGAR)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Faça o upload do arquivo CSV ou cole os dados diretamente abaixo.
            </p>
          </div>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors shrink-0 shadow-sm">
            <UploadCloud className="w-4 h-4" />
            <span>Selecionar Arquivo CSV</span>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="space-y-2">
          <textarea
            rows={4}
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            placeholder="Ou cole aqui as linhas do relatório separadas por ponto e vírgula (;)..."
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
          />

          {pasteContent && (
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => processAndImport(pasteContent, 'replace')}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Substituir Base de Dados
              </button>
              <button
                type="button"
                onClick={() => processAndImport(pasteContent, 'append')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
              >
                Adicionar aos Títulos Existentes
              </button>
            </div>
          )}
        </div>

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Database Review Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Títulos Carregados no Sistema ({filteredTitles.length})
            </h3>
            <p className="text-xs text-slate-400">
              Estes são os títulos que qualquer fornecedor pode consultar na tela pública.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filtrar fornecedor, CNPJ..."
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
            >
              <option value="ALL">Todos os Status</option>
              <option value="NO_PRAZO">No Prazo</option>
              <option value="EM_ATRASO">Em Atraso</option>
              <option value="PAGO">Pago</option>
            </select>
          </div>
        </div>

        <div className="max-h-[460px] overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] sticky top-0 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Fornecedor / CNPJ</th>
                <th className="py-2.5 px-4">Documento</th>
                <th className="py-2.5 px-4">Vencimento</th>
                <th className="py-2.5 px-4 text-right">Valor</th>
                <th className="py-2.5 px-4 text-center">Status Previsão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredTitles.length > 0 ? (
                filteredTitles.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4">
                      <div className="font-sans font-semibold text-white max-w-[220px] truncate">
                        {t.fornecedorNome}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatCNPJ(t.fornecedorCnpj)}
                      </div>
                    </td>

                    <td className="py-2.5 px-4 text-slate-300">
                      <div>NF {t.numeroDocumento}</div>
                      <div className="text-[11px] text-slate-500">{t.clienteNome}</div>
                    </td>

                    <td className="py-2.5 px-4 text-slate-200 font-semibold tabular-nums">
                      {t.dataVencimento}
                    </td>

                    <td className="py-2.5 px-4 text-right font-bold text-emerald-400 tabular-nums">
                      {formatBRL(t.valor)}
                    </td>

                    <td className="py-2.5 px-4 text-center">
                      {t.statusPrevisao === 'EM_ATRASO' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                          ATRASADO ({t.diasAtraso}d)
                        </span>
                      )}
                      {t.statusPrevisao === 'NO_PRAZO' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          NO PRAZO
                        </span>
                      )}
                      {t.statusPrevisao === 'PAGO' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                          PAGO
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                    Nenhum título encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
