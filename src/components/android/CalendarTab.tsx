import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  Coins, 
  AlertCircle, 
  Send, 
  ArrowRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Transaction, Language } from '../../types';
import { 
  formatINR, 
  formatNumberWithCommas, 
  calculateFinancials, 
  calculateDurationDays, 
  getTodayDateString, 
  formatDateReadable,
  getPastDateString,
  getRelativeDaysLabel
} from '../../utils/formatters';

interface CalendarTabProps {
  transactions: Transaction[];
  language: Language;
  onEnterDealForDate: (dateStr: string) => void;
  onSelectDealToSettle: (tx: Transaction) => void;
  onSaveQuickPastDeal?: (tx: Partial<Transaction>) => void;
}

export const CalendarTab: React.FC<CalendarTabProps> = ({
  transactions,
  language,
  onEnterDealForDate,
  onSelectDealToSettle,
  onSaveQuickPastDeal,
}) => {
  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Quick Inline Deal Entry state
  const [showInlineAdd, setShowInlineAdd] = useState<boolean>(false);
  const [quickPrincipal, setQuickPrincipal] = useState<number>(0);
  const [quickPrincipalStr, setQuickPrincipalStr] = useState<string>('');
  const [quickRate, setQuickRate] = useState<number>(1000);
  const [quickRateStr, setQuickRateStr] = useState<string>('1,000');
  const [quickName, setQuickName] = useState<string>('');

  // Month navigation
  const [currentYear, setCurrentYear] = useState<number>(() => {
    const parts = todayStr.split('-').map(Number);
    return parts[0];
  });
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    const parts = todayStr.split('-').map(Number);
    return parts[1] - 1; // 0-indexed
  });

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthNamesTe = [
    'జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే', 'జూన్',
    'జూలై', 'ఆగస్టు', 'సెప్టెంబర్', 'అక్టోబర్', 'నవంబర్', 'డిసెంబర్'
  ];

  const weekDayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDayNamesTe = ['ఆది', 'సోమ', 'మంగళ', 'బుధ', 'గురు', 'శుక్ర', 'శని'];

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

  // Calendar days grid
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

    // Next month padding to complete 7-day rows
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNumber: d, isCurrentMonth: false });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Deals lookup map for dots on calendar
  const dealsByDate = useMemo(() => {
    const map = new Map<string, { active: Transaction[]; completed: Transaction[] }>();
    for (const tx of transactions) {
      if (!tx.givenDate) continue;
      const entry = map.get(tx.givenDate) || { active: [], completed: [] };
      if (tx.status === 'active' || tx.status === 'needs_followup') {
        entry.active.push(tx);
      } else if (tx.status === 'completed') {
        entry.completed.push(tx);
      }
      map.set(tx.givenDate, entry);
    }
    return map;
  }, [transactions]);

  // Deals for the selected date
  const selectedDateDeals = useMemo(() => {
    const startedOnDate = transactions.filter((t) => t.givenDate === selectedDate);
    const completedOnDate = transactions.filter((t) => t.status === 'completed' && t.returnDate === selectedDate);
    return {
      started: startedOnDate,
      completed: completedOnDate,
      totalStartedPrincipal: startedOnDate.reduce((sum, t) => sum + (t.principal || 0), 0),
    };
  }, [transactions, selectedDate]);

  // Quick past deal submit handler
  const handleQuickPastDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickPrincipal <= 0) {
      alert(language === 'te' ? 'దయచేసి అసలు మొత్తం నమోదు చేయండి' : 'Please enter principal amount');
      return;
    }
    if (quickRate <= 0) {
      alert(language === 'te' ? 'దయచేసి వడ్డీ రేటు నమోదు చేయండి' : 'Please enter interest rate');
      return;
    }

    const label = quickName.trim() || `Deal ₹${formatNumberWithCommas(quickPrincipal)}`;
    const newTx: Partial<Transaction> = {
      customerName: label,
      principal: quickPrincipal,
      givenDate: selectedDate,
      customerRatePerLakh: quickRate,
      ratePeriod: 'per_day',
      status: 'active',
      enableProfitSharing: false,
      investors: [],
      releaseBank: '',
      targetBank: '',
      agentId: '',
      agentName: '',
    };

    if (onSaveQuickPastDeal) {
      onSaveQuickPastDeal(newTx);
    } else {
      onEnterDealForDate(selectedDate);
    }

    setShowInlineAdd(false);
    setQuickPrincipal(0);
    setQuickPrincipalStr('');
    setQuickName('');
  };

  const isPast = selectedDate < todayStr;
  const isToday = selectedDate === todayStr;
  const isFuture = selectedDate > todayStr;
  const relativeLabel = getRelativeDaysLabel(selectedDate, language);
  const elapsedDays = calculateDurationDays(selectedDate);

  return (
    <div className="p-4 space-y-4 pb-20 max-w-lg mx-auto">
      {/* Screen Title & Calendar Quick Jumps */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-[#C5A059]/15 text-[#C5A059] rounded-xl">
              <CalendarIcon className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1E293B]">
                {language === 'te' ? 'క్యాలెండర్ & గత తేదీ లెక్కలు' : 'Calendar & Past Deals'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {language === 'te' 
                  ? 'ఏ రోజైనా ఎంచుకోండి — మర్చిపోయిన పాత లెక్కలను సులభంగా నమోదు చేయండి'
                  : 'Select any date to record past missed deals & track progress'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGoToday}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold shadow-2xs transition active:scale-95"
          >
            {language === 'te' ? 'ఈ రోజు' : 'Today'}
          </button>
        </div>

        {/* Fast Shortcut Pills: Today, Yesterday, 2 Days Ago, 3 Days Ago */}
        <div className="pt-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
            {language === 'te' ? 'త్వరిత తేదీ ఎంపిక:' : 'Quick Date Jump:'}
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { labelEn: 'Today', labelTe: 'ఈ రోజు', date: todayStr },
              { labelEn: 'Yesterday', labelTe: 'నిన్న', date: getPastDateString(1) },
              { labelEn: '2 Days Ago', labelTe: '2 రోజుల క్రితం', date: getPastDateString(2) },
              { labelEn: '3 Days Ago', labelTe: '3 రోజుల క్రితం', date: getPastDateString(3) },
            ].map((shortcut) => {
              const isSel = selectedDate === shortcut.date;
              return (
                <button
                  key={shortcut.labelEn}
                  type="button"
                  onClick={() => {
                    setSelectedDate(shortcut.date);
                    const parts = shortcut.date.split('-').map(Number);
                    setCurrentYear(parts[0]);
                    setCurrentMonth(parts[1] - 1);
                  }}
                  className={`py-1.5 px-1 rounded-xl text-xs font-bold transition text-center border active:scale-95 cursor-pointer ${
                    isSel 
                      ? 'bg-[#1E293B] text-[#C5A059] border-[#1E293B] shadow-xs' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="block truncate">
                    {language === 'te' ? shortcut.labelTe : shortcut.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calendar Month Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        {/* Month & Nav Controls */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition"
            title="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h3 className="text-base font-extrabold text-[#1E293B]">
              {language === 'te' ? monthNamesTe[currentMonth] : monthNamesEn[currentMonth]} {currentYear}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              {language === 'te' ? 'తేదీని ట్యాప్ చేయండి' : 'Tap any date to view or enter deal'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition"
            title="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 gap-1 text-center border-b border-slate-100 pb-1.5">
          {(language === 'te' ? weekDayNamesTe : weekDayNamesEn).map((day, idx) => (
            <span 
              key={idx} 
              className={`text-[11px] font-bold ${idx === 0 ? 'text-rose-500' : 'text-slate-400'}`}
            >
              {day}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {calendarDays.map((dayObj) => {
            const isSel = dayObj.dateStr === selectedDate;
            const isCurrDay = dayObj.dateStr === todayStr;
            const dayDeals = dealsByDate.get(dayObj.dateStr);
            const hasActive = dayDeals && dayDeals.active.length > 0;
            const hasCompleted = dayDeals && dayDeals.completed.length > 0;

            return (
              <button
                key={dayObj.dateStr}
                type="button"
                onClick={() => setSelectedDate(dayObj.dateStr)}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 cursor-pointer ${
                  isSel 
                    ? 'bg-[#C5A059] text-slate-950 font-black shadow-md scale-105 ring-2 ring-[#C5A059]/40 z-10' 
                    : isCurrDay
                    ? 'bg-slate-100 text-[#1E293B] font-extrabold ring-2 ring-[#C5A059]/60'
                    : dayObj.isCurrentMonth
                    ? 'text-slate-800 hover:bg-slate-100 font-semibold'
                    : 'text-slate-300 hover:bg-slate-50 font-normal'
                }`}
              >
                <span className="text-xs">{dayObj.dayNumber}</span>
                
                {/* Dots indicator */}
                <div className="flex items-center gap-0.5 mt-0.5 h-1.5">
                  {hasActive && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-slate-950' : 'bg-blue-600'}`} />
                  )}
                  {hasCompleted && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-emerald-950' : 'bg-emerald-600'}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 px-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
              <span>{language === 'te' ? 'నడుస్తున్నవి' : 'Active'}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              <span>{language === 'te' ? 'ముగిసినవి' : 'Completed'}</span>
            </span>
          </div>
          <span className="text-slate-400 font-medium">
            {formatDateReadable(selectedDate)}
          </span>
        </div>
      </div>

      {/* Selected Date Hub ("The Deal Center for this Date") */}
      <div className="bg-white border-2 border-[#C5A059]/40 rounded-2xl p-4 shadow-sm space-y-3">
        {/* Date Header with Relative Status */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#1E293B]">
                {formatDateReadable(selectedDate)}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                isToday 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : isPast
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {relativeLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isPast && (
                <span>
                  {language === 'te' 
                    ? `ఈ తేదీన ప్రారంభమైన లెక్కలు ఈ రోజుకు ${elapsedDays} రోజులు నడుస్తాయి.`
                    : `Deals started on this date have run for ${elapsedDays} days up to today.`}
                </span>
              )}
              {isToday && (
                <span>
                  {language === 'te' 
                    ? 'ఈ రోజు చేసిన తాజా లెక్కలు' 
                    : 'Current deals started today'}
                </span>
              )}
              {isFuture && (
                <span>
                  {language === 'te' ? 'భవిష్యత్తు తేదీ' : 'Future date'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Big Action: Enter Deal for This Date */}
        {!showInlineAdd ? (
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => onEnterDealForDate(selectedDate)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9a7836] hover:from-[#b08e4d] hover:to-[#88692f] text-white font-extrabold text-sm shadow-md flex items-center justify-center space-x-2 transition active:scale-[0.98] cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 stroke-[2.4]" />
              <span>
                {language === 'te' 
                  ? `+ ఈ తేదీన (${formatDateReadable(selectedDate)}) లెక్క రాయండి` 
                  : `+ Enter Deal for ${formatDateReadable(selectedDate)}`}
                {isPast && ` (${relativeLabel})`}
              </span>
            </button>

            {/* Quick Inline Expander button */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowInlineAdd(true)}
                className="text-xs text-[#9a7836] hover:text-[#785b24] font-bold underline"
              >
                {language === 'te' ? '⚡ లేదా ఇక్కడే ఫాస్ట్ ఎంట్రీ చేయండి' : '⚡ Or quick-add past deal right here'}
              </button>
            </div>
          </div>
        ) : (
          /* Inline Fast Add Form directly on the calendar */
          <form onSubmit={handleQuickPastDealSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>
                  {language === 'te' 
                    ? `గత తేదీ ఫాస్ట్ ఎంట్రీ (${relativeLabel})` 
                    : `Quick Enter Past Deal (${relativeLabel})`}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setShowInlineAdd(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕ Close
              </button>
            </div>

            {/* Amount input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                {language === 'te' ? 'అసలు మొత్తం (Principal):' : 'Amount (Principal):'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-bold text-slate-400">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={quickPrincipalStr}
                  onChange={(e) => {
                    const rawDigits = e.target.value.replace(/\D/g, '');
                    const num = rawDigits ? parseInt(rawDigits, 10) : 0;
                    setQuickPrincipal(num);
                    setQuickPrincipalStr(num > 0 ? formatNumberWithCommas(num) : '');
                  }}
                  placeholder="e.g. 5,00,000"
                  className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-base font-bold font-mono text-slate-900 focus:outline-none focus:border-[#C5A059]"
                  required
                />
              </div>

              {/* Quick Principal Chips */}
              <div className="grid grid-cols-4 gap-1 pt-1">
                {[100000, 200000, 300000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setQuickPrincipal((prev) => {
                        const next = prev + amt;
                        setQuickPrincipalStr(formatNumberWithCommas(next));
                        return next;
                      });
                    }}
                    className="py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-bold font-mono text-slate-800"
                  >
                    +{(amt / 100000)}L
                  </button>
                ))}
              </div>
            </div>

            {/* Rate Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                {language === 'te' ? 'వడ్డీ రేటు (₹1,00,000 కి రోజుకు):' : 'Interest Rate (per ₹1L / day):'}
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[100, 120, 1000, 2000].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setQuickRate(r);
                      setQuickRateStr(formatNumberWithCommas(r));
                    }}
                    className={`py-1 rounded-md text-[11px] font-bold border transition ${
                      quickRate === r
                        ? 'bg-[#1E293B] text-[#C5A059] border-[#1E293B]'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    ₹{r >= 1000 ? `${r / 1000}K` : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Elapsed calculation preview */}
            {quickPrincipal > 0 && quickRate > 0 && (
              <div className="bg-[#1E293B] text-white p-2.5 rounded-lg text-xs space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Elapsed Days to Today:</span>
                  <span className="font-bold text-[#C5A059]">{elapsedDays} Days</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Accrued Interest So Far:</span>
                  <span className="font-bold text-emerald-400">
                    +{formatINR(Math.round((quickPrincipal / 100000) * quickRate * elapsedDays))}
                  </span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-700 pt-1 text-white">
                  <span>Total Due Today:</span>
                  <span className="text-[#C5A059]">
                    {formatINR(quickPrincipal + Math.round((quickPrincipal / 100000) * quickRate * elapsedDays))}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition"
            >
              {language === 'te' ? 'ఈ గత లెక్కను సేవ్ చేయండి' : 'Save Past Deal to Ledger'}
            </button>
          </form>
        )}

        {/* Existing Deals for this Date */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              {language === 'te' ? 'ఈ తేదీన ప్రారంభమైన లెక్కలు:' : 'Deals on this Date:'}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {selectedDateDeals.started.length} {language === 'te' ? 'లెక్కలు' : 'deals'}
            </span>
          </div>

          {selectedDateDeals.started.length > 0 ? (
            <div className="space-y-2">
              {selectedDateDeals.started.map((tx) => {
                const fin = calculateFinancials(tx);
                const isActive = tx.status === 'active';

                return (
                  <div 
                    key={tx.id} 
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-extrabold text-[#1E293B] block">
                          {tx.customerName || `Deal ${formatINR(tx.principal)}`}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          ₹{formatNumberWithCommas(tx.customerRatePerLakh)}/1L/day • {fin.durationDays} days active
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black font-mono text-[#1E293B] block">
                          {formatINR(tx.principal)}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isActive ? (language === 'te' ? 'నడుస్తున్నది' : 'Active') : (language === 'te' ? 'ముగిసింది' : 'Completed')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                      <div className="text-emerald-700 font-bold">
                        <span>{language === 'te' ? 'వడ్డీ: ' : 'Interest: '}</span>
                        <span>+{formatINR(fin.grossInterest)}</span>
                      </div>
                      {isActive && (
                        <button
                          type="button"
                          onClick={() => onSelectDealToSettle(tx)}
                          className="px-2.5 py-1 bg-[#1E293B] hover:bg-slate-800 text-[#C5A059] rounded-lg text-xs font-bold transition active:scale-95 flex items-center gap-1"
                        >
                          <span>{language === 'te' ? 'లెక్క తేల్చు' : 'Settle Now'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-4 text-center space-y-1">
              <Clock className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                {language === 'te' 
                  ? `${formatDateReadable(selectedDate)} న ఎటువంటి లెక్క నమోదు కాలేదు.` 
                  : `No deals recorded for ${formatDateReadable(selectedDate)} yet.`}
              </p>
              {isPast && (
                <p className="text-[11px] text-amber-700">
                  {language === 'te' 
                    ? 'ఆ రోజు చేసిన లెక్క ఉంటే పై బటన్‌తో నమోదు చేయవచ్చు.' 
                    : 'If you forgot to enter a deal that happened on this day, tap above to add it now!'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
