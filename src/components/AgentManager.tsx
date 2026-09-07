import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Phone, 
  Coins, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Building2, 
  Edit2, 
  Trash2, 
  ArrowRight,
  Sparkles,
  Check
} from 'lucide-react';
import { Agent, Transaction, Language } from '../types';
import { formatINR, formatCompactINR, calculateFinancials, calculateDurationDays } from '../utils/formatters';
import { getT } from '../utils/translations';

interface AgentManagerProps {
  agents: Agent[];
  transactions: Transaction[];
  language: Language;
  onAddAgent: (agent: Omit<Agent, 'id' | 'createdAt'>) => void;
  onUpdateAgent: (agent: Agent) => void;
  onDeleteAgent: (id: string) => void;
  onFilterTransactionsByAgent: (agentId: string) => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const AgentManager: React.FC<AgentManagerProps> = ({
  agents,
  transactions,
  language,
  onAddAgent,
  onUpdateAgent,
  onDeleteAgent,
  onFilterTransactionsByAgent,
  onSelectTransaction,
}) => {
  const t = getT(language);

  const [isAdding, setIsAdding] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || '');

  // New Agent Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [upiOrBank, setUpiOrBank] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingAgent) {
      onUpdateAgent({
        ...editingAgent,
        name,
        phone,
        upiOrBank,
        notes,
      });
      setEditingAgent(null);
    } else {
      onAddAgent({
        name,
        phone,
        upiOrBank,
        notes,
        active: true,
      });
      setIsAdding(false);
    }

    setName('');
    setPhone('');
    setUpiOrBank('');
    setNotes('');
  };

  const startEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setName(agent.name);
    setPhone(agent.phone);
    setUpiOrBank(agent.upiOrBank || '');
    setNotes(agent.notes || '');
    setIsAdding(true);
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];
  const agentTransactions = transactions.filter((tx) => tx.agentId === selectedAgent?.id);

  // Compute agent metrics
  const totalHandled = agentTransactions.reduce((sum, tx) => sum + tx.principal, 0);
  const activeTxs = agentTransactions.filter((tx) => tx.status === 'active' || tx.status === 'needs_followup');
  const completedTxs = agentTransactions.filter((tx) => tx.status === 'completed');
  const activePrincipal = activeTxs.reduce((sum, tx) => sum + tx.principal, 0);

  // Commission metrics
  let totalCommissionEarned = 0;
  let totalCommissionSettled = 0;
  agentTransactions.forEach((tx) => {
    if (tx.enableProfitSharing && tx.agentCommissionRatePerLakh) {
      const days = tx.durationDays || calculateDurationDays(tx.givenDate, tx.returnDate);
      const fin = calculateFinancials(tx, days);
      totalCommissionEarned += fin.agentCommission;
      if (tx.agentCommissionSettled) {
        totalCommissionSettled += fin.agentCommission;
      }
    }
  });

  return (
    <div className="space-y-6 text-[#1E293B]">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B] flex items-center gap-2 tracking-tight">
            <Users className="w-6 h-6 text-[#C5A059]" />
            <span>Field Agent Directory & Commissions</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage agents executing bank releases, track total principal handled, and commission payouts
          </p>
        </div>

        <button
          id="add-agent-btn"
          onClick={() => {
            setEditingAgent(null);
            setName('');
            setPhone('');
            setUpiOrBank('');
            setNotes('');
            setIsAdding(!isAdding);
          }}
          className="px-4 py-2 rounded-lg text-xs sm:text-sm font-bold bg-[#C5A059] hover:bg-[#b08e4d] text-white shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isAdding ? t.cancel : t.addAgent}</span>
        </button>
      </div>

      {/* Add / Edit Form Modal or Inline Card */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#C5A059] uppercase tracking-wider">
            {editingAgent ? 'Edit Agent Profile' : t.addAgent}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.agentName} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shaik Rafi"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:border-[#C5A059] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.phone} *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 98480 22334"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:border-[#C5A059] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                UPI ID or Bank Details (For Commission Payouts)
              </label>
              <input
                type="text"
                value={upiOrBank}
                onChange={(e) => setUpiOrBank(e.target.value)}
                placeholder="e.g. rafi.gold@okhdfcbank"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:border-[#C5A059] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes & Preferred Branches
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Market branch SBI and Muthoot specialist"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:border-[#C5A059] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold bg-[#C5A059] hover:bg-[#b08e4d] text-white shadow-xs"
            >
              {editingAgent ? t.save : '+ Save Agent'}
            </button>
          </div>
        </form>
      )}

      {/* Agents Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((agent) => {
          const isSelected = selectedAgent?.id === agent.id;
          const aTxs = transactions.filter((x) => x.agentId === agent.id);
          const aActive = aTxs.filter((x) => x.status === 'active' || x.status === 'needs_followup');
          const aPrincipal = aTxs.reduce((s, x) => s + x.principal, 0);

          return (
            <div
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between shadow-xs ${
                isSelected
                  ? 'bg-white border-[#C5A059] ring-2 ring-[#C5A059]/30'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#C5A059]/15 text-[#C5A059] flex items-center justify-center font-bold text-sm">
                    {agent.name.charAt(0)}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(agent);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {agents.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete agent ${agent.name}?`)) {
                            onDeleteAgent(agent.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h4 className="font-bold text-[#1E293B] text-base">{agent.name}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />
                  <span>{agent.phone}</span>
                </p>
                {agent.upiOrBank && (
                  <p className="text-[11px] text-[#C5A059] font-mono truncate mt-1">
                    {agent.upiOrBank}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Handled</span>
                  <span className="font-bold text-[#1E293B] text-sm">
                    {formatCompactINR(aPrincipal)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Active Money</span>
                  <span className={`font-bold text-sm ${aActive.length > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                    {aActive.length > 0 ? formatCompactINR(aActive.reduce((s, x) => s + x.principal, 0)) : 'None'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Detail Workspace */}
      {selectedAgent && (
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center space-x-2 text-xs text-[#C5A059] font-bold uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>Selected Agent Profile</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1E293B] mt-1 tracking-tight">
                {selectedAgent.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedAgent.phone} {selectedAgent.notes ? `• ${selectedAgent.notes}` : ''}
              </p>
            </div>

            <button
              onClick={() => onFilterTransactionsByAgent(selectedAgent.id)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>View in All Transactions Tab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4 Agent KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-xs block">Total Principal Handled</span>
              <span className="text-xl font-black text-[#1E293B] mt-1 block">
                {formatINR(totalHandled)}
              </span>
              <span className="text-[10px] text-slate-400">{agentTransactions.length} total transfers</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-xs block">Currently Outside</span>
              <span className="text-xl font-black text-blue-600 mt-1 block">
                {formatINR(activePrincipal)}
              </span>
              <span className="text-[10px] text-slate-400">{activeTxs.length} active loans</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-xs block">Total Commission Earned</span>
              <span className="text-xl font-black text-[#C5A059] mt-1 block">
                {formatINR(totalCommissionEarned)}
              </span>
              <span className="text-[10px] text-slate-400">across profit-sharing deals</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-xs block">Commission Settled</span>
              <span className="text-xl font-black text-emerald-600 mt-1 block">
                {formatINR(totalCommissionSettled)}
              </span>
              <span className="text-[10px] text-slate-400">
                Pending: {formatINR(totalCommissionEarned - totalCommissionSettled)}
              </span>
            </div>
          </div>

          {/* Transactions handled by this agent */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Transactions Handled by {selectedAgent.name} ({agentTransactions.length})
            </h4>

            {agentTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                No transactions recorded for this agent yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {agentTransactions.map((tx) => {
                  const days = tx.durationDays || calculateDurationDays(tx.givenDate, tx.returnDate);
                  const fin = calculateFinancials(tx, days);

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className="bg-slate-50 hover:bg-slate-100/80 p-3.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 cursor-pointer transition shadow-xs"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#1E293B] text-sm">
                            {tx.customerName}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tx.status === 'active'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {tx.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {tx.releaseBank} ➔ {tx.targetBank} • Given on {tx.givenDate} ({days} days)
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        <span className="font-bold text-[#1E293B] text-sm block">
                          {formatINR(tx.principal)}
                        </span>
                        {tx.enableProfitSharing && tx.agentCommissionRatePerLakh ? (
                          <span className="text-[#C5A059] font-bold block">
                            Comm: {formatINR(fin.agentCommission)} {tx.agentCommissionSettled ? '(✓ Paid)' : '(Pending)'}
                          </span>
                        ) : (
                          <span className="text-slate-400">No agent commission</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
