import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Landmark, 
  Check, 
  ChevronDown,
  UserCheck,
  Briefcase,
  Handshake,
  Coins
} from 'lucide-react';
import { Transaction, Agent, Investor, InvestorContribution, Language } from '../../types';
import { 
  formatINR, 
  formatNumberWithCommas, 
  calculateFinancials, 
  calculateDurationDays, 
  getTodayDateString 
} from '../../utils/formatters';

interface SettleAndCallDayTabProps {
  activeDeals: Transaction[];
  selectedDeal: Transaction | null;
  onSelectDeal: (tx: Transaction | null) => void;
  onCompleteDealAndCallDay: (completedData: {
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
  }) => void;
  language: Language;
  onGoToHistory: () => void;
  agents?: Agent[];
  investors?: Investor[];
}

export const SettleAndCallDayTab: React.FC<SettleAndCallDayTabProps> = ({
  activeDeals,
  selectedDeal,
  onSelectDeal,
  onCompleteDealAndCallDay,
  language,
  onGoToHistory,
  agents = [],
  investors = [],
}) => {
  // Currently active deal to settle
  const deal = selectedDeal || activeDeals[0] || null;

  // Base calculation for this deal duration
  const baseFinancials = useMemo(() => {
    if (!deal) return null;
    return calculateFinancials(deal);
  }, [deal]);

  const durationDays = baseFinancials?.durationDays || 1;
  const principalUnits = (deal?.principal || 0) / 100000;

  // Form State for Actual Received
  const [actualReceived, setActualReceived] = useState<number>(0);
  const [actualReceivedStr, setActualReceivedStr] = useState<string>('');
  const [customerReceivedConfirmed, setCustomerReceivedConfirmed] = useState<boolean>(true);

  // Form State for Investor in Settlement
  const [hasInvestor, setHasInvestor] = useState<boolean>(false);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>('custom');
  const [investorName, setInvestorName] = useState<string>('');
  const [investorPrincipal, setInvestorPrincipal] = useState<number>(0);
  const [investorPrincipalStr, setInvestorPrincipalStr] = useState<string>('');
  const [investorMode, setInvestorMode] = useState<'rate' | 'fixed'>('rate');
  const [investorRatePerLakh, setInvestorRatePerLakh] = useState<number>(0);
  const [investorRatePerLakhStr, setInvestorRatePerLakhStr] = useState<string>('');
  const [investorFixedShare, setInvestorFixedShare] = useState<number>(0);
  const [investorFixedShareStr, setInvestorFixedShareStr] = useState<string>('');
  const [investorTransferred, setInvestorTransferred] = useState<boolean>(false);

  // Form State for Agent in Settlement
  const [hasAgent, setHasAgent] = useState<boolean>(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('custom');
  const [agentName, setAgentName] = useState<string>('');
  const [agentMode, setAgentMode] = useState<'rate' | 'fixed'>('rate');
  const [agentRatePerLakh, setAgentRatePerLakh] = useState<number>(0);
  const [agentRatePerLakhStr, setAgentRatePerLakhStr] = useState<string>('');
  const [agentFixedComm, setAgentFixedComm] = useState<number>(0);
  const [agentFixedCommStr, setAgentFixedCommStr] = useState<string>('');
  const [agentTransferred, setAgentTransferred] = useState<boolean>(false);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [lastProfitEarned, setLastProfitEarned] = useState<number>(0);

  // Initialize or sync form when deal changes
  useEffect(() => {
    if (!deal || !baseFinancials) return;

    // Actual received defaults to expected total
    setActualReceived(baseFinancials.totalAmountExpected);
    setActualReceivedStr(formatNumberWithCommas(baseFinancials.totalAmountExpected));
    setCustomerReceivedConfirmed(true);

    // Investor initialization from deal
    const existingInv = deal.investors?.[0];
    if (existingInv && existingInv.investorName) {
      setHasInvestor(true);
      const matchInv = investors.find((i) => i.id === existingInv.investorId || i.name === existingInv.investorName);
      setSelectedInvestorId(matchInv ? matchInv.id : 'custom');
      setInvestorName(existingInv.investorName);
      setInvestorPrincipal(existingInv.amount || deal.principal);
      setInvestorPrincipalStr(formatNumberWithCommas(existingInv.amount || deal.principal));
      setInvestorMode('rate');
      setInvestorRatePerLakh(existingInv.ratePerLakh || 0);
      setInvestorRatePerLakhStr(existingInv.ratePerLakh ? String(existingInv.ratePerLakh) : '');
      setInvestorFixedShare(0);
      setInvestorFixedShareStr('');
      setInvestorTransferred(Boolean(existingInv.settled));
    } else {
      setHasInvestor(false);
      setSelectedInvestorId('custom');
      setInvestorName('');
      setInvestorPrincipal(deal.principal);
      setInvestorPrincipalStr(formatNumberWithCommas(deal.principal));
      setInvestorMode('rate');
      setInvestorRatePerLakh(0);
      setInvestorRatePerLakhStr('');
      setInvestorFixedShare(0);
      setInvestorFixedShareStr('');
      setInvestorTransferred(false);
    }

    // Agent initialization from deal
    if (deal.agentName) {
      setHasAgent(true);
      const matchAg = agents.find((a) => a.id === deal.agentId || a.name === deal.agentName);
      setSelectedAgentId(matchAg ? matchAg.id : 'custom');
      setAgentName(deal.agentName);
      setAgentMode('rate');
      setAgentRatePerLakh(deal.agentCommissionRatePerLakh || 0);
      setAgentRatePerLakhStr(deal.agentCommissionRatePerLakh ? String(deal.agentCommissionRatePerLakh) : '');
      setAgentFixedComm(0);
      setAgentFixedCommStr('');
      setAgentTransferred(Boolean(deal.agentCommissionSettled));
    } else {
      setHasAgent(false);
      setSelectedAgentId('custom');
      setAgentName('');
      setAgentMode('rate');
      setAgentRatePerLakh(0);
      setAgentRatePerLakhStr('');
      setAgentFixedComm(0);
      setAgentFixedCommStr('');
      setAgentTransferred(false);
    }
  }, [deal?.id]);

  // Actual received input handler
  const handleActualReceivedInput = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const num = digits ? parseInt(digits, 10) : 0;
    setActualReceived(num);
    setActualReceivedStr(num > 0 ? formatNumberWithCommas(num) : '');
  };

  // Investor principal input handler
  const handleInvestorPrincipalInput = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const num = digits ? parseInt(digits, 10) : 0;
    setInvestorPrincipal(num);
    setInvestorPrincipalStr(num > 0 ? formatNumberWithCommas(num) : '');
  };

  // Investor rate input handler
  const handleInvestorRateInput = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const num = digits ? parseInt(digits, 10) : 0;
    setInvestorRatePerLakh(num);
    setInvestorRatePerLakhStr(digits);
  };

  // Investor fixed share input handler
  const handleInvestorFixedShareInput = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const num = digits ? parseInt(digits, 10) : 0;
    setInvestorFixedShare(num);
    setInvestorFixedShareStr(num > 0 ? formatNumberWithCommas(num) : '');
  };

  // Agent rate input handler
  const handleAgentRateInput = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const num = digits ? parseInt(digits, 10) : 0;
    setAgentRatePerLakh(num);
    setAgentRatePerLakhStr(digits);
  };

  // Agent fixed commission input handler
  const handleAgentFixedCommInput = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const num = digits ? parseInt(digits, 10) : 0;
    setAgentFixedComm(num);
    setAgentFixedCommStr(num > 0 ? formatNumberWithCommas(num) : '');
  };

  // Calculated Real-Time Settlement Numbers
  const calculatedInvestorShare = useMemo(() => {
    if (!hasInvestor) return 0;
    if (investorMode === 'fixed') return investorFixedShare;
    const invUnits = (investorPrincipal || 0) / 100000;
    return Math.round(invUnits * (investorRatePerLakh || 0) * durationDays);
  }, [hasInvestor, investorMode, investorFixedShare, investorPrincipal, investorRatePerLakh, durationDays]);

  const totalInvestorPayout = useMemo(() => {
    if (!hasInvestor) return 0;
    return investorPrincipal + calculatedInvestorShare;
  }, [hasInvestor, investorPrincipal, calculatedInvestorShare]);

  const calculatedAgentCommission = useMemo(() => {
    if (!hasAgent) return 0;
    if (agentMode === 'fixed') return agentFixedComm;
    return Math.round(principalUnits * (agentRatePerLakh || 0) * durationDays);
  }, [hasAgent, agentMode, agentFixedComm, principalUnits, agentRatePerLakh, durationDays]);

  const grossInterest = Math.max(0, actualReceived - (deal?.principal || 0));
  const realOwnerProfit = Math.max(
    0,
    grossInterest - (hasInvestor ? calculatedInvestorShare : 0) - (hasAgent ? calculatedAgentCommission : 0)
  );

  // 1k+ Quick Add for Total Interest / Actual Received
  const addTotalInterest = (delta: number) => {
    const currentVal = actualReceived > 0 ? actualReceived : (baseFinancials?.totalAmountExpected || deal?.principal || 0);
    const nextVal = currentVal + delta;
    setActualReceived(nextVal);
    setActualReceivedStr(formatNumberWithCommas(nextVal));
  };

  // Direct Total Interest input handler
  const handleTotalInterestInput = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const num = digits ? parseInt(digits, 10) : 0;
    const nextVal = (deal?.principal || 0) + num;
    setActualReceived(nextVal);
    setActualReceivedStr(nextVal > 0 ? formatNumberWithCommas(nextVal) : '');
  };

  // 1k+ Quick Add for Investor Share
  const addInvestorShare = (delta: number) => {
    setInvestorMode('fixed');
    const currentShare = investorMode === 'fixed' ? investorFixedShare : calculatedInvestorShare;
    const nextVal = Math.max(0, currentShare + delta);
    setInvestorFixedShare(nextVal);
    setInvestorFixedShareStr(nextVal > 0 ? formatNumberWithCommas(nextVal) : '');
  };

  const clearInvestorShare = () => {
    setInvestorMode('fixed');
    setInvestorFixedShare(0);
    setInvestorFixedShareStr('');
  };

  // 100+ Quick Add for Agent Commission
  const addAgentCommission = (delta: number) => {
    setAgentMode('fixed');
    const currentComm = agentMode === 'fixed' ? agentFixedComm : calculatedAgentCommission;
    const nextVal = Math.max(0, currentComm + delta);
    setAgentFixedComm(nextVal);
    setAgentFixedCommStr(nextVal > 0 ? formatNumberWithCommas(nextVal) : '');
  };

  const clearAgentCommission = () => {
    setAgentMode('fixed');
    setAgentFixedComm(0);
    setAgentFixedCommStr('');
  };

  if (!deal || !baseFinancials) {
    return (
      <div className="p-4 space-y-4 pb-20 max-w-lg mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {language === 'te' ? 'అన్ని లెక్కలు పూర్తయ్యాయి!' : 'All Deals Settled & Done!'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'te' 
                ? 'ప్రస్తుతం సెటిల్ చేయడానికి ఏ బ్యాలెన్స్ ట్రాన్స్‌ఫర్ లేదు. మీ రోజు ప్రశాంతంగా ముగిసింది.' 
                : 'No active deals to settle right now. Tap Day Done to review your profits.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToHistory}
            className="px-4 py-2 bg-[#1E293B] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-slate-800 transition"
          >
            {language === 'te' ? 'ముగిసిన లెక్కలు చూడండి' : 'View Day Summary & Profits'}
          </button>
        </div>
      </div>
    );
  }

  // Handle Call the Day
  const handleCallDay = () => {
    if (!customerReceivedConfirmed) {
      alert(language === 'te' ? 'దయచేసి కస్టమర్ నుండి డబ్బు అందినట్లు నిర్ధారించండి' : 'Please confirm customer money is collected');
      return;
    }

    const updatedInvestorsList: InvestorContribution[] = hasInvestor
      ? [
          {
            investorId: selectedInvestorId !== 'custom' ? selectedInvestorId : `inv-${Date.now()}`,
            investorName: investorName.trim() || (language === 'te' ? 'ఇన్వెస్టర్' : 'Investor'),
            amount: investorPrincipal,
            ratePerLakh: investorMode === 'rate' ? investorRatePerLakh : 0,
            settled: investorTransferred,
            settledDate: getTodayDateString(),
            settledAmount: totalInvestorPayout,
          },
        ]
      : [];

    onCompleteDealAndCallDay({
      txId: deal.id,
      actualMoneyReceived: actualReceived,
      finalOwnerProfit: realOwnerProfit,
      investorSettled: hasInvestor ? investorTransferred : false,
      agentSettled: hasAgent ? agentTransferred : false,
      investors: updatedInvestorsList,
      agentName: hasAgent ? (agentName.trim() || (language === 'te' ? 'ఏజెంట్' : 'Agent')) : '',
      agentCommissionRatePerLakh: hasAgent && agentMode === 'rate' ? agentRatePerLakh : 0,
      finalInvestorShare: hasInvestor ? calculatedInvestorShare : 0,
      finalAgentCommission: hasAgent ? calculatedAgentCommission : 0,
    });

    setLastProfitEarned(realOwnerProfit);
    setShowCelebration(true);
  };

  return (
    <div className="p-4 space-y-4 pb-24 max-w-lg mx-auto">
      {/* Celebration Modal / Banner */}
      {showCelebration && (
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-xl space-y-3 animate-in zoom-in-95">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="font-extrabold text-sm uppercase tracking-wider">
              {language === 'te' ? '🎉 రోజు విజయవంతంగా ముగిసింది!' : '🎉 Day Successfully Called!'}
            </span>
          </div>
          <div>
            <span className="text-xs text-emerald-100 block">
              {language === 'te' ? 'మీ నికర లాభం ఖరారైంది:' : 'Net Profit Earned:'}
            </span>
            <span className="text-3xl font-black font-mono text-white">
              +{formatINR(lastProfitEarned)}
            </span>
          </div>
          <div className="pt-2 border-t border-emerald-500/50 flex space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowCelebration(false);
                onGoToHistory();
              }}
              className="flex-1 py-2.5 bg-white text-emerald-800 rounded-xl font-bold text-xs shadow-xs hover:bg-emerald-50 transition"
            >
              {language === 'te' ? 'ముగింపు నివేదిక చూడండి →' : 'View Day Summary →'}
            </button>
            <button
              type="button"
              onClick={() => setShowCelebration(false)}
              className="px-3 py-2.5 bg-emerald-800/80 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Deal Selector (If multiple active deals) */}
      {activeDeals.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            {language === 'te' ? 'నడుస్తున్న డీల్ ఎంచుకోండి:' : 'Select Deal to Settle:'}
          </span>
          <select
            value={deal.id}
            onChange={(e) => {
              const found = activeDeals.find((t) => t.id === e.target.value);
              if (found) onSelectDeal(found);
            }}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#C5A059]"
          >
            {activeDeals.map((t, idx) => (
              <option key={t.id} value={t.id}>
                #{idx + 1} {t.customerName || formatINR(t.principal)} ({formatINR(t.principal)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 1. Collection Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Step 1: Collect Money
            </span>
            <h3 className="text-base font-extrabold text-[#1E293B] mt-1">
              {deal.customerName || `Deal ${formatINR(deal.principal)}`}
            </h3>
            <p className="text-[11px] text-slate-500">
              Principal: {formatINR(deal.principal)} • Running {durationDays} Days
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Expected Total</span>
            <span className="text-base font-black font-mono text-[#C5A059]">
              {formatINR(baseFinancials.totalAmountExpected)}
            </span>
          </div>
        </div>

        {/* Input for Actual Received & Total Interest */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              {language === 'te' ? 'వసూలైన మొత్తం (చేతికి వచ్చినది)' : 'Actual Money Received (₹)'}
            </label>
            <button
              type="button"
              onClick={() => {
                setActualReceived(baseFinancials.totalAmountExpected);
                setActualReceivedStr(formatNumberWithCommas(baseFinancials.totalAmountExpected));
              }}
              className="text-[11px] text-[#C5A059] font-bold hover:underline cursor-pointer"
            >
              Reset Expected
            </button>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-lg font-bold text-slate-400">₹</span>
            <input
              type="text"
              inputMode="numeric"
              value={actualReceivedStr}
              onChange={(e) => handleActualReceivedInput(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-lg font-black font-mono text-[#1E293B] focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          {/* Total Interest Calculated / Breakdown */}
          <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs">
            <span className="text-slate-600 font-semibold">
              {language === 'te' ? 'మొత్తం వడ్డీ' : 'Total Interest'}:
              <strong className="ml-1.5 text-emerald-700 font-mono font-black text-sm">
                {formatINR(grossInterest)}
              </strong>
            </span>
            <span className="text-[10px] text-slate-400">
              Expected Interest: {formatINR(baseFinancials.totalInterestExpected)}
            </span>
          </div>

          {/* 1k+ Quick Add for Total Interest */}
          <div className="space-y-1 pt-0.5">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              {language === 'te' ? 'వడ్డీ త్వరిత జోడింపు (1k+)' : '1k+ Quick Add (Total Interest):'}
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => addTotalInterest(1000)}
                className="py-1.5 bg-white hover:bg-slate-100 border border-slate-300 active:scale-95 text-slate-800 rounded-xl text-xs font-black font-mono transition text-center shadow-2xs cursor-pointer"
              >
                +1,000
              </button>
              <button
                type="button"
                onClick={() => addTotalInterest(2000)}
                className="py-1.5 bg-white hover:bg-slate-100 border border-slate-300 active:scale-95 text-slate-800 rounded-xl text-xs font-black font-mono transition text-center shadow-2xs cursor-pointer"
              >
                +2,000
              </button>
              <button
                type="button"
                onClick={() => addTotalInterest(5000)}
                className="py-1.5 bg-white hover:bg-slate-100 border border-slate-300 active:scale-95 text-slate-800 rounded-xl text-xs font-black font-mono transition text-center shadow-2xs cursor-pointer"
              >
                +5,000
              </button>
              <button
                type="button"
                onClick={() => {
                  setActualReceived(baseFinancials.totalAmountExpected);
                  setActualReceivedStr(formatNumberWithCommas(baseFinancials.totalAmountExpected));
                }}
                className="py-1.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 rounded-xl text-xs font-bold transition text-center cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          <label className="flex items-center space-x-2 pt-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={customerReceivedConfirmed}
              onChange={(e) => setCustomerReceivedConfirmed(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs font-semibold text-slate-700">
              {language === 'te' 
                ? 'మొత్తం డబ్బు చేతికి/ఖాతాకి అందింది ✓' 
                : 'Confirmed: Full cash / bank transfer received ✓'}
            </span>
          </label>
        </div>
      </div>

      {/* 2. Investor & Agent Settlement Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
            Step 2: Investor & Agent Settlement
          </span>
          <span className="text-[11px] text-slate-400">
            {language === 'te' ? 'వాటాలు సరిచూడండి' : 'Configure Payouts'}
          </span>
        </div>

        {/* SECTION A: Investor Details */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                <Landmark className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {language === 'te' ? 'ఇన్వెస్టర్ వివరాలు' : 'Investor Details'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {language === 'te' ? 'పెట్టుబడి & లాభ వాటా' : 'Principal return & profit share'}
                </span>
              </div>
            </div>

            {/* Investor Toggle Pill */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setHasInvestor(false);
                  setInvestorTransferred(false);
                }}
                className={`px-2.5 py-1 rounded-md transition ${
                  !hasInvestor
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {language === 'te' ? 'సొంత పెట్టుబడి' : 'Own Capital'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setHasInvestor(true);
                  if (!investorPrincipal) {
                    setInvestorPrincipal(deal.principal);
                    setInvestorPrincipalStr(formatNumberWithCommas(deal.principal));
                  }
                }}
                className={`px-2.5 py-1 rounded-md transition ${
                  hasInvestor
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {language === 'te' ? 'ఇన్వెస్టర్' : 'Investor'}
              </button>
            </div>
          </div>

          {/* Expanded Investor Details Form */}
          {hasInvestor ? (
            <div className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-3 space-y-3">
              {/* Investor Name Selection / Custom Entry */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-amber-900 flex items-center justify-between">
                  <span>{language === 'te' ? 'ఇన్వెస్టర్ పేరు' : 'Investor Name'}</span>
                  {investors.length > 0 && (
                    <span className="text-[10px] text-amber-700">
                      {investors.length} registered
                    </span>
                  )}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {investors.length > 0 && (
                    <select
                      value={selectedInvestorId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedInvestorId(val);
                        if (val !== 'custom') {
                          const found = investors.find((inv) => inv.id === val);
                          if (found) setInvestorName(found.name);
                        }
                      }}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
                    >
                      <option value="custom">+ Type Name Directly</option>
                      {investors.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <input
                    type="text"
                    placeholder={language === 'te' ? 'ఇన్వెస్టర్ పేరు రాయండి...' : 'Enter Investor Name...'}
                    value={investorName}
                    onChange={(e) => {
                      setInvestorName(e.target.value);
                      setSelectedInvestorId('custom');
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Investor Principal Funded */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-amber-900">
                    {language === 'te' ? 'ఇన్వెస్టర్ ఇచ్చిన అసలు (₹)' : 'Investor Principal Funded (₹)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setInvestorPrincipal(deal.principal);
                      setInvestorPrincipalStr(formatNumberWithCommas(deal.principal));
                    }}
                    className="text-[10px] text-amber-800 font-bold hover:underline"
                  >
                    Match Deal Principal ({formatINR(deal.principal)})
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm font-bold text-slate-400">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Principal amount..."
                    value={investorPrincipalStr}
                    onChange={(e) => handleInvestorPrincipalInput(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-sm font-black font-mono text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Investor Profit Share Calculation */}
              <div className="space-y-2 pt-1 border-t border-amber-200/60">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900">
                    {language === 'te' ? 'ఇన్వెస్టర్ లాభ వాటా లెక్క' : 'Investor Share Calculation'}
                  </span>
                  <div className="flex bg-white border border-amber-200 rounded-lg p-0.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setInvestorMode('rate')}
                      className={`px-2 py-0.5 rounded ${
                        investorMode === 'rate'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Rate / 1L / Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvestorMode('fixed')}
                      className={`px-2 py-0.5 rounded ${
                        investorMode === 'fixed'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Fixed ₹ Share
                    </button>
                  </div>
                </div>

                {investorMode === 'rate' ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Rate per Lakh per day (e.g. 80)"
                          value={investorRatePerLakhStr}
                          onChange={(e) => handleInvestorRateInput(e.target.value)}
                          className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black font-mono text-slate-800 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold shrink-0">
                        / 1L / day
                      </span>
                    </div>

                    {/* Quick rate chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">Quick Rate:</span>
                      {[50, 60, 70, 80, 100].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => {
                            setInvestorRatePerLakh(rate);
                            setInvestorRatePerLakhStr(String(rate));
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                            investorRatePerLakh === rate
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          ₹{rate}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Total fixed profit share (₹)..."
                        value={investorFixedShareStr}
                        onChange={(e) => handleInvestorFixedShareInput(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-sm font-black font-mono text-slate-800 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                {/* 1k+ Quick Add for Investor Share */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block">
                    {language === 'te' ? 'ఇన్వెస్టర్ వాటా త్వరిత జోడింపు (1k+)' : '1k+ Quick Add (Investor Share):'}
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => addInvestorShare(1000)}
                      className="py-1.5 bg-white hover:bg-amber-50 border border-amber-300 active:scale-95 text-amber-950 rounded-xl text-xs font-black font-mono transition text-center shadow-2xs cursor-pointer"
                    >
                      +1,000
                    </button>
                    <button
                      type="button"
                      onClick={() => addInvestorShare(2000)}
                      className="py-1.5 bg-white hover:bg-amber-50 border border-amber-300 active:scale-95 text-amber-950 rounded-xl text-xs font-black font-mono transition text-center shadow-2xs cursor-pointer"
                    >
                      +2,000
                    </button>
                    <button
                      type="button"
                      onClick={() => addInvestorShare(5000)}
                      className="py-1.5 bg-white hover:bg-amber-50 border border-amber-300 active:scale-95 text-amber-950 rounded-xl text-xs font-black font-mono transition text-center shadow-2xs cursor-pointer"
                    >
                      +5,000
                    </button>
                    <button
                      type="button"
                      onClick={clearInvestorShare}
                      className="py-1.5 bg-amber-100/70 hover:bg-amber-200 active:scale-95 text-amber-900 rounded-xl text-xs font-bold transition text-center cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Investor Payout Breakdown & Transfer Confirmation */}
              <div className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Principal {formatINR(investorPrincipal)} + Share {formatINR(calculatedInvestorShare)}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Total to Pay Investor</span>
                    <span className="text-sm font-black font-mono text-amber-900">
                      {formatINR(totalInvestorPayout)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInvestorTransferred(!investorTransferred)}
                  className={`w-full py-2 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                    investorTransferred
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>
                    {investorTransferred 
                      ? (language === 'te' ? 'ఇన్వెస్టర్‌కు పంపాను ✓' : 'Transferred to Investor ✓')
                      : (language === 'te' ? 'ఇన్వెస్టర్‌కు బదిలీ చేయి' : 'Mark Transferred to Investor')}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center justify-between">
              <span className="font-semibold">
                {language === 'te' ? 'సొంత పెట్టుబడితో చేసిన డీల్ (ఇన్వెస్టర్ వాటా లేదు)' : 'Funded with Own Money (No Investor Share)'}
              </span>
              <span className="font-bold">₹0 Payout</span>
            </div>
          )}
        </div>

        {/* SECTION B: Agent / Broker Commission */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                <Handshake className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {language === 'te' ? 'ఏజెంట్ వివరాలు' : 'Agent Details'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {language === 'te' ? 'బ్రోకర్ లేదా ఏజెంట్ కమిషన్' : 'Broker / Agent commission payout'}
                </span>
              </div>
            </div>

            {/* Agent Toggle Pill */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setHasAgent(false);
                  setAgentTransferred(false);
                }}
                className={`px-2.5 py-1 rounded-md transition ${
                  !hasAgent
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {language === 'te' ? 'ఏజెంట్ లేరు' : 'No Agent'}
              </button>
              <button
                type="button"
                onClick={() => setHasAgent(true)}
                className={`px-2.5 py-1 rounded-md transition ${
                  hasAgent
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {language === 'te' ? 'ఏజెంట్ కమిషన్' : 'Agent Commission'}
              </button>
            </div>
          </div>

          {/* Expanded Agent Form */}
          {hasAgent ? (
            <div className="bg-sky-50/40 border border-sky-200/80 rounded-xl p-3 space-y-3">
              {/* Agent Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-sky-900 flex items-center justify-between">
                  <span>{language === 'te' ? 'ఏజెంట్ పేరు' : 'Agent Name'}</span>
                  {agents.length > 0 && (
                    <span className="text-[10px] text-sky-700">
                      {agents.length} registered
                    </span>
                  )}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {agents.length > 0 && (
                    <select
                      value={selectedAgentId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedAgentId(val);
                        if (val !== 'custom') {
                          const found = agents.find((ag) => ag.id === val);
                          if (found) setAgentName(found.name);
                        }
                      }}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                    >
                      <option value="custom">+ Type Name Directly</option>
                      {agents.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <input
                    type="text"
                    placeholder={language === 'te' ? 'ఏజెంట్ పేరు రాయండి...' : 'Enter Agent Name...'}
                    value={agentName}
                    onChange={(e) => {
                      setAgentName(e.target.value);
                      setSelectedAgentId('custom');
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Commission Calculation */}
              <div className="space-y-2 pt-1 border-t border-sky-200/60">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-sky-900">
                    {language === 'te' ? 'కమిషన్ లెక్క' : 'Commission Calculation'}
                  </span>
                  <div className="flex bg-white border border-sky-200 rounded-lg p-0.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setAgentMode('rate')}
                      className={`px-2 py-0.5 rounded ${
                        agentMode === 'rate'
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Rate / 1L / Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgentMode('fixed')}
                      className={`px-2 py-0.5 rounded ${
                        agentMode === 'fixed'
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Fixed ₹ Commission
                    </button>
                  </div>
                </div>

                {agentMode === 'rate' ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Commission per Lakh per day (e.g. 30)"
                          value={agentRatePerLakhStr}
                          onChange={(e) => handleAgentRateInput(e.target.value)}
                          className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black font-mono text-slate-800 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold shrink-0">
                        / 1L / day
                      </span>
                    </div>

                    {/* Quick rate chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">Quick Rate:</span>
                      {[20, 30, 40, 50, 100].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => {
                            setAgentRatePerLakh(rate);
                            setAgentRatePerLakhStr(String(rate));
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                            agentRatePerLakh === rate
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          ₹{rate}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Total fixed commission amount (₹)..."
                        value={agentFixedCommStr}
                        onChange={(e) => handleAgentFixedCommInput(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-sm font-black font-mono text-slate-800 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                )}

                {/* 100+ Quick Add for Agent Commission */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-extrabold text-sky-900 uppercase tracking-wider block">
                    {language === 'te' ? 'కమిషన్ త్వరిత జోడింపు (100+)' : '100+ Quick Add (Agent Commission):'}
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => addAgentCommission(100)}
                      className="py-1.5 bg-white hover:bg-sky-50 border border-sky-300 active:scale-95 text-sky-950 rounded-xl text-xs font-black font-mono transition text-center shadow-2xs cursor-pointer"
                    >
                      +100
                    </button>
                    <button
                      type="button"
                      onClick={() => addAgentCommission(200)}
                      className="py-1.5 bg-white hover:bg-sky-50 border border-sky-300 active:scale-95 text-sky-950 rounded-xl text-xs font-black font-mono transition text-center shadow-2xs cursor-pointer"
                    >
                      +200
                    </button>
                    <button
                      type="button"
                      onClick={() => addAgentCommission(500)}
                      className="py-1.5 bg-white hover:bg-sky-50 border border-sky-300 active:scale-95 text-sky-950 rounded-xl text-xs font-black font-mono transition text-center shadow-2xs cursor-pointer"
                    >
                      +500
                    </button>
                    <button
                      type="button"
                      onClick={clearAgentCommission}
                      className="py-1.5 bg-sky-100/70 hover:bg-sky-200 active:scale-95 text-sky-900 rounded-xl text-xs font-bold transition text-center cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Agent Payout Breakdown & Confirmation */}
              <div className="bg-white border border-sky-200 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {agentMode === 'rate'
                      ? `${principalUnits}L × ₹${agentRatePerLakh || 0} × ${durationDays}d`
                      : 'Fixed Commission'}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Total Commission</span>
                    <span className="text-sm font-black font-mono text-sky-900">
                      {formatINR(calculatedAgentCommission)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAgentTransferred(!agentTransferred)}
                  className={`w-full py-2 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                    agentTransferred
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>
                    {agentTransferred 
                      ? (language === 'te' ? 'ఏజెంట్‌కు పంపాను ✓' : 'Transferred to Agent ✓')
                      : (language === 'te' ? 'ఏజెంట్‌కు బదిలీ చేయి' : 'Mark Transferred to Agent')}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-500 flex items-center justify-between">
              <span>{language === 'te' ? 'ఏజెంట్ కమిషన్ లేదు' : 'No Agent Commission for this deal'}</span>
              <span className="font-semibold">₹0</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. The Golden Profit Box */}
      <div className="bg-[#1E293B] border-2 border-[#C5A059] rounded-2xl p-4 text-white shadow-lg space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C5A059] block">
          {language === 'te' ? 'మీ జేబులో మిగిలే నికర లాభం' : 'Net Cash in Your Pocket'}
        </span>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-black font-mono text-emerald-400">
            {formatINR(realOwnerProfit)}
          </span>
          <span className="text-xs text-slate-400">
            (Gross Interest: +{formatINR(grossInterest)})
          </span>
        </div>

        {/* Dynamic split explanation */}
        <div className="text-[11px] text-slate-300 border-t border-slate-800 pt-2 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Collected: {formatINR(actualReceived)}</span>
            <span>Principal: {formatINR(deal.principal)}</span>
          </div>
          {(hasInvestor || hasAgent) && (
            <div className="flex items-center justify-between text-xs text-amber-200/90 pt-0.5">
              {hasInvestor && (
                <span>
                  🏦 Investor Share: -{formatINR(calculatedInvestorShare)}
                </span>
              )}
              {hasAgent && (
                <span>
                  🤝 Agent Comm: -{formatINR(calculatedAgentCommission)}
                </span>
              )}
            </div>
          )}
          <p className="text-[10px] text-slate-400 pt-1">
            {language === 'te' 
              ? 'ఈ లాభం మీదే. ఇన్వెస్టర్ & ఏజెంట్ వాటాలు తీసివేయబడ్డాయి.' 
              : 'All investor and agent shares are accounted for. This is your pure daily profit.'}
          </p>
        </div>
      </div>

      {/* 4. The Master Action: "Call it a Day" */}
      <button
        type="button"
        onClick={handleCallDay}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white font-black text-base shadow-xl flex items-center justify-center space-x-2 transition cursor-pointer"
      >
        <CheckCircle2 className="w-5 h-5" />
        <span>
          {language === 'te' 
            ? '🏁 డబ్బులన్నీ పంచాను — రోజు ముగిసింది!' 
            : '🏁 Transferred All — Call it a Day!'}
        </span>
      </button>
    </div>
  );
};
