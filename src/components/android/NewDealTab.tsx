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
  CalendarDays,
  Users,
  UserCheck,
  Briefcase,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Transaction, Agent, Investor, Language } from '../../types';
import { 
  formatINR, 
  formatNumberWithCommas, 
  getTodayDateString,
  formatDateReadable,
  getPastDateString,
  getRelativeDaysLabel,
  calculateDurationDays,
  calculateCompoundDeal,
  getDefaultGraceDays
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
  agents = [],
  investors = [],
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

  // Agent & Commission
  const [selectedAgentId, setSelectedAgentId] = useState<string>(prefillData?.agentId || (agents[0]?.id || ''));
  const [agentCommissionRatePerLakh, setAgentCommissionRatePerLakh] = useState<number>(
    prefillData?.agentCommissionRatePerLakh !== undefined ? prefillData.agentCommissionRatePerLakh : 400
  );
  const [agentCommissionRateStr, setAgentCommissionRateStr] = useState<string>(
    prefillData?.agentCommissionRatePerLakh !== undefined ? String(prefillData.agentCommissionRatePerLakh) : '400'
  );

  // Normal Days Before Compounding Starts (Default 2 for 10L, 5 for 5L)
  const [graceDays, setGraceDays] = useState<number>(
    prefillData?.graceDays !== undefined ? prefillData.graceDays : (principal >= 1000000 ? 2 : 5)
  );

  // Investor Financing (Optional Section)
  const [showInvestorSection, setShowInvestorSection] = useState<boolean>(
    !!(prefillData?.investors && prefillData.investors.length > 0)
  );
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>(
    prefillData?.investors?.[0]?.investorId || (investors[0]?.id || '')
  );
  const [investorAmount, setInvestorAmount] = useState<number>(
    prefillData?.investors?.[0]?.amount || 0
  );
  const [investorAmountStr, setInvestorAmountStr] = useState<string>(
    prefillData?.investors?.[0]?.amount ? formatNumberWithCommas(prefillData.investors[0].amount) : ''
  );
  const [investorRatePerLakh, setInvestorRatePerLakh] = useState<number>(
    prefillData?.investors?.[0]?.ratePerLakh || 1000
  );
  const [investorRateStr, setInvestorRateStr] = useState<string>(
    prefillData?.investors?.[0]?.ratePerLakh ? formatNumberWithCommas(prefillData.investors[0].ratePerLakh) : '1,000'
  );

  // React to prefillData changes (e.g. user clicked "+ Enter Deal for Date" in Calendar)
  useEffect(() => {
    if (prefillData?.givenDate) {
      setDealDate(prefillData.givenDate);
    }
    if (prefillData?.principal !== undefined && prefillData.principal > 0) {
      setPrincipal(prefillData.principal);
      setPrincipalStr(formatNumberWithCommas(prefillData.principal));
      if (prefillData.principal >= 1000000) setGraceDays(2);
      else if (prefillData.principal <= 500000) setGraceDays(5);
    }
    if (prefillData?.customerRatePerLakh !== undefined && prefillData.customerRatePerLakh > 0) {
      setCustomerRatePerLakh(prefillData.customerRatePerLakh);
      setCustomerRateStr(formatNumberWithCommas(prefillData.customerRatePerLakh));
    }
    if (prefillData?.agentId) {
      setSelectedAgentId(prefillData.agentId);
    }
    if (prefillData?.graceDays !== undefined) {
      setGraceDays(prefillData.graceDays);
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
    // Auto-adjust default grace days according to business rule
    if (num >= 1000000) {
      setGraceDays(2);
    } else if (num > 0 && num <= 500000) {
      setGraceDays(5);
    }
  };

  // Handle rate input
  const handleRateInput = (value: string) => {
    const rawDigits = value.replace(/\D/g, '');
    const num = rawDigits ? parseInt(rawDigits, 10) : 0;
    setCustomerRatePerLakh(num);
    setCustomerRateStr(num > 0 ? formatNumberWithCommas(num) : '');
  };

  // Handle agent commission input
  const handleAgentCommInput = (value: string) => {
    const rawDigits = value.replace(/\D/g, '');
    const num = rawDigits ? parseInt(rawDigits, 10) : 0;
    setAgentCommissionRatePerLakh(num);
    setAgentCommissionRateStr(num > 0 ? formatNumberWithCommas(num) : '');
  };

  // Handle investor amount input
  const handleInvestorAmountInput = (value: string) => {
    const rawDigits = value.replace(/\D/g, '');
    const num = rawDigits ? parseInt(rawDigits, 10) : 0;
    setInvestorAmount(num);
    setInvestorAmountStr(num > 0 ? formatNumberWithCommas(num) : '');
  };

  // Handle investor rate input
  const handleInvestorRateInput = (value: string) => {
    const rawDigits = value.replace(/\D/g, '');
    const num = rawDigits ? parseInt(rawDigits, 10) : 0;
    setInvestorRatePerLakh(num);
    setInvestorRateStr(num > 0 ? formatNumberWithCommas(num) : '');
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
        dealCalc: null,
        hasValues: false,
      };
    }

    const units = principal / 100000;
    const dailyInterest = Math.round(units * customerRatePerLakh);
    const elapsedDays = calculateDurationDays(dealDate);
    
    const invList = (showInvestorSection && investorAmount > 0) ? [{
      investorId: selectedInvestorId || 'inv-1',
      investorName: investors.find(i => i.id === selectedInvestorId)?.name || 'Investor',
      amount: investorAmount,
      ratePerLakh: investorRatePerLakh,
    }] : [];

    const dealCalc = calculateCompoundDeal({
      principal,
      ratePerLakh: customerRatePerLakh,
      agentCommissionRatePerLakh,
      durationDays: Math.max(elapsedDays, 4),
      graceDays,
      investors: invList,
    });

    const activeIdx = Math.min(elapsedDays, dealCalc.dailyBreakdown.length) - 1;
    const activeDayInfo = dealCalc.dailyBreakdown[activeIdx] || dealCalc.dailyBreakdown[0];
    const totalCollectionDueToday = activeDayInfo?.closingBalance || (principal + dailyInterest * elapsedDays);
    const accruedInterestSoFar = totalCollectionDueToday - principal;

    return {
      units,
      dailyInterest,
      elapsedDays,
      accruedInterestSoFar,
      totalCollectionDueToday,
      isPastDeal: dealDate < getTodayDateString(),
      dealCalc,
      hasValues: true,
    };
  }, [principal, customerRatePerLakh, agentCommissionRatePerLakh, dealDate, graceDays, showInvestorSection, investorAmount, investorRatePerLakh, selectedInvestorId, investors]);

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

    const agentObj = agents.find(a => a.id === selectedAgentId);
    const dealLabel = agentObj ? `${agentObj.name} - ₹${formatNumberWithCommas(principal)}` : `Deal ₹${formatNumberWithCommas(principal)}`;

    const invList = (showInvestorSection && investorAmount > 0) ? [{
      investorId: selectedInvestorId || 'inv-1',
      investorName: investors.find(i => i.id === selectedInvestorId)?.name || 'Investor',
      amount: investorAmount,
      ratePerLakh: investorRatePerLakh,
      settled: false,
    }] : [];

    const newTx: Partial<Transaction> = {
      customerName: dealLabel,
      customerPhone: agentObj?.phone || '',
      releaseBank: '',
      targetBank: '',
      agentId: selectedAgentId,
      agentName: agentObj?.name || '',
      principal,
      givenDate: dealDate,
      customerRatePerLakh,
      ratePeriod,
      graceDays,
      status: 'active',
      enableProfitSharing: agentCommissionRatePerLakh > 0 || invList.length > 0,
      agentCommissionRatePerLakh,
      investors: invList,
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
              placeholder={language === 'te' ? 'లక్షకు రోజుకు రేటు (ఉదా: 2000 లేదా 1500)' : 'Rate per ₹1,00,000 / Day (e.g. 2000 or 1500)'}
              className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black font-mono text-slate-900 focus:outline-none focus:border-[#C5A059] focus:bg-white"
              required
            />
          </div>
        </div>

        {/* 3. Agent & Agent Commission */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{language === 'te' ? 'ఏజెంట్ & కమీషన్' : 'Agent & Commission'}</span>
            </label>
            {agentCommissionRatePerLakh > 0 && (
              <span className="text-xs font-mono font-bold text-slate-600">
                ₹{formatNumberWithCommas(agentCommissionRatePerLakh)} / 1L / day
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Agent Select */}
            <div>
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                {language === 'te' ? 'డబ్బు తీసుకున్న ఏజెంట్' : 'Agent Taking Money'}
              </span>
              {agents.length > 0 ? (
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#C5A059] focus:bg-white cursor-pointer"
                >
                  <option value="">{language === 'te' ? '-- ఏజెంట్ ఎంచుకోండి --' : '-- Select Agent --'}</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} {a.phone ? `(${a.phone})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder={language === 'te' ? 'ఏజెంట్ పేరు' : 'Agent Name'}
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              )}
            </div>

            {/* Agent Commission Rate per Lakh */}
            <div>
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                {language === 'te' ? 'ఏజెంట్ కమీషన్ (లక్షకు/రోజుకు)' : 'Agent Commission Rate (/1L/day)'}
              </span>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={agentCommissionRateStr}
                  onChange={(e) => handleAgentCommInput(e.target.value)}
                  placeholder="400"
                  className="w-full pl-6 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black font-mono text-slate-900 focus:outline-none focus:border-[#C5A059] focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Normal Days Before Compounding (Grace Days) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{language === 'te' ? 'సాధారణ వడ్డీ రోజులు (చక్రవడ్డీ మొదలయ్యే ముందు)' : 'Normal Days (Before Compounding Starts)'}</span>
            </label>
            <span className="text-xs font-mono font-bold text-[#C5A059]">
              {graceDays === 0 
                ? (language === 'te' ? 'ప్రతిరోజూ చక్రవడ్డీ' : 'Compounding Every Day')
                : `${graceDays} ${language === 'te' ? 'రోజులు' : 'Days'}`}
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            {language === 'te'
              ? `ఈ ${graceDays} రోజుల వరకు సాధారణ వడ్డీ మాత్రమే పడుతుంది. ${graceDays + 1}వ రోజు నుండి చక్రవడ్డీ మొదలవుతుంది.`
              : `Flat interest for first ${graceDays} days. On Day ${graceDays + 1}, previous balance becomes new principal (compounding).`}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setGraceDays(2)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                graceDays === 2 
                  ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              2 {language === 'te' ? 'రోజులు (10L డిఫాల్ట్)' : 'Days (10L Default)'}
            </button>
            <button
              type="button"
              onClick={() => setGraceDays(5)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                graceDays === 5 
                  ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              5 {language === 'te' ? 'రోజులు (5L డిఫాల్ట్)' : 'Days (5L Default)'}
            </button>
            <button
              type="button"
              onClick={() => setGraceDays(6)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                graceDays === 6 
                  ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              6 {language === 'te' ? 'రోజులు (ఏజెంట్ వాగ్దానం)' : 'Days (Agent Promise)'}
            </button>
            <button
              type="button"
              onClick={() => setGraceDays(7)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                graceDays === 7 
                  ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              7 {language === 'te' ? 'రోజులు (1 వారం)' : 'Days (1 Week)'}
            </button>
            <button
              type="button"
              onClick={() => setGraceDays(3)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                graceDays === 3 
                  ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              3 Days
            </button>
            <button
              type="button"
              onClick={() => setGraceDays(1)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                graceDays === 1 
                  ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              1 Day
            </button>
            <button
              type="button"
              onClick={() => setGraceDays(0)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                graceDays === 0 
                  ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              0 (Everyday Compound)
            </button>
          </div>
        </div>

        {/* 5. Optional Investor Financing Collapsible */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowInvestorSection(!showInvestorSection)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{language === 'te' ? 'ఇన్వెస్టర్ డబ్బుతో నడుస్తుందా? (ఐచ్ఛికం)' : 'Financed by Investor? (Optional)'}</span>
              {showInvestorSection ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {showInvestorSection && investorAmount > 0 && (
              <span className="text-xs font-mono font-bold text-emerald-700">
                {formatINR(investorAmount)} @ ₹{investorRatePerLakh}/1L
              </span>
            )}
          </div>

          {showInvestorSection && (
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <p className="text-[11px] text-slate-500">
                {language === 'te' 
                  ? 'ఇన్వెస్టర్ల కమీషన్ సరళంగా రోజుకు ₹1k/లక్ష చొప్పున లెక్కించబడుతుంది.' 
                  : 'Investor share is simpler: daily linear interest (e.g. ₹1,000 per 1 Lakh/day) for days used.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">
                    {language === 'te' ? 'ఇన్వెస్టర్' : 'Investor'}
                  </span>
                  {investors.length > 0 ? (
                    <select
                      value={selectedInvestorId}
                      onChange={(e) => setSelectedInvestorId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#C5A059]"
                    >
                      {investors.map((inv) => (
                        <option key={inv.id} value={inv.id}>{inv.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Investor Name"
                      value={selectedInvestorId}
                      onChange={(e) => setSelectedInvestorId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">
                    {language === 'te' ? 'ఇన్వెస్టర్ ఇచ్చిన అసలు' : 'Investor Amount'}
                  </span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={investorAmountStr}
                      onChange={(e) => handleInvestorAmountInput(e.target.value)}
                      placeholder="e.g. 5,00,000"
                      className="w-full pl-6 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">
                    {language === 'te' ? 'రేటు (లక్షకు/రోజుకు)' : 'Rate (/1L/day)'}
                  </span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={investorRateStr}
                      onChange={(e) => handleInvestorRateInput(e.target.value)}
                      placeholder="1000"
                      className="w-full pl-6 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Earnings & Compounding Timeline Calculation */}
        <div className="bg-[#1E293B] border-2 border-[#C5A059] rounded-2xl p-4 text-white shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
              <Coins className="w-4 h-4" />
              <span>{language === 'te' ? 'రోజువారీ లెక్క & చక్రవడ్డీ వివరాలు' : 'Daily Calculations & Compounding'}</span>
            </span>
            {calculated.hasValues && (
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#C5A059]" />
                <span>{graceDays} Days Normal Rate</span>
              </span>
            )}
          </div>

          {calculated.hasValues && calculated.dealCalc ? (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">
                    {language === 'te' ? 'మొదటి రోజు వడ్డీ' : 'Day 1 Starting Daily Interest'}
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

              {/* Day-by-Day Compounding Projection Table */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[#C5A059]" />
                    <span>{language === 'te' ? 'రోజువారీ తిరిగి ఇవ్వాల్సిన మొత్తం & ఏజెంట్ కమీషన్:' : 'Day-by-Day Return Schedule & Commission:'}</span>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] font-mono">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800 text-[10px] uppercase font-sans">
                        <th className="text-left pb-1">{language === 'te' ? 'రోజు' : 'Day'}</th>
                        <th className="text-right pb-1">{language === 'te' ? 'తిరిగి ఇవ్వాల్సిన మొత్తం' : 'Total to Return'}</th>
                        <th className="text-right pb-1">{language === 'te' ? 'వడ్డీ' : 'Interest'}</th>
                        <th className="text-right pb-1">{language === 'te' ? 'ఏజెంట్ కమీషన్' : 'Agent Comm'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {calculated.dealCalc.dailyBreakdown.slice(0, 4).map((b) => (
                        <tr key={b.day} className="hover:bg-slate-800/40">
                          <td className="py-1.5 text-left text-slate-300">
                            <div className="flex items-center gap-1">
                              <span>Day {b.day}</span>
                              {b.isCompounded && (
                                <span className="text-[9px] font-sans px-1 py-0.2 rounded bg-purple-900/80 text-purple-300 font-bold">
                                  {language === 'te' ? 'చక్రవడ్డీ' : 'Compounded'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-1.5 text-right font-black text-amber-300">
                            {formatINR(b.closingBalance)}
                          </td>
                          <td className="py-1.5 text-right text-emerald-400 font-bold">
                            +{formatINR(b.interestAdded)}
                          </td>
                          <td className="py-1.5 text-right text-slate-300">
                            {formatINR(b.cumulativeAgentCommission)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* If Investor enabled: Show net profit breakdown */}
                {showInvestorSection && investorAmount > 0 && (
                  <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700 text-xs space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>{language === 'te' ? 'ఇన్వెస్టర్ వాటా (రోజుకు):' : 'Investor Share (/day):'}</span>
                      <span className="font-mono text-amber-300">
                        {formatINR(Math.round((investorAmount / 100000) * investorRatePerLakh))}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-700">
                      <span>{language === 'te' ? 'ఓనర్ నికర లాభం (మొదటి రోజు):' : 'Owner Net Profit (Day 1):'}</span>
                      <span className="font-mono">
                        {formatINR(calculated.dailyInterest - Math.round((principal / 100000) * agentCommissionRatePerLakh) - Math.round((investorAmount / 100000) * investorRatePerLakh))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-slate-400">
              {language === 'te' 
                ? 'అసలు మొత్తం & వడ్డీ నమోదు చేయండి — రోజువారీ లాభం & చక్రవడ్డీ ఇక్కడ కనిపిస్తుంది'
                : 'Enter principal amount & interest rate to see day-by-day compounding'}
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
