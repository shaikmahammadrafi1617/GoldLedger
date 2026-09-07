import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  X, 
  Coins, 
  Calendar, 
  TrendingUp, 
  User, 
  Landmark, 
  ShieldCheck, 
  Sparkles,
  ArrowDownRight
} from 'lucide-react';
import { Transaction, Language } from '../types';
import { formatINR, calculateFinancials, calculateDurationDays, getTodayDateString } from '../utils/formatters';
import { getT } from '../utils/translations';

interface CompleteTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (completedData: {
    transactionId: string;
    returnDate: string;
    actualMoneyReceived: number;
    durationDays: number;
    finalGrossInterest: number;
    finalOwnerProfit: number;
    finalAgentCommission: number;
    finalInvestorShare: number;
    agentCommissionSettled: boolean;
    investorSettled: boolean;
    notes?: string;
  }) => void;
  transaction: Transaction | null;
  language: Language;
}

export const CompleteTransactionModal: React.FC<CompleteTransactionModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  transaction,
  language,
}) => {
  const t = getT(language);

  const [returnDate, setReturnDate] = useState(getTodayDateString());
  const [actualDurationDays, setActualDurationDays] = useState(1);
  const [actualMoneyReceived, setActualMoneyReceived] = useState<number>(0);
  const [notes, setNotes] = useState('');
  
  // Settle checkboxes
  const [settleAgentCommission, setSettleAgentCommission] = useState(true);
  const [settleInvestors, setSettleInvestors] = useState(true);

  // Initialize calculation when opening
  useEffect(() => {
    if (transaction) {
      const today = getTodayDateString();
      const defaultReturn = transaction.returnDate || today;
      setReturnDate(defaultReturn);

      const days = transaction.durationDays || calculateDurationDays(transaction.givenDate, defaultReturn);
      setActualDurationDays(days);

      const fin = calculateFinancials(transaction, days);
      const suggestedTotal = transaction.actualMoneyReceived !== undefined 
        ? transaction.actualMoneyReceived 
        : fin.totalAmountExpected;

      setActualMoneyReceived(suggestedTotal);
      setNotes(transaction.notes || '');
      setSettleAgentCommission(true);
      setSettleInvestors(true);
    }
  }, [transaction, isOpen]);

  // Recalculate duration when return date changes
  const handleReturnDateChange = (newDate: string) => {
    setReturnDate(newDate);
    if (transaction) {
      const days = calculateDurationDays(transaction.givenDate, newDate);
      setActualDurationDays(days);
      const fin = calculateFinancials(transaction, days);
      setActualMoneyReceived(fin.totalAmountExpected);
    }
  };

  const handleDurationChange = (days: number) => {
    const validDays = Math.max(1, days);
    setActualDurationDays(validDays);
    if (transaction) {
      const fin = calculateFinancials(transaction, validDays);
      setActualMoneyReceived(fin.totalAmountExpected);
    }
  };

  if (!isOpen || !transaction) return null;

  // Calculate financials based on actual duration and actual money received
  const fin = calculateFinancials(transaction, actualDurationDays);
  
  // Real gross interest received: actualMoneyReceived - principal
  const calculatedGrossInterest = Math.max(0, actualMoneyReceived - transaction.principal);
  
  // If profit sharing is enabled, deduct agent and investor shares
  const agentCommission = transaction.enableProfitSharing ? fin.agentCommission : 0;
  const investorShare = transaction.enableProfitSharing ? fin.investorTotalShare : 0;
  const calculatedOwnerNetProfit = calculatedGrossInterest - agentCommission - investorShare;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      transactionId: transaction.id,
      returnDate,
      actualMoneyReceived: Number(actualMoneyReceived),
      durationDays: actualDurationDays,
      finalGrossInterest: calculatedGrossInterest,
      finalOwnerProfit: calculatedOwnerNetProfit,
      finalAgentCommission: agentCommission,
      finalInvestorShare: investorShare,
      agentCommissionSettled: settleAgentCommission,
      investorSettled: settleInvestors,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 text-[#1E293B] rounded-xl max-w-xl w-full shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1E293B] flex items-center gap-2 tracking-tight">
                <span>{t.completeTransaction}</span>
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold">
                  RECEIVE CASH
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Record actual money returned from bank repledge & compute final profit
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Summary Box of the Transaction */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 block text-[11px]">{t.customerName}</span>
              <span className="font-bold text-[#1E293B] block mt-0.5 truncate">{transaction.customerName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">{t.agent}</span>
              <span className="font-bold text-[#1E293B] block mt-0.5 truncate">{transaction.agentName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Principal Given</span>
              <span className="font-bold text-[#C5A059] block mt-0.5">{formatINR(transaction.principal)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Money Given On</span>
              <span className="font-semibold text-slate-700 block mt-0.5">{transaction.givenDate}</span>
            </div>
          </div>

          {/* Actual Return Date & Days Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Actual Money Return Date <span className="text-emerald-600">*</span>
              </label>
              <input
                type="date"
                required
                value={returnDate}
                onChange={(e) => handleReturnDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:border-[#C5A059] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Active Days Count (రోజులు)
              </label>
              <input
                type="number"
                min="1"
                value={actualDurationDays}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:border-[#C5A059] focus:bg-white focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Auto-calculated from {transaction.givenDate} to {returnDate}
              </p>
            </div>
          </div>

          {/* Actual Total Money Received Input */}
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4" />
                <span>Actual Total Money Received (మొత్తం వచ్చినది)</span>
              </label>
              <span className="text-xs text-slate-500">
                Principal + Interest
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-3 text-emerald-700 font-bold text-lg">₹</span>
              <input
                type="number"
                step="500"
                min={transaction.principal}
                required
                value={actualMoneyReceived}
                onChange={(e) => setActualMoneyReceived(Number(e.target.value))}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-emerald-300 rounded-lg text-slate-900 font-bold text-xl focus:border-emerald-600 focus:outline-none shadow-xs"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <span>Gross Interest Received:</span>
              <strong className="text-emerald-700 text-sm font-mono font-bold">
                {formatINR(calculatedGrossInterest)}
              </strong>
            </div>
          </div>

          {/* Profit Breakdown Calculation */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono text-xs text-slate-700">
            <div className="text-[11px] text-slate-500 font-sans font-bold uppercase tracking-wider border-b border-slate-200 pb-1.5 mb-2">
              Profit Distribution Breakdown ({actualDurationDays} {t.days})
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Total Gross Interest Received:</span>
              <span className="text-emerald-700 font-bold">+{formatINR(calculatedGrossInterest)}</span>
            </div>

            {transaction.enableProfitSharing && (
              <>
                {investorShare > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>− Investor Share ({transaction.investors.length}):</span>
                    <span>−{formatINR(investorShare)}</span>
                  </div>
                )}
                {agentCommission > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>− Agent Commission ({transaction.agentName}):</span>
                    <span>−{formatINR(agentCommission)}</span>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between text-[#C5A059] font-bold text-base pt-2 border-t border-slate-200 font-sans">
              <span>Owner Final Net Profit:</span>
              <span>{formatINR(calculatedOwnerNetProfit)}</span>
            </div>
          </div>

          {/* Settlement Checkboxes for Agent & Investors */}
          {transaction.enableProfitSharing && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Instant Settlement Options
              </span>

              {agentCommission > 0 && (
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settleAgentCommission}
                    onChange={(e) => setSettleAgentCommission(e.target.checked)}
                    className="rounded text-[#C5A059] focus:ring-0"
                  />
                  <span>
                    Mark Agent Commission ({formatINR(agentCommission)}) as settled immediately
                  </span>
                </label>
              )}

              {investorShare > 0 && (
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settleInvestors}
                    onChange={(e) => setSettleInvestors(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-0"
                  />
                  <span>
                    Mark Investor Returns ({formatINR(investorShare)}) as settled immediately
                  </span>
                </label>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Closing Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cash received by owner at 5:30 PM. Handed ₹1,600 commission to Rafi."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-[#C5A059] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Confirm Completion & Profit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
