import React, { useState, useMemo } from 'react';
import { X, Delete, ArrowDownRight, Sparkles, Calculator, TrendingUp, Users, Share2, Check } from 'lucide-react';
import { Language } from '../../types';
import { 
  formatINR, 
  formatNumberWithCommas, 
  parseNumberFromCommas, 
  calculateCompoundDeal, 
  getDefaultGraceDays 
} from '../../utils/formatters';

interface AndroidCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onUseAmount: (amount: number) => void;
}

export const AndroidCalculatorModal: React.FC<AndroidCalculatorModalProps> = ({
  isOpen,
  onClose,
  language,
  onUseAmount,
}) => {
  const [calcTab, setCalcTab] = useState<'standard' | 'compound'>('compound');

  // Standard Calc state
  const [display, setDisplay] = useState('0');
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [resetNext, setResetNext] = useState(false);

  // Gold Loan Compound Calc state
  const [compPrincipalStr, setCompPrincipalStr] = useState('10,00,000');
  const [compRateStr, setCompRateStr] = useState('2,000');
  const [compAgentCommStr, setCompAgentCommStr] = useState('400');
  const [compGraceDays, setCompGraceDays] = useState(2);
  const [compDaysCount, setCompDaysCount] = useState(4);
  const [showInvestorSection, setShowInvestorSection] = useState(false);
  const [compInvestorAmountStr, setCompInvestorAmountStr] = useState('8,00,000');
  const [compInvestorRateStr, setCompInvestorRateStr] = useState('1,000');
  const [copiedShare, setCopiedShare] = useState(false);

  // Compute compound results
  const compoundResult = useMemo(() => {
    const principal = parseNumberFromCommas(compPrincipalStr) || 0;
    const ratePerLakh = parseNumberFromCommas(compRateStr) || 0;
    const agentCommRate = parseNumberFromCommas(compAgentCommStr) || 0;
    const invAmount = showInvestorSection ? (parseNumberFromCommas(compInvestorAmountStr) || 0) : 0;
    const invRate = showInvestorSection ? (parseNumberFromCommas(compInvestorRateStr) || 0) : 0;

    const investors = invAmount > 0 ? [{
      investorId: 'inv-sim',
      investorName: language === 'te' ? 'ఇన్వెస్టర్' : 'Investor',
      amount: invAmount,
      ratePerLakh: invRate,
    }] : [];

    return calculateCompoundDeal({
      principal,
      ratePerLakh,
      agentCommissionRatePerLakh: agentCommRate,
      durationDays: compDaysCount,
      graceDays: compGraceDays,
      investors,
    });
  }, [compPrincipalStr, compRateStr, compAgentCommStr, compGraceDays, compDaysCount, showInvestorSection, compInvestorAmountStr, compInvestorRateStr, language]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (display === '0' || resetNext) {
      setDisplay(digit);
      setResetNext(false);
    } else {
      setDisplay(display + digit);
    }
  };

  const handleOp = (operator: string) => {
    const current = parseFloat(display);
    if (prevVal === null) {
      setPrevVal(current);
    } else if (op) {
      const res = calculate(prevVal, current, op);
      setPrevVal(res);
      setDisplay(String(res));
    }
    setOp(operator);
    setResetNext(true);
  };

  const calculate = (a: number, b: number, operator: string): number => {
    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (prevVal !== null && op) {
      const current = parseFloat(display);
      const res = calculate(prevVal, current, op);
      setDisplay(String(res));
      setPrevVal(null);
      setOp(null);
      setResetNext(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevVal(null);
    setOp(null);
    setResetNext(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleQuickPercent = (rate: number) => {
    const current = parseFloat(display) || 0;
    const interest = (current * rate) / 100;
    setDisplay(String(Math.round(interest)));
    setResetNext(true);
  };

  const handleUseInDeal = (amount: number) => {
    if (amount > 0) {
      onUseAmount(amount);
      onClose();
    }
  };

  const handleShareCompoundWhatsApp = () => {
    const p = parseNumberFromCommas(compPrincipalStr) || 0;
    let msg = `*👑 GOLD LOAN COMPOUND CALCULATION*\n`;
    msg += `*అసలు (Principal):* ${formatINR(p)}\n`;
    msg += `*వడ్డీ రేటు:* ₹${compRateStr}/లక్షకి రోజుకి\n`;
    msg += `*ఏజెంట్ కమీషన్ రేటు:* ₹${compAgentCommStr}/లక్షకి\n`;
    msg += `*ఫ్లాట్ రోజులు (Grace Days):* ${compGraceDays} రోజులు\n`;
    msg += `--------------------------------\n`;
    compoundResult.dailyBreakdown.forEach((b) => {
      msg += `*Day ${b.day}:* ${formatINR(b.closingBalance)} (వడ్డీ: +${formatINR(b.interestAdded)}${b.isCompounded ? ' [చక్రవడ్డీ]' : ''} | కమీషన్: ${formatINR(b.cumulativeAgentCommission)})\n`;
    });
    msg += `--------------------------------\n`;
    msg += `*మొత్తం రావాల్సింది (${compDaysCount} రోజులు):* ${formatINR(compoundResult.totalAmountExpected)}\n`;
    msg += `*ఏజెంట్ కమీషన్:* ${formatINR(compoundResult.agentCommission)}\n`;
    if (compoundResult.investorTotalShare > 0) {
      msg += `*ఇన్వెస్టర్ వాటా:* ${formatINR(compoundResult.investorTotalShare)}\n`;
      msg += `*ఓనర్ నికర లాభం:* ${formatINR(compoundResult.ownerNetProfit)}\n`;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-3.5 max-h-[94vh] overflow-y-auto animate-in slide-in-from-bottom-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span>{language === 'te' ? 'క్యాలిక్యులేటర్' : 'Calculator'}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switch: Gold Loan Compounding vs Normal Keypad */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setCalcTab('compound')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              calcTab === 'compound'
                ? 'bg-[#C5A059] text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{language === 'te' ? 'రోజువారీ చక్రవడ్డీ' : 'Daily Compound'}</span>
          </button>
          <button
            type="button"
            onClick={() => setCalcTab('standard')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              calcTab === 'standard'
                ? 'bg-[#C5A059] text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{language === 'te' ? 'సాధారణ కీప్యాడ్' : 'Standard'}</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: GOLD LOAN COMPOUND CALC (Matches Owner Exact Rule)     */}
        {/* ============================================================ */}
        {calcTab === 'compound' && (
          <div className="space-y-3 font-sans">
            {/* Inputs: Principal & Rate */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  {language === 'te' ? 'అసలు మొత్తం (Principal)' : 'Principal (₹)'}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={compPrincipalStr}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const num = raw ? parseInt(raw, 10) : 0;
                      setCompPrincipalStr(num > 0 ? formatNumberWithCommas(num) : '');
                      if (num >= 1000000) setCompGraceDays(2);
                      else if (num > 0 && num <= 500000) setCompGraceDays(5);
                    }}
                    className="w-full pl-6 pr-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  {language === 'te' ? 'వడ్డీ రేటు (లక్షకు / రోజు)' : 'Rate / Lakh / Day'}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={compRateStr}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const num = raw ? parseInt(raw, 10) : 0;
                      setCompRateStr(num > 0 ? formatNumberWithCommas(num) : '');
                    }}
                    className="w-full pl-6 pr-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>
            </div>

            {/* Agent Commission & Grace Days */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  {language === 'te' ? 'ఏజెంట్ కమీషన్ (లక్షకు/రోజు)' : 'Agent Comm / 1L'}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={compAgentCommStr}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const num = raw ? parseInt(raw, 10) : 0;
                      setCompAgentCommStr(num > 0 ? formatNumberWithCommas(num) : '');
                    }}
                    className="w-full pl-6 pr-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  {language === 'te' ? 'చక్రవడ్డీ ప్రారంభం (Grace)' : 'Grace / Flat Days'}
                </label>
                <select
                  value={compGraceDays}
                  onChange={(e) => setCompGraceDays(parseInt(e.target.value, 10))}
                  className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#C5A059]"
                >
                  <option value={2}>2 {language === 'te' ? 'రోజులు (10L డిఫాల్ట్)' : 'Days (10L default)'}</option>
                  <option value={5}>5 {language === 'te' ? 'రోజులు (5L డిఫాల్ట్)' : 'Days (5L default)'}</option>
                  <option value={1}>1 {language === 'te' ? 'రోజు' : 'Day'}</option>
                  <option value={3}>3 {language === 'te' ? 'రోజులు' : 'Days'}</option>
                  <option value={6}>6 {language === 'te' ? 'రోజులు' : 'Days'}</option>
                  <option value={7}>7 {language === 'te' ? 'రోజులు' : 'Days'}</option>
                  <option value={0}>{language === 'te' ? 'ప్రతి రోజూ చక్రవడ్డీ' : 'Everyday Compound'}</option>
                </select>
              </div>
            </div>

            {/* Days Stepper */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  {language === 'te' ? 'ఎన్ని రోజులు లెక్కించాలి?' : 'Calculate for how many days?'}
                </label>
                <span className="text-xs font-mono font-black text-[#C5A059]">
                  {compDaysCount} {language === 'te' ? 'రోజులు' : 'Days'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[1, 2, 3, 4, 5, 7, 10].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setCompDaysCount(d)}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border transition ${
                      compDaysCount === d
                        ? 'bg-[#C5A059] text-white border-[#C5A059]'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {d}D
                  </button>
                ))}
              </div>
            </div>

            {/* Investor Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowInvestorSection(!showInvestorSection)}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>
                  {showInvestorSection 
                    ? (language === 'te' ? '- ఇన్వెస్టర్ వివరాలు దాచు' : '- Hide Investor') 
                    : (language === 'te' ? '+ ఇన్వెస్టర్ వాటా & ఓనర్ నికర లాభం లెక్కించండి' : '+ Calculate Investor Share & Net Profit')}
                </span>
              </button>

              {showInvestorSection && (
                <div className="mt-2 p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase block mb-1">
                      {language === 'te' ? 'ఇన్వెస్టర్ డబ్బు (₹)' : 'Investor Money (₹)'}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={compInvestorAmountStr}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        const num = raw ? parseInt(raw, 10) : 0;
                        setCompInvestorAmountStr(num > 0 ? formatNumberWithCommas(num) : '');
                      }}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase block mb-1">
                      {language === 'te' ? 'ఇన్వెస్టర్ రేటు (₹/లక్ష)' : 'Investor Rate (₹/1L)'}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={compInvestorRateStr}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        const num = raw ? parseInt(raw, 10) : 0;
                        setCompInvestorRateStr(num > 0 ? formatNumberWithCommas(num) : '');
                      }}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Results Table (Matches user's exact example) */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 text-slate-400 text-[10px] uppercase font-bold">
                <span>{language === 'te' ? 'రోజుల వారీ లెక్క' : 'Day-by-Day Timeline'}</span>
                <span>{language === 'te' ? 'రావాల్సింది | కమీషన్' : 'Return | Comm'}</span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {compoundResult.dailyBreakdown.map((b) => (
                  <div 
                    key={b.day} 
                    className={`flex justify-between items-center p-1.5 rounded-lg text-[11px] ${
                      b.day === compDaysCount ? 'bg-slate-800/80 border border-[#C5A059]/40' : 'bg-slate-900/50'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">Day {b.day}</span>
                        {b.isCompounded ? (
                          <span className="text-[9px] px-1 py-0.2 bg-amber-950/80 text-[#C5A059] border border-[#C5A059]/30 rounded font-sans font-bold">
                            {language === 'te' ? 'చక్రవడ్డీ' : 'Compounded'}
                          </span>
                        ) : (
                          <span className="text-[9px] px-1 py-0.2 bg-slate-800 text-slate-400 rounded font-sans">
                            {language === 'te' ? 'ఫ్లాట్' : 'Flat'}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        +{formatINR(b.interestAdded)} {language === 'te' ? 'వడ్డీ' : 'int'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-white text-xs">
                        {formatINR(b.closingBalance)}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-sans">
                        Comm: {formatINR(b.cumulativeAgentCommission)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Totals */}
              <div className="border-t border-slate-800 pt-2 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-white">
                  <span>{language === 'te' ? 'మొత్తం రావాల్సింది:' : 'Total to Return:'}</span>
                  <span className="text-emerald-400 text-sm font-black font-mono">
                    {formatINR(compoundResult.totalAmountExpected)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>{language === 'te' ? 'ఏజెంట్ కమీషన్:' : 'Agent Commission:'}</span>
                  <span className="font-bold text-[#C5A059] font-mono">
                    {formatINR(compoundResult.agentCommission)}
                  </span>
                </div>
                {showInvestorSection && compoundResult.investorTotalShare > 0 && (
                  <>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>{language === 'te' ? 'ఇన్వెస్టర్ వాటా (సాధారణ రోజులు):' : 'Investor Share (Simple Linear):'}</span>
                      <span className="font-bold text-rose-400 font-mono">
                        -{formatINR(compoundResult.investorTotalShare)}
                      </span>
                    </div>
                    <div className="flex justify-between font-black text-emerald-400 pt-1 border-t border-slate-800 text-xs">
                      <span>{language === 'te' ? 'ఓనర్ నికర లాభం:' : 'Owner Net Profit:'}</span>
                      <span className="font-mono text-sm">
                        {formatINR(compoundResult.ownerNetProfit)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleShareCompoundWhatsApp}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => handleUseInDeal(compoundResult.totalAmountExpected)}
                className="py-2.5 bg-[#C5A059] hover:bg-[#b08e4d] text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>{language === 'te' ? 'ఈ మొత్తాన్ని వాడండి' : 'Use Amount'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: STANDARD LCD KEYPAD                                   */}
        {/* ============================================================ */}
        {calcTab === 'standard' && (
          <div className="space-y-3.5">
            {/* LCD Display */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-right space-y-1 shadow-inner">
              <div className="text-xs font-mono text-slate-400 h-4">
                {prevVal !== null && op ? `${prevVal} ${op}` : ''}
              </div>
              <div className="text-3xl font-black font-mono text-white tracking-wider truncate">
                {display}
              </div>
              <div className="text-[11px] font-mono text-[#C5A059]">
                {formatINR(parseFloat(display) || 0)}
              </div>
            </div>

            {/* Gold Loan Quick Presets */}
            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-[10px] text-slate-400 whitespace-nowrap">Calc Interest:</span>
              <button
                type="button"
                onClick={() => handleQuickPercent(2)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[#C5A059] rounded-lg text-[10px] font-bold whitespace-nowrap"
              >
                2% వడ్డీ
              </button>
              <button
                type="button"
                onClick={() => handleQuickPercent(2.5)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[#C5A059] rounded-lg text-[10px] font-bold whitespace-nowrap"
              >
                2.5% వడ్డీ
              </button>
              <button
                type="button"
                onClick={() => handleQuickPercent(3)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[#C5A059] rounded-lg text-[10px] font-bold whitespace-nowrap"
              >
                3% వడ్డీ
              </button>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-4 gap-2 text-lg font-bold">
              <button
                type="button"
                onClick={handleClear}
                className="py-3 rounded-xl bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 border border-rose-800/40 transition active:scale-95"
              >
                C
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition active:scale-95 flex items-center justify-center"
              >
                <Delete className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleOp('÷')}
                className="py-3 rounded-xl bg-slate-800 text-[#C5A059] hover:bg-slate-700 transition active:scale-95"
              >
                ÷
              </button>
              <button
                type="button"
                onClick={() => handleOp('×')}
                className="py-3 rounded-xl bg-slate-800 text-[#C5A059] hover:bg-slate-700 transition active:scale-95"
              >
                ×
              </button>

              {['7', '8', '9'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigit(d)}
                  className="py-3 rounded-xl bg-slate-850 hover:bg-slate-750 text-white transition active:scale-95"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleOp('-')}
                className="py-3 rounded-xl bg-slate-800 text-[#C5A059] hover:bg-slate-700 transition active:scale-95"
              >
                -
              </button>

              {['4', '5', '6'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigit(d)}
                  className="py-3 rounded-xl bg-slate-850 hover:bg-slate-750 text-white transition active:scale-95"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleOp('+')}
                className="py-3 rounded-xl bg-slate-800 text-[#C5A059] hover:bg-slate-700 transition active:scale-95"
              >
                +
              </button>

              {['1', '2', '3'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigit(d)}
                  className="py-3 rounded-xl bg-slate-850 hover:bg-slate-750 text-white transition active:scale-95"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={handleEquals}
                className="py-3 rounded-xl bg-[#C5A059] text-white hover:bg-[#b08e4d] font-black transition active:scale-95 row-span-2 flex items-center justify-center"
              >
                =
              </button>

              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="py-3 rounded-xl bg-slate-850 hover:bg-slate-750 text-white transition active:scale-95 col-span-2"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleDigit('.')}
                className="py-3 rounded-xl bg-slate-850 hover:bg-slate-750 text-white transition active:scale-95"
              >
                .
              </button>
            </div>

            {/* Action: Use in Deal */}
            <button
              type="button"
              onClick={() => handleUseInDeal(parseFloat(display) || 0)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition active:scale-95"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>{language === 'te' ? 'ఈ మొత్తాన్ని కొత్త లెక్కలో వాడండి' : 'Use Amount in New Deal'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
