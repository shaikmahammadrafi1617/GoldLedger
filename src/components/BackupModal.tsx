import React, { useState } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  X, 
  ShieldCheck, 
  Lock, 
  History, 
  Check, 
  Clock, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { Transaction, Agent, Investor, ActivityLog, OwnerSettings, Language } from '../types';
import { getT } from '../utils/translations';
import { getTodayDateString } from '../utils/formatters';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  agents: Agent[];
  investors: Investor[];
  logs: ActivityLog[];
  settings: OwnerSettings;
  language: Language;
  onRestoreData: (data: {
    transactions: Transaction[];
    agents: Agent[];
    investors: Investor[];
    logs: ActivityLog[];
    settings: OwnerSettings;
  }) => void;
  onUpdateSettings: (newSettings: OwnerSettings) => void;
  onResetToSampleData: () => Promise<void> | void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  transactions,
  agents,
  investors,
  logs,
  settings,
  language,
  onRestoreData,
  onUpdateSettings,
  onResetToSampleData,
}) => {
  const t = getT(language);
  const [activeTab, setActiveTab] = useState<'backup' | 'settings' | 'logs'>('backup');
  const [pinCode, setPinCode] = useState(settings.pinCode);
  const [securityLockEnabled, setSecurityLockEnabled] = useState(settings.securityLockEnabled);
  const [restoreStatus, setRestoreStatus] = useState<string>('');
  const [restoreError, setRestoreError] = useState<string>('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  if (!isOpen) return null;

  // Export JSON
  const handleDownloadJSON = () => {
    const backupObj = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      transactions,
      agents,
      investors,
      logs,
      settings,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `goldledger-backup-${getTodayDateString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.transactions && json.agents && json.investors) {
          onRestoreData(json);
          setRestoreStatus('Backup successfully restored!');
          setRestoreError('');
          setTimeout(() => setRestoreStatus(''), 4000);
        } else {
          setRestoreError('Invalid GoldLedger backup file format.');
          setTimeout(() => setRestoreError(''), 4000);
        }
      } catch (err) {
        setRestoreError('Error parsing JSON backup file.');
        setTimeout(() => setRestoreError(''), 4000);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      pinCode,
      securityLockEnabled,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 text-[#1E293B] rounded-xl max-w-xl w-full shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center font-bold border border-[#C5A059]/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1E293B] tracking-tight">
                Ledger Data, Security & Audit
              </h3>
              <p className="text-xs text-slate-500">
                Data persistence, offline safety, audit trails & security
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold px-4 pt-2">
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === 'backup'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Backup & Restore
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === 'logs'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Activity History ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === 'settings'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Security PIN
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-[#1E293B] text-sm flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#C5A059]" />
                  <span>Download Ledger Backup</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Save all transactions, agents, investors, and interest histories into an offline JSON backup file.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadJSON}
                  className="mt-2 px-4 py-2 rounded-lg font-bold bg-[#C5A059] hover:bg-[#b08e4d] text-white text-xs inline-flex items-center gap-1.5 transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON Backup</span>
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-[#1E293B] text-sm flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-sky-600" />
                  <span>Restore From File</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Upload a previously saved GoldLedger JSON file to restore your entire database.
                </p>
                <label className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs cursor-pointer transition shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select Backup File...</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {restoreError && (
                  <p className="text-xs text-rose-600 font-bold mt-1">
                    ⚠ {restoreError}
                  </p>
                )}
                {restoreStatus && (
                  <p className="text-xs text-emerald-700 font-bold mt-1">
                    ✓ {restoreStatus}
                  </p>
                )}
              </div>

              <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 space-y-3">
                <div>
                  <h4 className="font-bold text-rose-800 text-sm flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    <span>{language === 'te' ? 'అన్ని డేటాను తొలగించండి (మొత్తం క్లియర్)' : 'Clear All Data (Clean Slate)'}</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === 'te'
                      ? 'అన్ని లెక్కలు, ట్రాన్సాక్షన్లు మరియు లాగ్‌లను పూర్తిగా తొలగించి కొత్తగా ప్రారంభించండి.'
                      : 'Wipe all transactions, agents, and logs to start fresh with a clean zero-balance ledger.'}
                  </p>
                </div>

                {clearSuccess ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center space-x-1.5">
                    <span>✓ {language === 'te' ? 'డేటా అంతా పూర్తిగా తొలగించబడింది.' : 'All data cleared successfully. Starting fresh!'}</span>
                  </div>
                ) : showClearConfirm ? (
                  <div className="p-3.5 bg-rose-100/70 border border-rose-300 rounded-xl space-y-2.5">
                    <p className="text-xs font-bold text-rose-900 leading-snug">
                      {language === 'te'
                        ? '⚠️ మీరు ఖచ్చితంగా అన్ని లావాదేవీలు మరియు లెక్కల డేటాను పూర్తిగా తొలగించాలనుకుంటున్నారా? ఇది తిరిగి పొందలేరు.'
                        : '⚠️ Are you sure you want to permanently clear all deals, logs, and ledger data? This cannot be undone.'}
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        disabled={isClearing}
                        onClick={async () => {
                          setIsClearing(true);
                          try {
                            await onResetToSampleData();
                            setClearSuccess(true);
                            setTimeout(() => {
                              setClearSuccess(false);
                              setShowClearConfirm(false);
                              onClose();
                            }, 1500);
                          } catch (e) {
                            console.error('Error clearing data:', e);
                            alert('Failed to clear data');
                          } finally {
                            setIsClearing(false);
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-extrabold shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center space-x-1"
                      >
                        <RotateCcw className={`w-3 h-3 ${isClearing ? 'animate-spin' : ''}`} />
                        <span>{isClearing ? 'Clearing...' : (language === 'te' ? 'అవును, మొత్తం తొలగించు' : 'Yes, Wipe Everything')}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isClearing}
                        onClick={() => setShowClearConfirm(false)}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition"
                      >
                        {language === 'te' ? 'రద్దు చేయి' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="mt-1 px-4 py-2 rounded-lg font-bold bg-rose-600 hover:bg-rose-700 text-white text-xs transition active:scale-95 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'te' ? 'అన్ని డేటాను క్లియర్ చేయండి' : 'Clear All Data'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-500 text-xs uppercase tracking-wider">
                Audit Trail of Created, Edited & Settled Transactions
              </h4>
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.action === 'complete'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'create'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {log.action}
                        </span>
                        <span className="font-bold text-slate-900">{log.customerOrAgent || 'Ledger'}</span>
                      </div>
                      <p className="text-slate-600 mt-1">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#1E293B] text-sm block">Enable Security PIN Lock</span>
                    <span className="text-xs text-slate-500">Lock app upon startup or when lock button clicked</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securityLockEnabled}
                      onChange={(e) => setSecurityLockEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C5A059]"></div>
                  </label>
                </div>

                {securityLockEnabled && (
                  <div className="pt-3 border-t border-slate-200">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      4-Digit Owner PIN Code
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-center tracking-widest text-lg focus:border-[#C5A059] focus:outline-none shadow-2xs"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Default is 1234</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                {settingsSaved ? (
                  <p className="text-xs text-emerald-700 font-bold">
                    ✓ Settings saved successfully.
                  </p>
                ) : <span />}
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-bold bg-[#C5A059] hover:bg-[#b08e4d] text-white text-xs shadow-xs"
                >
                  Save Settings
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
