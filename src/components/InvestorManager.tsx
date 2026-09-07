import React, { useState } from 'react';
import { 
  Landmark, 
  UserPlus, 
  Coins, 
  Phone, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Edit2, 
  Trash2, 
  Plus,
  Check
} from 'lucide-react';
import { Investor, Transaction, Language } from '../types';
import { formatINR, formatCompactINR, calculateFinancials, calculateDurationDays } from '../utils/formatters';
import { getT } from '../utils/translations';

interface InvestorManagerProps {
  investors: Investor[];
  transactions: Transaction[];
  language: Language;
  onAddInvestor: (investor: Omit<Investor, 'id' | 'createdAt'>) => void;
  onUpdateInvestor: (investor: Investor) => void;
  onDeleteInvestor: (id: string) => void;
  onSelectTransaction: (tx: Transaction) => void;
  onToggleSettled: (txId: string, type: 'investor', investorId: string) => void;
}

export const InvestorManager: React.FC<InvestorManagerProps> = ({
  investors,
  transactions,
  language,
  onAddInvestor,
  onUpdateInvestor,
  onDeleteInvestor,
  onSelectTransaction,
  onToggleSettled,
}) => {
  const t = getT(language);

  const [isAdding, setIsAdding] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>(investors[0]?.id || '');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [totalCapital, setTotalCapital] = useState<number>(2000000);
  const [upiOrBank, setUpiOrBank] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingInvestor) {
      onUpdateInvestor({
        ...editingInvestor,
        name,
        phone,
        totalCapital: Number(totalCapital),
        upiOrBank,
        notes,
      });
      setEditingInvestor(null);
    } else {
      onAddInvestor({
        name,
        phone,
        totalCapital: Number(totalCapital),
        upiOrBank,
        notes,
      });
      setIsAdding(false);
    }

    setName('');
    setPhone('');
    setTotalCapital(2000000);
    setUpiOrBank('');
    setNotes('');
  };

  const startEdit = (inv: Investor) => {
    setEditingInvestor(inv);
    setName(inv.name);
    setPhone(inv.phone);
    setTotalCapital(inv.totalCapital);
    setUpiOrBank(inv.upiOrBank || '');
    setNotes(inv.notes || '');
    setIsAdding(true);
  };

  const selectedInvestor = investors.find((i) => i.id === selectedInvestorId) || investors[0];

  // Transactions with this investor
  const investorTxs = transactions.filter(
    (tx) => tx.enableProfitSharing && tx.investors && tx.investors.some((inv) => inv.investorId === selectedInvestor?.id)
  );

  // Calculate active capital used, returned capital, total profit earned
  let activeCapitalUsed = 0;
  let returnedCapital = 0;
  let totalProfitEarned = 0;
  let totalProfitSettled = 0;

  investorTxs.forEach((tx) => {
    const invData = tx.investors.find((i) => i.investorId === selectedInvestor?.id);
    if (!invData) return;

    const days = tx.durationDays || calculateDurationDays(tx.givenDate, tx.returnDate);
    const units = invData.amount / 100000;
    const share = Math.round(units * invData.ratePerLakh * days);
    totalProfitEarned += share;

    if (invData.settled) {
      totalProfitSettled += share;
    }

    if (tx.status === 'active' || tx.status === 'needs_followup') {
      activeCapitalUsed += invData.amount;
    } else if (tx.status === 'completed') {
      returnedCapital += invData.amount;
    }
  });

  const availableCapital = (selectedInvestor?.totalCapital || 0) - activeCapitalUsed;

  return (
    <div className="space-y-6 text-[#1E293B]">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B] flex items-center gap-2 tracking-tight">
            <Landmark className="w-6 h-6 text-[#C5A059]" />
            <span>Investor Capital & Profit Sharing</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage funding partners, active capital deployment in balance transfers, and interest payouts
          </p>
        </div>

        <button
          id="add-investor-btn"
          onClick={() => {
            setEditingInvestor(null);
            setName('');
            setPhone('');
            setTotalCapital(2000000);
            setUpiOrBank('');
            setNotes('');
            setIsAdding(!isAdding);
          }}
          className="px-4 py-2 rounded-lg text-xs sm:text-sm font-bold bg-[#C5A059] hover:bg-[#b08e4d] text-white shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isAdding ? t.cancel : t.addInvestorBtn}</span>
        </button>
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#C5A059] uppercase tracking-wider">
            {editingInvestor ? 'Edit Investor Details' : t.addInvestorBtn}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.investorName} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Suresh Reddy"
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
                placeholder="e.g. 98490 11223"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:border-[#C5A059] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Committed Capital (₹)
              </label>
              <input
                type="number"
                step="50000"
                min="50000"
                required
                value={totalCapital}
                onChange={(e) => setTotalCapital(Number(e.target.value))}
                placeholder="25,00,000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:border-[#C5A059] focus:bg-white focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bank / UPI Details
              </label>
              <input
                type="text"
                value={upiOrBank}
                onChange={(e) => setUpiOrBank(e.target.value)}
                placeholder="e.g. suresh.reddy@sbi"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:border-[#C5A059] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Terms & Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Standard rate ₹1,000/1L/day, 24-hr advance notice required for withdrawal"
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
              {editingInvestor ? t.save : '+ Save Investor'}
            </button>
          </div>
        </form>
      )}

      {/* Investors Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {investors.map((inv) => {
          const isSelected = selectedInvestor?.id === inv.id;
          const iTxs = transactions.filter(
            (tx) => tx.enableProfitSharing && tx.investors && tx.investors.some((x) => x.investorId === inv.id)
          );
          const iActive = iTxs.filter((tx) => tx.status === 'active' || tx.status === 'needs_followup');
          let iActiveAmt = 0;
          iActive.forEach((tx) => {
            const data = tx.investors.find((x) => x.investorId === inv.id);
            if (data) iActiveAmt += data.amount;
          });

          return (
            <div
              key={inv.id}
              onClick={() => setSelectedInvestorId(inv.id)}
              className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between shadow-xs ${
                isSelected
                  ? 'bg-white border-[#C5A059] ring-2 ring-[#C5A059]/30'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm">
                    {inv.name.charAt(0)}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(inv);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {investors.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete investor ${inv.name}?`)) {
                            onDeleteInvestor(inv.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h4 className="font-bold text-[#1E293B] text-base">{inv.name}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />
                  <span>{inv.phone}</span>
                </p>
                <div className="text-xs text-slate-600 mt-2 flex justify-between">
                  <span>Total Capital:</span>
                  <span className="font-bold text-[#1E293B]">{formatINR(inv.totalCapital)}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Active Used</span>
                  <span className={`font-bold text-sm ${iActiveAmt > 0 ? 'text-purple-700' : 'text-slate-400'}`}>
                    {formatCompactINR(iActiveAmt)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Available</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {formatCompactINR(inv.totalCapital - iActiveAmt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Investor Detail Workspace */}
      {selectedInvestor && (
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center space-x-2 text-xs text-[#C5A059] font-bold uppercase tracking-wider">
              <Landmark className="w-4 h-4" />
              <span>Investor Ledger & Capital Performance</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#1E293B] mt-1 tracking-tight">
              {selectedInvestor.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Phone: {selectedInvestor.phone} • Bank/UPI: {selectedInvestor.upiOrBank || 'Direct Cash / RTGS'}
            </p>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-xs block">Committed Capital</span>
              <span className="text-xl font-black text-[#1E293B] mt-1 block">
                {formatINR(selectedInvestor.totalCapital)}
              </span>
              <span className="text-[10px] text-slate-400">Total investment pool</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-xs block">Active Capital in Field</span>
              <span className="text-xl font-black text-purple-700 mt-1 block">
                {formatINR(activeCapitalUsed)}
              </span>
              <span className="text-[10px] text-slate-400">currently deployed</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-xs block">Available Capital</span>
              <span className="text-xl font-black text-emerald-600 mt-1 block">
                {formatINR(availableCapital)}
              </span>
              <span className="text-[10px] text-slate-400">ready for new disbursal</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-xs block">Total Profit Earned</span>
              <span className="text-xl font-black text-[#C5A059] mt-1 block">
                {formatINR(totalProfitEarned)}
              </span>
              <span className="text-[10px] text-slate-400">
                Settled: {formatINR(totalProfitSettled)}
              </span>
            </div>
          </div>

          {/* Investor Deals History */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Deals Funded by {selectedInvestor.name} ({investorTxs.length})
            </h4>

            {investorTxs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                No deals currently allocated to this investor.
              </div>
            ) : (
              <div className="space-y-2.5">
                {investorTxs.map((tx) => {
                  const invData = tx.investors.find((x) => x.investorId === selectedInvestor.id);
                  if (!invData) return null;

                  const days = tx.durationDays || calculateDurationDays(tx.givenDate, tx.returnDate);
                  const units = invData.amount / 100000;
                  const profitEarned = Math.round(units * invData.ratePerLakh * days);

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
                          <span className="text-xs text-slate-500">
                            (Agent: {tx.agentName})
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {tx.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Given on {tx.givenDate} • Active for {days} days • Total deal principal {formatINR(tx.principal)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right text-xs">
                          <span className="text-slate-400 block text-[11px]">Contributed Principal</span>
                          <span className="font-bold text-[#1E293B] text-sm block">
                            {formatINR(invData.amount)}
                          </span>
                          <span className="text-purple-700 font-bold font-mono block">
                            Profit: +{formatINR(profitEarned)} (₹{invData.ratePerLakh}/1L)
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSettled(tx.id, 'investor', selectedInvestor.id);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            invData.settled
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200'
                          }`}
                        >
                          {invData.settled ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Settled</span>
                            </>
                          ) : (
                            <span>Mark Settled</span>
                          )}
                        </button>
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
