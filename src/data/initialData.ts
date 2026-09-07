import { Agent, Investor, Transaction, ActivityLog, OwnerSettings } from '../types';

export const initialAgents: Agent[] = [];

export const initialInvestors: Investor[] = [];

export const initialTransactions: Transaction[] = [];

export const initialLogs: ActivityLog[] = [];

export const initialSettings: OwnerSettings = {
  securityLockEnabled: false,
  pinCode: '1234',
  defaultCustomerRatePerLakh: 100,
  defaultAgentRatePerLakh: 20,
  defaultInvestorRatePerLakh: 50,
  language: 'en',
};
