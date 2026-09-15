export type TransactionStatus = 'active' | 'completed' | 'cancelled' | 'needs_followup';

export interface InvestorContribution {
  investorId: string;
  investorName: string;
  amount: number; // Principal portion contributed
  ratePerLakh: number; // e.g. 1000 per 1L per day
  settled: boolean;
  settledDate?: string;
  settledAmount?: number;
}

export interface Transaction {
  id: string;
  customerName: string;
  customerPhone?: string;
  releaseBank: string; // Bank where gold is pledged currently
  targetBank: string; // New bank offering loan
  agentId: string;
  agentName: string;
  principal: number; // Total principal money given by owner (e.g. 400000)
  givenDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD (recorded only when money received)
  customerRatePerLakh: number; // e.g. 2000 per 1 Lakh per day
  ratePeriod: 'per_day' | 'per_month' | 'per_year';
  graceDays?: number; // Days before daily compounding starts (e.g. 2 for 10L, 5 for 5L)
  status: TransactionStatus;
  notes?: string;
  
  // Profit sharing options
  enableProfitSharing: boolean;
  agentCommissionRatePerLakh?: number; // e.g. 400 per 1 Lakh
  agentCommissionSettled?: boolean;
  agentCommissionSettledDate?: string;
  
  investors: InvestorContribution[];
  
  // Completion data
  actualMoneyReceived?: number; // Total principal + interest received
  durationDays?: number; // calculated or confirmed days
  finalGrossInterest?: number;
  finalOwnerProfit?: number;
  finalAgentCommission?: number;
  finalInvestorShare?: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  upiOrBank?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface Investor {
  id: string;
  name: string;
  phone: string;
  totalCapital: number;
  upiOrBank?: string;
  notes?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: 'create' | 'edit' | 'complete' | 'cancel' | 'delete' | 'status_change' | 'settle' | 'agent_update' | 'investor_update';
  transactionId?: string;
  customerOrAgent?: string;
  details: string;
}

export interface AgentKhataEntry {
  id: string;
  userId?: string;
  agentId: string;
  agentName: string;
  date: string; // YYYY-MM-DD
  type: 'give_cash' | 'rollover_compound' | 'received_payment' | 'settle_deal';
  principalGiven?: number;
  ratePerLakh?: number; // e.g. 2000 per 1L per day
  days?: number; // e.g. 1, 2, 3, 4 days
  graceDays?: number; // Days before daily compounding starts (e.g. 2 for 10L, 5 for 5L)
  enableCompounding?: boolean; // Whether daily compounding is enabled (default: false - simple flat daily interest)
  compoundAfterDays?: number; // Days after which compounding begins if enabled (e.g. 2, 5, 7)
  agentCommissionRatePerLakh?: number; // e.g. 400 per 1L
  interestAmount?: number;
  receivedAmount?: number;
  previousBalance: number;
  newBalance: number;
  formulaText?: string;
  notes?: string;
  createdAt: string;
}

export type Language = 'en' | 'te';

export interface OwnerSettings {
  securityLockEnabled: boolean;
  pinCode: string;
  defaultCustomerRatePerLakh: number;
  defaultAgentRatePerLakh: number;
  defaultInvestorRatePerLakh: number;
  language: Language;
}
