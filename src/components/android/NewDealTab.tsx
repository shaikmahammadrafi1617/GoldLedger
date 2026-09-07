import React, { useState, useMemo } from 'react';
import { 
  Send, 
  Percent, 
  ArrowRight,
  CheckCircle2,
  Coins,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Transaction, Agent, Investor, Language } from '../../types';
import { formatINR, formatNumberWithCommas, getTodayDateString } from '../../utils/formatters';

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

  // Success Feedback
  const [justCreatedTx, setJustCreatedTx] = useState<Transaction | null>(null);

  // Handle formatted principal typing
  const handlePrincipalInput = (value: string) => {
    const rawDigits = value.replace(/\D/g, '');
    const num = rawDigits ? parseInt(rawDigits, 10) : 0;
    setPrincipal(num);
    setPrincipalStr(num > 0 ? formatNumberWithCommas(num) : '');
  };

  // Quick Amount Addition with commas
  const addAmount = (amount: number) => {
    setPrincipal((prev) => {
      const next = prev + amount;
      setPrincipalStr(next > 0 ? formatNumberWithCommas(next) : '');
      return next;
    });
  };

  const clearAmount = () => {
    setPrincipal(0);
    setPrincipalStr('');
  };

  // Handle rate input
  const handleRateInput = (value: string) => {
    const rawDigits = value.replace(/\D/g, '');
    const num = rawDigits ? parseInt(rawDigits, 10) : 0;
    setCustomerRatePerLakh(num);
    setCustomerRateStr(num > 0 ? formatNumberWithCommas(num) : '');
  };

  const addRate = (delta: number) => {
    setCustomerRatePerLakh((prev) => {
      const next = prev + delta;
      setCustomerRateStr(next > 0 ? formatNumberWithCommas(next) : '');
      return next;
    });
  };

  const clearRate = () => {
    setCustomerRatePerLakh(0);
    setCustomerRateStr('');
  };

  // Calculations per day
  const calculated = useMemo(() => {
    if (principal <= 0 || customerRatePerLakh <= 0) {
      return {
        units: 0,
        dailyInterest: 0,
        day1Total: principal,
        day2Total: principal,
        day3Total: principal,
        hasValues: false,
      };
    }

    const units = principal / 100000;
    const dailyInterest = Math.round(units * customerRatePerLakh);

    return {
      units,
      dailyInterest,
      day1Total: principal + dailyInterest,
      day2Total: principal + dailyInterest * 2,
      day3Total: principal + dailyInterest * 3,
      hasValues: true,
    };
  }, [principal, customerRatePerLakh]);

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
      givenDate: getTodayDateString(),
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
        {/* 1. Amount Transferred (Principal) with Calculator Buttons */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
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

          {/* Big Amount Input - Empty by default, no default numbers */}
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-xl font-bold text-slate-400">₹</span>
            <input
              type="text"
              inputMode="numeric"
              value={principalStr}
              onChange={(e) => handlePrincipalInput(e.target.value)}
              placeholder="Enter amount"
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-2xl font-black font-mono text-[#1E293B] focus:outline-none focus:border-[#C5A059] focus:bg-white tracking-wide"
              required
            />
          </div>

          {/* Fast Calculator Addition Keys with Indian Comma Formatting */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => addAmount(50000)}
              className="py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-xl text-xs font-bold font-mono transition text-center"
            >
              +50,000
            </button>
            <button
              type="button"
              onClick={() => addAmount(100000)}
              className="py-2 bg-[#C5A059]/15 hover:bg-[#C5A059]/25 active:scale-95 text-[#9a7836] rounded-xl text-xs font-extrabold font-mono transition text-center"
            >
              +1,00,000
            </button>
            <button
              type="button"
              onClick={() => addAmount(200000)}
              className="py-2 bg-[#C5A059]/15 hover:bg-[#C5A059]/25 active:scale-95 text-[#9a7836] rounded-xl text-xs font-extrabold font-mono transition text-center"
            >
              +2,00,000
            </button>
            <button
              type="button"
              onClick={clearAmount}
              className="py-2 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 rounded-xl text-xs font-bold transition text-center"
            >
              Clear
            </button>
          </div>
        </div>

        {/* 2. Daily Interest Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{language === 'te' ? 'వడ్డీ రేటు (రోజుకు)' : 'Daily Interest Rate'}</span>
            </label>
            {customerRatePerLakh > 0 && (
              <span className="text-xs font-mono font-bold text-[#C5A059]">
                ₹{formatNumberWithCommas(customerRatePerLakh)} / 1L / day
              </span>
            )}
          </div>

          {/* 1K+ Quick Add Buttons */}
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              {language === 'te' ? 'వడ్డీ రేటు త్వరిత జోడింపు (1K+)' : '1K+ Quick Add (Interest Rate):'}
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => addRate(1000)}
                className="py-2 bg-[#C5A059]/15 hover:bg-[#C5A059]/25 active:scale-95 text-[#9a7836] rounded-xl text-xs font-extrabold font-mono transition text-center shadow-2xs cursor-pointer"
              >
                +1,000
              </button>
              <button
                type="button"
                onClick={() => addRate(2000)}
                className="py-2 bg-[#C5A059]/15 hover:bg-[#C5A059]/25 active:scale-95 text-[#9a7836] rounded-xl text-xs font-extrabold font-mono transition text-center shadow-2xs cursor-pointer"
              >
                +2,000
              </button>
              <button
                type="button"
                onClick={() => addRate(5000)}
                className="py-2 bg-[#C5A059]/15 hover:bg-[#C5A059]/25 active:scale-95 text-[#9a7836] rounded-xl text-xs font-extrabold font-mono transition text-center shadow-2xs cursor-pointer"
              >
                +5,000
              </button>
              <button
                type="button"
                onClick={clearRate}
                className="py-2 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 rounded-xl text-xs font-bold transition text-center cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Quick Rate Presets */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { rate: 100, label: '₹100' },
              { rate: 120, label: '₹120' },
              { rate: 150, label: '₹150' },
              { rate: 1000, label: '₹1,000 (1K)' },
            ].map((p) => (
              <button
                key={p.rate}
                type="button"
                onClick={() => {
                  setCustomerRatePerLakh(p.rate);
                  setCustomerRateStr(formatNumberWithCommas(p.rate));
                }}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition border cursor-pointer ${
                  customerRatePerLakh === p.rate
                    ? 'bg-[#1E293B] text-[#C5A059] border-[#1E293B]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Rate Input - Empty by default, no default numbers */}
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block mb-1">
              {language === 'te' ? 'లేదా మీరే రాయండి (₹1,00,000 కి రోజుకు ₹)' : 'Or Enter Custom Rate (₹ per ₹1,00,000 / Day)'}
            </span>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
              <input
                type="text"
                inputMode="numeric"
                value={customerRateStr}
                onChange={(e) => handleRateInput(e.target.value)}
                placeholder="Enter rate per Lakh (e.g. 1000)"
                className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-900 focus:outline-none focus:border-[#C5A059] focus:bg-white"
                required
              />
            </div>
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
