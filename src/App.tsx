import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  Transaction, 
  Agent, 
  Investor, 
  InvestorContribution,
  ActivityLog, 
  OwnerSettings, 
  Language 
} from './types';
import { 
  initialTransactions, 
  initialAgents, 
  initialInvestors, 
  initialLogs, 
  initialSettings 
} from './data/initialData';
import { getTodayDateString, calculateDurationDays, calculateFinancials, formatINR, formatDateReadable } from './utils/formatters';

// Firebase
import { auth, signInWithGoogle, logOut } from './firebase';
import { 
  subscribeToUserData, 
  saveTransactionToFirestore, 
  deleteTransactionFromFirestore,
  clearAllUserDataFromFirestore,
  saveAgentToFirestore, 
  saveInvestorToFirestore, 
  saveLogToFirestore, 
  saveSettingsToFirestore 
} from './services/firestoreService';

// Android Components
import { AndroidHeader } from './components/android/AndroidHeader';
import { AndroidBottomNav } from './components/android/AndroidBottomNav';
import { NewDealTab } from './components/android/NewDealTab';
import { ActiveDealsTab } from './components/android/ActiveDealsTab';
import { CalendarTab } from './components/android/CalendarTab';
import { SettleAndCallDayTab } from './components/android/SettleAndCallDayTab';
import { DayDoneTab } from './components/android/DayDoneTab';
import { AndroidCalculatorModal } from './components/android/AndroidCalculatorModal';
import { AuthScreen } from './components/android/AuthScreen';

// Modals
import { SecurityLockModal } from './components/SecurityLockModal';
import { BackupModal } from './components/BackupModal';
import { Toast, ToastMessage } from './components/Toast';
import { usePWAInstall } from './utils/usePWAInstall';
import { Cloud, CheckCircle2, ShieldAlert } from 'lucide-react';

const STORAGE_KEY_TRANSACTIONS = 'goldledger_transactions_v2';
const STORAGE_KEY_AGENTS = 'goldledger_agents_v2';
const STORAGE_KEY_INVESTORS = 'goldledger_investors_v2';
const STORAGE_KEY_LOGS = 'goldledger_logs_v2';
const STORAGE_KEY_SETTINGS = 'goldledger_settings_v2';
const STORAGE_KEY_LANG = 'goldledger_lang_v2';

