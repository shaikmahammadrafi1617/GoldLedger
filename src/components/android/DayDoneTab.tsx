import React, { useMemo, useState } from 'react';
import { 
  CheckCheck, 
  Coins, 
  Calendar, 
  Share2, 
  Sparkles, 
  ArrowUpRight, 
  CheckCircle, 
  Database,
  History,
  RotateCcw,
  Trash2,
  TrendingUp,
  Landmark,
  Handshake
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { Transaction, Language } from '../../types';
import { formatINR, formatDateReadable, getTodayDateString } from '../../utils/formatters';
import { ConfirmModal } from '../ConfirmModal';

interface DayDoneTabProps {
  transactions: Transaction[];
  language: Language;
  onOpenBackup: () => void;
  onDeleteDeal?: (txId: string) => void;
  onClearAllData?: () => Promise<void> | void;
}

export const DayDoneTab: React.FC<DayDoneTabProps> = ({
  transactions,
  language,
  onOpenBackup,
  onDeleteDeal,
  onClearAllData,
}) => {
  const todayStr = getTodayDateString();
  const [dealToDelete, setDealToDelete] = useState<Transaction | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Completed transactions
  const completedDeals = useMemo(() => {
    return transactions
      .filter((tx) => tx.status === 'completed')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }, [transactions]);

  // Today's completed deals
  const todayCompleted = useMemo(() => {
    return completedDeals.filter((tx) => tx.returnDate === todayStr);
  }, [completedDeals, todayStr]);

  // Today's numbers
  const todayProfit = todayCompleted.reduce((sum, tx) => sum + (tx.finalOwnerProfit || 0), 0);
  const todayPrincipalReturned = todayCompleted.reduce((sum, tx) => sum + (tx.principal || 0), 0);

  // Overall numbers
  const totalCompletedProfit = completedDeals.reduce((sum, tx) => sum + (tx.finalOwnerProfit || 0), 0);

  // Last 7 days profit data calculation for Recharts
  const last7DaysData = useMemo(() => {
    const data = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      const isToday = i === 0;

      // Filter deals settled on this calendar day
      const dayDeals = completedDeals.filter((tx) => {
        const txDate = (tx.returnDate || tx.updatedAt || tx.givenDate || '').split('T')[0];
        return txDate === dateKey;
      });

      const dayProfit = dayDeals.reduce((sum, tx) => sum + (tx.finalOwnerProfit || 0), 0);

      // Format human-readable short labels
      const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString('en-IN', { month: 'short' });

      data.push({
        date: dateKey,
        dayLabel: isToday ? (language === 'te' ? 'నేడు' : 'Today') : dayName,
        dateFormatted: `${dayNum} ${monthShort}`,
        profit: Math.max(0, dayProfit),
        isToday,
        dealsCount: dayDeals.length,
      });
    }
    return data;
  }, [completedDeals, language]);

  const total7DayProfit = useMemo(() => {
    return last7DaysData.reduce((sum, item) => sum + item.profit, 0);
  }, [last7DaysData]);

  // Custom Tooltip for Recharts Bar Chart
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-[#1E293B] text-white px-3 py-2 rounded-xl border border-[#C5A059] shadow-xl text-xs space-y-1 z-50">
          <div className="flex items-center justify-between gap-3 text-slate-300 border-b border-slate-700 pb-1">
            <span className="font-bold">{item.dateFormatted}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-[#C5A059] font-semibold">
              {item.dayLabel}
            </span>
          </div>
          <div className="pt-0.5">
            <span className="text-[10px] text-slate-400 block">
              {language === 'te' ? 'నికర లాభం' : 'Owner Net Profit'}
            </span>
            <span className="text-sm font-black font-mono text-emerald-400">
              +{formatINR(item.profit)}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            {item.dealsCount} {language === 'te' ? 'డీల్స్ పూర్తయ్యాయి' : 'deals closed'}
          </p>
        </div>
      );
    }
    return null;
  };

  // WhatsApp share of today's summary
  const handleShareSummary = () => {
    const text = language === 'te'
      ? `📅 గోల్డ్ లెడ్జర్ రోజువారీ ముగింపు (${todayStr}):\n\nఈ రోజు పూర్తయిన డీల్స్: ${todayCompleted.length}\nమొత్తం అసలు సైకిల్: ${formatINR(todayPrincipalReturned)}\nఈ రోజు నికర లాభం (జేబులో): ${formatINR(todayProfit)}\nగత 7 రోజుల మొత్తం లాభం: ${formatINR(total7DayProfit)}\n\nలెక్కలన్నీ సరిపోయాయి. రోజు ప్రశాంతంగా ముగిసింది! - GoldLedger`
      : `📅 GoldLedger Daily Closing Summary (${todayStr}):\n\nDeals Completed Today: ${todayCompleted.length}\nPrincipal Returned: ${formatINR(todayPrincipalReturned)}\nOwner Net Profit: ${formatINR(todayProfit)}\nLast 7 Days Profit: ${formatINR(total7DayProfit)}\n\nAll accounts settled. Called the day! - GoldLedger`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="p-4 space-y-4 pb-20 max-w-lg mx-auto">
      {/* Today's Hero Summary Card */}
      <div className="bg-[#1E293B] border-2 border-[#C5A059] rounded-2xl p-5 text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center font-bold">
              <CheckCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">
                {language === 'te' ? 'ఈ రోజు ముగింపు (Called the Day)' : 'Today\'s Daily Closing'}
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">{formatDateReadable(todayStr)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleShareSummary}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#C5A059] border border-slate-700 transition"
            title="Share to WhatsApp"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Big Profit Readout */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            {language === 'te' ? 'ఈ రోజు మీ నికర సంపాదన' : 'Owner Net Profit Today'}
          </span>
          <span className="text-3xl font-black font-mono text-emerald-400 mt-0.5 block">
            {formatINR(todayProfit)}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            {todayCompleted.length} {language === 'te' ? 'డీల్స్ ముగిశాయి' : 'Deals Settled & Closed Today'}
          </span>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs border-t border-slate-800">
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
            <span className="text-[11px] text-slate-400 block">
              {language === 'te' ? 'నేడు తిరిగొచ్చిన అసలు' : 'Principal Cycled Today'}
            </span>
            <span className="text-sm font-bold font-mono text-white">
              {formatINR(todayPrincipalReturned)}
            </span>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
            <span className="text-[11px] text-slate-400 block">
              {language === 'te' ? 'మొత్తం లాభం (ఆల్ టైమ్)' : 'All-Time Profit'}
            </span>
            <span className="text-sm font-bold font-mono text-[#C5A059]">
              {formatINR(totalCompletedProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* 7-Day Profit Bar Chart with recharts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {language === 'te' ? 'గత 7 రోజుల లాభం' : 'Last 7 Days Profit'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {language === 'te' ? 'రోజువారీ నికర సంపాదన గ్రాఫ్' : 'Daily net profit performance'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-semibold text-slate-400 block">
              {language === 'te' ? '7 రోజుల మొత్తం' : '7-Day Total'}
            </span>
            <span className="text-sm font-black font-mono text-emerald-600">
              +{formatINR(total7DayProfit)}
            </span>
          </div>
        </div>

        {/* Recharts Bar Chart Container */}
        <div className="w-full h-44 pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={last7DaysData}
              margin={{ top: 8, right: 6, left: -22, bottom: 0 }}
            >
              <XAxis
                dataKey="dayLabel"
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: '#94A3B8' }}
                tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`)}
              />
              <Tooltip content={<CustomChartTooltip />} cursor={{ fill: '#F8FAFC', radius: 6 }} />
              <Bar dataKey="profit" radius={[6, 6, 0, 0]} maxBarSize={30}>
                {last7DaysData.map((entry, index) => (
                  <Cell
                    key={`bar-cell-${index}`}
                    fill={
                      entry.isToday
                        ? '#C5A059'
                        : entry.profit > 0
                        ? '#10B981'
                        : '#E2E8F0'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Legend */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-2 px-1">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#C5A059] inline-block" />
              <span>{language === 'te' ? 'ఈ రోజు' : 'Today'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981] inline-block" />
              <span>{language === 'te' ? 'మునుపటి లాభం' : 'Past Days'}</span>
            </div>
          </div>
          <span className="font-medium text-slate-400">
            {language === 'te' ? 'టాప్ చేసి వివరాలు చూడండి' : 'Tap bars for details'}
          </span>
        </div>
      </div>

      {/* List of Completed Deals */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>
              {language === 'te' ? 'ముగిసిన లెక్కల జాబితా' : 'Settled Deals History'} ({completedDeals.length})
            </span>
          </h3>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onOpenBackup}
              className="text-[11px] text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition"
            >
              <Database className="w-3 h-3 text-[#C5A059]" />
              <span>Backup</span>
            </button>

            {onClearAllData && (
              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                className="text-[11px] text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition active:scale-95 cursor-pointer"
                title={language === 'te' ? 'అన్ని డేటాను క్లియర్ చేయండి' : 'Clear All Data'}
              >
                <RotateCcw className="w-3 h-3 text-rose-600" />
                <span>{language === 'te' ? 'క్లియర్' : 'Clear All'}</span>
              </button>
            )}
          </div>
        </div>

        {completedDeals.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
            No completed deals recorded yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {completedDeals.map((tx) => {
              const hasInvestor = tx.investors && tx.investors.length > 0 && tx.investors[0].investorName;
              const hasAgent = Boolean(tx.agentName);

              return (
                <div
                  key={tx.id}
                  className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-extrabold text-[#1E293B]">
                          {tx.customerName || `Deal ${formatINR(tx.principal)}`}
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                          Done
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Principal {formatINR(tx.principal)} • Return: {formatDateReadable(tx.returnDate || tx.givenDate)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Your Profit</span>
                        <span className="text-sm font-black font-mono text-emerald-600">
                          +{formatINR(tx.finalOwnerProfit)}
                        </span>
                      </div>
                      {onDeleteDeal && (
                        <button
                          type="button"
                          onClick={() => setDealToDelete(tx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition active:scale-95 cursor-pointer ml-1"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Investor and Agent Settlement details badge bar */}
                  {(hasInvestor || hasAgent) && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 text-[11px]">
                      {hasInvestor && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded-lg font-medium">
                          <Landmark className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>
                            {tx.investors[0].investorName}: {formatINR((tx.finalInvestorShare || 0) + (tx.investors[0].amount || tx.principal))}
                          </span>
                          <span className="text-[10px] text-amber-700">
                            ({language === 'te' ? 'వాటా' : 'Share'}: {formatINR(tx.finalInvestorShare || 0)})
                          </span>
                        </span>
                      )}

                      {hasAgent && (
                        <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-900 border border-sky-200/80 px-2 py-0.5 rounded-lg font-medium">
                          <Handshake className="w-3 h-3 text-sky-600 shrink-0" />
                          <span>
                            {tx.agentName}: {formatINR(tx.finalAgentCommission || 0)}
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* In-App Confirmation Modal for Deleting Completed Deal */}
      <ConfirmModal
        isOpen={!!dealToDelete}
        onClose={() => setDealToDelete(null)}
        onConfirm={() => {
          if (dealToDelete && onDeleteDeal) {
            onDeleteDeal(dealToDelete.id);
            setDealToDelete(null);
          }
        }}
        title={language === 'te' ? 'రికార్డు తొలగించాలా?' : 'Delete Record?'}
        message={
          dealToDelete
            ? language === 'te'
              ? `ఈ ముగిసిన రికార్డు (${formatINR(dealToDelete.principal)}) ను తొలగించాలనుకుంటున్నారా?`
              : `Delete this settled record (${formatINR(dealToDelete.principal)})? This record will be permanently deleted from history.`
            : ''
        }
        confirmText={language === 'te' ? 'తొలగించు' : 'Delete Record'}
        cancelText={language === 'te' ? 'రద్దు చేయి' : 'Cancel'}
        isDanger={true}
        type="delete"
      />

      {/* In-App Confirmation Modal for Clearing All Data */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        isLoading={isClearing}
        onConfirm={async () => {
          if (onClearAllData) {
            setIsClearing(true);
            try {
              await onClearAllData();
              setIsClearModalOpen(false);
            } catch (err) {
              console.error(err);
            } finally {
              setIsClearing(false);
            }
          }
        }}
        title={language === 'te' ? 'అన్ని డేటాను క్లియర్ చేయాలా?' : 'Clear All Ledger Data?'}
        message={
          language === 'te'
            ? 'మీరు ఖచ్చితంగా అన్ని లావాదేవీలు, డీల్స్ మరియు లెక్కల డేటాను పూర్తిగా తొలగించాలనుకుంటున్నారా? ఇది తిరిగి పొందలేరు.'
            : 'Are you sure you want to permanently clear all deals, logs, and ledger data? You will start fresh with a clean zero-balance ledger.'
        }
        confirmText={language === 'te' ? 'అవును, మొత్తం తొలగించు' : 'Yes, Clear Everything'}
        cancelText={language === 'te' ? 'రద్దు చేయి' : 'Cancel'}
        isDanger={true}
        type="clear"
      />
    </div>
  );
};
