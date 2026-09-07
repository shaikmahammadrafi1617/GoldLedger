import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Check, 
  Clock, 
  AlertCircle, 
  User, 
  Coins, 
  Info,
  CalendarDays
} from 'lucide-react';
import { Transaction, Language } from '../types';
import { 
  formatINR, 
  formatCompactINR, 
  calculateFinancials, 
  calculateDurationDays, 
  getTodayDateString 
} from '../utils/formatters';
import { getT } from '../utils/translations';
import { DailyClosingSummary } from './DailyClosingSummary';

interface CalendarViewProps {
  transactions: Transaction[];
  language: Language;
  onSelectTransaction: (tx: Transaction) => void;
  onCompleteTransaction: (tx: Transaction) => void;
  onNewTransactionForDate?: (dateStr: string) => void;
}

type ViewMode = 'month' | 'week' | 'day';

export const CalendarView: React.FC<CalendarViewProps> = ({
  transactions,
  language,
  onSelectTransaction,
  onCompleteTransaction,
  onNewTransactionForDate,
}) => {
  const t = getT(language);
  const todayStr = getTodayDateString();

  // Selected date defaults to today or first day of current month
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Month navigation state: initialize with current date (Sep 2026)
  const [currentYear, setCurrentYear] = useState<number>(() => {
    const parts = todayStr.split('-').map(Number);
    return parts[0];
  });
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    const parts = todayStr.split('-').map(Number);
    return parts[1] - 1; // 0-indexed
  });

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const parts = todayStr.split('-').map(Number);
    setCurrentYear(parts[0]);
    setCurrentMonth(parts[1] - 1);
    setSelectedDate(todayStr);
  };

  // Month grid generation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNumber: d, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNumber: d, isCurrentMonth: true });
    }

    // Next month padding to fill complete weeks (multiples of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNumber: d, isCurrentMonth: false });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Week view days: 7 days around selectedDate
  const weekDays = useMemo(() => {
    const curr = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = curr.getDay(); // 0 = Sun
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    const days: { dateStr: string; dayNumber: number; dayName: string }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      days.push({
        dateStr: `${y}-${m}-${day}`,
        dayNumber: d.getDate(),
        dayName: dayNames[i],
      });
    }
    return days;
  }, [selectedDate]);

  // Filter transactions that intersect with the active view or day
  const getTransactionsForDate = (dateStr: string) => {
    return transactions.filter((tx) => {
      if (tx.status === 'cancelled') {
        return tx.givenDate === dateStr;
      }
      const isStarted = tx.givenDate <= dateStr;
      if (!isStarted) return false;

      // If completed, bar ends on returnDate
      if (tx.status === 'completed') {
        const returnD = tx.returnDate || tx.givenDate;
        return dateStr <= returnD;
      }

      // If still active or needs_followup, extends across active days up to today or currently
      return dateStr <= todayStr;
    });
  };

  /**
   * Color System strictly per prompt:
   * - Blue bar — Active transaction
   * - Green bar — Successfully completed transaction
   * - Grey bar — Cancelled transaction
   * - Orange bar — Needs follow-up transaction
   * - Purple bar — Transaction with investor capital
   * - Dark green completion marker — Money and interest received successfully
   */
  const getBarColorClasses = (tx: Transaction, isCompletionDay: boolean) => {
    if (isCompletionDay && tx.status === 'completed') {
      return 'bg-emerald-700 text-white border-emerald-900 ring-2 ring-emerald-400';
    }
    if (tx.investors && tx.investors.length > 0 && tx.enableProfitSharing) {
      return 'bg-purple-600 text-white border-purple-700 shadow-sm';
    }
    switch (tx.status) {
      case 'completed':
        return 'bg-emerald-600 text-white border-emerald-700 shadow-sm';
      case 'active':
        return 'bg-sky-600 text-white border-sky-700 shadow-sm';
      case 'needs_followup':
        return 'bg-amber-600 text-white border-amber-700 shadow-sm';
      case 'cancelled':
        return 'bg-slate-500 text-slate-100 border-slate-600 opacity-70';
      default:
        return 'bg-sky-600 text-white border-sky-700';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6 text-[#1E293B]">
      {/* Calendar Header Controls */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <p className="text-xs text-slate-500">
                Tap any day to view daily closing details & settled money
              </p>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* View mode buttons & Today */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleGoToday}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
            >
              {t.today}
            </button>

            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-md transition ${
                  viewMode === 'month'
                    ? 'bg-[#C5A059] text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.monthView}
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-md transition ${
                  viewMode === 'week'
                    ? 'bg-[#C5A059] text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.weekView}
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 rounded-md transition ${
                  viewMode === 'day'
                    ? 'bg-[#C5A059] text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.dayView}
              </button>
            </div>
          </div>
        </div>

        {/* Color System Legend */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] text-slate-600">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            Timeline Color System:
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>
            <span>Blue: Active</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600 inline-block"></span>
            <span>Green: Completed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-700 border border-emerald-500 inline-flex items-center justify-center text-[9px] text-white">
              ✓
            </span>
            <span>Dark Green: Money Returned (✓)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-purple-600 inline-block"></span>
            <span>Purple: Investor Capital</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-600 inline-block"></span>
            <span>Orange: Follow-up</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-400 inline-block"></span>
            <span>Grey: Cancelled</span>
          </span>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Day Names Row */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 bg-white">
            {calendarDays.map((day) => {
              const isToday = day.dateStr === todayStr;
              const isSelected = day.dateStr === selectedDate;
              const txsForDay = getTransactionsForDate(day.dateStr);

              return (
                <div
                  key={day.dateStr}
                  id={`cal-day-${day.dateStr}`}
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`min-h-[115px] sm:min-h-[135px] p-1.5 sm:p-2 transition cursor-pointer flex flex-col justify-between ${
                    day.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 text-slate-400'
                  } ${isSelected ? 'ring-2 ring-[#C5A059] bg-[#C5A059]/5 z-10' : 'hover:bg-slate-50'}`}
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                        isToday
                          ? 'bg-[#C5A059] text-white font-black'
                          : isSelected
                          ? 'bg-[#C5A059]/20 text-[#C5A059] font-bold'
                          : day.isCurrentMonth
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {txsForDay.length > 0 && (
                      <span className="text-[10px] font-semibold text-slate-400">
                        {txsForDay.length} {txsForDay.length === 1 ? 'loan' : 'loans'}
                      </span>
                    )}
                  </div>

                  {/* Horizontal Transaction Bars for this Day */}
                  <div className="space-y-1 overflow-y-auto max-h-[85px] no-scrollbar">
                    {txsForDay.map((tx) => {
                      const isReturnDay = tx.returnDate === day.dateStr && tx.status === 'completed';
                      const fin = calculateFinancials(tx, tx.durationDays);
                      const profitDisplay = tx.finalOwnerProfit !== undefined 
                        ? formatINR(tx.finalOwnerProfit)
                        : formatINR(fin.ownerNetProfit);

                      const colorClasses = getBarColorClasses(tx, isReturnDay);

                      return (
                        <div
                          key={`${tx.id}-${day.dateStr}`}
                          id={`cal-bar-${tx.id}-${day.dateStr}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(day.dateStr);
                            onSelectTransaction(tx);
                          }}
                          className={`text-[10px] sm:text-[11px] leading-tight px-1.5 py-1 rounded font-semibold transition cursor-pointer hover:scale-[1.02] shadow-xs ${colorClasses} ${
                            isReturnDay ? 'font-bold' : ''
                          }`}
                          title={`Click for details: ${tx.agentName} - Principal: ${formatINR(tx.principal)} - Given: ${tx.givenDate} - Status: ${tx.status}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-extrabold tracking-tight">
                              [{formatCompactINR(tx.principal)}]
                              {isReturnDay && <span className="ml-0.5">✓</span>}
                            </span>
                            <span className="truncate max-w-[65px] sm:max-w-[75px] opacity-90">
                              {tx.agentName.split(' ')[0]}
                            </span>
                          </div>

                          {/* Profit label */}
                          <div className="text-[9px] opacity-90 truncate mt-0.5 flex items-center justify-between">
                            <span>{profitDisplay}</span>
                            {isReturnDay && (
                              <span className="text-[8px] bg-black/20 px-1 rounded font-mono">
                                RETURNED
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 divide-x divide-slate-200 bg-slate-50 text-center py-2.5">
            {weekDays.map((day) => {
              const isSelected = day.dateStr === selectedDate;
              const isToday = day.dateStr === todayStr;
              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`p-2 cursor-pointer transition ${
                    isSelected ? 'bg-[#C5A059]/10' : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs text-slate-500 font-semibold uppercase">{day.dayName}</div>
                  <div className={`text-lg font-bold mt-1 mx-auto w-8 h-8 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-[#C5A059] text-white' : isSelected ? 'bg-[#C5A059]/20 text-[#C5A059]' : 'text-slate-800'
                  }`}>
                    {day.dayNumber}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-7 divide-x divide-slate-200 min-h-[260px] p-2 bg-white">
            {weekDays.map((day) => {
              const txs = getTransactionsForDate(day.dateStr);
              return (
                <div key={day.dateStr} className="space-y-2 p-1">
                  {txs.map((tx) => {
                    const isReturnDay = tx.returnDate === day.dateStr && tx.status === 'completed';
                    const fin = calculateFinancials(tx, tx.durationDays);
                    const colorClasses = getBarColorClasses(tx, isReturnDay);

                    return (
                      <div
                        key={`${tx.id}-${day.dateStr}`}
                        onClick={() => {
                          setSelectedDate(day.dateStr);
                          onSelectTransaction(tx);
                        }}
                        className={`p-2 rounded-lg text-xs cursor-pointer hover:scale-[1.02] transition shadow-xs ${colorClasses}`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>[{formatCompactINR(tx.principal)}]</span>
                          {isReturnDay && <span className="text-xs">✓ Done</span>}
                        </div>
                        <div className="text-[11px] truncate mt-1">Agent: {tx.agentName}</div>
                        <div className="text-[11px] font-mono mt-0.5">
                          Profit: {formatINR(tx.finalOwnerProfit || fin.ownerNetProfit)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <h3 className="text-lg font-bold text-slate-800">
              Day Breakdown: {selectedDate}
            </h3>
            <span className="text-xs text-slate-500">
              {getTransactionsForDate(selectedDate).length} active / completed transactions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getTransactionsForDate(selectedDate).map((tx) => {
              const isReturnDay = tx.returnDate === selectedDate && tx.status === 'completed';
              const fin = calculateFinancials(tx, tx.durationDays);
              const colorClasses = getBarColorClasses(tx, isReturnDay);

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className={`p-4 rounded-xl cursor-pointer transition hover:opacity-95 shadow-xs ${colorClasses}`}
                >
                  <div className="flex items-center justify-between font-bold text-sm">
                    <span>{tx.customerName}</span>
                    <span>[{formatINR(tx.principal)}]</span>
                  </div>
                  <div className="text-xs mt-1 opacity-90 flex items-center justify-between">
                    <span>Agent: {tx.agentName}</span>
                    <span>Status: {tx.status.toUpperCase()}</span>
                  </div>
                  <div className="text-xs mt-2 pt-2 border-t border-white/20 flex items-center justify-between font-mono">
                    <span>Given: {tx.givenDate}</span>
                    <span>Profit: {formatINR(tx.finalOwnerProfit || fin.ownerNetProfit)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAILY CLOSING SUMMARY BELOW CALENDAR */}
      <DailyClosingSummary
        selectedDate={selectedDate}
        transactions={transactions}
        language={language}
        onSelectTransaction={onSelectTransaction}
        onCompleteTransaction={onCompleteTransaction}
      />
    </div>
  );
};
