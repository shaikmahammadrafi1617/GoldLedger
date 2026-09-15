import { Transaction, Language } from '../types';

/**
 * Format a number into standard Indian Currency format (e.g. ₹1,00,000)
 */
export function formatINR(amount: number | undefined | null, includeDecimals = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('en-IN', {
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: 0,
  });
  return `₹${formatted}`;
}

/**
 * Format a number into standard Indian comma-separated format without currency symbol (e.g. "1,00,000")
 */
export function formatNumberWithCommas(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') return '';
  const num = typeof amount === 'string' ? Number(amount.replace(/,/g, '')) : amount;
  if (isNaN(num)) return '';
  return Math.round(num).toLocaleString('en-IN');
}

/**
 * Parse a comma-formatted string back to a clean number (e.g. "3,00,000" -> 300000)
 */
export function parseNumberFromCommas(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format number into compact Lakhs representation (e.g. ₹2L, ₹4.5L, ₹50K)
 */
export function formatCompactINR(amount: number): string {
  if (!amount) return '₹0';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}K`;
  }
  return `₹${amount}`;
}

/**
 * Calculate duration in days between given date and return date (or today if active).
 * In day-based gold loan finance:
 * The give day is active and counted:
 * Same-day return (e.g. Sep 13 to Sep 13) = 1 day
 * Next-day return (e.g. Sep 13 to Sep 14) = 2 days
 * Sep 13 to Sep 15 = 3 days
 */
export function calculateDurationDays(givenDateStr: string, returnDateStr?: string): number {
  if (!givenDateStr) return 1;
  const start = new Date(givenDateStr + 'T00:00:00');
  const end = returnDateStr 
    ? new Date(returnDateStr + 'T00:00:00') 
    : new Date(); // current day
  
  // Set both to midnight UTC for clean calendar day count
  const startMidnight = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endMidnight = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  
  const diffMs = endMidnight - startMidnight;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  // Give day is active and counted: diffDays + 1 (e.g. Sep 13 to Sep 15 is 3 days).
  return Math.max(1, diffDays + 1);
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateReadable(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export interface FinancialBreakdown {
  durationDays: number;
  principal: number;
  totalUnits: number; // in lakhs (e.g. 4 for ₹4,00,000)
  grossInterest: number;
  totalAmountExpected: number;
  agentCommission: number;
  investorTotalShare: number;
  totalInvestorShare?: number; // alias so activeCompoundInfo.totalInvestorShare always works
  ownerNetProfit: number;
  dailyBreakdown?: DayBreakdown[];
  investorBreakdowns: {
    investorId: string;
    investorName: string;
    amount: number;
    units: number;
    ratePerLakh: number;
    share: number;
    settled: boolean;
  }[];
}

export interface DayBreakdown {
  day: number;
  openingPrincipal: number;
  interestAdded: number;
  closingBalance: number;
  agentCommission: number;
  cumulativeAgentCommission: number;
  isCompounded: boolean;
  investorDailyShare?: number;
  cumulativeInvestorShare?: number;
  ownerDayNetProfit?: number;
}

export interface CompoundFinancialBreakdown extends FinancialBreakdown {
  ratePerLakh: number;
  agentCommissionRatePerLakh: number;
  graceDays: number;
  enableCompounding?: boolean;
  compoundAfterDays?: number;
  dailyBreakdown: DayBreakdown[];
  totalInterestAccrued: number;
}

/**
 * Default grace/flat simple days before daily compounding starts:
 * - For ₹10L or higher: 2 days
 * - For ₹5L or lower: 5 days
 * - In-between: 3 days
 */
export function getDefaultGraceDays(principal: number): number {
  if (principal >= 1000000) return 2;
  if (principal <= 500000) return 5;
  return 3;
}

/**
 * Compounding Calculation for Agent Deals & Gold Loan BT:
 * - Day 1 interest is added immediately upon taking money.
 * - Flat daily interest for grace days (e.g. 2 days for 10L, 5 days for 5L).
 * - On day 3+ (after grace days), previous closing balance becomes the new principal basis.
 * - Agent commission is also calculated on this compounded principal basis.
 * - Investor commission is simpler: simple daily linear interest on contributed capital.
 * - Owner Net Profit = Gross Interest - Agent Commission - Investor Share.
 */
export function calculateCompoundDeal({
  principal,
  ratePerLakh,
  agentCommissionRatePerLakh = 0,
  durationDays = 1,
  graceDays = 2,
  enableCompounding = false,
  compoundAfterDays,
  investors = [],
}: {
  principal: number;
  ratePerLakh: number;
  agentCommissionRatePerLakh?: number;
  durationDays?: number;
  graceDays?: number;
  enableCompounding?: boolean;
  compoundAfterDays?: number;
  investors?: {
    investorId: string;
    investorName: string;
    amount: number;
    ratePerLakh: number;
    settled?: boolean;
  }[];
}): CompoundFinancialBreakdown {
  const dCount = Math.max(1, durationDays);
  const compAfter = compoundAfterDays !== undefined ? compoundAfterDays : (graceDays ?? 2);
  const dailyBreakdown: DayBreakdown[] = [];

  let runningClosing = principal;
  let cumulativeAgentComm = 0;

  for (let day = 1; day <= dCount; day++) {
    let basisPrincipal = principal;
    let isCompounded = false;

    if (!enableCompounding) {
      // Simple Flat daily rate for all days (no compounding)
      basisPrincipal = principal;
      isCompounded = false;
    } else {
      // Compounding enabled: flat for days <= compAfter, compounded after that
      if (day <= compAfter) {
        basisPrincipal = principal;
        isCompounded = false;
      } else {
        basisPrincipal = runningClosing;
        isCompounded = true;
      }
    }

    const units = basisPrincipal / 100000;
    const interestAdded = Math.round(units * ratePerLakh);
    const dayAgentComm = Math.round(units * agentCommissionRatePerLakh);

    // Investor daily interest
    let dayInvestorShare = 0;
    if (investors && investors.length > 0) {
      for (const inv of investors) {
        const invUnits = (inv.amount || 0) / 100000;
        dayInvestorShare += Math.round(invUnits * (inv.ratePerLakh || 0));
      }
    }
    const cumulativeInvestorShare = dayInvestorShare * day;
    const dayOwnerNetProfit = interestAdded - dayAgentComm - dayInvestorShare;

    const openingPrincipal = isCompounded ? basisPrincipal : runningClosing;
    runningClosing = runningClosing + interestAdded;
    cumulativeAgentComm += dayAgentComm;

    dailyBreakdown.push({
      day,
      openingPrincipal,
      interestAdded,
      closingBalance: runningClosing,
      agentCommission: dayAgentComm,
      cumulativeAgentCommission: cumulativeAgentComm,
      isCompounded,
      investorDailyShare: dayInvestorShare,
      cumulativeInvestorShare,
      ownerDayNetProfit: dayOwnerNetProfit,
    });
  }

  const totalAmountExpected = runningClosing;
  const grossInterest = totalAmountExpected - principal;
  const totalUnits = principal / 100000;

  // Investor calculations (Simpler linear daily interest: Amount * Rate * Days)
  let investorTotalShare = 0;
  const investorBreakdowns: FinancialBreakdown['investorBreakdowns'] = [];

  if (investors && investors.length > 0) {
    for (const inv of investors) {
      const invUnits = (inv.amount || 0) / 100000;
      const invShare = Math.round(invUnits * (inv.ratePerLakh || 0) * dCount);
      investorTotalShare += invShare;
      investorBreakdowns.push({
        investorId: inv.investorId,
        investorName: inv.investorName,
        amount: inv.amount,
        units: invUnits,
        ratePerLakh: inv.ratePerLakh,
        share: invShare,
        settled: !!inv.settled,
      });
    }
  }

  const ownerNetProfit = grossInterest - cumulativeAgentComm - investorTotalShare;

  return {
    durationDays: dCount,
    principal,
    totalUnits,
    grossInterest,
    totalInterestAccrued: grossInterest,
    totalAmountExpected,
    agentCommission: cumulativeAgentComm,
    investorTotalShare,
    totalInvestorShare: investorTotalShare,
    ownerNetProfit,
    investorBreakdowns,
    ratePerLakh,
    agentCommissionRatePerLakh,
    graceDays: compAfter,
    enableCompounding,
    compoundAfterDays: compAfter,
    dailyBreakdown,
  };
}

/**
 * Core business calculation for Gold Loan Balance Transfer:
 * customerRatePerLakh is per ₹1 Lakh per day (e.g., ₹2,000 / 1L / day)
 * investorRatePerLakh is per ₹1 Lakh per day (e.g., ₹1,000 / 1L / day)
 * agentCommissionRate is per ₹1 Lakh per day (e.g., ₹400 / 1L / day) on total principal
 */
export function calculateFinancials(
  tx: Pick<Transaction, 'principal' | 'givenDate' | 'returnDate' | 'customerRatePerLakh' | 'ratePeriod' | 'enableProfitSharing' | 'agentCommissionRatePerLakh' | 'investors' | 'graceDays'>,
  customDays?: number
): FinancialBreakdown {
  const durationDays = customDays !== undefined 
    ? Math.max(1, customDays) 
    : calculateDurationDays(tx.givenDate, tx.returnDate);

  const principal = tx.principal || 0;
  const ratePeriod = tx.ratePeriod || 'per_day';

  // If daily rate, use the exact compounding logic (using tx.graceDays or defaulting based on principal)
  if (ratePeriod === 'per_day') {
    const effectiveGraceDays = tx.graceDays !== undefined ? tx.graceDays : getDefaultGraceDays(principal);
    const compoundRes = calculateCompoundDeal({
      principal,
      ratePerLakh: tx.customerRatePerLakh || 0,
      agentCommissionRatePerLakh: (tx.enableProfitSharing || (tx.agentCommissionRatePerLakh && tx.agentCommissionRatePerLakh > 0)) 
        ? (tx.agentCommissionRatePerLakh || 0) 
        : 0,
      durationDays,
      graceDays: effectiveGraceDays,
      investors: (tx.enableProfitSharing || (tx.investors && tx.investors.length > 0)) ? (tx.investors || []) : [],
    });

    return {
      durationDays,
      principal,
      totalUnits: compoundRes.totalUnits,
      grossInterest: compoundRes.grossInterest,
      totalAmountExpected: compoundRes.totalAmountExpected,
      agentCommission: compoundRes.agentCommission,
      investorTotalShare: compoundRes.investorTotalShare,
      ownerNetProfit: compoundRes.ownerNetProfit,
      dailyBreakdown: compoundRes.dailyBreakdown,
      investorBreakdowns: compoundRes.investorBreakdowns,
    };
  }

  const totalUnits = principal / 100000; // e.g. 4.0 for 4 Lakhs
  
  let timeMultiplier = durationDays;
  if (ratePeriod === 'per_month') {
    timeMultiplier = durationDays / 30;
  } else if (ratePeriod === 'per_year') {
    timeMultiplier = durationDays / 365;
  }

  // Gross interest from customer
  const grossInterest = Math.round(totalUnits * (tx.customerRatePerLakh || 0) * timeMultiplier);
  const totalAmountExpected = principal + grossInterest;

  let agentCommission = 0;
  let investorTotalShare = 0;
  const investorBreakdowns: FinancialBreakdown['investorBreakdowns'] = [];

  if (tx.enableProfitSharing) {
    // Agent gets commission on total principal amount per 1L per day
    if (tx.agentCommissionRatePerLakh) {
      agentCommission = Math.round(totalUnits * tx.agentCommissionRatePerLakh * timeMultiplier);
    }

    // Investors get their share based on their contributed principal per 1L per day
    if (tx.investors && tx.investors.length > 0) {
      for (const inv of tx.investors) {
        const invUnits = (inv.amount || 0) / 100000;
        const invShare = Math.round(invUnits * (inv.ratePerLakh || 0) * timeMultiplier);
        investorTotalShare += invShare;
        investorBreakdowns.push({
          investorId: inv.investorId,
          investorName: inv.investorName,
          amount: inv.amount,
          units: invUnits,
          ratePerLakh: inv.ratePerLakh,
          share: invShare,
          settled: inv.settled,
        });
      }
    }
  }

  // Owner net profit formula: Gross Interest - Investor Share - Agent Commission
  const ownerNetProfit = grossInterest - investorTotalShare - agentCommission;

  return {
    durationDays,
    principal,
    totalUnits,
    grossInterest,
    totalAmountExpected,
    agentCommission,
    investorTotalShare,
    ownerNetProfit,
    investorBreakdowns,
  };
}

/**
 * Get date string (YYYY-MM-DD) for a specific number of days in the past
 */
export function getPastDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get human readable relative day label (e.g. "Today", "Yesterday", "2 days ago")
 */
export function getRelativeDaysLabel(dateStr: string, language: Language = 'en'): string {
  if (!dateStr) return '';
  const today = getTodayDateString();
  if (dateStr === today) {
    return language === 'te' ? 'ఈ రోజు' : 'Today';
  }

  const [y1, m1, d1] = today.split('-').map(Number);
  const [y2, m2, d2] = dateStr.split('-').map(Number);

  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  const diffDays = Math.round((t1 - t2) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return language === 'te' ? 'నిన్న (1 రోజు క్రితం)' : 'Yesterday';
  }
  if (diffDays === 2) {
    return language === 'te' ? '2 రోజుల క్రితం' : '2 days ago';
  }
  if (diffDays > 0) {
    return language === 'te' ? `${diffDays} రోజుల క్రితం` : `${diffDays} days ago`;
  }
  if (diffDays === -1) {
    return language === 'te' ? 'రేపు' : 'Tomorrow';
  }
  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return language === 'te' ? `${abs} రోజుల తర్వాత` : `In ${abs} days`;
  }

  return formatDateReadable(dateStr);
}
