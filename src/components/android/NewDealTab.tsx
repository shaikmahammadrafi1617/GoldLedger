import React, { useState, useMemo, useEffect } from 'react';
import { 
  Send, 
  Percent, 
  ArrowRight,
  CheckCircle2,
  Coins, 
  TrendingUp,
  Clock,
  Calendar,
  AlertTriangle,
  CalendarDays
} from 'lucide-react';
import { Transaction, Agent, Investor, Language } from '../../types';
import { 
  formatINR, 
  formatNumberWithCommas, 
  getTodayDateString,
  formatDateReadable,
  getPastDateString,
  getRelativeDaysLabel,
  calculateDurationDays
} from '../../utils/formatters';

interface NewDealTabProps {
  onSaveTransaction: (tx: Partial<Transaction>) => void;
  agents: Agent[];
  investors: Investor[];
  language: Language;
  onViewActive: () => void;
  prefillData?: Partial<Transaction> | null;
}

export const NewDealTab: React.FC<NewDealTabProps> = ({
  onSaveTransaction,
  language,
  onViewActive,
  prefillData,
}) => {
  // Deal Start Date (default today or prefilled from Calendar)
  const [dealDate, setDealDate] = useState<string>(prefillData?.givenDate || getTodayDateString());

  // Principal Amount - completely empty by default (no numbers shown in input field)
  const [principal, setPrincipal] = useState<number>(prefillData?.principal || 0);
  const [principalStr, setPrincipalStr] = useState<string>(
    prefillData?.principal ? formatNumberWithCommas(prefillData.principal) : ''
  );
  
  // Rate per Lakh - completely empty by default (no numbers shown in input field)
  const [customerRatePerLakh, setCustomerRatePerLakh] = useState<number>(
    prefillData?.customerRatePerLakh || 0
  );
  const [customerRateStr, setCustomerRateStr] = useState<string>(
    prefillData?.customerRatePerLakh ? String(prefillData.customerRatePerLakh) : ''
  );
  const ratePeriod: 'per_day' = 'per_day';

  // React to prefillData changes (e.g. user clicked "+ Enter Deal for Date" in Calendar)
  useEffect(() => {
    if (prefillData?.givenDate) {
      setDealDate(prefillData.givenDate);
    }
    if (prefillData?.principal !== undefined && prefillData.principal > 0) {
      setPrincipal(prefillData.principal);
      setPrincipalStr(formatNumberWithCommas(prefillData.principal));
    }
    if (prefillData?.customerRatePerLakh !== undefined && prefillData.customerRatePerLakh > 0) {
      setCustomerRatePerLakh(prefillData.customerRatePerLakh);
      setCustomerRateStr(formatNumberWithCommas(prefillData.customerRatePerLakh));
    }
  }, [prefillData]);

  // Success Feedback
  const [justCreatedTx, setJustCreatedTx] = useState<Transaction | null>(null);

  // Handle formatted principal typing
  const handlePrincipalInput = (value: string) => {
    const rawDigits = value.replace(/\D/g, '');
    const num = rawDigits ? parseInt(rawDigits, 10) : 0;
    setPrincipal(num);
    setPrincipalStr(num > 0 ? formatNumberWithCommas(num) : '');
  };

  // Handle rate input
  const handleRateInput = (value: string) => {
    const rawDigits = value.replace(/\D/g, '');
    const num = rawDigits ? parseInt(rawDigits, 10) : 0;
    setCustomerRatePerLakh(num);
    setCustomerRateStr(num > 0 ? formatNumberWithCommas(num) : '');
  };

  // Calculations per day
  const calculated = useMemo(() => {
    if (principal <= 0 || customerRatePerLakh <= 0) {
      return {
        units: 0,
        dailyInterest: 0,
        elapsedDays: 1,
        accruedInterestSoFar: 0,
        totalCollectionDueToday: principal,
        isPastDeal: dealDate < getTodayDateString(),
        day1Total: principal,
        day2Total: principal,
        day3Total: principal,
        hasValues: false,
      };
    }

    const units = principal / 100000;
    const dailyInterest = Math.round(units * customerRatePerLakh);
    const elapsedDays = calculateDurationDays(dealDate);
    const accruedInterestSoFar = Math.round(units * customerRatePerLakh * elapsedDays);
    const totalCollectionDueToday = principal + accruedInterestSoFar;

    return {
      units,
      dailyInterest,
      elapsedDays,
      accruedInterestSoFar,
      totalCollectionDueToday,
      isPastDeal: dealDate < getTodayDateString(),
      day1Total: principal + dailyInterest,
      day2Total: principal + dailyInterest * 2,
      day3Total: principal + dailyInterest * 3,
      hasValues: true,
    };
  }, [principal, customerRatePerLakh, dealDate]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (principal <= 0) {
      alert(language === 'te' ? 'దయచేసి అసలు మొత్తం నమోదు చేయండి' : 'Please enter principal amount');
      return;
    }
    if (customerRatePerLakh <= 0) {
      alert(language === 'te' ? 'దయచేసి వడ్డీ రేటు నమోదు చేయండి' : 'Please enter interest rate per lakh');
      return;
    }

    const dealLabel = `Deal ₹${formatNumberWithCommas(principal)}`;

    const newTx: Partial<Transaction> = {
      customerName: dealLabel,
      customerPhone: '',
      releaseBank: '',
      targetBank: '',
      agentId: '',
      agentName: '',
      principal,
      givenDate: dealDate,
      customerRatePerLakh,
      ratePeriod,
      status: 'active',
      enableProfitSharing: false,
      agentCommissionRatePerLakh: 0,
      investors: [],
      notes: '',
    };

    onSaveTransaction(newTx);

    // Show celebratory banner
    setJustCreatedTx({
      ...newTx,
      id: 'tx-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Transaction);

    // Reset fields to completely blank
    setPrincipal(0);
    setPrincipalStr('');
    setCustomerRatePerLakh(0);
    setCustomerRateStr('');
    setDealDate(getTodayDateString());
  };

  return (
    <div className="p-4 space-y-4 pb-20 max-w-lg mx-auto">
      {/* Creation Success Banner */}
      {justCreatedTx && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 shadow-sm space-y-2 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold text-sm">
              {language === 'te' 
                ? 'డబ్బు పంపడం నమోదు చేయబడింది! నడుస్తున్నది.' 
                : 'Money Transferred! Deal is now Active.'}
            </span>
          </div>
          <p className="text-xs text-emerald-700 font-mono font-bold">
            {formatINR(justCreatedTx.principal)} Principal Disbursed
          </p>
          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={onViewActive}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-emerald-700 transition flex items-center space-x-1"
            >
              <span>{language === 'te' ? 'నడుస్తున్న లెక్కలు చూడండి' : 'View in Active Deals'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setJustCreatedTx(null)}
              className="px-3 py-1.5 bg-white text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold"
            >
              {language === 'te' ? 'మరొకటి రాయండి' : '+ Add Another Deal'}
            </button>
          </div>
        </div>
      )}

      {/* Screen Title */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
        <h2 className="text-base font-extrabold text-[#1E293B]">
          {language === 'te' ? 'డబ్బు పంపడం & వడ్డీ లెక్క' : 'Transfer Money & Fix Interest'}
        </h2>
        <p className="text-xs text-slate-500">
          {language === 'te' 
            ? 'అసలు మొత్తం & రోజువారీ వడ్డీ నమోదు చేయండి'
            : 'Enter principal amount & daily interest rate'}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Deal Start Date with Quick Past-Date Pills */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{language === 'te' ? 'డబ్బు ఇచ్చిన తేదీ (Deal Date)' : 'Deal Date (Money Given)'}</span>
            </label>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
              dealDate === getTodayDateString() 
                ? 'bg-slate-100 text-slate-700' 
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {getRelativeDaysLabel(dealDate, language)}
            </span>
          </div>

          {/* Quick Date Pills: Today, Yesterday, 2 Days Ago, 3 Days Ago */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { labelEn: 'Today', labelTe: 'ఈ రోజు', date: getTodayDateString() },
              { labelEn: 'Yesterday', labelTe: 'నిన్న', date: getPastDateString(1) },
              { labelEn: '2 Days Ago', labelTe: '2 రోజుల క్రితం', date: getPastDateString(2) },
              { labelEn: '3 Days Ago', labelTe: '3 రోజుల క్రితం', date: getPastDateString(3) },
            ].map((d) => {
              const isSelected = dealDate === d.date;
              return (
                <button
                  key={d.labelEn}
                  type="button"
                  onClick={() => setDealDate(d.date)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition text-center border active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1E293B] text-[#C5A059] border-[#1E293B] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="block truncate">{language === 'te' ? d.labelTe : d.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Date Picker Input for any other past date */}
          <div className="flex items-center gap-2 pt-0.5">
            <div className="relative flex-1">
              <input
                type="date"
                max={getTodayDateString()}
                value={dealDate}
                onChange={(e) => setDealDate(e.target.value || getTodayDateString())}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#C5A059] focus:bg-white cursor-pointer"
              />
            </div>
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
              {formatDateReadable(dealDate)}
            </span>
          </div>

          {/* Helpful notice if it's a past deal */}
          {dealDate < getTodayDateString() && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {language === 'te' 
                    ? `గత తేదీ లెక్క (${getRelativeDaysLabel(dealDate, language)})` 
                    : `Past Deal (${getRelativeDaysLabel(dealDate, language)})`}
                </p>
                <p className="text-[11px] text-amber-800">
                  {language === 'te'
                    ? `ఈ లెక్క ${calculateDurationDays(dealDate)} రోజులుగా నడుస్తున్నట్లు ఆటోమేటిక్‌గా లెక్కించబడుతుంది.`
                    : `Already running for ${calculateDurationDays(dealDate)} days. Elapsed duration & interest will count from ${formatDateReadable(dealDate)}.`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 1. Amount Transferred (Principal) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>₹</span>
              <span>{language === 'te' ? 'పంపిణీ చేసిన అసలు మొత్తం' : 'Amount Given (Principal)'}</span>
            </label>
            {principal > 0 && (
              <span className="text-xs font-mono font-bold text-[#C5A059]">
                {(principal / 100000).toFixed(1)} Lakhs ({formatINR(principal)})
              </span>
            )}
          </div>

          {/* Big Amount Input - Clean & Direct */}
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-xl font-bold text-slate-400">₹</span>
            <input
              type="text"
              inputMode="numeric"
              value={principalStr}
              onChange={(e) => handlePrincipalInput(e.target.value)}
              placeholder="Enter amount (e.g. 2,00,000)"
              className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-2xl font-black font-mono text-[#1E293B] focus:outline-none focus:border-[#C5A059] focus:bg-white tracking-wide"
              required
            />
          </div>
        </div>

        {/* 2. Daily Interest Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{language === 'te' ? 'వడ్డీ రేటు (రోజుకు లక్షకు)' : 'Daily Interest Rate (per Lakh/Day)'}</span>
            </label>
            {customerRatePerLakh > 0 && (
              <span className="text-xs font-mono font-bold text-[#C5A059]">
                ₹{formatNumberWithCommas(customerRatePerLakh)} / 1L / day
              </span>
            )}
          </div>

          {/* Clean Direct Rate Input */}
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-lg font-bold text-slate-400">₹</span>
            <input
              type="text"
              inputMode="numeric"
              value={customerRateStr}
              onChange={(e) => handleRateInput(e.target.value)}
              placeholder={language === 'te' ? 'లక్షకు రోజుకు రేటు (ఉదా: 1000 లేదా 500)' : 'Rate per ₹1,00,000 / Day (e.g. 1000 or 500)'}
              className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black font-mono text-slate-900 focus:outline-none focus:border-[#C5A059] focus:bg-white"
              required
            />
          </div>
        </div>

        {/* Live Earnings Calculation */}
        <div className="bg-[#1E293B] border-2 border-[#C5A059] rounded-2xl p-4 text-white shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
              <Coins className="w-4 h-4" />
              <span>{language === 'te' ? 'రోజువారీ సంపాదన' : 'Daily Interest Earning'}</span>
            </span>
            {calculated.hasValues && (
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#C5A059]" />
                <span>Runs until day of settlement</span>
              </span>
            )}
          </div>

          {calculated.hasValues ? (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">
                    {language === 'te' ? 'ప్రతి రోజు మీకు వచ్చే వడ్డీ' : 'Your Profit Every Single Day'}
                  </span>
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    +{formatINR(calculated.dailyInterest)}
                    <span className="text-xs text-slate-400 font-normal"> / day</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">
                    {language === 'te' ? 'అసలు మొత్తం' : 'Principal Given'}
                  </span>
                  <span className="text-sm font-bold font-mono text-white">
                    {formatINR(principal)}
                  </span>
                </div>
              </div>

              {/* Day-by-Day Running Collection Preview */}
              <div className="pt-2 border-t border-slate-800">
                {calculated.isPastDeal ? (
                  <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-2.5 space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{language === 'te' ? 'గత తేదీ లెక్క స్థితి (ఈ రోజు వరకు):' : 'Past Deal Status to Today:'}</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{language === 'te' ? 'నడిచిన రోజులు' : 'Elapsed Days'}</span>
                        <span className="font-extrabold text-[#C5A059] font-mono">{calculated.elapsedDays} Days</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{language === 'te' ? 'ఇప్పటివరకు వడ్డీ' : 'Accrued Interest'}</span>
                        <span className="font-extrabold text-emerald-400 font-mono">+{formatINR(calculated.accruedInterestSoFar)}</span>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-amber-500/30 flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-semibold">{language === 'te' ? 'ఈ రోజే క్లోజ్ చేస్తే మొత్తం:' : 'Total if Settled Today:'}</span>
                      <span className="font-black text-amber-300 font-mono text-sm">{formatINR(calculated.totalCollectionDueToday)}</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block mb-1.5 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-[#C5A059]" />
                      <span>Total Collection Due by Day:</span>
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
                        <span className="text-[9px] text-slate-400 block">If 1 Day</span>
                        <span className="text-[11px] font-bold font-mono text-white">{formatINR(calculated.day1Total)}</span>
                      </div>
                      <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
                        <span className="text-[9px] text-slate-400 block">If 2 Days</span>
                        <span className="text-[11px] font-bold font-mono text-white">{formatINR(calculated.day2Total)}</span>
                      </div>
                      <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
                        <span className="text-[9px] text-slate-400 block">If 3 Days</span>
                        <span className="text-[11px] font-bold font-mono text-white">{formatINR(calculated.day3Total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-slate-400">
              {language === 'te' 
                ? 'అసలు మొత్తం & వడ్డీ నమోదు చేయండి — రోజువారీ లాభం ఇక్కడ కనిపిస్తుంది'
                : 'Enter principal amount & interest rate to see daily profit'}
            </div>
          )}
        </div>

        {/* Big Action Button */}
        <button
          type="submit"
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C5A059] to-[#9a7836] hover:from-[#b08e4d] hover:to-[#88692f] active:scale-[0.98] text-white font-black text-base shadow-xl flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <Send className="w-5 h-5 stroke-[2.5]" />
          <span>
            {language === 'te' ? '📲 డబ్బు పంపాను — లెక్క ప్రారంభించు' : '📲 Transfer Money & Start Deal'}
          </span>
        </button>
      </form>
    </div>
  );
};
