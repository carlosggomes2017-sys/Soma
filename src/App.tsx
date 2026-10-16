import React, { useState, useEffect } from 'react';
import { TitleRecord } from './types';
import { parseRelTitulosAPagar } from './utils/spreadsheetParser';
import { DEFAULT_RAW_CSV } from './data/initialCsv';
import { Header } from './components/Header';
import { PublicQueryView } from './components/PublicQueryView';
import { TreasuryImportView } from './components/TreasuryImportView';
import { TreasuryAuthModal } from './components/TreasuryAuthModal';
import { CalendarCheck } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'consulta' | 'tesouraria'>('consulta');
  const [isTreasuryAuthorized, setIsTreasuryAuthorized] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Initialize titles from localStorage or the default Artplan CSV
  const [titles, setTitles] = useState<TitleRecord[]>(() => {
    try {
      const saved = localStorage.getItem('portalpay_titulos_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return parseRelTitulosAPagar(DEFAULT_RAW_CSV);
  });

  // Save to localStorage whenever titles change
  useEffect(() => {
    try {
      localStorage.setItem('portalpay_titulos_db', JSON.stringify(titles));
    } catch {
      // Ignore storage errors in sandbox
    }
  }, [titles]);

  const handleImportTitles = (newTitles: TitleRecord[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setTitles(newTitles);
    } else {
      setTitles((prev) => [...newTitles, ...prev]);
    }
  };

  const handleClearTitles = () => {
    setTitles([]);
  };

  const handleRestoreDefault = () => {
    const defaultParsed = parseRelTitulosAPagar(DEFAULT_RAW_CSV);
    setTitles(defaultParsed);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isTreasuryAuthorized={isTreasuryAuthorized}
        setIsTreasuryAuthorized={setIsTreasuryAuthorized}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-6">
        {currentTab === 'consulta' && (
          <PublicQueryView titles={titles} />
        )}

        {currentTab === 'tesouraria' && isTreasuryAuthorized && (
          <TreasuryImportView
            titles={titles}
            onImportTitles={handleImportTitles}
            onClearTitles={handleClearTitles}
            onRestoreDefault={handleRestoreDefault}
          />
        )}
      </main>

      {/* Treasury Auth Modal */}
      <TreasuryAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsTreasuryAuthorized(true);
          setCurrentTab('tesouraria');
        }}
      />

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-400 font-semibold">Portal de Previsão de Pagamentos</span>
            <span>· Consulta e Controle de Títulos a Pagar</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Base atualizada com {titles.length} registros</span>
            <span>© 2026. Todos os direitos reservados.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
