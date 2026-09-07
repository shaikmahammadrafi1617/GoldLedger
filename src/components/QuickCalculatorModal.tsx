import React, { useState } from 'react';
import { 
  Calculator, 
  X, 
  Coins, 
  Plus, 
  ArrowRight, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  Percent
} from 'lucide-react';
import { Language } from '../types';
import { formatINR, formatNumberWithCommas } from '../utils/formatters';
import { getT } from '../utils/translations';

interface QuickCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onApplyToNewTransaction?: (data: {
    principal: number;
    customerRatePerLakh: number;
    ratePeriod: 'per_day' | 'per_month' | 'per_year';
    investorAmount?: number;
    investorRate?: number;
    agentRate?: number;
  }) => void;
}

export const QuickCalculatorModal: React.FC<QuickCalculatorModalProps> = ({
  isOpen,
  onClose,
  language,
  onApplyToNewTransaction,
}) => {
  const t = getT(language);

  // Calculator inputs matching prototype exactly
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [loanAmountStr, setLoanAmountStr] = useState<string>('');
  const [durationVal, setDurationVal] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<'days' | 'months' | 'years'>('days');
  const [ratePeriod, setRatePeriod] = useState<'per_day' | 'per_month' | 'per_year'>('per_day');
  const [customerRate, setCustomerRate] = useState<number>(0);
  const [customerRateStr, setCustomerRateStr] = useState<string>('');

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [investorAmount, setInvestorAmount] = useState<number>(0);
  const [investorAmountStr, setInvestorAmountStr] = useState<string>('');
  const [investorRate, setInvestorRate] = useState<number>(1000);
  const [agentRate, setAgentRate] = useState<number>(400);

  const handleLoanAmountInput = (val: string) => {
    const raw = val.replace(/\D/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    setLoanAmount(num);
    setLoanAmountStr(num > 0 ? formatNumberWithCommas(num) : '');
  };

  const handleInvestorAmountInput = (val: string) => {
    const raw = val.replace(/\D/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    setInvestorAmount(num);
    setInvestorAmountStr(num > 0 ? formatNumberWithCommas(num) : '');
  };

  const handleCustomerRateInput = (val: string) => {
    const raw = val.replace(/\D/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    setCustomerRate(num);
    setCustomerRateStr(num > 0 ? formatNumberWithCommas(num) : '');
  };

  if (!isOpen) return null;

  // Calculation logic exactly following user specification
  const cappedInvestorAmount = Math.min(investorAmount, loanAmount);

  let timeMultiplier = 0;
  if (ratePeriod === 'per_month') {
    if (durationUnit === 'days') timeMultiplier = durationVal / 30;
    else if (durationUnit === 'months') timeMultiplier = durationVal;
    else if (durationUnit === 'years') timeMultiplier = durationVal * 12;
  } else if (ratePeriod === 'per_day') {
    if (durationUnit === 'days') timeMultiplier = durationVal;
    else if (durationUnit === 'months') timeMultiplier = durationVal * 30;
    else if (durationUnit === 'years') timeMultiplier = durationVal * 365;
  } else if (ratePeriod === 'per_year') {
    if (durationUnit === 'days') timeMultiplier = durationVal / 365;
    else if (durationUnit === 'months') timeMultiplier = durationVal / 12;
    else if (durationUnit === 'years') timeMultiplier = durationVal;
  }

  const totalUnits = loanAmount / 100000;
  const investorUnits = cappedInvestorAmount / 100000;

  const totalProfit = Math.round(totalUnits * customerRate * timeMultiplier);
  const totalCollect = loanAmount + totalProfit;

  const agentProfit = Math.round(totalUnits * (showAdvanced ? agentRate : 0) * timeMultiplier);
  const investorProfit = Math.round(investorUnits * (showAdvanced ? investorRate : 0) * timeMultiplier);
  const totalPayToInvestor = cappedInvestorAmount > 0 ? cappedInvestorAmount + investorProfit : 0;

  const ownerNetProfit = totalProfit - investorProfit - agentProfit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 text-[#1E293B] rounded-xl max-w-lg w-full shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center font-bold border border-[#C5A059]/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1E293B] tracking-tight">
                Finance Calculator (కాలిక్యులేటర్)
              </h3>
              <p className="text-xs text-slate-500">
                Gold Loan Balance Transfer • Flat Rate per ₹1 Lakh
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

        {/* Calculator Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Card 1: Main Loan Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <span>1. Loan Details (అసలు వివరాలు)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loan Amount (లోన్ మొత్తం)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={loanAmountStr}
                  onChange={(e) => handleLoanAmountInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold text-base focus:border-[#C5A059] focus:outline-none font-mono"
                  placeholder="Enter loan amount"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration (వ్యవధి)
                </label>
                <input
                  type="number"
                  min="1"
                  value={durationVal}
                  onChange={(e) => setDurationVal(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit (యూనిట్)
                </label>
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:border-[#C5A059] focus:outline-none"
                >
                  <option value="days">Days (రోజులు)</option>
                  <option value="months">Months (నెలలు)</option>
                  <option value="years">Years (సం.)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rate Period (వర్తించే విధానం)
                </label>
                <select
                  value={ratePeriod}
                  onChange={(e) => setRatePeriod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:border-[#C5A059] focus:outline-none"
                >
                  <option value="per_day">Per Day (రోజుకు)</option>
                  <option value="per_month">Per Month (నెలకు)</option>
                  <option value="per_year">Per Year (సం.)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Rate per 1L (వడ్డీ)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customerRateStr}
                    onChange={(e) => handleCustomerRateInput(e.target.value)}
                    className="w-full pl-7 pr-2 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold focus:border-[#C5A059] focus:outline-none"
                    placeholder="Enter rate"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Advanced Options (Collapsible) */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-3.5 flex items-center justify-between text-left text-xs font-bold text-[#C5A059] hover:bg-slate-100 transition"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>2. Advanced Options (Investor & Agent)</span>
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="p-4 pt-2 space-y-3 border-t border-slate-200 bg-white">
                <p className="text-[11px] text-slate-500">
                  Leave zero for 100% owner profit (వదిలేస్తే, మొత్తం లాభం మీకే వస్తుంది).
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Investor Amount (ఇన్వెస్టర్ పెట్టుబడి)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={investorAmountStr}
                      onChange={(e) => handleInvestorAmountInput(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:border-[#C5A059] focus:bg-white focus:outline-none font-mono"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Investor Rate / 1L
                    </label>
                    <input
                      type="number"
                      step="100"
                      value={investorRate}
                      onChange={(e) => setInvestorRate(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:border-[#C5A059] focus:bg-white focus:outline-none"
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Agent Commission / 1L
                    </label>
                    <input
                      type="number"
                      step="50"
                      value={agentRate}
                      onChange={(e) => setAgentRate(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:border-[#C5A059] focus:bg-white focus:outline-none"
                      placeholder="400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Results Display */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs font-mono text-slate-700">
            <div className="text-xs font-sans font-bold text-[#1E293B] uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
              <span>Final Results (ఫలితాలు)</span>
              <span className="text-[10px] text-slate-400 font-normal lowercase">instant calculation</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Principal (అసలు):</span>
              <span className="font-bold text-slate-900">{formatINR(loanAmount)}</span>
            </div>

            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Total Interest (మొత్తం వడ్డీ లాభం):</span>
              <span>+{formatINR(totalProfit)}</span>
            </div>

            {showAdvanced && cappedInvestorAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>To Investor (ఇన్వెస్టర్‌కు అసలు + వడ్డీ):</span>
                <span>{formatINR(totalPayToInvestor)}</span>
              </div>
            )}

            {showAdvanced && agentRate > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>To Agent Commission (ఏజెంట్‌కు):</span>
                <span>{formatINR(agentProfit)}</span>
              </div>
            )}

            <div className="flex justify-between text-[#C5A059] font-bold text-base pt-2 border-t border-slate-200 font-sans">
              <span>Owner Net Profit (ఓనర్ నికర లాభం):</span>
              <span>{formatINR(ownerNetProfit)}</span>
            </div>

            <div className="flex justify-between text-slate-900 font-bold pt-1 text-xs">
              <span>Total to Collect (వసూలు చేయాల్సినది):</span>
              <span>{formatINR(totalCollect)}</span>
            </div>
          </div>

          {/* Action to create transaction directly */}
          {onApplyToNewTransaction && (
            <button
              type="button"
              onClick={() => {
                onApplyToNewTransaction({
                  principal: loanAmount,
                  customerRatePerLakh: customerRate,
                  ratePeriod,
                  investorAmount: showAdvanced ? cappedInvestorAmount : 0,
                  investorRate: showAdvanced ? investorRate : 0,
                  agentRate: showAdvanced ? agentRate : 0,
                });
                onClose();
              }}
              className="w-full py-2.5 rounded-xl font-bold bg-[#C5A059] hover:bg-[#b08e4d] text-white transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Active Disbursal with These Values</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
