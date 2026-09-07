import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Coins, 
  User, 
  Calendar, 
  Building2, 
  Landmark, 
  Edit3, 
  Check, 
  Sparkles,
  ChevronDown,
  Trash2,
  FileText
} from 'lucide-react';
import { Transaction, Agent, Language, TransactionStatus } from '../types';
import { 
  formatINR, 
  formatCompactINR, 
  calculateFinancials, 
  calculateDurationDays, 
  formatDateReadable 
} from '../utils/formatters';
import { getT } from '../utils/translations';

interface TransactionListProps {
  transactions: Transaction[];
  agents: Agent[];
  language: Language;
  onNewTransaction: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onEditTransaction: (tx: Transaction) => void;
  onCompleteTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateStatus: (id: string, status: TransactionStatus) => void;
  onToggleSettled: (txId: string, type: 'agent' | 'investor', investorId?: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  agents,
  language,
  onNewTransaction,
  onSelectTransaction,
  onEditTransaction,
  onCompleteTransaction,
  onDeleteTransaction,
  onUpdateStatus,
  onToggleSettled,
}) => {
  const t = getT(language);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'profit_desc'>('date_desc');

  // Filtered & Sorted transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'with_investors') {
          if (!tx.investors || tx.investors.length === 0 || !tx.enableProfitSharing) return false;
        } else if (tx.status !== statusFilter) {
          return false;
        }
      }

      // Agent filter
      if (agentFilter !== 'all' && tx.agentId !== agentFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCustomer = tx.customerName.toLowerCase().includes(q);
        const matchesAgent = tx.agentName.toLowerCase().includes(q);
        const matchesBank = (tx.releaseBank + ' ' + tx.targetBank).toLowerCase().includes(q);
        const matchesAmount = tx.principal.toString().includes(q);
        const matchesDate = tx.givenDate.includes(q) || (tx.returnDate && tx.returnDate.includes(q));
        const matchesNotes = tx.notes ? tx.notes.toLowerCase().includes(q) : false;

        if (!matchesCustomer && !matchesAgent && !matchesBank && !matchesAmount && !matchesDate && !matchesNotes) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return (b.givenDate || '').localeCompare(a.givenDate || '');
      }
      if (sortBy === 'date_asc') {
        return (a.givenDate || '').localeCompare(b.givenDate || '');
      }
      if (sortBy === 'amount_desc') {
        return b.principal - a.principal;
      }
      if (sortBy === 'profit_desc') {
        const profitA = a.finalOwnerProfit !== undefined ? a.finalOwnerProfit : calculateFinancials(a).ownerNetProfit;
        const profitB = b.finalOwnerProfit !== undefined ? b.finalOwnerProfit : calculateFinancials(b).ownerNetProfit;
        return profitB - profitA;
      }
      return 0;
    });
  }, [transactions, statusFilter, agentFilter, searchQuery, sortBy]);

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'needs_followup':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 shadow-xs">
            <AlertCircle className="w-3.5 h-3.5" />
            Needs Follow-up
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1 shadow-xs">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-[#1E293B]">
      {/* Top Filter & Search Controls */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              id="tx-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 text-xs sm:text-sm focus:border-[#C5A059] focus:bg-white focus:outline-none transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Agent filter dropdown */}
            <select
              id="tx-agent-filter"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-semibold focus:border-[#C5A059] focus:outline-none"
            >
              <option value="all">{t.filterByAgent}</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            {/* Sort selector */}
            <select
              id="tx-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-semibold focus:border-[#C5A059] focus:outline-none"
            >
              <option value="date_desc">Latest Given First</option>
              <option value="date_asc">Oldest Given First</option>
              <option value="amount_desc">Highest Principal</option>
              <option value="profit_desc">Highest Net Profit</option>
            </select>

            {/* New button */}
            <button
              id="tx-list-new-btn"
              onClick={onNewTransaction}
              className="px-4 py-2 rounded-lg text-xs sm:text-sm font-bold bg-[#C5A059] hover:bg-[#b08e4d] text-white shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{t.newTransaction}</span>
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar border-t border-slate-200 pt-3">
          {[
            { id: 'all', label: 'All Transfers', count: transactions.length },
            { id: 'active', label: t.activeTransactions, count: transactions.filter(x => x.status === 'active').length },
            { id: 'completed', label: t.completedTransactions, count: transactions.filter(x => x.status === 'completed').length },
            { id: 'needs_followup', label: t.followupTransactions, count: transactions.filter(x => x.status === 'needs_followup').length },
            { id: 'with_investors', label: 'With Investors', count: transactions.filter(x => x.enableProfitSharing && x.investors?.length > 0).length },
            { id: 'cancelled', label: t.cancelledTransactions, count: transactions.filter(x => x.status === 'cancelled').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === tab.id ? 'bg-[#C5A059] text-white font-bold' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Cards List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 text-slate-500 shadow-sm">
            <Coins className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800 mb-1">No Balance Transfers Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No records match your filters. Try clearing the search or create a new disbursal.
            </p>
            <button
              onClick={onNewTransaction}
              className="mt-4 px-4 py-2 rounded-lg text-xs font-bold bg-[#C5A059] hover:bg-[#b08e4d] text-white inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t.newTransaction}</span>
            </button>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const daysActive = tx.durationDays || calculateDurationDays(tx.givenDate, tx.returnDate);
            const fin = calculateFinancials(tx, daysActive);
            const grossInterest = tx.finalGrossInterest !== undefined ? tx.finalGrossInterest : fin.grossInterest;
            const ownerProfit = tx.finalOwnerProfit !== undefined ? tx.finalOwnerProfit : fin.ownerNetProfit;

            return (
              <div
                key={tx.id}
                id={`tx-card-${tx.id}`}
                className={`bg-white rounded-xl p-4 sm:p-5 border transition shadow-xs ${
                  tx.status === 'active'
                    ? 'border-blue-200 hover:border-blue-300'
                    : tx.status === 'completed'
                    ? 'border-emerald-200 hover:border-emerald-300'
                    : tx.status === 'needs_followup'
                    ? 'border-amber-200 hover:border-amber-300'
                    : 'border-slate-200'
                }`}
              >
                {/* Top row: Status, Customer, Days */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-3">
                  <div className="flex items-center space-x-2.5">
                    {getStatusBadge(tx.status)}
                    <span className="font-bold text-[#1E293B] text-sm sm:text-base">
                      {tx.customerName}
                    </span>
                    {tx.customerPhone && (
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        ({tx.customerPhone})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>{daysActive} {t.days}</span>
                      {tx.status === 'active' && <span className="text-[10px] text-blue-600 font-bold">(active)</span>}
                    </span>

                    {/* Quick Complete Button for Active */}
                    {tx.status !== 'completed' && tx.status !== 'cancelled' && (
                      <button
                        onClick={() => onCompleteTransaction(tx)}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-[#C5A059] hover:bg-[#b08e4d] text-white transition flex items-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{t.completeTransaction}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      title={t.editTransaction}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Middle Financials Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">{t.principal}:</span>
                    <span className="text-base sm:text-lg font-black text-[#1E293B] mt-0.5 block">
                      {formatINR(tx.principal)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Rate: ₹{tx.customerRatePerLakh}/1L/day
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">{t.totalGrossInterest}:</span>
                    <span className="text-base sm:text-lg font-black text-emerald-600 mt-0.5 block font-mono">
                      +{formatINR(grossInterest)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Collect: {formatINR(tx.actualMoneyReceived || (tx.principal + grossInterest))}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">{t.ownerNetProfit}:</span>
                    <span className="text-base sm:text-lg font-black text-[#C5A059] mt-0.5 block font-mono">
                      {formatINR(ownerProfit)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {tx.enableProfitSharing ? 'After investor/agent' : '100% Owner retain'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">{t.agent}:</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5 block truncate">
                      {tx.agentName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Given: {tx.givenDate}
                    </span>
                  </div>
                </div>

                {/* Optional Profit Sharing Breakdown Details if enabled */}
                {tx.enableProfitSharing && (
                  <div className="mt-3 bg-purple-50/50 p-3 rounded-lg border border-purple-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-purple-800 font-bold text-[11px] uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Advanced Profit Sharing Distribution</span>
                      </span>
                      <span className="text-purple-600 font-normal lowercase">
                        approved by owner
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Agent Commission */}
                      {tx.agentCommissionRatePerLakh && tx.agentCommissionRatePerLakh > 0 ? (
                        <div className="bg-white p-2.5 rounded-lg border border-purple-100 flex items-center justify-between shadow-2xs">
                          <div>
                            <span className="text-slate-500 text-[11px] block">Agent Commission</span>
                            <span className="font-semibold text-slate-800 text-xs">
                              {tx.agentName} (₹{tx.agentCommissionRatePerLakh}/1L)
                            </span>
                            <span className="text-[#C5A059] font-mono font-bold block text-sm">
                              {formatINR(fin.agentCommission)}
                            </span>
                          </div>

                          <button
                            onClick={() => onToggleSettled(tx.id, 'agent')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              tx.agentCommissionSettled
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30 hover:bg-[#C5A059]/25'
                            }`}
                          >
                            {tx.agentCommissionSettled ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Settled</span>
                              </>
                            ) : (
                              <span>Mark Settled</span>
                            )}
                          </button>
                        </div>
                      ) : null}

                      {/* Investors */}
                      {tx.investors && tx.investors.map((inv, i) => {
                        const invUnits = inv.amount / 100000;
                        const invShare = Math.round(invUnits * inv.ratePerLakh * daysActive);

                        return (
                          <div
                            key={i}
                            className="bg-white p-2.5 rounded-lg border border-purple-100 flex items-center justify-between shadow-2xs"
                          >
                            <div>
                              <span className="text-slate-500 text-[11px] block">Investor Share</span>
                              <span className="font-semibold text-slate-800 text-xs">
                                {inv.investorName} (Contributed {formatINR(inv.amount)})
                              </span>
                              <span className="text-purple-700 font-mono font-bold block text-sm">
                                {formatINR(invShare)}
                              </span>
                            </div>

                            <button
                              onClick={() => onToggleSettled(tx.id, 'investor', inv.investorId)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                inv.settled
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200'
                              }`}
                            >
                              {inv.settled ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Settled</span>
                                </>
                              ) : (
                                <span>Mark Settled</span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer notes & Bank info */}
                <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center space-x-3">
                    {(tx.releaseBank || tx.targetBank) && (
                      <span className="flex items-center gap-1 text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{tx.releaseBank || 'Old Bank'}</span>
                        <span className="text-slate-400">➔</span>
                        <span>{tx.targetBank || 'New Bank'}</span>
                      </span>
                    )}

                    {tx.notes && (
                      <span className="italic text-slate-500 truncate max-w-xs">
                        "{tx.notes}"
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Status change actions dropdown */}
                    <select
                      value={tx.status}
                      onChange={(e) => onUpdateStatus(tx.id, e.target.value as TransactionStatus)}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-700 font-medium focus:outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="needs_followup">Needs Follow-up</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <button
                      onClick={() => {
                        if (confirm(`Delete transaction for ${tx.customerName}?`)) {
                          onDeleteTransaction(tx.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                      title={t.deleteTransaction}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