export function App() {
  // PWA Install state
  const { isInstallable, install: installPWA } = usePWAInstall();

  // Firebase Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [guestMode, setGuestMode] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Clean initialization: NO DEMO DATA
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      // Clear old v1 demo keys if present
      localStorage.removeItem('goldledger_transactions_v1');
      const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isDemo = Array.isArray(parsed) && parsed.some(t => t.id?.startsWith('tx-10') || t.customerName === 'K. Satyanarayana');
        if (isDemo) {
          localStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
          return [];
        }
        return parsed;
      }
      return initialTransactions;
    } catch {
      return [];
    }
  });

  const [agents, setAgents] = useState<Agent[]>(() => {
    try {
      localStorage.removeItem('goldledger_agents_v1');
      const saved = localStorage.getItem(STORAGE_KEY_AGENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isDemo = Array.isArray(parsed) && parsed.some(a => a.id === 'agent-1');
        if (isDemo) return [];
        return parsed;
      }
      return initialAgents;
    } catch {
      return [];
    }
  });

  const [investors, setInvestors] = useState<Investor[]>(() => {
    try {
      localStorage.removeItem('goldledger_investors_v1');
      const saved = localStorage.getItem(STORAGE_KEY_INVESTORS);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isDemo = Array.isArray(parsed) && parsed.some(i => i.id === 'inv-1');
        if (isDemo) return [];
        return parsed;
      }
      return initialInvestors;
    } catch {
      return [];
    }
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    try {
      localStorage.removeItem('goldledger_logs_v1');
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isDemo = Array.isArray(parsed) && parsed.some(l => l.id === 'log-1');
        if (isDemo) return [];
        return parsed;
      }
      return initialLogs;
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<OwnerSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? JSON.parse(saved) : initialSettings;
    } catch {
      return initialSettings;
    }
  });

  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      return saved === 'te' ? 'te' : 'en';
    } catch {
      return 'en';
    }
  });

  // Current Android Tab
  const [currentTab, setCurrentTab] = useState<string>('new-deal');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Selected Deal for Settle Tab
  const [dealToSettle, setDealToSettle] = useState<Transaction | null>(null);

  // Modals state
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Prefill state for new deal
  const [prefillTxData, setPrefillTxData] = useState<Partial<Transaction> | null>(null);

  // Phone Frame toggle on desktop
  const [usePhoneFrame, setUsePhoneFrame] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Firebase Auth state listener (keeps user logged in on device until sign out)
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
    });
    return () => unsubAuth();
  }, []);

  // Subscribe to real-time Firestore database when logged in
  useEffect(() => {
    if (!user) return;
    setIsSyncing(true);

    const unsubData = subscribeToUserData(user.uid, {
      onTransactions: (serverTxs) => {
        setTransactions(serverTxs);
        setIsSyncing(false);
      },
      onAgents: (serverAgents) => {
        setAgents(serverAgents);
      },
      onInvestors: (serverInvestors) => {
        setInvestors(serverInvestors);
      },
      onLogs: (serverLogs) => {
        setLogs(serverLogs);
      },
      onSettings: (serverSettings) => {
        if (serverSettings) setSettings(serverSettings);
      },
    });

    return () => unsubData();
  }, [user?.uid]);

  // Sync state changes to localStorage as offline cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to persist transactions', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(agents));
    } catch (e) {
      console.error('Failed to persist agents', e);
    }
  }, [agents]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INVESTORS, JSON.stringify(investors));
    } catch (e) {
      console.error('Failed to persist investors', e);
    }
  }, [investors]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to persist logs', e);
    }
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to persist settings', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, language);
    } catch (e) {
      console.error('Failed to persist language', e);
    }
  }, [language]);

  // Auth Actions
  const handleSignIn = () => {
    setGuestMode(false);
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setUser(null);
      setGuestMode(false);
      setToast({
        id: 'toast-' + Date.now(),
        type: 'info',
        title: language === 'te' ? 'లాగౌట్ అయ్యారు' : 'Signed Out',
        message: language === 'te' 
          ? 'పరికరంలో ఖాతా నుండి విజయవంతంగా లాగౌట్ అయ్యారు.' 
          : 'You have been signed out from this device.',
      });
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // Helper to add audit activity log
  const addLog = async (action: ActivityLog['action'], details: string, customerOrAgent?: string) => {
    const newLog: ActivityLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
      action,
      details,
      customerOrAgent: customerOrAgent || '',
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    if (user) {
      try {
        await saveLogToFirestore(user.uid, newLog);
      } catch (err) {
        console.warn('Failed to sync log to Firestore:', err);
      }
    }
  };

  // Create new transaction from NewDealTab
  const handleSaveTransaction = async (txData: Partial<Transaction>) => {
    const newId = 'tx_' + Date.now();
    const dealLabel = txData.customerName || (txData.notes ? txData.notes : `Deal ${formatINR(txData.principal || 100000)}`);
    const newTx: Transaction = {
      id: newId,
      customerName: dealLabel,
      customerPhone: '',
      releaseBank: '',
      targetBank: '',
      agentId: txData.agentId || '',
      agentName: txData.agentName || '',
      principal: txData.principal || 100000,
      givenDate: txData.givenDate || getTodayDateString(),
      customerRatePerLakh: txData.customerRatePerLakh || 100,
      ratePeriod: txData.ratePeriod || 'per_day',
      status: 'active',
      enableProfitSharing: !!txData.enableProfitSharing,
      agentCommissionRatePerLakh: txData.agentCommissionRatePerLakh || 0,
      investors: txData.investors || [],
      notes: txData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);

    if (user) {
      try {
        await saveTransactionToFirestore(user.uid, newTx);
      } catch (err) {
        console.error('Failed to sync transaction to Firestore:', err);
      }
    }

    await addLog(
      'create',
      `Transferred principal ${formatINR(newTx.principal)} for balance transfer deal`,
      dealLabel
    );
  };

  // From Active Deals tab -> select deal to settle
  const handleSelectDealToSettle = (tx: Transaction) => {
    setDealToSettle(tx);
    setCurrentTab('settle');
  };

  // Complete deal & "Call the Day"
  const handleCompleteDealAndCallDay = async ({
    txId,
    actualMoneyReceived,
    finalOwnerProfit,
    investorSettled,
    agentSettled,
    investors: updatedInvestors,
    agentName: updatedAgentName,
    agentCommissionRatePerLakh: updatedAgentRate,
    finalInvestorShare: updatedInvestorShare,
    finalAgentCommission: updatedAgentComm,
  }: {
    txId: string;
    actualMoneyReceived: number;
    finalOwnerProfit: number;
    investorSettled: boolean;
    agentSettled: boolean;
    investors?: InvestorContribution[];
    agentName?: string;
    agentCommissionRatePerLakh?: number;
    finalInvestorShare?: number;
    finalAgentCommission?: number;
  }) => {
    const today = getTodayDateString();
    let updatedTx: Transaction | null = null;

    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id !== txId) return t;

        const durationDays = calculateDurationDays(t.givenDate, today);
        const financials = calculateFinancials(t, durationDays);

        const chosenInvestors = updatedInvestors !== undefined ? updatedInvestors : t.investors;
        const chosenAgentName = updatedAgentName !== undefined ? updatedAgentName : t.agentName;
        const chosenAgentRate = updatedAgentRate !== undefined ? updatedAgentRate : (t.agentCommissionRatePerLakh || 0);
        const chosenInvestorShare = updatedInvestorShare !== undefined ? updatedInvestorShare : financials.investorTotalShare;
        const chosenAgentComm = updatedAgentComm !== undefined ? updatedAgentComm : financials.agentCommission;

        updatedTx = {
          ...t,
          status: 'completed',
          returnDate: today,
          durationDays,
          actualMoneyReceived,
          finalGrossInterest: actualMoneyReceived - t.principal,
          finalOwnerProfit,
          finalAgentCommission: chosenAgentComm,
          finalInvestorShare: chosenInvestorShare,
          agentName: chosenAgentName || '',
          agentCommissionRatePerLakh: chosenAgentRate,
          agentCommissionSettled: agentSettled,
          enableProfitSharing: Boolean(chosenAgentName || (chosenInvestors && chosenInvestors.length > 0)),
          investors: chosenInvestors.map((inv) => ({
            ...inv,
            settled: investorSettled,
            settledDate: today,
          })),
          updatedAt: new Date().toISOString(),
        };
        return updatedTx;
      })
    );

    if (user && updatedTx) {
      try {
        await saveTransactionToFirestore(user.uid, updatedTx);
      } catch (err) {
        console.error('Failed to update completed transaction in Firestore:', err);
      }
    }

    await addLog(
      'complete',
      `Settled and called the day! Received ₹${actualMoneyReceived.toLocaleString('en-IN')}, Owner Profit: ₹${finalOwnerProfit.toLocaleString('en-IN')}`,
      dealToSettle?.customerName || 'Deal'
    );
    setDealToSettle(null);
  };

  // Delete single deal
  const handleDeleteDeal = async (txId: string) => {
    const target = transactions.find((t) => t.id === txId);
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
    if (dealToSettle?.id === txId) {
      setDealToSettle(null);
    }
    if (user) {
      try {
        await deleteTransactionFromFirestore(user.uid, txId);
      } catch (err) {
        console.error('Failed to delete transaction from Firestore:', err);
      }
    }
    if (target) {
      await addLog(
        'delete',
        `Deleted deal ${target.customerName || 'Deal'} (${formatINR(target.principal)})`,
        target.customerName || 'Deal'
      );
    }
    setToast({
      id: Date.now().toString(),
      type: 'info',
      message: language === 'te' 
        ? `${target?.customerName || 'డీల్'} రికార్డు తొలగించబడింది` 
        : `Deleted ${target?.customerName || 'deal'} (${formatINR(target?.principal || 0)})`,
    });
  };

  // Clear all data (Clean slate)
  const handleClearAllData = async () => {
    setTransactions([]);
    setAgents([]);
    setInvestors([]);
    setLogs([]);
    setSettings(initialSettings);
    setDealToSettle(null);
    localStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEY_AGENTS);
    localStorage.removeItem(STORAGE_KEY_INVESTORS);
    localStorage.removeItem(STORAGE_KEY_LOGS);

    if (user) {
      setIsSyncing(true);
      try {
        await clearAllUserDataFromFirestore(user.uid);
      } catch (err) {
        console.error('Failed to clear user data from Firestore:', err);
      } finally {
        setIsSyncing(false);
      }
    }

    setToast({
      id: Date.now().toString(),
      type: 'success',
      message: language === 'te' 
        ? 'లెడ్జర్ డేటా అంతా పూర్తిగా క్లియర్ చేయబడింది.' 
        : 'All ledger data cleared successfully. Clean slate ready!',
    });
  };

  // Active Deals count for badge
  const activeCount = transactions.filter((t) => t.status === 'active').length;

  // 1. Checking persistent device session
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center select-none p-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#C5A059] to-[#8C6D2D] p-0.5 shadow-2xl flex items-center justify-center animate-pulse">
            <div className="w-full h-full bg-[#1E293B] rounded-[22px] flex items-center justify-center">
              <span className="font-serif font-black text-2xl text-[#C5A059]">₹</span>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-white tracking-tight">GoldLedger</h1>
            <p className="text-xs text-[#C5A059] font-medium">
              {language === 'te' ? 'సెషన్ తనిఖీ చేస్తోంది...' : 'Restoring secure device session...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Start the app with login or registration on first use (device persists until logout)
  if (!user && !guestMode) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start sm:py-4 select-none">
        <div className={`w-full ${usePhoneFrame ? 'max-w-md sm:rounded-[40px] sm:border-[8px] sm:border-slate-800 sm:shadow-2xl' : 'max-w-xl'} bg-slate-900 h-[100dvh] max-h-[100dvh] sm:h-[92vh] sm:max-h-[92vh] flex flex-col relative overflow-hidden transition-all duration-300 shadow-2xl`}>
          <AuthScreen
            language={language}
            onLanguageChange={setLanguage}
            onSuccess={(authenticatedUser) => {
              setUser(authenticatedUser);
              setToast({
                id: 'toast-' + Date.now(),
                type: 'success',
                title: language === 'te' ? 'లాగిన్ విజయవంతమైంది' : 'Welcome to GoldLedger',
                message: language === 'te' 
                  ? `స్వాగతం, ${authenticatedUser.displayName || authenticatedUser.email}` 
                  : `Signed in as ${authenticatedUser.displayName || authenticatedUser.email}`,
              });
            }}
            onSkipOffline={() => setGuestMode(true)}
          />
        </div>
        {/* Floating toggle for desktop preview */}
        <div className="hidden sm:flex items-center space-x-2 mt-2 text-xs text-slate-400">
          <span>GoldLedger Secure Auth</span>
          <span>•</span>
          <button
            type="button"
            onClick={() => setUsePhoneFrame(!usePhoneFrame)}
            className="hover:text-slate-200 text-[#C5A059] font-semibold underline cursor-pointer"
          >
            {usePhoneFrame ? 'Expand Width' : 'Phone Frame View'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-start sm:py-4 select-none">
      {/* Frame Container: Centered Android device frame on desktop, 100% full screen on mobile */}
      <div className={`w-full ${usePhoneFrame ? 'max-w-md sm:rounded-[40px] sm:border-[8px] sm:border-slate-800 sm:shadow-2xl' : 'max-w-xl'} bg-slate-100 h-[100dvh] max-h-[100dvh] sm:h-[92vh] sm:max-h-[92vh] flex flex-col relative overflow-hidden transition-all duration-300 shadow-xl`}>
        {/* Android Top Header */}
        <AndroidHeader
          language={language}
          onLanguageChange={setLanguage}
          onOpenCalculator={() => setIsCalcOpen(true)}
          onOpenBackup={() => setIsBackupOpen(true)}
          onLockApp={() => setIsLocked(true)}
          isInstallable={isInstallable}
          onInstallApp={installPWA}
          isOnline={isOnline}
          user={user}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          isSyncing={isSyncing}
        />

        {/* Cloud Sync Status Banner if in guest mode */}
        {!user && guestMode && (
          <div className="bg-amber-500/10 border-b border-amber-200/60 px-4 py-2 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center space-x-1.5 text-amber-900 font-semibold">
              <Cloud className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                {language === 'te' 
                  ? 'ఆఫ్‌లైన్ గెస్ట్ మోడ్. క్లౌడ్ సింక్ కోసం లాగిన్ అవ్వండి.' 
                  : 'Offline Guest Mode. Log in to sync to Firebase Cloud.'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignIn}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shadow-xs active:scale-95 transition cursor-pointer"
            >
              {language === 'te' ? 'లాగిన్' : 'Login'}
            </button>
          </div>
        )}

        {authError && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs text-rose-700 font-semibold flex items-center justify-between shrink-0">
            <span>{authError}</span>
            <button 
              type="button" 
              onClick={() => setAuthError(null)}
              className="text-rose-900 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Android Main App Scroll View */}
        <main className="flex-1 overflow-y-auto overscroll-contain relative bg-slate-100 pb-2">
          {currentTab === 'new-deal' && (
            <NewDealTab
              onSaveTransaction={handleSaveTransaction}
              agents={agents}
              investors={investors}
              language={language}
              onViewActive={() => setCurrentTab('active')}
              prefillData={prefillTxData}
            />
          )}

          {currentTab === 'active' && (
            <ActiveDealsTab
              transactions={transactions}
              onSelectDealToSettle={handleSelectDealToSettle}
              onNewDeal={() => setCurrentTab('new-deal')}
              onDeleteDeal={handleDeleteDeal}
              language={language}
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarTab
              transactions={transactions}
              language={language}
              onEnterDealForDate={(dateStr) => {
                setPrefillTxData({ givenDate: dateStr });
                setCurrentTab('new-deal');
              }}
              onSelectDealToSettle={(tx) => {
                handleSelectDealToSettle(tx);
              }}
              onSaveQuickPastDeal={async (tx) => {
                await handleSaveTransaction(tx);
                setToast({
                  id: 'toast-' + Date.now(),
                  type: 'success',
                  title: language === 'te' ? 'గత తేదీ లెక్క సేవ్ చేయబడింది' : 'Past Deal Saved',
                  message: language === 'te' 
                    ? `ఈ లెక్క రికార్డులలో చేర్చబడింది.` 
                    : `Deal for ${formatDateReadable(tx.givenDate)} saved to ledger.`,
                });
              }}
            />
          )}

          {currentTab === 'settle' && (
            <SettleAndCallDayTab
              activeDeals={transactions.filter((t) => t.status === 'active')}
              selectedDeal={dealToSettle}
              onSelectDeal={setDealToSettle}
              onCompleteDealAndCallDay={handleCompleteDealAndCallDay}
              language={language}
              onGoToHistory={() => setCurrentTab('day-done')}
              agents={agents}
              investors={investors}
            />
          )}

          {currentTab === 'day-done' && (
            <DayDoneTab
              transactions={transactions}
              language={language}
              onOpenBackup={() => setIsBackupOpen(true)}
              onDeleteDeal={handleDeleteDeal}
              onClearAllData={handleClearAllData}
            />
          )}
        </main>

        {/* Android Sticky Bottom Navigation */}
        <div className="sticky bottom-0 z-40 bg-white border-t border-slate-200 shrink-0 w-full shadow-lg">
          <AndroidBottomNav
            activeTab={currentTab}
            onTabChange={(tab) => {
              // Clear prefill if user navigates away
              if (tab !== 'new-deal') {
                setPrefillTxData(null);
              }
              setCurrentTab(tab);
            }}
            activeCount={activeCount}
            language={language}
          />
          {/* Android Gesture Navigation Bar Pill */}
          <div className="py-1 flex items-center justify-center bg-white">
            <div className="w-28 h-1 bg-slate-300 rounded-full" />
          </div>
        </div>
      </div>

      {/* Floating frame switch for preview convenience */}
      <div className="hidden sm:flex items-center space-x-2 mt-2 text-xs text-slate-400">
        <span>Android App Preview Mode</span>
        <span>•</span>
        <button
          type="button"
          onClick={() => setUsePhoneFrame(!usePhoneFrame)}
          className="hover:text-slate-200 text-[#C5A059] font-semibold underline"
        >
          {usePhoneFrame ? 'Expand Width' : 'Phone Frame View'}
        </button>
      </div>

      {/* Android Mobile Calculator Modal */}
      <AndroidCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        language={language}
        onUseAmount={(amount) => {
          setPrefillTxData({ principal: amount });
          setCurrentTab('new-deal');
        }}
      />

      {/* Backup, Audit & Settings Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        transactions={transactions}
        agents={agents}
        investors={investors}
        logs={logs}
        settings={settings}
        language={language}
        onRestoreData={async (data) => {
          setTransactions(data.transactions);
          setAgents(data.agents);
          setInvestors(data.investors);
          if (data.logs) setLogs(data.logs);
          if (data.settings) setSettings(data.settings);

          if (user) {
            for (const tx of data.transactions) {
              await saveTransactionToFirestore(user.uid, tx);
            }
            for (const ag of data.agents) {
              await saveAgentToFirestore(user.uid, ag);
            }
            for (const inv of data.investors) {
              await saveInvestorToFirestore(user.uid, inv);
            }
          }
        }}
        onUpdateSettings={async (newSettings) => {
          setSettings(newSettings);
          if (user) {
            await saveSettingsToFirestore(user.uid, newSettings);
          }
        }}
        onResetToSampleData={handleClearAllData}
      />

      {/* Security PIN Lock Screen */}
      <SecurityLockModal
        isLocked={isLocked}
        onUnlock={() => setIsLocked(false)}
        settings={settings}
        language={language}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default App;
