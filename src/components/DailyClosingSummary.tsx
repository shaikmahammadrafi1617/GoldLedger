import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ArrowDownRight, 
  Coins, 
  TrendingUp, 
  User, 
  Building2, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Transaction, Language } from '../types';
import { formatINR, formatDateReadable, calculateFinancials, calculateDurationDays } from '../utils/formatters';
import { getT } from '../utils/translations';

interface DailyClosingSummaryProps {
  selectedDate: string; // YYYY-MM-DD
  transactions: Transaction[];
  language: Language;
  onSelectTransaction: (tx: Transaction) => void;
  onCompleteTransaction: (tx: Transaction) => void;
}

export const DailyClosingSummary: React.FC<DailyClosingSummaryProps> = ({
  selectedDate,
  transactions,
  language,
  onSelectTransaction,
  onCompleteTransaction,
}) => {
  const t = getT(language);

  // Completed transactions specifically on this date
  const completedOnDate = transactions.filter(
    (tx) => tx.status === 'completed' && tx.returnDate === selectedDate
  );

  // Active transactions on this date (started on or before, and either not returned or returned after this date)
  const activeOnDate = transactions.filter((tx) => {
    if (tx.status === 'cancelled') return false;
    const isStarted = tx.givenDate <= selectedDate;
    if (!isStarted) return false;
    if (tx.status === 'completed') {
      return tx.returnDate && tx.returnDate >= selectedDate;
    }
    return true;
  });

  // Calculate totals for transactions completed on this date
  let principalReturnedToday = 0;
  let grossInterestToday = 0;
  let ownerNetProfitToday = 0;

  completedOnDate.forEach((tx) => {
    principalReturnedToday += tx.principal;
    const fin = calculateFinancials(tx, tx.durationDays);
    const gross = tx.finalGrossInterest !== undefined ? tx.finalGrossInterest : fin.grossInterest;
    const net = tx.finalOwnerProfit !== undefined ? tx.finalOwnerProfit : fin.ownerNetProfit;
    grossInterestToday += gross;
    ownerNetProfitToday += net;
  });

  // Total active money outside on this date (loans that were active on this date)
  const currentlyOutsideOnDate = activeOnDate
    .filter((tx) => tx.status === 'active' || tx.status === 'needs_followup')
    .reduce((sum, tx) => sum + tx.principal, 0);

  return (
    <div id="daily-closing-summary-card" className="bg-white text-[#1E293B] rounded-xl p-5 sm:p-6 border border-slate-200 shadow-sm mt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 mb-5">
        <div>
          <div className="flex items-center space-x-2 text-[#C5A059] text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span>{t.dailyClosingSummary}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#1E293B] mt-1 tracking-tight">
            {formatDateReadable(selectedDate)}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.dailyClosingDesc}
          </p>
        </div>

        {/* Quick Badge */}
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {completedOnDate.length} {t.completedTransactions}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {activeOnDate.filter(x => x.status === 'active').length} {t.activeTransactions}
          </span>
        </div>
      </div>

      {/* 3 Core Answers to Owner Questions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {/* Q1: How much money is currently outside? */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>{t.moneyOutside}</span>
            <Coins className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-[#1E293B]">
            {formatINR(currentlyOutsideOnDate)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Active in field on this date
          </div>
        </div>

        {/* Q2: Which transactions were completed / returned today? */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>{t.returnedToday}</span>
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {formatINR(principalReturnedToday)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {completedOnDate.length} {completedOnDate.length === 1 ? 'loan settled' : 'loans settled'}
          </div>
        </div>

        {/* Q3: How much interest and net profit came back today? */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 border-l-4 border-l-[#C5A059] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-[#C5A059] text-xs font-semibold mb-1">
            <span>{t.netProfitToday}</span>
            <TrendingUp className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-2xl font-black text-[#C5A059]">
            {formatINR(ownerNetProfitToday)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
            <span>Gross Interest: {formatINR(grossInterestToday)}</span>
          </div>
        </div>
      </div>

      {/* Transactions List for This Date */}
      <div>
        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
          Transactions Associated with {formatDateReadable(selectedDate)}
        </h4>

        {completedOnDate.length === 0 && activeOnDate.length === 0 ? (
          <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <p className="text-sm">{t.noActivityOnDay}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Completed section */}
            {completedOnDate.map((tx, idx) => {
              const fin = calculateFinancials(tx, tx.durationDays);
              const interest = tx.finalGrossInterest !== undefined ? tx.finalGrossInterest : fin.grossInterest;
              const netProfit = tx.finalOwnerProfit !== undefined ? tx.finalOwnerProfit : fin.ownerNetProfit;

              return (
                <div
                  key={tx.id}
                  id={`daily-tx-${tx.id}`}
                  onClick={() => onSelectTransaction(tx)}
                  className="bg-slate-50 hover:bg-slate-100/80 rounded-xl p-4 border border-slate-200 transition cursor-pointer hover:border-emerald-500/60 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                        Transaction {idx + 1} • {t.completedTransactions}
                      </span>
                      <span className="text-xs text-slate-600 font-semibold">
                        ({tx.customerName})
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded">
                      {tx.durationDays || calculateDurationDays(tx.givenDate, tx.returnDate)} {t.days}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">{t.agent}:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        {tx.agentName}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block">{t.principal}:</span>
                      <span className="font-bold text-[#1E293B] text-sm mt-0.5 block">
                        {formatINR(tx.principal)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block">{t.interestReceived}:</span>
                      <span className="font-bold text-emerald-600 text-sm mt-0.5 block">
                        {formatINR(interest)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block">{t.ownerNetProfit}:</span>
                      <span className="font-bold text-[#C5A059] text-sm mt-0.5 block">
                        {formatINR(netProfit)}
                      </span>
                    </div>
                  </div>

                  {(tx.releaseBank || tx.targetBank) && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {tx.releaseBank} ➔ {tx.targetBank}
                      </span>
                      {tx.enableProfitSharing && (
                        <span className="text-[#C5A059] font-medium">
                          Profit Sharing Distributed
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Active on this date section */}
            {activeOnDate
              .filter((tx) => tx.status !== 'completed')
              .map((tx) => {
                const daysActiveSoFar = calculateDurationDays(tx.givenDate, selectedDate);
                const fin = calculateFinancials(tx, daysActiveSoFar);

                return (
                  <div
                    key={tx.id}
                    id={`daily-tx-active-${tx.id}`}
                    onClick={() => onSelectTransaction(tx)}
                    className="bg-slate-50 hover:bg-slate-100/80 rounded-xl p-4 border border-blue-200 transition cursor-pointer shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          tx.status === 'needs_followup' ? 'bg-amber-500' : 'bg-blue-500 animate-pulse'
                        }`}></span>
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                          {tx.status === 'needs_followup' ? t.followupTransactions : t.activeTransactions}
                        </span>
                        <span className="text-xs text-slate-700 font-semibold">
                          {tx.customerName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500">
                          Active {daysActiveSoFar} {t.days}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCompleteTransaction(tx);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#C5A059] hover:bg-[#b08e4d] text-white font-bold text-xs shadow-xs transition"
                        >
                          {t.completeTransaction}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">{t.agent}:</span>
                        <span className="font-semibold text-slate-800 mt-0.5 block">{tx.agentName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">{t.principal}:</span>
                        <span className="font-bold text-[#1E293B] text-sm mt-0.5 block">{formatINR(tx.principal)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Accrued Interest:</span>
                        <span className="font-bold text-emerald-600 text-sm mt-0.5 block">{formatINR(fin.grossInterest)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Est. Owner Profit:</span>
                        <span className="font-bold text-[#C5A059] text-sm mt-0.5 block">{formatINR(fin.ownerNetProfit)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
