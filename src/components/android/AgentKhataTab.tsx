import React, { useState, useMemo, useEffect } from 'react';
import { 
  PlusCircle, 
  Share2, 
  Trash2, 
  CheckCircle2,
  Calendar,
  Percent,
  Edit3,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Users,
  Check
} from 'lucide-react';
import { Agent, AgentKhataEntry, Language } from '../../types';
import { 
  formatINR, 
  formatNumberWithCommas, 
  parseNumberFromCommas, 
  getTodayDateString, 
  formatDateReadable,
  calculateDurationDays,
  calculateCompoundDeal,
  getDefaultGraceDays
} from '../../utils/formatters';
import { ConfirmModal } from '../ConfirmModal';

interface AgentKhataTabProps {
  agents: Agent[];
  khataEntries: AgentKhataEntry[];
  language: Language;
  onAddEntry: (entry: Omit<AgentKhataEntry, 'id' | 'createdAt'>) => void;
  onDeleteEntry: (id: string) => void;
  onAddAgent: (name: string, phone: string) => void;
  onDeleteAgent: (agentId: string) => void;
}

// Quick helper to get relative past date (e.g. 1 day ago, 2 days ago)
const getPastDateString = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const AgentKhataTab: React.FC<AgentKhataTabProps> = ({
  agents,
  khataEntries,
  language,
  onAddEntry,
  onDeleteEntry,
  onAddAgent,
  onDeleteAgent,
}) => {
  // Selected Agent
  const [selectedAgentId, setSelectedAgentId] = useState<string>(() => {
    return agents.length > 0 ? agents[0].id : '';
  });

  // Modals for deletion confirmation
  const [entryToDelete, setEntryToDelete] = useState<AgentKhataEntry | null>(null);
  const [isDeletingAgent, setIsDeletingAgent] = useState<boolean>(false);

  // View modes: 'view' | 'give_cash' | 'add_more' | 'add_interest' | 'received' | 'new_agent'
  const [mode, setMode] = useState<'view' | 'give_cash' | 'add_more' | 'add_interest' | 'received' | 'new_agent'>('view');

  // Input States
  const [entryDate, setEntryDate] = useState<string>(getTodayDateString());
  const [amountStr, setAmountStr] = useState<string>('');
  const [rateStr, setRateStr] = useState<string>('2000');
  const [agentCommissionRateStr, setAgentCommissionRateStr] = useState<string>('400');
  const [graceDays, setGraceDays] = useState<number>(5);
  const [daysCount, setDaysCount] = useState<number>(1);
  const [customInterestStr, setCustomInterestStr] = useState<string>('');
  const [showCustomInterest, setShowCustomInterest] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Compounding toggle & settings (Default: false = Simple Flat daily interest as requested)
  const [enableCompounding, setEnableCompounding] = useState<boolean>(false);
  const [compoundAfterDays, setCompoundAfterDays] = useState<number>(5);

  // Selected day row in daily breakdown table (defaults to null, which resolves to today)
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);

  const [receivedAmountStr, setReceivedAmountStr] = useState<string>('');

  // UI state for Breakdown & Investor Tracker
  const [showCompoundBreakdown, setShowCompoundBreakdown] = useState<boolean>(true);
  const [showInvestorNetProfit, setShowInvestorNetProfit] = useState<boolean>(false);
  const [investorAmountStr, setInvestorAmountStr] = useState<string>('8,00,000');
  const [investorRateStr, setInvestorRateStr] = useState<string>('1,000');

  // New Agent Form
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentPhone, setNewAgentPhone] = useState('');

  // Selected Agent Object
  const selectedAgent = useMemo(() => {
    if (!selectedAgentId && agents.length > 0) return agents[0];
    return agents.find((a) => a.id === selectedAgentId) || agents[0] || null;
  }, [agents, selectedAgentId]);

  // Entries for selected agent
  const currentAgentEntries = useMemo(() => {
    if (!selectedAgent) return [];
    return khataEntries
      .filter((e) => e.agentId === selectedAgent.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [khataEntries, selectedAgent]);

  // Current Running Balance (Total to Take)
  const currentBalance = useMemo(() => {
    if (currentAgentEntries.length === 0) return 0;
    return currentAgentEntries[currentAgentEntries.length - 1].newBalance;
  }, [currentAgentEntries]);

  // Last active entry
  const lastActiveEntry = useMemo(() => {
    if (currentAgentEntries.length === 0) return null;
    return currentAgentEntries[currentAgentEntries.length - 1];
  }, [currentAgentEntries]);

  // Find all entries for current active cycle (since balance was last 0)
  const activeCycleStartIndex = useMemo(() => {
    if (currentAgentEntries.length === 0 || currentBalance <= 0) return -1;
    let startIndex = 0;
    for (let i = currentAgentEntries.length - 1; i >= 0; i--) {
      if (currentAgentEntries[i].previousBalance === 0 && currentAgentEntries[i].type === 'give_cash') {
        startIndex = i;
        break;
      }
      if (currentAgentEntries[i].newBalance === 0) {
        startIndex = i + 1;
        break;
      }
    }
    return startIndex;
  }, [currentAgentEntries, currentBalance]);

  const activeCycleEntries = useMemo(() => {
    if (activeCycleStartIndex === -1 || activeCycleStartIndex >= currentAgentEntries.length) return [];
    return currentAgentEntries.slice(activeCycleStartIndex);
  }, [currentAgentEntries, activeCycleStartIndex]);

  // Initial deal entry for current active cycle
  const currentCycleStart = useMemo(() => {
    if (activeCycleEntries.length === 0) return null;
    return activeCycleEntries[0];
  }, [activeCycleEntries]);

  // Sync compounding settings when active cycle changes
  useEffect(() => {
    if (currentCycleStart) {
      if (currentCycleStart.enableCompounding !== undefined) {
        setEnableCompounding(currentCycleStart.enableCompounding);
      } else {
        setEnableCompounding(false);
      }
      if (currentCycleStart.compoundAfterDays !== undefined) {
        setCompoundAfterDays(currentCycleStart.compoundAfterDays);
      } else if (currentCycleStart.graceDays !== undefined) {
        setCompoundAfterDays(currentCycleStart.graceDays);
      } else {
        setCompoundAfterDays(5);
      }
    } else {
      setEnableCompounding(false);
      setCompoundAfterDays(5);
    }
    setSelectedDayNumber(null);
  }, [currentCycleStart?.id]);

  // Total principal given across all cash disbursements in this cycle
  const cyclePrincipal = useMemo(() => {
    if (activeCycleEntries.length === 0) return currentBalance;
    const totalGiven = activeCycleEntries
      .filter((e) => e.type === 'give_cash')
      .reduce((sum, e) => sum + (e.principalGiven || 0), 0);
    return totalGiven > 0 ? totalGiven : (currentCycleStart?.principalGiven || currentBalance);
  }, [activeCycleEntries, currentCycleStart, currentBalance]);

  const cycleRate = currentCycleStart?.ratePerLakh || (lastActiveEntry?.ratePerLakh ?? 2000);
  const cycleGraceDays = compoundAfterDays;
  const cycleAgentCommRate = currentCycleStart?.agentCommissionRatePerLakh ?? 400;

  // Number of days running since the active balance started (inclusive of give day)
  const daysRunning = useMemo(() => {
    if (!currentCycleStart || currentBalance <= 0) return 1;
    return Math.max(1, calculateDurationDays(currentCycleStart.date, getTodayDateString()));
  }, [currentCycleStart, currentBalance]);

  // Days elapsed since the latest entry was recorded in the ledger
  const daysSinceLastEntry = useMemo(() => {
    if (!lastActiveEntry || currentBalance <= 0) return 0;
    const lastDate = lastActiveEntry.date;
    const today = getTodayDateString();
    if (lastDate >= today) return 0;
    const d1 = new Date(`${lastDate}T00:00:00`);
    const d2 = new Date(`${today}T00:00:00`);
    const diffMs = d2.getTime() - d1.getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  }, [lastActiveEntry, currentBalance]);

  // Active rate per lakh
  const currentRate = cycleRate;

  // Live due balance for today (inclusive of give day and elapsed compounding or simple flat interest)
  const todayTotalDue = useMemo(() => {
    if (currentBalance <= 0) return 0;

    // When the latest entry was already recorded today (or future), currentBalance is already up to date
    if (daysSinceLastEntry === 0) {
      return currentBalance;
    }

    // When compounding is NOT enabled (default):
    // Simple flat daily interest on the principal
    if (!enableCompounding) {
      const dailyFlatInterest = Math.round((cyclePrincipal / 100000) * cycleRate);
      return currentBalance + (daysSinceLastEntry * dailyFlatInterest);
    }

    // When compounding IS enabled:
    if (activeCycleEntries.length === 1) {
      const calc = calculateCompoundDeal({
        principal: cyclePrincipal,
        ratePerLakh: cycleRate,
        agentCommissionRatePerLakh: cycleAgentCommRate,
        durationDays: daysRunning,
        enableCompounding: true,
        compoundAfterDays,
      });
      const todayRow = calc.dailyBreakdown.find((b) => b.day === daysRunning);
      return todayRow ? todayRow.closingBalance : calc.totalAmountExpected;
    }

    // If multiple entries exist in the cycle with compounding:
    let running = currentBalance;
    for (let d = 1; d <= daysSinceLastEntry; d++) {
      const dayNum = daysRunning - daysSinceLastEntry + d;
      const isCompounded = dayNum > compoundAfterDays;
      const rateBasis = isCompounded ? running : cyclePrincipal;
      const dayInterest = Math.round((rateBasis / 100000) * cycleRate);
      running += dayInterest;
    }
    return running;
  }, [currentBalance, daysSinceLastEntry, enableCompounding, compoundAfterDays, activeCycleEntries.length, cyclePrincipal, cycleRate, cycleAgentCommRate, daysRunning]);

  // Daily schedule calculation for the active deal (displays at least 7 days)
  const activeCompoundInfo = useMemo(() => {
    if (currentBalance <= 0) return null;
    const invAmt = showInvestorNetProfit ? (parseNumberFromCommas(investorAmountStr) || 0) : 0;
    const invRate = showInvestorNetProfit ? (parseNumberFromCommas(investorRateStr) || 0) : 0;
    const investors = invAmt > 0 ? [{
      investorId: 'inv-khata',
      investorName: language === 'te' ? 'ఇన్వెస్టర్' : 'Investor',
      amount: invAmt,
      ratePerLakh: invRate,
    }] : [];

    const baseCalc = calculateCompoundDeal({
      principal: cyclePrincipal,
      ratePerLakh: cycleRate,
      agentCommissionRatePerLakh: cycleAgentCommRate,
      durationDays: Math.max(daysRunning + 5, 10), // Show at least 10 days for convenient day selection
      enableCompounding,
      compoundAfterDays,
      investors,
    });

    if (activeCycleEntries.length > 1) {
      const adjustedBreakdown = baseCalc.dailyBreakdown.map((row) => {
        if (row.day === daysRunning) {
          return {
            ...row,
            closingBalance: todayTotalDue,
          };
        }
        return row;
      });
      return {
        ...baseCalc,
        dailyBreakdown: adjustedBreakdown,
        totalAmountExpected: Math.max(todayTotalDue, baseCalc.totalAmountExpected),
      };
    }

    return baseCalc;
  }, [currentBalance, cyclePrincipal, cycleRate, cycleAgentCommRate, daysRunning, enableCompounding, compoundAfterDays, showInvestorNetProfit, investorAmountStr, investorRateStr, language, activeCycleEntries.length, todayTotalDue]);

  // Helper to format calendar date for each day row in table
  const formatRowDate = (startDateStr: string | undefined, dayNumber: number): string => {
    if (!startDateStr) return `Day ${dayNumber}`;
    try {
      const [y, m, d] = startDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d + (dayNumber - 1));
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const yyyy = dateObj.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    } catch {
      return `Day ${dayNumber}`;
    }
  };

  // Active selected day (defaults to today's day number)
  const activeSelectedDay = selectedDayNumber ?? daysRunning;

  // Selected breakdown row object
  const selectedBreakdownRow = useMemo(() => {
    if (!activeCompoundInfo) return null;
    return activeCompoundInfo.dailyBreakdown.find((b) => b.day === activeSelectedDay) || null;
  }, [activeCompoundInfo, activeSelectedDay]);

  // Active due amount (for the selected day or today)
  const activeDueAmount = useMemo(() => {
    if (selectedDayNumber && selectedBreakdownRow) {
      return selectedBreakdownRow.closingBalance;
    }
    return todayTotalDue;
  }, [selectedDayNumber, selectedBreakdownRow, todayTotalDue]);

  // Daily interest currently accruing
  const dailyInterest = useMemo(() => {
    if (todayTotalDue <= 0) return 0;
    const isCompounded = enableCompounding && daysRunning > compoundAfterDays;
    const basis = isCompounded ? todayTotalDue : cyclePrincipal;
    return Math.round((basis / 100000) * currentRate);
  }, [todayTotalDue, enableCompounding, daysRunning, compoundAfterDays, cyclePrincipal, currentRate]);

  // Numeric input formatters
  const handleAmountChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    setAmountStr(num > 0 ? formatNumberWithCommas(num) : '');
  };

  const handleRateChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    setRateStr(num > 0 ? formatNumberWithCommas(num) : '');
  };

  const handleAgentCommRateChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    setAgentCommissionRateStr(num > 0 ? formatNumberWithCommas(num) : '');
  };

  const handleCustomInterestChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    setCustomInterestStr(num > 0 ? formatNumberWithCommas(num) : '');
  };

  // Date selection with automatic inclusive day duration update
  const handleEntryDateChange = (newDate: string) => {
    setEntryDate(newDate);
    if (mode === 'give_cash' || mode === 'view' || mode === 'add_more') {
      const days = calculateDurationDays(newDate, getTodayDateString());
      setDaysCount(days);
    }
  };

  // Reset form inputs
  const resetFormState = () => {
    const today = getTodayDateString();
    setEntryDate(today);
    setAmountStr('');
    setRateStr(currentRate ? currentRate.toString() : '2000');
    setAgentCommissionRateStr(cycleAgentCommRate ? cycleAgentCommRate.toString() : '400');
    setGraceDays(cycleGraceDays || 2);
    setDaysCount(1);
    setCustomInterestStr('');
    setShowCustomInterest(false);
    setNotes('');
    setReceivedAmountStr('');
  };

  // 1. GIVE CASH (Start a deal or record past given money with exact compound logic)
  const handleGiveCash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;
    const principal = parseNumberFromCommas(amountStr);
    const rate = parseNumberFromCommas(rateStr) || 2000;
    const agentCommRate = parseNumberFromCommas(agentCommissionRateStr) || 400;
    const d = daysCount > 0 ? daysCount : 1;
    if (principal <= 0) return;

    const baseBalance = todayTotalDue > 0 ? todayTotalDue : currentBalance;

    // Calculate deal based on compounding toggle
    const dealCalc = calculateCompoundDeal({
      principal,
      ratePerLakh: rate,
      agentCommissionRatePerLakh: agentCommRate,
      durationDays: d,
      enableCompounding,
      compoundAfterDays,
    });

    const calculatedInterest = dealCalc.totalInterestAccrued;
    const finalInterest = showCustomInterest && customInterestStr 
      ? parseNumberFromCommas(customInterestStr) 
      : calculatedInterest;

    const totalToTake = principal + finalInterest;

    let formula = '';
    if (baseBalance > 0) {
      formula = language === 'te'
        ? `పాత బాకీ (${formatINR(baseBalance)}) + కొత్త నగదు (${formatINR(principal)}) + వడ్డీ (${formatINR(finalInterest)}) = ${formatINR(baseBalance + totalToTake)}`
        : `Old Due (${formatINR(baseBalance)}) + Cash Given (${formatINR(principal)}) + Interest (${formatINR(finalInterest)}) = ${formatINR(baseBalance + totalToTake)}`;
    } else if (d === 1) {
      formula = language === 'te'
        ? `ఇచ్చిన నగదు: ${formatINR(principal)} + 1వ రోజు వడ్డీ (@ ₹${rate}/లక్ష): ${formatINR(finalInterest)} = ${formatINR(totalToTake)} | కమీషన్: ${formatINR(dealCalc.agentCommission)}`
        : `Cash Given: ${formatINR(principal)} + Day 1 Interest (@ ₹${rate}/Lakh): ${formatINR(finalInterest)} = ${formatINR(totalToTake)} | Comm: ${formatINR(dealCalc.agentCommission)}`;
    } else if (!enableCompounding) {
      formula = language === 'te'
        ? `ఇచ్చిన నగదు: ${formatINR(principal)} (${d} రోజులు సాధారణ వడ్డీ @ ₹${rate}/లక్ష) = ${formatINR(totalToTake)} | కమీషన్: ${formatINR(dealCalc.agentCommission)}`
        : `Cash Given: ${formatINR(principal)} (${d} days flat rate @ ₹${rate}/Lakh) = ${formatINR(totalToTake)} | Comm: ${formatINR(dealCalc.agentCommission)}`;
    } else {
      formula = language === 'te'
        ? `ఇచ్చిన నగదు: ${formatINR(principal)} (${d} రోజులు, ${compoundAfterDays} రోజుల తర్వాత చక్రవడ్డీ) = ${formatINR(totalToTake)} | కమీషన్: ${formatINR(dealCalc.agentCommission)}`
        : `Cash Given: ${formatINR(principal)} (${d} days, compound after ${compoundAfterDays} days) = ${formatINR(totalToTake)} | Comm: ${formatINR(dealCalc.agentCommission)}`;
    }

    onAddEntry({
      agentId: selectedAgent.id,
      agentName: selectedAgent.name,
      date: entryDate,
      type: 'give_cash',
      principalGiven: principal,
      ratePerLakh: rate,
      days: d,
      graceDays: compoundAfterDays,
      enableCompounding,
      compoundAfterDays,
      agentCommissionRatePerLakh: agentCommRate,
      interestAmount: finalInterest,
      previousBalance: baseBalance,
      newBalance: baseBalance + totalToTake,
      formulaText: formula,
      notes: notes.trim() || undefined,
    });

    resetFormState();
    setMode('view');
  };

  // 2. GAVE MORE CASH (Adding more money to existing running balance)
  const handleAddMoreMoney = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;
    const newCash = parseNumberFromCommas(amountStr);
    const rate = parseNumberFromCommas(rateStr) || currentRate;
    const d = daysCount > 0 ? daysCount : 1;
    if (newCash <= 0) return;

    // Use live today's due as the accurate base balance
    const baseBalance = todayTotalDue > 0 ? todayTotalDue : currentBalance;

    // Interest on new cash for d days
    const interestOnNew = Math.round((newCash / 100000) * rate * d);

    const finalInterest = showCustomInterest && customInterestStr 
      ? parseNumberFromCommas(customInterestStr) 
      : interestOnNew;

    const finalBalance = baseBalance + newCash + finalInterest;

    const formula = language === 'te'
      ? `నేటి వరకు పాత బాకీ (${formatINR(baseBalance)}) + కొత్త నగదు (${formatINR(newCash)})${finalInterest > 0 ? ` + వడ్డీ (${formatINR(finalInterest)})` : ''} = ${formatINR(finalBalance)}`
      : `Old Due Today (${formatINR(baseBalance)}) + New Cash (${formatINR(newCash)})${finalInterest > 0 ? ` + Interest (${formatINR(finalInterest)})` : ''} = ${formatINR(finalBalance)}`;

    onAddEntry({
      agentId: selectedAgent.id,
      agentName: selectedAgent.name,
      date: entryDate,
      type: 'give_cash',
      principalGiven: newCash,
      ratePerLakh: rate,
      days: d,
      graceDays: compoundAfterDays,
      enableCompounding,
      compoundAfterDays,
      agentCommissionRatePerLakh: cycleAgentCommRate,
      interestAmount: finalInterest,
      previousBalance: baseBalance,
      newBalance: finalBalance,
      formulaText: formula,
      notes: notes.trim() || (language === 'te' ? 'అదనపు నగదు ఇవ్వబడింది' : 'Additional Cash Given'),
    });

    resetFormState();
    setMode('view');
  };

  // 3. ADD INTEREST / DAYS (Money not returned: simple flat rate or compounding)
  const handleAddInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || (todayTotalDue <= 0 && currentBalance <= 0)) return;

    const rate = parseNumberFromCommas(rateStr) || cycleRate;
    const agentCommRate = parseNumberFromCommas(agentCommissionRateStr) || cycleAgentCommRate;
    const d = daysCount > 0 ? daysCount : 1;

    const baseBalance = todayTotalDue > 0 ? todayTotalDue : currentBalance;

    // Compounding check
    const nextDayNum = daysRunning + d;
    const isCompoundingExtension = enableCompounding && nextDayNum > compoundAfterDays;
    const rateBasis = isCompoundingExtension ? baseBalance : cyclePrincipal;

    const scheduledInterest = Math.round((rateBasis / 100000) * rate * d);
    const commAccrued = Math.round((rateBasis / 100000) * agentCommRate * d);

    const finalInterest = showCustomInterest && customInterestStr 
      ? parseNumberFromCommas(customInterestStr) 
      : scheduledInterest;

    const newBal = baseBalance + finalInterest;

    const formula = isCompoundingExtension
      ? (language === 'te'
          ? `${nextDayNum}వ రోజు చక్రవడ్డీ: బాకీ ${formatINR(baseBalance)} పై వడ్డీ = +${formatINR(finalInterest)} (మొత్తం: ${formatINR(newBal)}) | కమీషన్: ${formatINR(commAccrued)}`
          : `Day ${nextDayNum} Compounded: Interest on ${formatINR(baseBalance)} = +${formatINR(finalInterest)} (Total: ${formatINR(newBal)}) | Comm: ${formatINR(commAccrued)}`)
      : (language === 'te'
          ? `సాధారణ వడ్డీ: అసలు (${formatINR(cyclePrincipal)}) పై ${d} రోజుల వడ్డీ (@ ₹${rate}/లక్ష) = +${formatINR(finalInterest)} (మొత్తం: ${formatINR(newBal)})`
          : `Simple Interest: ${d} days on principal (${formatINR(cyclePrincipal)}) = +${formatINR(finalInterest)} (Total: ${formatINR(newBal)})`);

    onAddEntry({
      agentId: selectedAgent.id,
      agentName: selectedAgent.name,
      date: entryDate,
      type: 'rollover_compound',
      ratePerLakh: rate,
      days: d,
      graceDays: compoundAfterDays,
      enableCompounding,
      compoundAfterDays,
      agentCommissionRatePerLakh: agentCommRate,
      interestAmount: finalInterest,
      previousBalance: baseBalance,
      newBalance: newBal,
      formulaText: formula,
      notes: notes.trim() || (language === 'te' ? `${d} రోజుల వడ్డీ కలపబడింది` : `${d} Days Interest Added`),
    });

    resetFormState();
    setMode('view');
  };

  // 4. MONEY RECEIVED (Agent returned money)
  const handleReceiveMoney = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || todayTotalDue <= 0) return;

    const received = receivedAmountStr 
      ? parseNumberFromCommas(receivedAmountStr) 
      : todayTotalDue;

    const remaining = Math.max(0, todayTotalDue - received);

    const formula = language === 'te'
      ? `వచ్చిన డబ్బు: -${formatINR(received)} ${remaining === 0 ? '(పూర్తిగా చెల్లించారు - బాకీ లేదు)' : `(మిగిలిన బాకీ: ${formatINR(remaining)})`}`
      : `Money Received: -${formatINR(received)} ${remaining === 0 ? '(Fully Cleared - Zero Balance)' : `(Remaining to Take: ${formatINR(remaining)})`}`;

    onAddEntry({
      agentId: selectedAgent.id,
      agentName: selectedAgent.name,
      date: entryDate,
      type: remaining === 0 ? 'settle_deal' : 'received_payment',
      receivedAmount: received,
      previousBalance: todayTotalDue,
      newBalance: remaining,
      formulaText: formula,
      notes: notes.trim() || (remaining === 0 ? (language === 'te' ? 'పూర్తి చెల్లింపు' : 'Full Payment') : (language === 'te' ? 'పాక్షిక చెల్లింపు' : 'Partial Payment')),
    });

    resetFormState();
    setMode('view');
  };

  // Create New Agent
  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;
    onAddAgent(newAgentName.trim(), newAgentPhone.trim());
    setNewAgentName('');
    setNewAgentPhone('');
    setMode('view');
  };

  // WhatsApp statement with exact compound breakdown
  const handleShareWhatsApp = () => {
    if (!selectedAgent) return;
    let text = `*👑 GOLD LEDGER - ఏజెంట్ ఖాతా (${selectedAgent.name})*\n`;
    text += `*తేదీ:* ${getTodayDateString()}\n`;
    text += `--------------------------------\n`;
    text += `*అసలు ఇచ్చిన నగదు:* ${formatINR(cyclePrincipal)}\n`;
    if (currentCycleStart?.date) {
      text += `*ఇచ్చిన తేదీ:* ${formatDateReadable(currentCycleStart.date)}\n`;
    }
    text += `*నడుస్తున్న రోజులు:* ${daysRunning} రోజులు (ఇచ్చిన రోజు కలుపుకుని)\n`;
    text += `*ఈ రోజు వరకు రావాల్సిన మొత్తం:* ${formatINR(todayTotalDue)}\n`;
    if (activeCompoundInfo) {
      const todayBd = activeCompoundInfo.dailyBreakdown.find(b => b.day === daysRunning);
      if (todayBd) {
        text += `*నేటి ఏజెంట్ కమీషన్ మొత్తం:* ${formatINR(todayBd.cumulativeAgentCommission)}\n`;
      }
      text += `--------------------------------\n`;
      text += `*రోజుల వారీ లెక్క:*\n`;
      activeCompoundInfo.dailyBreakdown.slice(0, Math.max(daysRunning, 3)).forEach((b) => {
        text += `Day ${b.day}: ${formatINR(b.closingBalance)} (వడ్డీ: +${formatINR(b.interestAdded)}${b.isCompounded ? ' [చక్రవడ్డీ]' : ''} | కమీషన్: ${formatINR(b.cumulativeAgentCommission)})\n`;
      });
    }
    text += `--------------------------------\nధన్యవాదాలు.`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Quick date selector buttons
  const renderDatePills = () => (
    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
      <button
        type="button"
        onClick={() => handleEntryDateChange(getTodayDateString())}
        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
          entryDate === getTodayDateString() 
            ? 'bg-[#1E293B] text-white border-[#1E293B]' 
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
        }`}
      >
        {language === 'te' ? 'ఈ రోజు' : 'Today'}
      </button>
      <button
        type="button"
        onClick={() => handleEntryDateChange(getPastDateString(1))}
        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
          entryDate === getPastDateString(1) 
            ? 'bg-[#1E293B] text-white border-[#1E293B]' 
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
        }`}
      >
        {language === 'te' ? 'నిన్న' : 'Yesterday'}
      </button>
      <button
        type="button"
        onClick={() => handleEntryDateChange(getPastDateString(2))}
        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
          entryDate === getPastDateString(2) 
            ? 'bg-[#1E293B] text-white border-[#1E293B]' 
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
        }`}
      >
        2 {language === 'te' ? 'రోజుల క్రితం' : 'Days ago'}
      </button>
      <button
        type="button"
        onClick={() => handleEntryDateChange(getPastDateString(3))}
        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
          entryDate === getPastDateString(3) 
            ? 'bg-[#1E293B] text-white border-[#1E293B]' 
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
        }`}
      >
        3 {language === 'te' ? 'రోజుల క్రితం' : 'Days ago'}
      </button>
    </div>
  );

  return (
    <div className="space-y-3.5 pb-16 px-1">
      {/* 1. AGENT SELECTOR BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            {language === 'te' ? 'ఏజెంట్' : 'Agent'}
          </span>
          {agents.length > 0 ? (
            <select
              value={selectedAgent?.id || ''}
              onChange={(e) => {
                setSelectedAgentId(e.target.value);
                setMode('view');
                resetFormState();
              }}
              className="w-full text-base font-black text-slate-900 bg-transparent border-none p-0 focus:outline-none cursor-pointer truncate"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} {a.phone ? `(${a.phone})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm font-bold text-slate-500">
              {language === 'te' ? 'ఏజెంట్ లేరు' : 'No Agent'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedAgent && (
            <button
              type="button"
              onClick={() => setIsDeletingAgent(true)}
              title={language === 'te' ? 'ఈ ఏజెంట్‌ను తొలగించు' : 'Delete this agent'}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition cursor-pointer flex items-center gap-1 font-bold text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'te' ? 'ఏజెంట్ తొలగించు' : 'Delete Agent'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setMode(mode === 'new_agent' ? 'view' : 'new_agent')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{language === 'te' ? '+ ఏజెంట్' : '+ Agent'}</span>
          </button>
        </div>
      </div>

      {/* New Agent Inline Form */}
      {mode === 'new_agent' && (
        <form onSubmit={handleCreateAgent} className="bg-amber-50/80 border border-[#C5A059]/40 rounded-2xl p-4 space-y-3">
          <span className="text-xs font-bold text-[#9a7836] uppercase tracking-wider block">
            {language === 'te' ? 'కొత్త ఏజెంట్ పేరు రాయండి' : 'Add New Agent'}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder={language === 'te' ? 'ఏజెంట్ పేరు (ఉదా: రాజు)' : 'Agent Name'}
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
              required
              autoFocus
            />
            <input
              type="tel"
              placeholder={language === 'te' ? 'ఫోన్ నంబర్' : 'Phone'}
              value={newAgentPhone}
              onChange={(e) => setNewAgentPhone(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setMode('view')}
              className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#1E293B] text-[#C5A059] text-xs font-bold rounded-xl cursor-pointer"
            >
              {language === 'te' ? 'సేవ్ చేయండి' : 'Save Agent'}
            </button>
          </div>
        </form>
      )}

      {/* 2. THE MAIN RUNNING DEAL CARD */}
      {selectedAgent && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
          {/* Header Row: Total to Take */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  {selectedDayNumber && selectedDayNumber !== daysRunning
                    ? (language === 'te' 
                        ? `ఎంచుకున్న రోజు బాకీ (Day ${selectedDayNumber} • ${formatRowDate(currentCycleStart?.date, selectedDayNumber)})` 
                        : `Due for Day ${selectedDayNumber} (${formatRowDate(currentCycleStart?.date, selectedDayNumber)})`)
                    : (language === 'te' ? 'ఈ రోజు రావాల్సిన మొత్తం (Total Due Today)' : 'Total Due Today from Agent')}
                </span>
                {selectedDayNumber && selectedDayNumber !== daysRunning && (
                  <button
                    type="button"
                    onClick={() => setSelectedDayNumber(null)}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                  >
                    {language === 'te' ? 'నేటి రోజుకు మార్చు' : 'Reset to Today'}
                  </button>
                )}
              </div>
              <div className="text-3xl sm:text-4xl font-bold font-mono text-slate-900 tracking-tight mt-0.5">
                {formatINR(activeDueAmount)}
              </div>
              {activeDueAmount > cyclePrincipal && (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block mt-1">
                  {language === 'te' 
                    ? `అసలు: ${formatINR(cyclePrincipal)} + వడ్డీ: ${formatINR(activeDueAmount - cyclePrincipal)}`
                    : `Principal: ${formatINR(cyclePrincipal)} + Accrued Interest: ${formatINR(activeDueAmount - cyclePrincipal)}`}
                </span>
              )}
            </div>

            {todayTotalDue > 0 && (
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 transition cursor-pointer"
                title="Share statement"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* If Active Deal: Show simple Days, Rate & Today's Interest */}
          {todayTotalDue > 0 ? (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="text-left border-r border-slate-200/80 pr-2">
                <span className="font-medium block text-[10px] text-slate-500 font-sans uppercase">
                  {language === 'te' ? 'నడుస్తున్న రోజులు' : 'Days Running'}
                </span>
                <span className="font-semibold text-slate-800 text-sm">{daysRunning} {language === 'te' ? 'రోజులు' : 'Days'}</span>
                <span className="block text-[9px] text-slate-400 font-sans font-normal">
                  {language === 'te' ? 'ఇచ్చిన రోజు కలుపుకుని' : 'Give day included'}
                </span>
              </div>
              <div className="border-r border-slate-200/80 px-2">
                <span className="font-medium block text-[10px] text-slate-500 font-sans uppercase">
                  {language === 'te' ? 'వడ్డీ రేటు' : 'Rate / Lakh / Day'}
                </span>
                <span className="font-semibold text-slate-800 text-sm">₹{currentRate}</span>
                {enableCompounding && daysRunning > compoundAfterDays ? (
                  <span className="block text-[9px] text-purple-700 font-medium font-sans">
                    {language === 'te' ? 'చక్రవడ్డీ' : 'Compounded'}
                  </span>
                ) : (
                  <span className="block text-[9px] text-slate-500 font-sans">
                    {language === 'te' ? 'సాధారణ వడ్డీ' : 'Flat Rate'}
                  </span>
                )}
              </div>
              <div className="text-right pl-2">
                <span className="font-medium block text-[10px] text-slate-500 font-sans uppercase">
                  {language === 'te' ? 'నేటి వడ్డీ' : "Today's Interest"}
                </span>
                <span className="font-semibold text-emerald-700 text-sm">
                  +{formatINR(activeCompoundInfo?.dailyBreakdown.find((b) => b.day === daysRunning)?.interestAdded || dailyInterest)}
                </span>
                <span className="block text-[9px] text-slate-600 font-sans font-medium">
                  {language === 'te' ? 'కమీషన్:' : 'Comm:'} {formatINR(activeCompoundInfo?.dailyBreakdown.find((b) => b.day === daysRunning)?.cumulativeAgentCommission || 0)}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-2 text-center text-slate-400 text-xs font-medium">
              {language === 'te' ? 'ప్రస్తుతం ఏ బాకీ లేదు. కొత్తగా డబ్బు ఇవ్వవచ్చు.' : 'No balance due. Ready to give cash.'}
            </div>
          )}

          {/* 3. PRIMARY DIRECT ACTIONS */}
          {mode === 'view' && (
            <div className="space-y-3 pt-1">
              {todayTotalDue <= 0 ? (
                /* When no active deal: 1 Big Button */
                <button
                  type="button"
                  onClick={() => {
                    resetFormState();
                    setMode('give_cash');
                  }}
                  className="w-full py-3.5 bg-[#1E293B] hover:bg-slate-800 active:scale-[0.99] text-[#C5A059] font-black text-sm rounded-2xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{language === 'te' ? 'డబ్బు ఇవ్వండి (Give Cash)' : 'Give Cash'}</span>
                </button>
              ) : (
                /* When deal is active: 2 Direct Clean Buttons */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Money Received */}
                    <button
                      type="button"
                      onClick={() => {
                        resetFormState();
                        setReceivedAmountStr(formatNumberWithCommas(activeDueAmount));
                        setMode('received');
                      }}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{language === 'te' ? 'డబ్బు వచ్చింది (Money Received)' : 'Money Received'}</span>
                    </button>

                    {/* Add More Cash */}
                    <button
                      type="button"
                      onClick={() => {
                        resetFormState();
                        setRateStr(currentRate ? currentRate.toString() : '2000');
                        setMode('add_more');
                      }}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 active:scale-[0.99] text-amber-300 font-semibold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                    >
                      <PlusCircle className="w-4 h-4 shrink-0" />
                      <span>{language === 'te' ? '+ మరికొంత ఇచ్చారు' : '+ Gave More Cash'}</span>
                    </button>
                  </div>

                  {/* DAILY BREAKDOWN CARD */}
                  {activeCompoundInfo && (
                    <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
                      {/* Header with Title and Toggle */}
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowCompoundBreakdown(!showCompoundBreakdown)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 cursor-pointer"
                        >
                          <TrendingUp className="w-4 h-4 text-amber-600" />
                          <span>
                            {language === 'te' ? 'రోజువారీ లెక్కలు (Daily Table)' : 'Daily Breakdown Table'}
                          </span>
                          {showCompoundBreakdown ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                        </button>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                          enableCompounding 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {enableCompounding 
                            ? (language === 'te' ? `${compoundAfterDays} రోజుల తర్వాత చక్రవడ్డీ` : `Compound after ${compoundAfterDays}d`) 
                            : (language === 'te' ? 'సాధారణ వడ్డీ (Flat Rate)' : 'Flat Rate')}
                        </span>
                      </div>

                      {showCompoundBreakdown && (
                        <div className="space-y-3 pt-0.5">
                          {/* Compounding Toggle & Selector Control */}
                          <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-slate-600">
                                {language === 'te' ? 'వడ్డీ పద్ధతి:' : 'Interest Mode:'}
                              </span>
                              {/* Simple Segmented Toggle */}
                              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => setEnableCompounding(false)}
                                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                                    !enableCompounding
                                      ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                                      : 'text-slate-500 hover:text-slate-700'
                                  }`}
                                >
                                  {language === 'te' ? 'సాధారణ వడ్డీ (Flat)' : 'Flat Rate'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEnableCompounding(true)}
                                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                                    enableCompounding
                                      ? 'bg-purple-600 text-white shadow-2xs font-semibold'
                                      : 'text-slate-500 hover:text-slate-700'
                                  }`}
                                >
                                  {language === 'te' ? 'చక్రవడ్డీ (Compound)' : 'Compound'}
                                </button>
                              </div>
                            </div>

                            {enableCompounding && (
                              <p className="text-[11px] text-purple-700 font-normal pt-1 border-t border-slate-100">
                                {language === 'te' 
                                  ? `పట్టికలో ఒక రోజు వరుసను (Row) ఎంచుకోండి. (ప్రస్తుతం: Day ${compoundAfterDays} తర్వాత చక్రవడ్డీ)` 
                                  : `Select a day row in table to view or settle (Current: compound starts after Day ${compoundAfterDays})`}
                              </p>
                            )}
                          </div>

                          {/* Day by day table with Date Column and Selectable Rows */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-[11px] font-mono">
                              <thead>
                                <tr className="text-slate-500 border-b border-slate-200 text-[10px] uppercase font-sans">
                                  <th className="text-center pb-2 font-medium w-6"></th>
                                  <th className="text-left pb-2 font-medium">{language === 'te' ? 'రోజు' : 'Day'}</th>
                                  <th className="text-left pb-2 font-medium">{language === 'te' ? 'తేదీ' : 'Date'}</th>
                                  <th className="text-right pb-2 font-medium">{language === 'te' ? 'తిరిగి ఇవ్వాల్సింది' : 'Total Due'}</th>
                                  <th className="text-right pb-2 font-medium">{language === 'te' ? 'రోజు వడ్డీ' : 'Interest'}</th>
                                  <th className="text-center pb-2 font-medium">{language === 'te' ? 'రకం' : 'Type'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {activeCompoundInfo.dailyBreakdown.slice(0, Math.max(daysRunning + 5, 10)).map((b) => {
                                  const isSelected = activeSelectedDay === b.day;
                                  const isToday = b.day === daysRunning;
                                  const rowDate = formatRowDate(currentCycleStart?.date, b.day);
                                  const isComp = b.isCompounded;

                                  return (
                                    <tr 
                                      key={b.day} 
                                      onClick={() => setSelectedDayNumber(b.day)}
                                      className={`cursor-pointer transition ${
                                        isSelected 
                                          ? 'bg-amber-100/90 text-slate-900 font-medium ring-1 ring-amber-300' 
                                          : isToday 
                                          ? 'bg-amber-50/70 font-medium hover:bg-amber-100/50' 
                                          : 'hover:bg-slate-100/70'
                                      }`}
                                    >
                                      <td className="py-2 text-center pl-1">
                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center mx-auto ${
                                          isSelected ? 'border-amber-600 bg-amber-600' : 'border-slate-300'
                                        }`}>
                                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                      </td>
                                      <td className="py-2 text-left text-slate-700 whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                          <span>Day {b.day}</span>
                                          {isToday && (
                                            <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-amber-500 text-white font-medium">
                                              {language === 'te' ? 'నేడు' : 'Today'}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2 text-left text-slate-600 font-sans text-[11px] whitespace-nowrap">
                                        {rowDate}
                                      </td>
                                      <td className="py-2 text-right font-semibold text-slate-800 whitespace-nowrap">
                                        {formatINR(b.closingBalance)}
                                      </td>
                                      <td className="py-2 text-right text-emerald-700 font-medium whitespace-nowrap">
                                        +{formatINR(b.interestAdded)}
                                      </td>
                                      <td className="py-2 text-center font-sans text-[10px]" onClick={(e) => e.stopPropagation()}>
                                        {!enableCompounding ? (
                                          <span className="text-slate-400">
                                            {language === 'te' ? 'సాధారణ' : 'Flat'}
                                          </span>
                                        ) : isComp ? (
                                          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium inline-block">
                                            {language === 'te' ? 'చక్రవడ్డీ' : 'Compound'}
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => setCompoundAfterDays(b.day)}
                                            className="px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 hover:text-purple-700 hover:border-purple-300 hover:bg-purple-50 transition cursor-pointer"
                                            title={language === 'te' ? `Day ${b.day} తర్వాత చక్రవడ్డీ ప్రారంభించు` : `Start compound after Day ${b.day}`}
                                          >
                                            {language === 'te' ? 'సాధారణ' : 'Flat'}
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Selected Day Direct Settlement Bar */}
                          <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 flex-wrap text-xs shadow-2xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-700">
                                {language === 'te' ? 'ఎంచుకున్నది:' : 'Selected:'} Day {activeSelectedDay}
                              </span>
                              <span className="text-slate-500 font-mono text-[11px]">
                                ({formatRowDate(currentCycleStart?.date, activeSelectedDay)})
                              </span>
                              <span className="font-bold text-slate-900 font-mono text-sm ml-1">
                                {formatINR(activeDueAmount)}
                              </span>
                              {activeSelectedDay === daysRunning && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                                  {language === 'te' ? 'ఈ రోజు' : 'Today'}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                resetFormState();
                                setReceivedAmountStr(formatNumberWithCommas(activeDueAmount));
                                setMode('received');
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs transition ml-auto"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{language === 'te' ? 'ఈ రోజే లెక్క తేల్చండి' : 'Settle This Day'}</span>
                            </button>
                          </div>

                          {/* Rollover notice if compounding is on */}
                          {enableCompounding && daysRunning >= compoundAfterDays && (
                            <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-2.5 flex items-center justify-between gap-2">
                              <div className="text-[11px] text-amber-950">
                                <span className="font-semibold block">
                                  {language === 'te' 
                                    ? `తదుపరి రోజు చక్రవడ్డీ: +${formatINR(Math.round((currentBalance / 100000) * cycleRate))}` 
                                    : `Next Day Interest: +${formatINR(Math.round((currentBalance / 100000) * cycleRate))}`}
                                </span>
                                <span className="text-[10px] text-amber-800">
                                  {language === 'te' ? `పాత బాకీ ${formatINR(currentBalance)} పై చక్రవడ్డీ వర్తిస్తుంది` : `Compounding on ${formatINR(currentBalance)}`}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Investor & Owner Net Profit Toggle */}
                          <div className="border-t border-slate-200/80 pt-2">
                            <button
                              type="button"
                              onClick={() => setShowInvestorNetProfit(!showInvestorNetProfit)}
                              className="text-[11px] font-bold text-slate-700 hover:text-slate-900 flex items-center justify-between w-full cursor-pointer py-1"
                            >
                              <span className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-blue-600" />
                                <span>{language === 'te' ? 'ఇన్వెస్టర్ వాటా & ఓనర్ నికర లాభం' : 'Investor Share & Owner Profit (Optional)'}</span>
                              </span>
                              <span className="text-[10px] text-blue-600 underline font-semibold">
                                {showInvestorNetProfit ? (language === 'te' ? 'దాచు' : 'Hide') : (language === 'te' ? 'చూడండి' : 'Show')}
                              </span>
                            </button>

                            {showInvestorNetProfit && (
                              <div className="bg-white border border-slate-200 rounded-xl p-3 mt-2 space-y-2.5 text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                      {language === 'te' ? 'ఇన్వెస్టర్ డబ్బు (₹)' : 'Investor Amount'}
                                    </label>
                                    <input
                                      type="text"
                                      value={investorAmountStr}
                                      onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, '');
                                        const num = raw ? parseInt(raw, 10) : 0;
                                        setInvestorAmountStr(num > 0 ? formatNumberWithCommas(num) : '');
                                      }}
                                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                      {language === 'te' ? 'ఇన్వెస్టర్ రేటు/లక్ష/రోజు' : 'Rate/Lakh/Day'}
                                    </label>
                                    <input
                                      type="text"
                                      value={investorRateStr}
                                      onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, '');
                                        const num = raw ? parseInt(raw, 10) : 0;
                                        setInvestorRateStr(num > 0 ? formatNumberWithCommas(num) : '');
                                      }}
                                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                                    />
                                  </div>
                                </div>

                                {activeCompoundInfo && (
                                  <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 space-y-1.5 font-mono text-[11px]">
                                    <div className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-wider mb-1 flex justify-between items-center">
                                      <span>{language === 'te' ? `రోజు ${activeSelectedDay} వరకు నికర లెక్క:` : `Up to Day ${activeSelectedDay} Breakdown:`}</span>
                                      <span className="text-blue-700 font-bold">{formatRowDate(currentCycleStart?.date, activeSelectedDay)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                      <span>{language === 'te' ? 'మొత్తం వచ్చిన వడ్డీ:' : 'Total Interest Added:'}</span>
                                      <span className="font-bold text-slate-900">
                                        {formatINR(selectedBreakdownRow ? (selectedBreakdownRow.closingBalance - cyclePrincipal) : activeCompoundInfo.totalInterestAccrued)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-[#9a7836]">
                                      <span>{language === 'te' ? 'ఏజెంట్ కమీషన్:' : 'Agent Commission:'}</span>
                                      <span className="font-bold">
                                        -{formatINR(selectedBreakdownRow ? selectedBreakdownRow.cumulativeAgentCommission : activeCompoundInfo.agentCommission)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-blue-700">
                                      <span>{language === 'te' ? 'ఇన్వెస్టర్ వాటా:' : 'Investor Share:'}</span>
                                      <span className="font-bold">
                                        -{formatINR(
                                          selectedBreakdownRow?.cumulativeInvestorShare !== undefined
                                            ? selectedBreakdownRow.cumulativeInvestorShare
                                            : (activeCompoundInfo.investorTotalShare ?? activeCompoundInfo.totalInvestorShare ?? 0)
                                        )}
                                      </span>
                                    </div>
                                    <div className="border-t border-slate-200 pt-1.5 flex justify-between font-black text-slate-900 text-xs font-sans">
                                      <span>{language === 'te' ? 'మీ నికర లాభం (ఓనర్):' : 'Your Net Profit (Owner):'}</span>
                                      <span className="text-emerald-700 font-mono font-black text-sm">
                                        {formatINR(
                                          selectedBreakdownRow
                                            ? (
                                                (selectedBreakdownRow.closingBalance - cyclePrincipal) -
                                                selectedBreakdownRow.cumulativeAgentCommission -
                                                (selectedBreakdownRow.cumulativeInvestorShare || 0)
                                              )
                                            : activeCompoundInfo.ownerNetProfit
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* FORM 1: GIVE CASH (With Date for Past Money & Interest Details) */}
          {/* ============================================================ */}
          {mode === 'give_cash' && (
            <form onSubmit={handleGiveCash} className="bg-slate-50 border border-slate-300 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-black text-slate-900 uppercase">
                  {language === 'te' ? 'డబ్బు ఇవ్వండి (Give Cash)' : 'Give Cash to Agent'}
                </span>
                <span className="text-xs font-bold text-slate-600">{selectedAgent.name}</span>
              </div>

              {/* Date Input with Past Money Quick Pills */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  {language === 'te' ? 'ఇచ్చిన తేదీ (Date Given)' : 'Date Given (Past or Today)'}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => handleEntryDateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-[#C5A059]"
                    required
                  />
                </div>
                {renderDatePills()}
              </div>

              {/* Amount Given */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  {language === 'te' ? 'ఇచ్చిన మొత్తం (Cash Given)' : 'Cash Given (₹)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xl font-bold text-slate-400">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amountStr}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="2,00,000"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-2xl font-black font-mono text-slate-900 focus:outline-none focus:border-[#C5A059]"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Interest Details: Rate, Agent Comm & Number of Days */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    {language === 'te' ? 'వడ్డీ రేటు (లక్షకు / రోజు)' : 'Interest Rate/Lakh/Day'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={rateStr}
                      onChange={(e) => handleRateChange(e.target.value)}
                      className="w-full pl-6 pr-2 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    {language === 'te' ? 'ఏజెంట్ కమీషన్ (లక్షకు / రోజు)' : 'Agent Comm/Lakh/Day'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={agentCommissionRateStr}
                      onChange={(e) => handleAgentCommRateChange(e.target.value)}
                      className="w-full pl-6 pr-2 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Compounding Checkbox & Setting */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-semibold text-slate-700">
                    {language === 'te' ? 'చక్రవడ్డీ వర్తింపజేయాలా? (Enable Compound Interest?)' : 'Enable Compound Interest?'}
                  </span>
                  <input
                    type="checkbox"
                    checked={enableCompounding}
                    onChange={(e) => setEnableCompounding(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                  />
                </label>

                {enableCompounding ? (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      {language === 'te' ? 'ఎన్ని రోజుల తర్వాత చక్రవడ్డీ ప్రారంభించాలి?' : 'Start compounding after how many days?'}
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[2, 3, 5, 7, 10].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setCompoundAfterDays(d)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition cursor-pointer ${
                            compoundAfterDays === d
                              ? 'bg-purple-600 text-white border-purple-600 font-semibold'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {d} {language === 'te' ? 'రోజులు' : 'Days'}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {language === 'te' 
                        ? `మొదటి ${compoundAfterDays} రోజులు సాధారణ వడ్డీ, ఆ తర్వాత రోజు నుండి చక్రవడ్డీ కలుస్తుంది.` 
                        : `First ${compoundAfterDays} days flat rate, then daily balance is compounded.`}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500">
                    {language === 'te' 
                      ? 'సాధారణ వడ్డీ: డబ్బు తిరిగి ఇచ్చేంత వరకు అసలు పైనే సమాన వడ్డీ లెక్కించబడుతుంది (10L కొనసాగినా రోజూ సమాన వడ్డీ).' 
                      : 'Flat rate: Same daily interest on principal until returned.'}
                  </p>
                )}
              </div>

              {/* Number of Days */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-semibold text-slate-600 uppercase block">
                    {language === 'te' ? 'నడుస్తున్న రోజుల సంఖ్య' : 'Number of Active Days'}
                  </label>
                  <span className="text-[10px] font-medium text-emerald-700">
                    {language === 'te' ? 'ఇచ్చిన రోజు కలుపుకుని' : 'Give day included'}
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={daysCount}
                  onChange={(e) => setDaysCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold font-mono"
                  required
                />
                {daysCount > 1 && (
                  <span className="text-[10px] text-slate-500 font-sans mt-1 block">
                    {language === 'te' 
                      ? `${formatDateReadable(entryDate)} నుండి నేటి వరకు మొత్తం ${daysCount} రోజులు` 
                      : `From ${formatDateReadable(entryDate)} to today = ${daysCount} active days`}
                  </span>
                )}
              </div>

              {/* Interest Customization Toggle */}
              <div className="pt-0.5">
                {!showCustomInterest ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomInterest(true);
                      const principal = parseNumberFromCommas(amountStr);
                      const rate = parseNumberFromCommas(rateStr) || 2000;
                      const calculated = Math.round((principal / 100000) * rate * daysCount);
                      setCustomInterestStr(calculated > 0 ? formatNumberWithCommas(calculated) : '');
                    }}
                    className="text-[11px] font-medium text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{language === 'te' ? 'వడ్డీ మొత్తాన్ని మార్చాలా? (Custom Interest)' : 'Change interest amount manually?'}</span>
                  </button>
                ) : (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-semibold text-amber-800 uppercase">
                        {language === 'te' ? 'వడ్డీ మొత్తం (Custom Interest ₹)' : 'Custom Interest Amount (₹)'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomInterest(false);
                          setCustomInterestStr('');
                        }}
                        className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                      >
                        {language === 'te' ? 'ఆటో కాలిక్యులేషన్ చేయి' : 'Use Auto Calculation'}
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={customInterestStr}
                        onChange={(e) => handleCustomInterestChange(e.target.value)}
                        placeholder="ఉదా: 4,000"
                        className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <input
                  type="text"
                  placeholder={language === 'te' ? 'గమనిక (ఐచ్ఛికం)' : 'Notes (Optional)'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              {/* Calculation Preview */}
              {parseNumberFromCommas(amountStr) > 0 && (() => {
                const principal = parseNumberFromCommas(amountStr);
                const rate = parseNumberFromCommas(rateStr) || 2000;
                const agentCommRate = parseNumberFromCommas(agentCommissionRateStr) || 400;
                const d = daysCount > 0 ? daysCount : 1;

                const dealCalc = calculateCompoundDeal({
                  principal,
                  ratePerLakh: rate,
                  agentCommissionRatePerLakh: agentCommRate,
                  durationDays: d,
                  graceDays: compoundAfterDays,
                  enableCompounding,
                  compoundAfterDays,
                });

                const calcInterest = dealCalc.totalInterestAccrued;
                const appliedInterest = showCustomInterest && customInterestStr 
                  ? parseNumberFromCommas(customInterestStr) 
                  : calcInterest;
                const total = principal + appliedInterest;

                return (
                  <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono space-y-1.5 shadow-2xs">
                    <div className="flex justify-between text-slate-600">
                      <span>{language === 'te' ? 'ఇచ్చిన నగదు:' : 'Cash Given:'}</span>
                      <span className="font-semibold">{formatINR(principal)}</span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span>
                        {language === 'te' 
                          ? `వడ్డీ (${d} రోజులు${enableCompounding && d > compoundAfterDays ? ' - చక్రవడ్డీతో' : ''}):` 
                          : `Interest (${d} days${enableCompounding && d > compoundAfterDays ? ' - with Compounding' : ''}):`}
                      </span>
                      <span className="font-semibold">+{formatINR(appliedInterest)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>{language === 'te' ? 'ఏజెంట్ కమీషన్ వాటా:' : 'Agent Commission:'}</span>
                      <span className="font-medium text-slate-700">{formatINR(dealCalc.agentCommission)}</span>
                    </div>
                    <div className="border-t border-slate-100 pt-1.5 flex justify-between font-semibold text-slate-900 text-sm">
                      <span>{language === 'te' ? 'రావాల్సిన మొత్తం (Total Due):' : 'Total Due:'}</span>
                      <span className="text-emerald-700 font-semibold">{formatINR(total)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="px-3.5 py-2 bg-slate-200 text-slate-700 text-xs font-medium rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-850 bg-slate-900 text-amber-300 text-xs font-semibold rounded-xl shadow-xs cursor-pointer hover:bg-black"
                >
                  {language === 'te' ? 'సేవ్ చేయండి (Save Entry)' : 'Save Entry'}
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* FORM 2: GAVE MORE CASH (With Date & Interest Details)         */}
          {/* ============================================================ */}
          {mode === 'add_more' && (
            <form onSubmit={handleAddMoreMoney} className="bg-slate-50 border border-slate-300 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-semibold text-slate-900 uppercase">
                  {language === 'te' ? '+ మరికొంత నగదు ఇవ్వండి' : 'Give More Cash'}
                </span>
                <span className="text-xs font-medium text-slate-600">
                  {language === 'te' ? 'నేటి వరకు పాత బాకీ:' : 'Old Due Today:'} {formatINR(todayTotalDue > 0 ? todayTotalDue : currentBalance)}
                </span>
              </div>

              {/* Date Input with Past Money Quick Pills */}
              <div>
                <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-1">
                  {language === 'te' ? 'కొత్తగా ఇచ్చిన తేదీ (Date Given)' : 'Date Given (Past or Today)'}
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => handleEntryDateChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
                {renderDatePills()}
              </div>

              {/* Amount Given */}
              <div>
                <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-1">
                  {language === 'te' ? 'కొత్తగా ఇచ్చిన మొత్తం' : 'New Cash Given (₹)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-lg font-bold text-slate-400">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amountStr}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="3,00,000"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xl font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Rate & Days */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-1">
                    {language === 'te' ? 'వడ్డీ రేటు (లక్షకు / రోజు)' : 'Rate / Lakh (₹ / Day)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={rateStr}
                      onChange={(e) => handleRateChange(e.target.value)}
                      className="w-full pl-6 pr-2 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-1">
                    {language === 'te' ? 'రోజుల సంఖ్య (Days)' : 'Number of Days'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={daysCount}
                    onChange={(e) => setDaysCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold font-mono"
                    required
                  />
                </div>
              </div>

              {/* Interest Customization Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInterest(!showCustomInterest);
                    if (!showCustomInterest) {
                      const newCash = parseNumberFromCommas(amountStr);
                      const r = parseNumberFromCommas(rateStr) || currentRate;
                      const d = daysCount > 0 ? daysCount : 1;
                      const autoInt = Math.round((newCash / 100000) * r * d);
                      setCustomInterestStr(autoInt > 0 ? formatNumberWithCommas(autoInt) : '');
                    }
                  }}
                  className="text-xs font-bold text-[#C5A059] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>
                    {showCustomInterest
                      ? (language === 'te' ? 'వడ్డీ ఆటోమేటిక్‌గా లెక్కించు' : 'Use Calculated Interest')
                      : (language === 'te' ? 'వడ్డీ మార్చాలా? (ఐచ్ఛికం)' : 'Customize Interest (Optional)')}
                  </span>
                </button>

                {showCustomInterest && (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                    <label className="text-[10px] font-bold text-amber-900 uppercase block">
                      {language === 'te' ? 'ఖచ్చితమైన వడ్డీ మొత్తం (₹)' : 'Custom Interest Amount (₹)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={customInterestStr}
                        onChange={(e) => handleCustomInterestChange(e.target.value)}
                        placeholder="ఉదా: 5,000"
                        className="w-full pl-6 pr-2 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold font-mono text-amber-950 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <input
                  type="text"
                  placeholder={language === 'te' ? 'గమనిక (ఐచ్ఛికం)' : 'Notes (Optional)'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              {/* Preview */}
              {parseNumberFromCommas(amountStr) > 0 && (() => {
                const baseBalance = todayTotalDue > 0 ? todayTotalDue : currentBalance;
                const newCash = parseNumberFromCommas(amountStr);
                const rate = parseNumberFromCommas(rateStr) || currentRate;
                const d = daysCount > 0 ? daysCount : 1;
                const newInt = showCustomInterest && customInterestStr
                  ? parseNumberFromCommas(customInterestStr)
                  : Math.round((newCash / 100000) * rate * d);
                const finalBal = baseBalance + newCash + newInt;

                return (
                  <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono space-y-1.5 shadow-2xs">
                    <div className="flex justify-between text-slate-600">
                      <span>{language === 'te' ? 'నేటి వరకు పాత బాకీ:' : 'Old Due Today:'}</span>
                      <span className="font-semibold">{formatINR(baseBalance)}</span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span>{language === 'te' ? 'కొత్త నగదు + వడ్డీ:' : 'New Cash + Interest:'}</span>
                      <span className="font-semibold">+{formatINR(newCash + newInt)}</span>
                    </div>
                    <div className="border-t border-slate-100 pt-1.5 flex justify-between font-semibold text-slate-900 text-sm">
                      <span>{language === 'te' ? 'మొత్తం రావాల్సింది (New Total Due):' : 'New Total Due:'}</span>
                      <span className="text-emerald-700 font-semibold">{formatINR(finalBal)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="px-3.5 py-2 bg-slate-200 text-slate-700 text-xs font-medium rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  {language === 'te' ? 'కలిపి సేవ్ చేయండి' : 'Add & Save'}
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* FORM 3: ADD INTEREST / DAYS (With Date & Custom Details)     */}
          {/* ============================================================ */}
          {mode === 'add_interest' && (
            <form onSubmit={handleAddInterest} className="bg-slate-50 border border-slate-300 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-semibold text-slate-900 uppercase">
                  {language === 'te' ? '+ వడ్డీ కలపండి / రోజులు' : 'Add Interest / Days'}
                </span>
                <span className="text-xs font-medium text-slate-600">
                  {language === 'te' ? 'నేటి వరకు బాకీ:' : 'Due Today:'} {formatINR(todayTotalDue > 0 ? todayTotalDue : currentBalance)}
                </span>
              </div>

              {/* Explanatory Compounding Notice if compounding is enabled and active */}
              {enableCompounding && daysRunning >= compoundAfterDays && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    <span>
                      {language === 'te' 
                        ? `${daysRunning + 1}వ రోజు చక్రవడ్డీ నిబంధన` 
                        : `Day ${daysRunning + 1} Compounding Rule`}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed font-sans">
                    {language === 'te'
                      ? `సాధారణ రోజులు (${compoundAfterDays}) ముగిశాయి. గత రోజు మొత్తం ${formatINR(todayTotalDue > 0 ? todayTotalDue : currentBalance)} కొత్త అసలుగా మారింది. దీనిపై చక్రవడ్డీ (+${formatINR(Math.round(((todayTotalDue > 0 ? todayTotalDue : currentBalance) / 100000) * cycleRate))}) కలుస్తుంది.`
                      : `Flat days (${compoundAfterDays}) completed. The previous total ${formatINR(todayTotalDue > 0 ? todayTotalDue : currentBalance)} is compounded with +${formatINR(Math.round(((todayTotalDue > 0 ? todayTotalDue : currentBalance) / 100000) * cycleRate))}.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDaysCount(1);
                      setShowCustomInterest(false);
                      setCustomInterestStr('');
                    }}
                    className="w-full py-2 bg-amber-200/80 hover:bg-amber-300/80 text-amber-950 font-semibold rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer transition"
                  >
                    <span>⚡ {language === 'te' ? '1 రోజు చక్రవడ్డీ ఆటోమేటిక్‌గా వేయి' : 'Set to 1-Day Auto Compounding'}</span>
                  </button>
                </div>
              )}

              {/* Date Input with Past Money Quick Pills */}
              <div>
                <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-1">
                  {language === 'te' ? 'తేదీ (Date)' : 'Date (Past or Today)'}
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => handleEntryDateChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                  required
                />
                {renderDatePills()}
              </div>

              {/* Days and Rate */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-1">
                    {language === 'te' ? 'రోజుల సంఖ్య (Days)' : 'Number of Days'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={daysCount}
                    onChange={(e) => setDaysCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-1">
                    {language === 'te' ? 'రేటు (లక్షకు / రోజు)' : 'Rate / Lakh (₹ / Day)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={rateStr}
                      onChange={(e) => handleRateChange(e.target.value)}
                      className="w-full pl-6 pr-2 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Custom Interest Option */}
              <div className="pt-0.5">
                {!showCustomInterest ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomInterest(true);
                      const baseBal = todayTotalDue > 0 ? todayTotalDue : currentBalance;
                      const rate = parseNumberFromCommas(rateStr) || currentRate;
                      const isComp = enableCompounding && (daysRunning + daysCount) > compoundAfterDays;
                      const calculated = (daysCount === 1 && isComp)
                        ? Math.round((baseBal / 100000) * rate)
                        : Math.round((baseBal / 100000) * rate * daysCount);
                      setCustomInterestStr(calculated > 0 ? formatNumberWithCommas(calculated) : '');
                    }}
                    className="text-[11px] font-medium text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{language === 'te' ? 'వడ్డీ మొత్తాన్ని మార్చాలా? (Custom Interest)' : 'Change interest amount manually?'}</span>
                  </button>
                ) : (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-semibold text-amber-800 uppercase">
                        {language === 'te' ? 'వడ్డీ మొత్తం (Custom Interest ₹)' : 'Custom Interest Amount (₹)'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomInterest(false);
                          setCustomInterestStr('');
                        }}
                        className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                      >
                        {language === 'te' ? 'ఆటో కాలిక్యులేషన్ చేయి' : 'Use Auto Calculation'}
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={customInterestStr}
                        onChange={(e) => handleCustomInterestChange(e.target.value)}
                        placeholder="ఉదా: 2,500"
                        className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <input
                  type="text"
                  placeholder={language === 'te' ? 'గమనిక (ఐచ్ఛికం)' : 'Notes (Optional)'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              {/* Preview */}
              {(() => {
                const baseBalance = todayTotalDue > 0 ? todayTotalDue : currentBalance;
                const rate = parseNumberFromCommas(rateStr) || currentRate;
                const d = daysCount > 0 ? daysCount : 1;
                const nextDay = daysRunning + d;
                const isComp = enableCompounding && nextDay > compoundAfterDays;
                const calcInt = (d === 1 && isComp)
                  ? Math.round((baseBalance / 100000) * rate)
                  : Math.round((baseBalance / 100000) * rate * d);
                const appliedInt = showCustomInterest && customInterestStr
                  ? parseNumberFromCommas(customInterestStr)
                  : calcInt;
                const newTotal = baseBalance + appliedInt;
                const agentComm = (d === 1 && isComp)
                  ? Math.round((baseBalance / 100000) * cycleAgentCommRate)
                  : Math.round((baseBalance / 100000) * cycleAgentCommRate * d);

                return (
                  <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono space-y-1.5 shadow-2xs">
                    <div className="flex justify-between text-slate-600">
                      <span>{language === 'te' ? 'ప్రస్తుత బాకీ (కొత్త అసలు):' : 'Current Due (New Principal):'}</span>
                      <span className="font-semibold">{formatINR(baseBalance)}</span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span>
                        {language === 'te' 
                          ? `కలిపే వడ్డీ (${d} రోజులు${isComp ? ' - చక్రవడ్డీ' : ''}):` 
                          : `Interest Added (${d} days${isComp ? ' - Compounded' : ''}):`}
                      </span>
                      <span className="font-semibold">+{formatINR(appliedInt)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>{language === 'te' ? 'ఏజెంట్ కమీషన్ వాటా:' : 'Agent Commission Accrued:'}</span>
                      <span className="font-medium text-slate-700">{formatINR(agentComm)}</span>
                    </div>
                    <div className="border-t border-slate-100 pt-1.5 flex justify-between font-semibold text-slate-900 text-sm">
                      <span>{language === 'te' ? 'కొత్త మొత్తం రావాల్సింది:' : 'New Total Due:'}</span>
                      <span className="text-emerald-700 font-semibold">{formatINR(newTotal)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="px-3.5 py-2 bg-slate-200 text-slate-700 text-xs font-medium rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-800 text-amber-300 text-xs font-semibold rounded-xl shadow-xs cursor-pointer hover:bg-slate-900"
                >
                  {language === 'te' ? 'వడ్డీ కలపండి (Add Interest)' : 'Add Interest'}
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* FORM 4: MONEY RECEIVED (With Date for Past Money Returned)   */}
          {/* ============================================================ */}
          {mode === 'received' && (
            <form onSubmit={handleReceiveMoney} className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="text-xs font-semibold text-emerald-900 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'te' ? 'డబ్బు వచ్చింది (Money Received)' : 'Money Received'}</span>
                </span>
                <span className="text-xs font-medium text-slate-600">{selectedAgent.name}</span>
              </div>

              {/* Date Input with Past Money Quick Pills */}
              <div>
                <label className="text-[10px] font-semibold text-emerald-900 uppercase block mb-1">
                  {language === 'te' ? 'వచ్చిన తేదీ (Date Received)' : 'Date Received (Past or Today)'}
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => handleEntryDateChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-semibold font-mono text-emerald-950 focus:outline-none focus:border-emerald-600"
                  required
                />
                {renderDatePills()}
              </div>

              {/* Amount Received */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-semibold text-emerald-900 uppercase">
                    {language === 'te' ? 'వచ్చిన మొత్తం (Amount Received)' : 'Amount Received (₹)'}
                  </label>
                  <span className="text-[11px] font-medium text-emerald-700">
                    {language === 'te' ? 'ఈ రోజు మొత్తం బాకీ:' : 'Total Due Today:'} {formatINR(todayTotalDue)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2 text-lg font-bold text-emerald-600">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={receivedAmountStr}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const num = raw ? parseInt(raw, 10) : 0;
                      setReceivedAmountStr(num > 0 ? formatNumberWithCommas(num) : '');
                    }}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-emerald-300 rounded-xl text-xl font-bold font-mono text-emerald-950 focus:outline-none focus:border-emerald-600"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <input
                  type="text"
                  placeholder={language === 'te' ? 'గమనిక (ఐచ్ఛికం)' : 'Notes (Optional)'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs font-medium"
                />
              </div>

              {/* Preview */}
              {(() => {
                const received = receivedAmountStr 
                  ? parseNumberFromCommas(receivedAmountStr) 
                  : todayTotalDue;
                const remaining = Math.max(0, todayTotalDue - received);

                return (
                  <div className="bg-white border border-emerald-200 rounded-xl p-3 text-xs font-mono space-y-1 shadow-2xs">
                    <div className="flex justify-between text-slate-600">
                      <span>{language === 'te' ? 'రావాల్సిన మొత్తం (నేటి వరకు):' : 'Total Due Today:'}</span>
                      <span className="font-semibold">{formatINR(todayTotalDue)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>{language === 'te' ? 'వచ్చిన మొత్తం:' : 'Amount Received:'}</span>
                      <span className="font-semibold">-{formatINR(received)}</span>
                    </div>
                    <div className="border-t border-slate-100 pt-1 flex justify-between font-semibold text-slate-900">
                      <span>{language === 'te' ? 'ఇంకా రావాల్సింది:' : 'Remaining to Take:'}</span>
                      <span className={remaining === 0 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {remaining === 0 
                          ? (language === 'te' ? '✓ ₹0 (పూర్తి అయింది)' : '✓ ₹0 (Zero Balance)') 
                          : formatINR(remaining)}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="px-3.5 py-2 bg-slate-200 text-slate-700 text-xs font-medium rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  {language === 'te' ? 'సేవ్ చేయండి (Save Payment)' : 'Save Payment'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 4. CHITTA / PASSBOOK LEDGER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            {language === 'te' ? 'ఖాతా వివరాలు (చిట్టా)' : 'Passbook (History)'}
          </span>
          <span className="text-xs font-mono font-bold text-slate-400">
            {currentAgentEntries.length} {language === 'te' ? 'ఎంట్రీలు' : 'entries'}
          </span>
        </div>

        {currentAgentEntries.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            {language === 'te' ? 'ఇంకా ఎలాంటి లావాదేవీలు నమోదు కాలేదు' : 'No entries yet for this agent.'}
          </div>
        ) : (
          <div className="space-y-2">
            {[...currentAgentEntries].reverse().map((entry) => (
              <div
                key={entry.id}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-1 hover:bg-slate-100/70 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-slate-500">{entry.date}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                      entry.type === 'give_cash' 
                        ? 'bg-amber-100 text-amber-900' 
                        : entry.type === 'settle_deal' || entry.type === 'received_payment'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-blue-100 text-blue-900'
                    }`}>
                      {entry.type === 'give_cash'
                        ? (language === 'te' ? '+ నగదు ఇచ్చారు' : '+ Cash Given')
                        : entry.type === 'settle_deal' || entry.type === 'received_payment'
                        ? (language === 'te' ? '✓ డబ్బు వచ్చింది' : '✓ Received')
                        : (language === 'te' ? '+ వడ్డీ' : '+ Interest')}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEntryToDelete(entry);
                      }}
                      title={language === 'te' ? 'ఈ ఎంట్రీని తొలగించు' : 'Delete this entry'}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/70 rounded-lg transition active:scale-95 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{language === 'te' ? 'డిలీట్' : 'Delete'}</span>
                    </button>
                  </div>
                </div>

                <div className="font-mono text-slate-800 text-[11px] leading-relaxed">
                  {entry.formulaText}
                </div>

                {entry.notes && (
                  <div className="text-[10px] text-slate-500 font-sans italic">
                    {entry.notes}
                  </div>
                )}

                <div className="flex justify-between items-center pt-1 border-t border-slate-200/50 font-mono text-[11px]">
                  <span className="text-slate-400 font-sans">
                    {language === 'te' ? 'రావాల్సిన మొత్తం:' : 'Total to Take:'}
                  </span>
                  <span className="font-black text-slate-900">
                    {formatINR(entry.newBalance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* In-App Delete Entry Confirmation Modal */}
      <ConfirmModal
        isOpen={!!entryToDelete}
        onClose={() => setEntryToDelete(null)}
        onConfirm={() => {
          if (entryToDelete) {
            onDeleteEntry(entryToDelete.id);
            setEntryToDelete(null);
          }
        }}
        title={language === 'te' ? 'ఎంట్రీ తొలగించాలా?' : 'Delete Khata Entry?'}
        message={
          entryToDelete
            ? language === 'te'
              ? `[${entryToDelete.date}] ${entryToDelete.formulaText || 'ఈ ఎంట్రీని'} ఖాతా నుండి తొలగించాలనుకుంటున్నారా?`
              : `Are you sure you want to delete this entry from ${entryToDelete.date}?`
            : ''
        }
        confirmText={language === 'te' ? 'తొలగించు' : 'Delete Entry'}
        cancelText={language === 'te' ? 'రద్దు చేయి' : 'Cancel'}
        isDanger={true}
        type="delete"
      />

      {/* In-App Delete Agent Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeletingAgent && !!selectedAgent}
        onClose={() => setIsDeletingAgent(false)}
        onConfirm={() => {
          if (selectedAgent) {
            const nextAgent = agents.find((a) => a.id !== selectedAgent.id);
            setSelectedAgentId(nextAgent ? nextAgent.id : '');
            onDeleteAgent(selectedAgent.id);
            setIsDeletingAgent(false);
          }
        }}
        title={language === 'te' ? 'ఏజెంట్‌ను తొలగించాలా?' : 'Delete Agent?'}
        message={
          selectedAgent
            ? language === 'te'
              ? `ఏజెంట్ "${selectedAgent.name}" ను మరియు వారి ఖాతా వివరాలను తొలగించాలనుకుంటున్నారా?`
              : `Are you sure you want to delete agent "${selectedAgent.name}" and all associated passbook entries?`
            : ''
        }
        confirmText={language === 'te' ? 'ఏజెంట్‌ను తొలగించు' : 'Delete Agent'}
        cancelText={language === 'te' ? 'రద్దు చేయి' : 'Cancel'}
        isDanger={true}
        type="delete"
      />
    </div>
  );
};
