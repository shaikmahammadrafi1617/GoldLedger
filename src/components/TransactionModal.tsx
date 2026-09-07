import React, { useState, useEffect } from 'react';
import { 
  X, 
  Coins, 
  User, 
  Calendar, 
  Building2, 
  Landmark, 
  Users, 
  Plus, 
  Trash2, 
  Percent, 
  ArrowRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { Transaction, Agent, Investor, Language, InvestorContribution, TransactionStatus } from '../types';
import { formatINR, calculateFinancials, getTodayDateString, calculateDurationDays } from '../utils/formatters';
import { getT } from '../utils/translations';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>) => void;
  initialTransaction?: Transaction | null;
  agents: Agent[];
  investors: Investor[];
  language: Language;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTransaction,
  agents,
  investors: allInvestors,
  language,
}) => {
  const t = getT(language);
  const isEditing = !!initialTransaction;

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [releaseBank, setReleaseBank] = useState('');
  const [targetBank, setTargetBank] = useState('');
  const [agentId, setAgentId] = useState(agents[0]?.id || '');
  const [principal, setPrincipal] = useState<number>(200000);
  const [givenDate, setGivenDate] = useState(getTodayDateString());
  const [customerRatePerLakh, setCustomerRatePerLakh] = useState<number>(2000);
  const [ratePeriod, setRatePeriod] = useState<'per_day' | 'per_month' | 'per_year'>('per_day');
  const [status, setStatus] = useState<TransactionStatus>('active');
  const [notes, setNotes] = useState('');

  // Optional Advanced Profit Sharing
  const [enableProfitSharing, setEnableProfitSharing] = useState(false);
  const [enableAgentCommission, setEnableAgentCommission] = useState(false);
  const [agentCommissionRatePerLakh, setAgentCommissionRatePerLakh] = useState<number>(400);
  const [txInvestors, setTxInvestors] = useState<InvestorContribution[]>([]);

  // Populate when editing or opening
  useEffect(() => {
    if (initialTransaction) {
      setCustomerName(initialTransaction.customerName || '');
      setCustomerPhone(initialTransaction.customerPhone || '');
      setReleaseBank(initialTransaction.releaseBank || '');
      setTargetBank(initialTransaction.targetBank || '');
      setAgentId(initialTransaction.agentId || agents[0]?.id || '');
      setPrincipal(initialTransaction.principal || 200000);
      setGivenDate(initialTransaction.givenDate || getTodayDateString());
      setCustomerRatePerLakh(initialTransaction.customerRatePerLakh || 2000);
      setRatePeriod(initialTransaction.ratePeriod || 'per_day');
      setStatus(initialTransaction.status || 'active');
      setNotes(initialTransaction.notes || '');

      setEnableProfitSharing(!!initialTransaction.enableProfitSharing);
      setEnableAgentCommission(!!initialTransaction.agentCommissionRatePerLakh);
      setAgentCommissionRatePerLakh(initialTransaction.agentCommissionRatePerLakh || 400);
      setTxInvestors(initialTransaction.investors || []);
    } else {
      // Defaults for new
      setCustomerName('');
      setCustomerPhone('');
      setReleaseBank('State Bank of India');
      setTargetBank('HDFC Bank');
      setAgentId(agents[0]?.id || '');
      setPrincipal(200000);
      setGivenDate(getTodayDateString());
      setCustomerRatePerLakh(2000);
      setRatePeriod('per_day');
      setStatus('active');
      setNotes('');
      setEnableProfitSharing(false);
      setEnableAgentCommission(false);
      setAgentCommissionRatePerLakh(400);
      setTxInvestors([]);
    }
  }, [initialTransaction, isOpen, agents]);

  if (!isOpen) return null;

  // Real-time calculation preview for Day 1 and estimated days
  const activeDaysCount = calculateDurationDays(givenDate);
  const previewTx = {
    principal,
    givenDate,
    customerRatePerLakh,
    ratePeriod,
    enableProfitSharing,
    agentCommissionRatePerLakh: enableAgentCommission ? agentCommissionRatePerLakh : 0,
    investors: txInvestors,
  };

  const day1Fin = calculateFinancials(previewTx, 1);
  const currentDaysFin = calculateFinancials(previewTx, activeDaysCount);

  const handleAddInvestor = () => {
    if (allInvestors.length === 0) return;
    const inv = allInvestors[0];
    const newContrib: InvestorContribution = {
      investorId: inv.id,
      investorName: inv.name,
      amount: 100000,
      ratePerLakh: 1000,
      settled: false,
    };
    setTxInvestors([...txInvestors, newContrib]);
    setEnableProfitSharing(true);
  };

  const handleUpdateInvestor = (index: number, field: keyof InvestorContribution, val: any) => {
    const updated = [...txInvestors];
    if (field === 'investorId') {
      const selectedInv = allInvestors.find((i) => i.id === val);
      updated[index] = {
        ...updated[index],
        investorId: val,
        investorName: selectedInv ? selectedInv.name : updated[index].investorName,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: val,
      };
    }
    setTxInvestors(updated);
  };

  const handleRemoveInvestor = (index: number) => {
    const updated = txInvestors.filter((_, i) => i !== index);
    setTxInvestors(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!principal || principal <= 0) {
      alert('Please enter a valid principal amount.');
      return;
    }
    const selectedAgent = agents.find((a) => a.id === agentId);
    const agentName = selectedAgent ? selectedAgent.name : 'Unknown Agent';

    onSave({
      ...(initialTransaction || {}),
      customerName: customerName || 'Valued Customer',
      customerPhone,
      releaseBank,
      targetBank,
      agentId,
      agentName,
      principal: Number(principal),
      givenDate,
      customerRatePerLakh: Number(customerRatePerLakh),
      ratePeriod,
      status,
      notes,
      enableProfitSharing,
      agentCommissionRatePerLakh: (enableProfitSharing && enableAgentCommission) ? Number(agentCommissionRatePerLakh) : 0,
      investors: enableProfitSharing ? txInvestors : [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 text-[#1E293B] rounded-xl max-w-2xl w-full shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center font-bold border border-[#C5A059]/30">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1E293B] tracking-tight">
                {isEditing ? t.editTransaction : t.newTransaction}
              </h3>
              <p className="text-xs text-slate-500">
                Gold Loan Balance Transfer Bridge Disbursal
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Section 1: Principal & Disbursal Date */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4" />
                <span>Principal Money Given (అసలు)</span>
              </label>
              <span className="text-[11px] text-slate-500 font-semibold">
                {(principal / 100000).toFixed(1)} Lakhs ({formatINR(principal)})
              </span>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[100000, 200000, 300000, 400000, 500000, 1000000].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setPrincipal(amt)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
                    principal === amt
                      ? 'bg-[#C5A059] text-white border-[#C5A059] font-bold shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {amt >= 100000 ? `₹${amt / 100000}L` : `₹${amt}`}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Principal Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    required
                    value={principal}
                    onChange={(e) => setPrincipal(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold focus:border-[#C5A059] focus:outline-none text-base"
                    placeholder="2,00,000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.moneyGivenDate}
                </label>
                <input
                  type="date"
                  required
                  value={givenDate}
                  onChange={(e) => setGivenDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:border-[#C5A059] focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  *Return date is not required now. Recorded when money is received.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Agent & Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.agent} <span className="text-[#C5A059]">*</span>
              </label>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:border-[#C5A059] focus:bg-white focus:outline-none"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.customerName}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. K. Satyanarayana"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-[#C5A059] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.releaseBank}
              </label>
              <input
                type="text"
                value={releaseBank}
                onChange={(e) => setReleaseBank(e.target.value)}
                placeholder="e.g. Muthoot Finance / SBI"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-[#C5A059] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.targetBank}
              </label>
              <input
                type="text"
                value={targetBank}
                onChange={(e) => setTargetBank(e.target.value)}
                placeholder="e.g. HDFC Bank / Canara Bank"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-[#C5A059] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Customer Flat Rate */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-4 h-4" />
                <span>Customer Flat Rate (వడ్డీ రేటు)</span>
              </label>
              <span className="text-xs text-slate-500 font-semibold">
                Standard: ₹2,000 per ₹1 Lakh / day
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rate per ₹1 Lakh (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="100"
                    min="100"
                    required
                    value={customerRatePerLakh}
                    onChange={(e) => setCustomerRatePerLakh(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold focus:border-[#C5A059] focus:outline-none"
                    placeholder="2000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rate Applied
                </label>
                <select
                  value={ratePeriod}
                  onChange={(e) => setRatePeriod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:border-[#C5A059] focus:outline-none"
                >
                  <option value="per_day">Per Day (రోజుకు) - Gold BT Standard</option>
                  <option value="per_month">Per Month (నెలకు)</option>
                  <option value="per_year">Per Year (సంవత్సరానికి)</option>
                </select>
              </div>
            </div>

            {/* Quick calculation preview box */}
            <div className="bg-white rounded-lg p-3 border border-slate-200 flex items-center justify-between text-xs shadow-xs">
              <span className="text-slate-600 font-medium">
                Gross Interest per day: <strong className="text-emerald-700 font-bold">{formatINR(day1Fin.grossInterest)}/day</strong>
              </span>
              <span className="text-slate-500">
                Units: {(principal / 100000).toFixed(1)}L × ₹{customerRatePerLakh}
              </span>
            </div>
          </div>

          {/* Section 4: Optional Advanced Profit Sharing */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>{t.advancedProfitSharing}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t.profitSharingDesc}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableProfitSharing}
                  onChange={(e) => setEnableProfitSharing(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C5A059]"></div>
              </label>
            </div>

            {enableProfitSharing && (
              <div className="space-y-4 pt-3 border-t border-slate-200">
                {/* Agent Commission Sub-section */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={enableAgentCommission}
                        onChange={(e) => setEnableAgentCommission(e.target.checked)}
                        className="rounded text-[#C5A059] focus:ring-0"
                      />
                      <span>{t.enableAgentCommission}</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Calculated on total principal
                    </span>
                  </div>

                  {enableAgentCommission && (
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex-1">
                        <label className="text-[11px] text-slate-600 block mb-1">
                          Agent Commission Rate per ₹1 Lakh / day
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            value={agentCommissionRatePerLakh}
                            onChange={(e) => setAgentCommissionRatePerLakh(Number(e.target.value))}
                            className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs font-bold focus:border-[#C5A059] focus:outline-none"
                            placeholder="400"
                          />
                        </div>
                      </div>
                      <div className="text-right text-xs pt-3">
                        <span className="text-slate-500 block text-[11px]">Commission / day</span>
                        <span className="font-bold text-[#C5A059]">
                          {formatINR((principal / 100000) * agentCommissionRatePerLakh)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Investor Contributions Sub-section */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Investor Contributions ({txInvestors.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddInvestor}
                      className="text-xs font-bold text-[#C5A059] hover:text-[#b08e4d] flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.addInvestor}</span>
                    </button>
                  </div>

                  {txInvestors.map((inv, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div className="sm:col-span-4">
                        <label className="text-[10px] text-slate-500 block">Investor</label>
                        <select
                          value={inv.investorId}
                          onChange={(e) => handleUpdateInvestor(idx, 'investorId', e.target.value)}
                          className="w-full p-1 bg-white border border-slate-200 rounded text-slate-800 font-medium text-xs focus:border-[#C5A059] focus:outline-none"
                        >
                          {allInvestors.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="text-[10px] text-slate-500 block">Contribution (₹)</label>
                        <input
                          type="number"
                          step="10000"
                          value={inv.amount}
                          onChange={(e) => handleUpdateInvestor(idx, 'amount', Number(e.target.value))}
                          className="w-full p-1 bg-white border border-slate-200 rounded text-slate-800 font-bold text-xs focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[10px] text-slate-500 block">Rate / 1L / day</label>
                        <input
                          type="number"
                          step="100"
                          value={inv.ratePerLakh}
                          onChange={(e) => handleUpdateInvestor(idx, 'ratePerLakh', Number(e.target.value))}
                          className="w-full p-1 bg-white border border-slate-200 rounded text-slate-800 font-bold text-xs focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveInvestor(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {txInvestors.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic">
                      No investors added. 100% of the principal is from the owner.
                    </p>
                  )}
                </div>

                {/* Profit Distribution Formula Preview */}
                <div className="bg-white p-3 rounded-lg border border-purple-200 text-xs font-mono space-y-1 shadow-xs">
                  <div className="text-[11px] text-purple-800 font-bold uppercase tracking-wide">
                    Distribution per 1 Day:
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Total Gross Interest:</span>
                    <span>+{formatINR(day1Fin.grossInterest)}</span>
                  </div>
                  {day1Fin.investorTotalShare > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>− Investor Share ({txInvestors.length}):</span>
                      <span>−{formatINR(day1Fin.investorTotalShare)}</span>
                    </div>
                  )}
                  {day1Fin.agentCommission > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>− Agent Commission:</span>
                      <span>−{formatINR(day1Fin.agentCommission)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#C5A059] font-bold pt-1 border-t border-slate-200 text-sm">
                    <span>= Owner Net Profit / day:</span>
                    <span>{formatINR(day1Fin.ownerNetProfit)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Status & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.status}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:border-[#C5A059] focus:bg-white focus:outline-none"
              >
                <option value="active">Active (Money in Field)</option>
                <option value="completed">Completed</option>
                <option value="needs_followup">Needs Follow-up (Gold inspection/delay)</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.notes}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Gold grams, branch token number..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-[#C5A059] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Save Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition text-xs sm:text-sm"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg font-bold bg-[#C5A059] hover:bg-[#b08e4d] text-white shadow-xs transition text-xs sm:text-sm"
            >
              {isEditing ? t.save : '+ Create Disbursal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
