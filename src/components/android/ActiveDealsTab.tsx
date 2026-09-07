import React, { useState } from 'react';
import { 
  Clock, 
  HandCoins, 
  Search, 
  Plus, 
  Share2,
  Trash2,
  Coins
} from 'lucide-react';
import { Transaction, Language } from '../../types';
import { formatINR, formatDateReadable, calculateFinancials } from '../../utils/formatters';
import { ConfirmModal } from '../ConfirmModal';

interface ActiveDealsTabProps {
  transactions: Transaction[];
  onSelectDealToSettle: (tx: Transaction) => void;
  onNewDeal: () => void;
  onDeleteDeal: (txId: string) => void;
  language: Language;
}

export const ActiveDealsTab: React.FC<ActiveDealsTabProps> = ({
  transactions,
  onSelectDealToSettle,
  onNewDeal,
  onDeleteDeal,
  language,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dealToDelete, setDealToDelete] = useState<Transaction | null>(null);

  const activeDeals = transactions.filter((tx) => tx.status === 'active');
  const filtered = activeDeals.filter((tx) => {
    const cleanSearch = searchTerm.replace(/,/g, '').toLowerCase().trim();
    return (
      (tx.customerName && tx.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.principal && tx.principal.toString().includes(cleanSearch))
    );
  });

  const totalActivePrincipal = activeDeals.reduce((sum, tx) => sum + (tx.principal || 0), 0);

  const handleShareDeal = (tx: Transaction, financials: ReturnType<typeof calculateFinancials>) => {
    const text = language === 'te'
      ? `గోల్డ్ లోన్ బ్యాలెన్స్ ట్రాన్స్‌ఫర్ లెక్క:\nఅసలు: ${formatINR(tx.principal)}\nఇచ్చిన తేదీ: ${formatDateReadable(tx.givenDate)}\nనడుస్తున్న రోజులు: ${financials.durationDays} రోజులు\nవడ్డీ రేటు: ₹${tx.customerRatePerLakh}/లక్షకి\nవడ్డీ: ${formatINR(financials.grossInterest)}\nమొత్తం కలెక్షన్: ${formatINR(financials.totalAmountExpected)}`
      : `Gold Loan Balance Transfer Slip:\nPrincipal: ${formatINR(tx.principal)}\nGiven Date: ${formatDateReadable(tx.givenDate)}\nDays Running: ${financials.durationDays} days\nRate: ₹${tx.customerRatePerLakh}/1L\nInterest: ${formatINR(financials.grossInterest)}\nTotal Collection Due: ${formatINR(financials.totalAmountExpected)}`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-4 space-y-4 pb-20 max-w-lg mx-auto">
      {/* Top Banner with Total Active Money Outside */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 text-white shadow-md flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C5A059] block">
            {language === 'te' ? 'బయట ఉన్న మొత్తం అసలు' : 'Money Outside in Market'}
          </span>
          <span className="text-2xl font-black font-mono text-white mt-0.5 block">
            {formatINR(totalActivePrincipal)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {activeDeals.length} {language === 'te' ? 'నడుస్తున్న బ్యాలెన్స్ ట్రాన్స్‌ఫర్లు' : 'Active Deals Running'}
          </span>
        </div>

        <button
          type="button"
          onClick={onNewDeal}
          className="px-3.5 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#b08e4d] text-white text-xs font-extrabold flex items-center space-x-1.5 shadow-md active:scale-95 transition"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{language === 'te' ? 'కొత్త లెక్క' : 'New Deal'}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder={language === 'te' ? 'మొత్తం వెతకండి...' : 'Search deals by amount...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#C5A059] shadow-xs"
        />
      </div>

      {/* List of Active Deals */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {language === 'te' ? 'ప్రస్తుతం నడుస్తున్న లెక్కలు లేవు' : 'No Active Deals Right Now'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'te' 
                ? 'డబ్బు ట్రాన్స్‌ఫర్ చేసినప్పుడు "+ కొత్త లెక్క" నొక్కండి' 
                : 'Tap "+ New Deal" when you disburse money for balance transfer'}
            </p>
          </div>
          <button
            type="button"
            onClick={onNewDeal}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#C5A059] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#b08e4d] transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'te' ? 'డబ్బు పంపడం నమోదు చేయండి' : 'Start First Deal'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((tx, idx) => {
            const financials = calculateFinancials(tx);
            const daysRunning = financials.durationDays;

            return (
              <div
                key={tx.id}
                className="bg-white border border-slate-200 hover:border-[#C5A059]/60 rounded-2xl p-4 shadow-xs space-y-3 transition"
              >
                {/* Header: Deal Name & Running Badge */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold font-mono">
                      #{idx + 1}
                    </span>
                    <h3 className="text-base font-extrabold text-[#1E293B]">
                      {tx.customerName || `Deal ${formatINR(tx.principal)}`}
                    </h3>
                  </div>

                  {/* Running Days Badge */}
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-xl text-right">
                    <span className="text-[10px] uppercase font-bold block">Running</span>
                    <span className="text-xs font-black font-mono">
                      {daysRunning} {daysRunning === 1 ? 'Day' : 'Days'}
                    </span>
                  </div>
                </div>

                {/* Live Numbers Grid */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-500 block">
                      {language === 'te' ? 'ఇచ్చిన అసలు' : 'Principal Given'}
                    </span>
                    <span className="text-base font-black font-mono text-slate-900">
                      {formatINR(tx.principal)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {formatDateReadable(tx.givenDate)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-bold text-emerald-700 block">
                      {language === 'te' ? 'నేడు వసూలు చేయవలసినది' : 'Collect Today'}
                    </span>
                    <span className="text-lg font-black font-mono text-[#C5A059] block">
                      {formatINR(financials.totalAmountExpected)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      (Interest: +{formatINR(financials.grossInterest)})
                    </span>
                  </div>
                </div>

                {/* Action Buttons: Share, Delete & Collect */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleShareDeal(tx, financials)}
                    className="py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center space-x-1 transition active:scale-95 border border-slate-200 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDealToDelete(tx)}
                    className="py-2.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center space-x-1 transition active:scale-95 border border-rose-200 cursor-pointer"
                    title="Delete deal"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{language === 'te' ? 'డిలీట్' : 'Delete'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectDealToSettle(tx)}
                    className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center space-x-1 shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <HandCoins className="w-4 h-4 stroke-[2.4] shrink-0" />
                    <span>{language === 'te' ? 'వసూలు' : 'Settle'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-App Confirmation Modal for Deleting Active Deal */}
      <ConfirmModal
        isOpen={!!dealToDelete}
        onClose={() => setDealToDelete(null)}
        onConfirm={() => {
          if (dealToDelete) {
            onDeleteDeal(dealToDelete.id);
            setDealToDelete(null);
          }
        }}
        title={language === 'te' ? 'డీల్ తొలగించాలా?' : 'Delete Deal?'}
        message={
          dealToDelete
            ? language === 'te'
              ? `${dealToDelete.customerName || 'డీల్'} (${formatINR(dealToDelete.principal)}) రికార్డును తొలగించాలనుకుంటున్నారా?`
              : `Are you sure you want to delete ${dealToDelete.customerName || 'this deal'} (${formatINR(dealToDelete.principal)})? This record will be removed from your active ledger.`
            : ''
        }
        confirmText={language === 'te' ? 'తొలగించు' : 'Delete Deal'}
        cancelText={language === 'te' ? 'రద్దు చేయి' : 'Cancel'}
        isDanger={true}
        type="delete"
      />
    </div>
  );
};
