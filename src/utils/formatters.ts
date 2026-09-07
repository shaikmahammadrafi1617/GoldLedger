import { Transaction } from '../types';

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
 * Same-day return = 1 day
 * Next-day return (e.g. Sep 1 to Sep 2) = 2 days
 * Sep 1 to Sep 3 = 3 days
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
  
  // Inclusive day counting: day 1 to day 1 is 1 day. Day 1 to day 3 is 3 days.
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
  ownerNetProfit: number;
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

/**
 * Core business calculation for Gold Loan Balance Transfer:
 * customerRatePerLakh is per ₹1 Lakh per day (e.g., ₹2,000 / 1L / day)
 * investorRatePerLakh is per ₹1 Lakh per day (e.g., ₹1,000 / 1L / day)
 * agentCommissionRate is per ₹1 Lakh per day (e.g., ₹400 / 1L / day) on total principal
 */
export function calculateFinancials(
  tx: Pick<Transaction, 'principal' | 'givenDate' | 'returnDate' | 'customerRatePerLakh' | 'ratePeriod' | 'enableProfitSharing' | 'agentCommissionRatePerLakh' | 'investors'>,
  customDays?: number
): FinancialBreakdown {
  const durationDays = customDays !== undefined 
    ? Math.max(1, customDays) 
    : calculateDurationDays(tx.givenDate, tx.returnDate);

  const principal = tx.principal || 0;
  const totalUnits = principal / 100000; // e.g. 4.0 for 4 Lakhs
  const ratePeriod = tx.ratePeriod || 'per_day';
  
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
