import React, { useState } from 'react';
import { 
  Calculator, 
  Lock, 
  Download, 
  Languages, 
  WifiOff, 
  Database,
  Coins,
  Cloud,
  CloudCheck,
  User as UserIcon,
  LogOut,
  Sparkles
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Language } from '../../types';

interface AndroidHeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenCalculator: () => void;
  onOpenBackup: () => void;
  onLockApp: () => void;
  isInstallable: boolean;
  onInstallApp: () => void;
  isOnline: boolean;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isSyncing: boolean;
}

export const AndroidHeader: React.FC<AndroidHeaderProps> = ({
  language,
  onLanguageChange,
  onOpenCalculator,
  onOpenBackup,
  onLockApp,
  isInstallable,
  onInstallApp,
  isOnline,
  user,
  onSignIn,
  onSignOut,
  isSyncing,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Brand & Identity */}
      <div className="flex items-center space-x-2">
        <div className="w-9 h-9 rounded-xl bg-[#1E293B] text-[#C5A059] flex items-center justify-center font-bold shadow-xs border border-slate-700 shrink-0">
          <Coins className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <h1 className="text-base font-extrabold text-[#1E293B] tracking-tight leading-none">
              GoldLedger
            </h1>
            <span className="text-[10px] uppercase font-bold bg-[#C5A059]/15 text-[#9a7836] px-1.5 py-0.2 rounded">
              Android
            </span>
          </div>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <p className="text-[10px] font-medium text-slate-500 leading-none">
              {language === 'te' ? 'గోల్డ్ లోన్ ట్రాన్స్‌ఫర్' : 'Gold Loan Transfers'}
            </p>
            {user ? (
              <span className="inline-flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                Firebase
              </span>
            ) : (
              <span className="inline-flex items-center text-[9px] font-semibold text-slate-400">
                • Local
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Controls */}
      <div className="flex items-center space-x-1">
        {!isOnline && (
          <div className="flex items-center space-x-1 bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-1 rounded-lg text-[10px] font-bold">
            <WifiOff className="w-3 h-3 text-amber-600" />
            <span className="hidden sm:inline">Offline</span>
          </div>
        )}

        {isInstallable && (
          <button
            type="button"
            onClick={onInstallApp}
            title="Install Android App"
            className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg text-[11px] font-bold transition shadow-xs"
          >
            <Download className="w-3 h-3" />
            <span>Install</span>
          </button>
        )}

        {/* Quick Calculator Button */}
        <button
          type="button"
          onClick={onOpenCalculator}
          title={language === 'te' ? 'క్యాలిక్యులేటర్' : 'Calculator'}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
        >
          <Calculator className="w-4 h-4 text-[#C5A059]" />
        </button>

        {/* Language Switcher */}
        <button
          type="button"
          onClick={() => onLanguageChange(language === 'en' ? 'te' : 'en')}
          title="Switch English / తెలుగు"
          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-[11px] transition flex items-center space-x-0.5"
        >
          <Languages className="w-3 h-3 text-slate-500" />
          <span>{language === 'en' ? 'తె' : 'EN'}</span>
        </button>

        {/* Firebase Cloud Sync / Auth Button */}
        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="p-1 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 transition flex items-center space-x-1"
              title={`Synced as ${user.displayName || user.email}`}
            >
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Avatar" 
                  className="w-5 h-5 rounded-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 text-xs space-y-2 animate-in fade-in-50 zoom-in-95">
                <div className="border-b border-slate-100 pb-2">
                  <div className="font-extrabold text-slate-800 truncate">
                    {user.displayName || 'Owner'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {user.email}
                  </div>
                  <div className="mt-1 flex items-center text-[10px] font-semibold text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                    Firebase Firestore Connected
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onSignOut();
                  }}
                  className="w-full py-1.5 px-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold flex items-center space-x-1.5 transition text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 shadow-xs transition active:scale-95"
            title="Sign in with Google to sync to Firebase Cloud"
          >
            <Cloud className="w-3 h-3" />
            <span>Sync</span>
          </button>
        )}

        {/* Backup / Settings */}
        <button
          type="button"
          onClick={onOpenBackup}
          title="Backup & Settings"
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition"
        >
          <Database className="w-4 h-4" />
        </button>

        {/* PIN Lock */}
        <button
          type="button"
          onClick={onLockApp}
          title="Lock App"
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
