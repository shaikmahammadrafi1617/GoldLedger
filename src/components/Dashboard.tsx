import React from 'react';
import { 
  Coins, 
  ArrowDownRight, 
  TrendingUp, 
  CalendarDays, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Plus, 
  Calculator, 
  ArrowRight,
  ShieldAlert,
  Landmark,
  FileSpreadsheet
} from 'lucide-react';
import { Transaction, Agent, Language } from '../types';
import { formatINR, formatCompactINR, calculateFinancials, calculateDurationDays, getTodayDateString } from '../utils/formatters';
import { getT } from '../utils/translations';

interface DashboardProps {
  transactions: Transaction[];
  agents: Agent[];
  language: Language;
  onNewTransaction: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onCompleteTransaction: (tx: Transaction) => void;
  onViewCalendar: () => void;
  onOpenCalculator: () => void;
  onViewReports: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  agents,
  language,
  onNewTransaction,
  onSelectTransaction,
  onCompleteTransaction,
  onViewCalendar,
  onOpenCalculator,
  onViewReports,
}) => {
  const t = getT(language);
  const todayStr = getTodayDateString();

  // Parse current month (e.g. 2026-09)
  const currentMonthPrefix = todayStr.substring(0, 7);

  // Status counts
  const activeTxs = transactions.filter((tx) => tx.status === 'active');
  const completedTxs = transactions.filter((tx) => tx.status === 'completed');
  const followupTxs = transactions.filter((tx) => tx.status === 'needs_followup');
  const cancelledTxs = transactions.filter((tx) => tx.status === 'cancelled');

  // KPI 1: Total active principal outside right now
  const totalActivePrincipal = activeTxs.reduce((sum, tx) => sum + tx.principal, 0) +
    followupTxs.reduce((sum, tx) => sum + tx.principal, 0);

  // KPI 2: Total principal returned today
  const completedToday = completedTxs.filter((tx) => tx.returnDate === todayStr);
  const principalReturnedToday = completedToday.reduce((sum, tx) => sum + tx.principal, 0);

  // KPI 3: Total interest received today
  let interestReceivedToday = 0;
  let netProfitToday = 0;
  completedToday.forEach((tx) => {
    const fin = calculateFinancials(tx, tx.durationDays);
    const gross = tx.finalGrossInterest !== undefined ? tx.finalGrossInterest : fin.grossInterest;
    const net = tx.finalOwnerProfit !== undefined ? tx.finalOwnerProfit : fin.ownerNetProfit;
    interestReceivedToday += gross;
    netProfitToday += net;
  });

  // KPI 4: Total net profit this month
  const completedThisMonth = completedTxs.filter((tx) => tx.returnDate?.startsWith(currentMonthPrefix));
  let netProfitThisMonth = 0;
  let totalInterestThisMonth = 0;
  completedThisMonth.forEach((tx) => {
    const fin = calculateFinancials(tx, tx.durationDays);
    const gross = tx.finalGrossInterest !== undefined ? tx.finalGrossInterest : fin.grossInterest;
    const net = tx.finalOwnerProfit !== undefined ? tx.finalOwnerProfit : fin.ownerNetProfit;
    netProfitThisMonth += net;
    totalInterestThisMonth += gross;
  });

  // Agent-wise transaction summary
  const agentStats = agents.map((agent) => {
    const agentTxs = transactions.filter((tx) => tx.agentId === agent.id);
    const agentActive = agentTxs.filter((tx) => tx.status === 'active' || tx.status === 'needs_followup');
    const agentCompleted = agentTxs.filter((tx) => tx.status === 'completed');
    const totalHandled = agentTxs.reduce((sum, tx) => sum + tx.principal, 0);
    const activePrincipal = agentActive.reduce((sum, tx) => sum + tx.principal, 0);

    return {
      agent,
      totalTxs: agentTxs.length,
      activeCount: agentActive.length,
      completedCount: agentCompleted.length,
      totalHandled,
      activePrincipal,
    };
  });

  // Recent completed transactions (up to 5)
  const recentCompleted = [...completedTxs]
    .sort((a, b) => (b.returnDate || b.updatedAt).localeCompare(a.returnDate || a.updatedAt))
    .slice(0, 5);

  return (
    <div className="space-y-6 text-[#1E293B]">
      {/* Top Welcome / Hero Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#C5A059] text-xs font-bold uppercase tracking-wider mb-1">
            <Coins className="w-4 h-4" />
            <span>Owner Dashboard • Gold Balance Transfer</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight">
            Financial Ledger & Daily Returns
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">
            Real-time control over gold loan balance transfers, daily flat-rate interest earnings, field agents, and investor capital.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="dash-quick-calc-btn"
            onClick={onOpenCalculator}
            className="px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition flex items-center gap-1.5 shadow-xs"
          >
            <Calculator className="w-4 h-4 text-[#C5A059]" />
            <span>{t.calculator}</span>
          </button>

          <button
            id="dash-view-cal-btn"
            onClick={onViewCalendar}
            className="px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition flex items-center gap-1.5 shadow-xs"
          >
            <CalendarDays className="w-4 h-4 text-blue-500" />
            <span>{t.calendar}</span>
          </button>

          <button
            id="dash-new-tx-btn"
            onClick={onNewTransaction}
            className="px-4 py-2 rounded-lg text-xs sm:text-sm font-bold bg-[#C5A059] hover:bg-[#b38e4a] text-white shadow-sm shadow-[#C5A059]/20 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t.newTransaction}</span>
          </button>
        </div>
      </div>

      {/* 4 Main Core Metrics Cards matching Geometric Balance */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Active Principal */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Active Principal</div>
            <div className="text-2xl font-black text-[#1E293B]">{formatINR(totalActivePrincipal)}</div>
          </div>
          <div className="text-[10px] text-blue-600 mt-2 font-semibold flex items-center gap-1">
            <span>{activeTxs.length} Active Transactions</span>
            {followupTxs.length > 0 && <span className="text-amber-600 font-bold">• {followupTxs.length} Follow-up</span>}
          </div>
        </div>

        {/* Metric 2: Net Profit Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500 flex flex-col justify-between">
          <div>
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Net Profit Today</div>
            <div className="text-2xl font-black text-emerald-600">{formatINR(netProfitToday)}</div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 font-medium">
            {completedToday.length} Completed • Interest: {formatINR(interestReceivedToday)}
          </div>
        </div>

        {/* Metric 3: Monthly Owner Earnings */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Monthly Owner Earnings</div>
            <div className="text-2xl font-black text-[#1E293B]">{formatINR(netProfitThisMonth)}</div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 font-medium">
            Gross: {formatINR(totalInterestThisMonth)} • {completedThisMonth.length} closed
          </div>
        </div>

        {/* Metric 4: Investor Capital / Returned Today */}
        <div className="bg-[#C5A059] p-4 rounded-xl shadow-lg shadow-[#C5A059]/20 text-white flex flex-col justify-between">
          <div>
            <div className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">Principal Returned Today</div>
            <div className="text-2xl font-black text-white">{formatINR(principalReturnedToday)}</div>
          </div>
          <div 
            onClick={onViewCalendar}
            className="text-[10px] text-white/90 mt-2 font-medium underline cursor-pointer hover:text-white"
          >
            View Settlements & Closings ➔
          </div>
        </div>
      </section>

      {/* Active Transactions Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Active Field Transactions ({activeTxs.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Money currently with agents releasing gold at old banks
            </p>
          </div>
          <button
            onClick={onViewCalendar}
            className="text-xs font-bold text-[#C5A059] hover:text-[#b38e4a] flex items-center gap-1 transition"
          >
            <span>Timeline Bars</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeTxs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <p className="text-sm">No active transactions right now. All capital returned!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeTxs.map((tx) => {
              const daysActive = calculateDurationDays(tx.givenDate);
              const fin = calculateFinancials(tx, daysActive);

              return (
                <div
                  key={tx.id}
                  id={`dash-active-${tx.id}`}
                  onClick={() => onSelectTransaction(tx)}
                  className="bg-slate-50 hover:bg-slate-100/80 rounded-xl p-4 border border-slate-200 transition cursor-pointer hover:border-[#C5A059]/60 shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-800 truncate max-w-[140px] font-semibold">{tx.customerName}</span>
                    <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                      Day {daysActive}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl font-black text-[#1E293B]">
                      {formatINR(tx.principal)}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 font-mono">
                      +{formatINR(fin.grossInterest)} gross
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1 truncate max-w-[120px]">
                      <User className="w-3 h-3 text-slate-400" />
                      {tx.agentName}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCompleteTransaction(tx);
                      }}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs transition"
                    >
                      {t.completeTransaction}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: Agent Performance Summary & Recent Completed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-[#C5A059]" />
              <span>Agent Overview</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">{agents.length} active agents</span>
          </div>

          <div className="space-y-3">
            {agentStats.map((item) => (
              <div
                key={item.agent.id}
                className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-slate-800">{item.agent.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {item.agent.phone} • {item.completedCount} completed
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-[#1E293B]">
                    {formatINR(item.totalHandled)}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {item.activeCount > 0 ? (
                      <span className="text-blue-600 font-semibold">{formatINR(item.activePrincipal)} outside</span>
                    ) : (
                      'No active money'
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Completed Transactions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Recent Completed Transfers</span>
            </h3>
            <button
              onClick={onViewReports}
              className="text-xs font-bold text-[#C5A059] hover:text-[#b38e4a] flex items-center gap-1"
            >
              <span>{t.reports}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentCompleted.map((tx) => {
              const fin = calculateFinancials(tx, tx.durationDays);
              const profit = tx.finalOwnerProfit !== undefined ? tx.finalOwnerProfit : fin.ownerNetProfit;

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="bg-slate-50 hover:bg-slate-100 rounded-xl p-3 border border-slate-200 flex items-center justify-between cursor-pointer transition shadow-xs"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {tx.customerName}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Agent: {tx.agentName} • {tx.durationDays || calculateDurationDays(tx.givenDate, tx.returnDate)} days
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-800">
                      {formatINR(tx.principal)}
                    </div>
                    <div className="text-xs font-extrabold text-emerald-600 font-mono">
                      +{formatINR(profit)} net
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
