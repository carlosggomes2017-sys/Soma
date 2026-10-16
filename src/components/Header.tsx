import React from 'react';
import { CalendarCheck, Lock, Unlock, Search, UploadCloud } from 'lucide-react';

interface HeaderProps {
  currentTab: 'consulta' | 'tesouraria';
  setCurrentTab: (tab: 'consulta' | 'tesouraria') => void;
  isTreasuryAuthorized: boolean;
  setIsTreasuryAuthorized: (auth: boolean) => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  isTreasuryAuthorized,
  setIsTreasuryAuthorized,
  onOpenAuthModal,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Wordmark */}
        <div
          onClick={() => setCurrentTab('consulta')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              Previsão de Pagamentos
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setCurrentTab('consulta')}
            className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'consulta'
                ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Consultar Pagamentos</span>
          </button>

          {isTreasuryAuthorized && (
            <button
              type="button"
              onClick={() => setCurrentTab('tesouraria')}
              className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'tesouraria'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Importar Planilhas (Tesouraria)</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Treasury Login / Exit Action */}
        <div className="flex items-center gap-3 shrink-0">
          {isTreasuryAuthorized ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-400 font-mono hidden sm:inline">
                Acesso Tesouraria Ativo
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsTreasuryAuthorized(false);
                  setCurrentTab('consulta');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sair</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Acesso à Tesouraria</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
