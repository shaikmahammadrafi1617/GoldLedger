import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  CalendarDays, 
  Users, 
  Landmark, 
  FileSpreadsheet, 
  Calculator, 
  Database, 
  Lock, 
  X,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Language, OwnerSettings } from '../types';
import { getT } from '../utils/translations';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenCalculator: () => void;
  onOpenBackup: () => void;
  onLockApp: () => void;
  settings: OwnerSettings;
  isOnline: boolean;
  activeCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  language,
  onLanguageChange,
  onOpenCalculator,
  onOpenBackup,
  onLockApp,
  settings,
  isOnline,
  activeCount,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const t = getT(language);

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { 
      id: 'transactions', 
      label: t.transactions, 
      icon: Receipt,
      badge: activeCount > 0 ? activeCount : undefined 
    },
    { id: 'calendar', label: t.calendar, icon: CalendarDays },
    { id: 'agents', label: t.agents, icon: Users },
    { id: 'investors', label: t.investors, icon: Landmark },
    { id: 'reports', label: t.reports, icon: FileSpreadsheet },
  ];

  const content = (
    <div className="w-64 bg-[#1E293B] text-slate-100 flex flex-col h-full border-r border-slate-700/50 select-none">
      {/* Brand Header */}
      <div className="p-5 sm:p-6 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C5A059] rounded-lg flex items-center justify-center shadow-lg shadow-[#C5A059]/20">
            <span className="text-white font-bold text-xl tracking-tight">G</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold tracking-tight text-base leading-tight">GoldLedger</span>
            <span className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold mt-0.5">Owner-Only MVP</span>
          </div>
        </div>

        {/* Close button on mobile drawer */}
        {isOpenMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3.5 sm:p-4 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => {
                onTabChange(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full p-2.5 sm:p-3 rounded-md flex items-center justify-between text-sm font-medium transition text-left ${
                isActive
                  ? 'bg-white/10 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#C5A059]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C5A059] text-slate-950">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick Tools Section */}
        <div className="pt-4 mt-3 border-t border-slate-700/50">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-3 mb-2">
            Owner Tools
          </div>
          <button
            id="sidebar-calc-btn"
            onClick={() => {
              onOpenCalculator();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full p-2.5 rounded-md flex items-center gap-3 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition"
          >
            <Calculator className="w-4 h-4 text-[#C5A059]" />
            <span>{t.calculator}</span>
          </button>
          <button
            id="sidebar-backup-btn"
            onClick={() => {
              onOpenBackup();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full p-2.5 rounded-md flex items-center gap-3 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition"
          >
            <Database className="w-4 h-4 text-sky-400" />
            <span>Backup & Audit</span>
          </button>
          {settings.securityLockEnabled && (
            <button
              id="sidebar-lock-btn"
              onClick={() => {
                onLockApp();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full p-2.5 rounded-md flex items-center gap-3 text-xs text-rose-300 hover:bg-white/5 hover:text-rose-200 transition"
            >
              <Lock className="w-4 h-4 text-rose-400" />
              <span>{t.lockApp}</span>
            </button>
          )}
        </div>
      </nav>

      {/* Language & Cloud Sync Section */}
      <div className="p-5 border-t border-slate-700/50 bg-black/10">
        <div className="flex flex-col gap-2.5">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Language</div>
          <div className="flex items-center gap-3">
            <span
              onClick={() => onLanguageChange('en')}
              className={`text-xs cursor-pointer transition ${
                language === 'en'
                  ? 'text-[#C5A059] font-bold underline underline-offset-4'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              English
            </span>
            <span className="text-slate-600 text-xs">•</span>
            <span
              onClick={() => onLanguageChange('te')}
              className={`text-xs cursor-pointer transition ${
                language === 'te'
                  ? 'text-[#C5A059] font-bold underline underline-offset-4'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              తెలుగు
            </span>
          </div>

          <div className="mt-1 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Offline DB:</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {isOnline ? 'Synced' : 'Saved locally'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col h-screen shrink-0 z-20">
        {content}
      </aside>

      {/* Mobile Slideout Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#1E293B] shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
