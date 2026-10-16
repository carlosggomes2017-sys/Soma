import React, { useState } from 'react';
import { TitleRecord } from '../types';
import { formatBRL, formatCNPJ } from '../utils/spreadsheetParser';
import { Search, Calendar, Clock, AlertTriangle, CheckCircle2, Building2, FileText, ArrowRight } from 'lucide-react';

interface PublicQueryViewProps {
  titles: TitleRecord[];
}

export const PublicQueryView: React.FC<PublicQueryViewProps> = ({ titles }) => {
  const [searchInput, setSearchInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<TitleRecord[]>([]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchInput.trim().toLowerCase();
    if (!query) {
      setHasSearched(false);
      setResults([]);
      return;
    }

    const cleanQueryNumeric = query.replace(/\D/g, '');

    const filtered = titles.filter((t) => {
      const matchName = t.fornecedorNome.toLowerCase().includes(query);
      const matchDoc = t.numeroDocumento.toLowerCase().includes(query) || t.nfe.toLowerCase().includes(query);
      const matchCliente = t.clienteNome.toLowerCase().includes(query);
      const matchCnpj = cleanQueryNumeric && t.fornecedorCnpj.replace(/\D/g, '').includes(cleanQueryNumeric);

      return matchName || matchDoc || matchCliente || matchCnpj;
    });

    setResults(filtered);
    setHasSearched(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Title & Instructions */}
      <div className="text-center space-y-3 pt-6">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Consulta de Previsão de Pagamentos
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Informe o CNPJ, Razão Social da empresa fornecedora ou o Número do Documento / NF-e para verificar a data prevista de pagamento e a situação.
        </p>
      </div>

      {/* Clean, Normal Search Form - No Quick Example Buttons */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Digite o CNPJ, Nome do Fornecedor ou Número da Nota Fiscal..."
              className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Consultar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
            <span>
              {results.length} {results.length === 1 ? 'registro encontrado' : 'registros encontrados'}
            </span>
          </div>

          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((item) => {
                const isAtrasado = item.statusPrevisao === 'EM_ATRASO';
                const isNoPrazo = item.statusPrevisao === 'NO_PRAZO';
                const isPago = item.statusPrevisao === 'PAGO';

                return (
                  <div
                    key={item.id}
                    className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-lg space-y-4 transition-all hover:border-slate-700"
                  >
                    {/* Top Row: Provider & Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div>
                        <h3 className="text-base font-bold text-white">
                          {item.fornecedorNome}
                        </h3>
                        {item.fornecedorCnpj && (
                          <span className="text-xs text-slate-400 font-mono">
                            CNPJ: {formatCNPJ(item.fornecedorCnpj)}
                          </span>
                        )}
                      </div>

                      <div className="shrink-0">
                        {isAtrasado && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/70 border border-rose-700/60 text-rose-300 text-xs font-bold font-mono">
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                            <span>EM ATRASO ({item.diasAtraso} {item.diasAtraso === 1 ? 'dia' : 'dias'})</span>
                          </div>
                        )}

                        {isNoPrazo && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-xs font-bold font-mono">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            <span>NO PRAZO (A VENCER)</span>
                          </div>
                        )}

                        {isPago && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-950/70 border border-blue-700/60 text-blue-300 text-xs font-bold font-mono">
                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                            <span>PAGO / LIQUIDADO</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Forecast Date and Financial Values */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-slate-950 border border-slate-800/80">
                      <div>
                        <span className="text-[11px] font-mono text-slate-400 uppercase block">
                          Previsão de Pagamento / Vencimento
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-emerald-400" />
                          <span className="text-base font-bold text-white font-mono">
                            {item.dataVencimento || 'A definir'}
                          </span>
                        </div>
                        {item.dataEmissao && (
                          <span className="text-[11px] text-slate-500 font-mono block mt-1">
                            Emissão: {item.dataEmissao}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[11px] font-mono text-slate-400 uppercase block">
                          Valor do Título
                        </span>
                        <span className="text-xl font-bold text-emerald-400 font-mono tabular-nums mt-1 block">
                          {formatBRL(item.valor)}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-1">
                          Documento: {item.numeroDocumento}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] font-mono text-slate-400 uppercase block">
                          Cliente / Sacado
                        </span>
                        <span className="text-xs font-medium text-slate-200 mt-1 block">
                          {item.clienteNome || 'Artplan Comunicação'}
                        </span>
                        {item.filialNome && (
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Unidade: {item.filialNome}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Additional Notes / Campaign */}
                    {item.campanha && (
                      <div className="text-xs text-slate-400 flex items-center gap-2 pt-1">
                        <span className="text-slate-500">Campanha / Referência:</span>
                        <span className="text-slate-300 font-medium">{item.campanha}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Nenhum título encontrado</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Não encontramos títulos ou previsões com o termo informado (<strong>{searchInput}</strong>).
                Tente buscar apenas pelo número do CNPJ (com ou sem pontuação) ou pelo número do documento.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Initial Guidance when not searched yet */}
      {!hasSearched && (
        <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
          <p className="text-xs text-slate-400">
            Digite o CNPJ da sua empresa ou o número da Nota Fiscal acima para visualizar a previsão e se está no prazo ou em atraso.
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            Atualmente existem {titles.length} títulos cadastrados na base de previsão.
          </p>
        </div>
      )}
    </div>
  );
};
