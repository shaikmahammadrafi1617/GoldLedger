import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Calendar, 
  TrendingUp, 
  Coins, 
  User, 
  Landmark, 
  CheckCircle2, 
  Filter,
  FileText
} from 'lucide-react';
import { Transaction, Agent, Investor, Language } from '../types';
import { formatINR, calculateFinancials, calculateDurationDays, formatDateReadable, getTodayDateString } from '../utils/formatters';
import { getT } from '../utils/translations';

interface ReportsViewProps {
  transactions: Transaction[];
  agents: Agent[];
  investors: Investor[];
  language: Language;
}

type ReportType = 'daily' | 'monthly' | 'agent' | 'investor';

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  agents,
  investors,
  language,
}) => {
  const t = getT(language);
  const todayStr = getTodayDateString();

  const [reportType, setReportType] = useState<ReportType>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(todayStr.substring(0, 7)); // YYYY-MM
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');

  // Daily Report Data
  const dailyCompleted = useMemo(() => {
    return transactions.filter(
      (tx) => tx.status === 'completed' && tx.returnDate === selectedDate
    );
  }, [transactions, selectedDate]);

  // Monthly Report Data
  const monthlyCompleted = useMemo(() => {
    return transactions.filter(
      (tx) => tx.status === 'completed' && tx.returnDate?.startsWith(selectedMonth)
    );
  }, [transactions, selectedMonth]);

  // Agent Report Data
  const agentReportData = useMemo(() => {
    const list = selectedAgentId === 'all' ? agents : agents.filter(a => a.id === selectedAgentId);
    return list.map((agent) => {
      const aTxs = transactions.filter((tx) => tx.agentId === agent.id);
      const completed = aTxs.filter((tx) => tx.status === 'completed');
      const active = aTxs.filter((tx) => tx.status === 'active' || tx.status === 'needs_followup');
      const totalPrincipal = aTxs.reduce((s, tx) => s + tx.principal, 0);

      let totalCommission = 0;
      let totalCommissionPaid = 0;
      aTxs.forEach((tx) => {
        if (tx.enableProfitSharing && tx.agentCommissionRatePerLakh) {
          const days = tx.durationDays || calculateDurationDays(tx.givenDate, tx.returnDate);
          const fin = calculateFinancials(tx, days);
          totalCommission += fin.agentCommission;
          if (tx.agentCommissionSettled) {
            totalCommissionPaid += fin.agentCommission;
          }
        }
      });

      return {
        agent,
        totalTxs: aTxs.length,
        completedCount: completed.length,
        activeCount: active.length,
        totalPrincipal,
        totalCommission,
        totalCommissionPaid,
        pendingCommission: totalCommission - totalCommissionPaid,
      };
    });
  }, [transactions, agents, selectedAgentId]);

  // Investor Report Data
  const investorReportData = useMemo(() => {
    return investors.map((inv) => {
      const deals = transactions.filter(
        (tx) => tx.enableProfitSharing && tx.investors && tx.investors.some(x => x.investorId === inv.id)
      );
      let activeCapital = 0;
      let returnedCapital = 0;
      let totalProfit = 0;
      let profitSettled = 0;

      deals.forEach((tx) => {
        const item = tx.investors.find(x => x.investorId === inv.id);
        if (!item) return;
        const days = tx.durationDays || calculateDurationDays(tx.givenDate, tx.returnDate);
        const units = item.amount / 100000;
        const profit = Math.round(units * item.ratePerLakh * days);
        totalProfit += profit;

        if (item.settled) {
          profitSettled += profit;
        }

        if (tx.status === 'active' || tx.status === 'needs_followup') {
          activeCapital += item.amount;
        } else if (tx.status === 'completed') {
          returnedCapital += item.amount;
        }
      });

      return {
        investor: inv,
        totalDeals: deals.length,
        committedCapital: inv.totalCapital,
        activeCapital,
        returnedCapital,
        availableCapital: inv.totalCapital - activeCapital,
        totalProfit,
        profitSettled,
        pendingProfit: totalProfit - profitSettled,
      };
    });
  }, [transactions, investors]);

  // Export to Excel / CSV
  const handleExportCSV = () => {
    let rows: string[][] = [];
    let filename = `goldledger-report-${reportType}-${todayStr}.csv`;

    if (reportType === 'daily' || reportType === 'monthly') {
      const data = reportType === 'daily' ? dailyCompleted : monthlyCompleted;
      rows.push([
        'Transaction ID',
        'Customer Name',
        'Agent Name',
        'Release Bank',
        'Target Bank',
        'Money Given Date',
        'Money Return Date',
        'Duration (Days)',
        'Principal (INR)',
        'Gross Interest (INR)',
        'Total Received (INR)',
        'Agent Commission (INR)',
        'Investor Share (INR)',
        'Owner Net Profit (INR)',
        'Status',
      ]);

      data.forEach((tx) => {
        const days = tx.durationDays || calculateDurationDays(tx.givenDate, tx.returnDate);
        const fin = calculateFinancials(tx, days);
        const gross = tx.finalGrossInterest !== undefined ? tx.finalGrossInterest : fin.grossInterest;
        const ownerNet = tx.finalOwnerProfit !== undefined ? tx.finalOwnerProfit : fin.ownerNetProfit;
        const agentComm = tx.enableProfitSharing ? fin.agentCommission : 0;
        const invShare = tx.enableProfitSharing ? fin.investorTotalShare : 0;

        rows.push([
          tx.id,
          `"${tx.customerName}"`,
          `"${tx.agentName}"`,
          `"${tx.releaseBank}"`,
          `"${tx.targetBank}"`,
          tx.givenDate,
          tx.returnDate || '',
          days.toString(),
          tx.principal.toString(),
          gross.toString(),
          (tx.actualMoneyReceived || (tx.principal + gross)).toString(),
          agentComm.toString(),
          invShare.toString(),
          ownerNet.toString(),
          tx.status,
        ]);
      });
    } else if (reportType === 'agent') {
      rows.push([
        'Agent Name',
        'Phone',
        'Total Deals',
        'Completed Deals',
        'Active Deals',
        'Total Principal Handled (INR)',
        'Commission Earned (INR)',
        'Commission Settled (INR)',
        'Pending Commission (INR)',
      ]);
      agentReportData.forEach((row) => {
        rows.push([
          `"${row.agent.name}"`,
          row.agent.phone,
          row.totalTxs.toString(),
          row.completedCount.toString(),
          row.activeCount.toString(),
          row.totalPrincipal.toString(),
          row.totalCommission.toString(),
          row.totalCommissionPaid.toString(),
          row.pendingCommission.toString(),
        ]);
      });
    } else {
      rows.push([
        'Investor Name',
        'Phone',
        'Total Deals Funded',
        'Committed Capital (INR)',
        'Active Capital (INR)',
        'Returned Capital (INR)',
        'Available Capital (INR)',
        'Total Profit Earned (INR)',
        'Profit Settled (INR)',
        'Pending Profit (INR)',
      ]);
      investorReportData.forEach((row) => {
        rows.push([
          `"${row.investor.name}"`,
          row.investor.phone,
          row.totalDeals.toString(),
          row.committedCapital.toString(),
          row.activeCapital.toString(),
          row.returnedCapital.toString(),
          row.availableCapital.toString(),
          row.totalProfit.toString(),
          row.profitSettled.toString(),
          row.pendingProfit.toString(),
        ]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-[#1E293B]">
      {/* Top Header Controls */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B] flex items-center gap-2 tracking-tight">
            <FileSpreadsheet className="w-6 h-6 text-[#C5A059]" />
            <span>Financial & Settlement Reports</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-ready daily closings, monthly profits, agent commissions, and investor capital statements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="report-export-csv-btn"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold bg-[#C5A059] hover:bg-[#b08e4d] text-white shadow-xs transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>{t.exportExcel}</span>
          </button>

          <button
            id="report-print-btn"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#C5A059]" />
            <span>{t.exportPdf}</span>
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex space-x-1 sm:space-x-2 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setReportType('daily')}
              className={`px-3 py-1.5 rounded-md transition ${
                reportType === 'daily' ? 'bg-white text-[#1E293B] shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Closing Report
            </button>
            <button
              onClick={() => setReportType('monthly')}
              className={`px-3 py-1.5 rounded-md transition ${
                reportType === 'monthly' ? 'bg-white text-[#1E293B] shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Summary Report
            </button>
            <button
              onClick={() => setReportType('agent')}
              className={`px-3 py-1.5 rounded-md transition ${
                reportType === 'agent' ? 'bg-white text-[#1E293B] shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agent Commission Report
            </button>
            <button
              onClick={() => setReportType('investor')}
              className={`px-3 py-1.5 rounded-md transition ${
                reportType === 'investor' ? 'bg-white text-[#1E293B] shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Investor Capital Statement
            </button>
          </div>

          {/* Contextual Date / Agent Selector */}
          <div className="flex items-center space-x-2">
            {reportType === 'daily' && (
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
                <span>Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:border-[#C5A059] focus:outline-none"
                />
              </div>
            )}

            {reportType === 'monthly' && (
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
                <span>Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:border-[#C5A059] focus:outline-none"
                />
              </div>
            )}

            {reportType === 'agent' && (
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
                <span>Agent:</span>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:border-[#C5A059] focus:outline-none"
                >
                  <option value="all">All Agents</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REPORT CONTENT VIEW */}
      <div id="printable-report-area" className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-6">
        {/* Printable Header Banner */}
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-[#1E293B] flex items-center gap-2 tracking-tight">
              <span className="text-[#C5A059]">GoldLedger</span> —
              <span>
                {reportType === 'daily' && `Daily Closing Report (${formatDateReadable(selectedDate)})`}
                {reportType === 'monthly' && `Monthly Profit Statement (${selectedMonth})`}
                {reportType === 'agent' && `Agent Commission & Performance Report`}
                {reportType === 'investor' && `Investor Capital & Distribution Ledger`}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Generated for Owner on {todayStr} • All currency values in INR (₹)
            </p>
          </div>
        </div>

        {/* DAILY / MONTHLY TABLE */}
        {(reportType === 'daily' || reportType === 'monthly') && (
          <div className="overflow-x-auto">
            {((reportType === 'daily' ? dailyCompleted : monthlyCompleted).length === 0) ? (
              <div className="text-center py-10 text-slate-400">
                No completed balance transfers recorded for this time period.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] bg-slate-50">
                    <th className="p-3">Customer & Agent</th>
                    <th className="p-3">Banks</th>
                    <th className="p-3">Dates & Days</th>
                    <th className="p-3 text-right">Principal</th>
                    <th className="p-3 text-right">Gross Interest</th>
                    <th className="p-3 text-right">Shares (Inv/Agent)</th>
                    <th className="p-3 text-right text-[#C5A059]">Owner Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {(reportType === 'daily' ? dailyCompleted : monthlyCompleted).map((tx) => {
                    const days = tx.durationDays || calculateDurationDays(tx.givenDate, tx.returnDate);
                    const fin = calculateFinancials(tx, days);
                    const gross = tx.finalGrossInterest !== undefined ? tx.finalGrossInterest : fin.grossInterest;
                    const net = tx.finalOwnerProfit !== undefined ? tx.finalOwnerProfit : fin.ownerNetProfit;
                    const deductions = (tx.enableProfitSharing ? fin.agentCommission + fin.investorTotalShare : 0);

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3">
                          <div className="font-bold text-[#1E293B] text-sm">{tx.customerName}</div>
                          <div className="text-[11px] text-slate-500">Agent: {tx.agentName}</div>
                        </td>
                        <td className="p-3 text-[11px] text-slate-600">
                          <div>Old: {tx.releaseBank || '-'}</div>
                          <div>New: {tx.targetBank || '-'}</div>
                        </td>
                        <td className="p-3 text-[11px] text-slate-600">
                          <div>{tx.givenDate} ➔ {tx.returnDate}</div>
                          <div className="font-semibold text-[#C5A059]">{days} days</div>
                        </td>
                        <td className="p-3 text-right font-bold text-[#1E293B] text-sm">
                          {formatINR(tx.principal)}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-600 text-sm font-mono">
                          +{formatINR(gross)}
                        </td>
                        <td className="p-3 text-right text-[11px] text-rose-600 font-semibold">
                          {deductions > 0 ? `−${formatINR(deductions)}` : 'None (0%)'}
                        </td>
                        <td className="p-3 text-right font-bold text-[#C5A059] text-sm font-mono">
                          {formatINR(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* AGENT COMMISSION TABLE */}
        {reportType === 'agent' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] bg-slate-50">
                  <th className="p-3">Agent Name</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3 text-center">Transfers (Done / Active)</th>
                  <th className="p-3 text-right">Total Principal Handled</th>
                  <th className="p-3 text-right">Total Commission</th>
                  <th className="p-3 text-right">Settled Payouts</th>
                  <th className="p-3 text-right text-[#C5A059]">Pending Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {agentReportData.map((row) => (
                  <tr key={row.agent.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-bold text-[#1E293B] text-sm">{row.agent.name}</td>
                    <td className="p-3 text-slate-500">{row.agent.phone}</td>
                    <td className="p-3 text-center">
                      <span className="text-emerald-600 font-bold">{row.completedCount} closed</span>
                      <span className="text-slate-400"> / {row.activeCount} active</span>
                    </td>
                    <td className="p-3 text-right font-bold text-[#1E293B]">{formatINR(row.totalPrincipal)}</td>
                    <td className="p-3 text-right font-bold text-[#C5A059] font-mono">{formatINR(row.totalCommission)}</td>
                    <td className="p-3 text-right text-emerald-600 font-mono font-semibold">{formatINR(row.totalCommissionPaid)}</td>
                    <td className="p-3 text-right font-bold text-[#C5A059] font-mono">
                      {formatINR(row.pendingCommission)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* INVESTOR CAPITAL TABLE */}
        {reportType === 'investor' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] bg-slate-50">
                  <th className="p-3">Investor Name</th>
                  <th className="p-3">Deals</th>
                  <th className="p-3 text-right">Committed Capital</th>
                  <th className="p-3 text-right text-purple-700">Active in Field</th>
                  <th className="p-3 text-right text-emerald-600">Available Capital</th>
                  <th className="p-3 text-right">Total Interest Earned</th>
                  <th className="p-3 text-right text-[#C5A059]">Pending Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {investorReportData.map((row) => (
                  <tr key={row.investor.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3">
                      <div className="font-bold text-[#1E293B] text-sm">{row.investor.name}</div>
                      <div className="text-[11px] text-slate-500">{row.investor.phone}</div>
                    </td>
                    <td className="p-3 text-slate-600 font-semibold">{row.totalDeals} deals</td>
                    <td className="p-3 text-right font-bold text-[#1E293B]">{formatINR(row.committedCapital)}</td>
                    <td className="p-3 text-right font-bold text-purple-700 font-mono">{formatINR(row.activeCapital)}</td>
                    <td className="p-3 text-right font-bold text-emerald-600 font-mono">{formatINR(row.availableCapital)}</td>
                    <td className="p-3 text-right font-bold text-[#1E293B] font-mono">{formatINR(row.totalProfit)}</td>
                    <td className="p-3 text-right font-bold text-[#C5A059] font-mono">
                      {formatINR(row.pendingProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
