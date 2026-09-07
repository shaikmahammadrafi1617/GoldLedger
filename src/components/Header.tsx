import React from 'react';
import { 
  Menu, 
  Plus, 
  Calculator, 
  Database, 
  Lock, 
  Languages, 
  Coins 
} from 'lucide-react';
import { Language, OwnerSettings } from '../types';
import { getT } from '../utils/translations';

export interface HeaderProps {
  currentTab?: string;
  activeTab?: string;
  setCurrentTab?: (tab: string) => void;
  onTabChange?: (tab: string) => void;
  language: Language;
  setLanguage?: (lang: Language) => void;
  onLanguageChange?: (lang: Language) => void;
  onNewTransaction?: () => void;
  onOpenCalculator: () => void;
  onLockApp: () => void;
  onOpenBackup: () => void;
  settings?: OwnerSettings;
  isOnline?: boolean;
  activeCount?: number;
  activeTransactionsCount?: number;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  activeTab,
  language,
  setLanguage,
  onLanguageChange,
  onNewTransaction,
  onOpenCalculator,
  onLockApp,
  onOpenBackup,
  settings,
  isOnline = true,
  onToggleMobileMenu,
}) => {
  const t = getT(language);
  const tab = activeTab || currentTab || 'dashboard';

  const getTabTitle = (tabId: string) => {
    switch (tabId) {
      case 'dashboard':
        return 'September 2026 Dashboard';
      case 'transactions':
        return t.transactions + ' Ledger';
      case 'calendar':
        return 'Calendar & Daily Closings';
      case 'agents':
        return 'Field Agent Ledgers';
      case 'investors':
        return 'Investor Capital & Settlements';
      case 'reports':
        return 'Financial Reports & Analytics';
      default:
        return 'GoldLedger Dashboard';
    }
  };

  const handleLanguageToggle = () => {
    const next = language === 'en' ? 'te' : 'en';
    if (onLanguageChange) onLanguageChange(next);
    else if (setLanguage) setLanguage(next);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm shrink-0 z-10 select-none">
      {/* Left side: Mobile menu toggle + Dynamic Section Title + Owner */}
      <div className="flex items-center gap-3 sm:gap-4">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
            {getTabTitle(tab)}
          </h1>
          <div className="hidden sm:block h-4 w-[1px] bg-slate-200"></div>
          <span className="hidden sm:inline-block text-slate-500 text-xs sm:text-sm font-medium">
            Owner: Satya Narayana
          </span>
        </div>
      </div>

      {/* Right side: Cloud status, Quick actions, New Transaction, SN Avatar */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Cloud Status indicator matching Geometric Balance */}
        <div className="hidden md:flex flex-col items-end">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none mb-0.5">
            Cloud Status
          </span>
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {isOnline ? 'Synced • 100% Offline Ready' : 'Local Mode • Offline Ready'}
          </span>
        </div>

        {/* Quick Calculator Shortcut */}
        <button
          id="header-quick-calc-btn"
          onClick={onOpenCalculator}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
          title={t.calculator}
        >
          <Calculator className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>{t.calculator}</span>
        </button>

        {/* Language switch on mobile/tablet */}
        <button
          onClick={handleLanguageToggle}
          className="sm:hidden p-2 rounded-lg text-xs font-semibold border border-slate-200 bg-slate-50 text-[#C5A059]"
          title="Toggle Language"
        >
          <Languages className="w-4 h-4" />
        </button>

        {/* Primary "+ New Transaction" Button */}
        {onNewTransaction && (
          <button
            id="new-tx-header-btn"
            onClick={onNewTransaction}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold bg-[#C5A059] hover:bg-[#b38e4a] text-white shadow-sm shadow-[#C5A059]/20 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t.newTransaction}</span>
          </button>
        )}

        {/* Owner Profile Avatar SN */}
        <div 
          className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shadow-xs"
          title="Owner: Satya Narayana"
        >
          <span>SN</span>
        </div>
      </div>
    </header>
  );
};
