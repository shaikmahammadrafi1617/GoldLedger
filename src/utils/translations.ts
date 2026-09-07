import { Language } from '../types';

export const translations = {
  en: {
    appTitle: 'GoldLedger',
    appSubtitle: 'Gold Loan Balance Transfer Finance',
    tagline: 'Owner-Only Financial Ledger & Profit Distribution',
    
    // Navigation & Tabs
    dashboard: 'Dashboard',
    calendar: 'Calendar',
    transactions: 'Transactions',
    agents: 'Agents',
    investors: 'Investors',
    reports: 'Reports',
    calculator: 'Quick Calc',
    settings: 'Settings',
    backup: 'Backup & Restore',
    
    // Core KPIs
    moneyOutside: 'Money Currently Outside',
    moneyOutsideDesc: 'Total active principal deployed in the field',
    returnedToday: 'Principal Returned Today',
    interestToday: 'Interest Received Today',
    netProfitToday: 'Owner Net Profit Today',
    netProfitMonth: 'Owner Profit This Month',
    
    activeTransactions: 'Active Transactions',
    completedTransactions: 'Completed Transactions',
    followupTransactions: 'Needs Follow-up',
    cancelledTransactions: 'Cancelled',
    
    // Actions
    newTransaction: 'New Transaction',
    completeTransaction: 'Receive & Complete',
    editTransaction: 'Edit Transaction',
    cancelTransaction: 'Cancel Transaction',
    deleteTransaction: 'Delete',
    markSettled: 'Mark as Settled',
    settled: 'Settled',
    unsettled: 'Pending',
    save: 'Save Transaction',
    confirm: 'Confirm',
    cancel: 'Cancel',
    exportExcel: 'Export Excel (CSV)',
    exportPdf: 'Print / Save PDF',
    searchPlaceholder: 'Search by agent, customer, bank, amount, or date...',
    filterByAgent: 'All Agents',
    filterByStatus: 'All Statuses',
    
    // Fields
    customerName: 'Customer Name',
    customerPhone: 'Customer Phone',
    releaseBank: 'Release Bank (Old Loan)',
    targetBank: 'Target Bank (New Loan)',
    agent: 'Responsible Agent',
    principalAmount: 'Principal Amount (అసలు)',
    moneyGivenDate: 'Money Given Date',
    moneyReturnDate: 'Money Return Date',
    duration: 'Duration',
    days: 'days',
    customerRate: 'Customer Rate (per ₹1 Lakh / day)',
    ratePeriod: 'Rate Period',
    notes: 'Notes / Remarks',
    status: 'Status',
    
    // Profit sharing
    advancedProfitSharing: 'Optional Advanced Profit Sharing',
    profitSharingDesc: 'Enable only when distributing profit to investors or agents.',
    enableInvestorSharing: 'Enable Investor Sharing',
    enableAgentCommission: 'Enable Agent Commission',
    agentCommissionRate: 'Agent Commission (per ₹1 Lakh / day)',
    investorAmount: 'Investor Contribution',
    investorRate: 'Investor Rate (per ₹1 Lakh / day)',
    addInvestor: '+ Add Another Investor',
    
    // Calculation Results
    principal: 'Principal',
    totalGrossInterest: 'Total Gross Interest',
    totalCollect: 'Total to Collect',
    investorShare: 'Investor Share',
    agentCommission: 'Agent Commission',
    ownerNetProfit: 'Owner Net Profit',
    
    // Daily Closing
    dailyClosingSummary: 'Daily Closing Summary',
    dailyClosingDesc: 'Transactions and returns recorded for this day',
    completedCount: 'Completed Transactions',
    interestReceived: 'Interest Received',
    noActivityOnDay: 'No active or completed balance transfers on this date.',
    
    // Calendar
    monthView: 'Month',
    weekView: 'Week',
    dayView: 'Day',
    today: 'Today',
    
    // Agents & Investors
    addAgent: 'Add New Agent',
    agentName: 'Agent Name',
    phone: 'Phone Number',
    totalHandled: 'Total Principal Handled',
    commissionDue: 'Commission Due',
    totalCommissionPaid: 'Total Commission Paid',
    addInvestorBtn: 'Add New Investor',
    investorName: 'Investor Name',
    availableCapital: 'Available Capital',
    activeCapitalUsed: 'Active Capital in Use',
    totalInterestEarned: 'Total Interest Earned',
    
    // Security & Basics
    appLocked: 'GoldLedger is Locked',
    enterPin: 'Enter 4-digit PIN to access ledger',
    unlockWithPin: 'Unlock Ledger',
    lockApp: 'Lock App',
    securityPin: 'Security PIN',
    offlineMode: 'Offline Mode (Synced locally)',
    onlineMode: 'Cloud Sync Active',
    language: 'Language',
  },
  te: {
    appTitle: 'గోల్డ్ లెడ్జర్',
    appSubtitle: 'బంగారు రుణ బ్యాలెన్స్ బదిలీ ఫైనాన్స్',
    tagline: 'ఓనర్ ఆర్థిక లెడ్జర్ & స్వయంచాలక లాభ పంపిణీ',
    
    // Navigation & Tabs
    dashboard: 'డ్యాష్‌బోర్డ్',
    calendar: 'క్యాలెండర్',
    transactions: 'లావాదేవీలు',
    agents: 'ఏజెంట్లు',
    investors: 'ఇన్వెస్టర్లు',
    reports: 'నివేదికలు',
    calculator: 'కాలిక్యులేటర్',
    settings: 'సెట్టింగ్‌లు',
    backup: 'బ్యాకప్ & రీస్టోర్',
    
    // Core KPIs
    moneyOutside: 'బయట ఉన్న మొత్తం అసలు',
    moneyOutsideDesc: 'ప్రస్తుతం ఫీల్డ్‌లో ఉన్న మొత్తం అసలు',
    returnedToday: 'ఈరోజు తిరిగి వచ్చిన అసలు',
    interestToday: 'ఈరోజు వచ్చిన వడ్డీ',
    netProfitToday: 'ఈరోజు ఓనర్ నికర లాభం',
    netProfitMonth: 'ఈ నెల ఓనర్ నికర లాభం',
    
    activeTransactions: 'నడుస్తున్న లావాదేవీలు',
    completedTransactions: 'పూర్తయిన లావాదేవీలు',
    followupTransactions: 'ఫాలో-అప్ అవసరం',
    cancelledTransactions: 'రద్దయినవి',
    
    // Actions
    newTransaction: '+ కొత్త లావాదేవీ',
    completeTransaction: 'డబ్బు స్వీకరించి ముగించు',
    editTransaction: 'సవరించు',
    cancelTransaction: 'రద్దు చేయి',
    deleteTransaction: 'తొలగించు',
    markSettled: 'చెల్లించినట్లు మార్క్ చేయి',
    settled: 'చెల్లించబడింది',
    unsettled: 'పెండింగ్',
    save: 'భద్రపరచు',
    confirm: 'నిర్ధారించు',
    cancel: 'రద్దు',
    exportExcel: 'Excel (CSV) ఎగుమతి',
    exportPdf: 'PDF / ప్రింట్ నివేదిక',
    searchPlaceholder: 'ఏజెంట్, కస్టమర్, బ్యాంకు, మొత్తం, తేదీ ద్వారా వెతకండి...',
    filterByAgent: 'అన్ని ఏజెంట్లు',
    filterByStatus: 'అన్ని స్థితులు',
    
    // Fields
    customerName: 'కస్టమర్ పేరు',
    customerPhone: 'కస్టమర్ ఫోన్',
    releaseBank: 'విడిపించే బ్యాంకు (పాత లోన్)',
    targetBank: 'కొత్త రుణం బ్యాంకు',
    agent: 'బాధ్యత గల ఏజెంట్',
    principalAmount: 'అసలు మొత్తం (రూ.)',
    moneyGivenDate: 'డబ్బు ఇచ్చిన తేదీ',
    moneyReturnDate: 'డబ్బు వచ్చిన తేదీ',
    duration: 'వ్యవధి',
    days: 'రోజులు',
    customerRate: 'కస్టమర్ వడ్డీ (₹1 లక్షకు / రోజుకు)',
    ratePeriod: 'రేటు విధానం',
    notes: 'గమనికలు',
    status: 'స్థితి',
    
    // Profit sharing
    advancedProfitSharing: 'అదనపు లాభ పంపిణీ (ఐచ్ఛికం)',
    profitSharingDesc: 'ఇన్వెస్టర్లు లేదా ఏజెంట్లకు లాభం పంచవలసి వస్తేనే ఆన్ చేయండి.',
    enableInvestorSharing: 'ఇన్వెస్టర్ వాటాను ప్రారంభించు',
    enableAgentCommission: 'ఏజెంట్ కమీషన్‌ను ప్రారంభించు',
    agentCommissionRate: 'ఏజెంట్ కమీషన్ (₹1 లక్షకు / రోజుకు)',
    investorAmount: 'ఇన్వెస్టర్ పెట్టుబడి',
    investorRate: 'ఇన్వెస్టర్ వడ్డీ (₹1 లక్షకు / రోజుకు)',
    addInvestor: '+ మరో ఇన్వెస్టర్‌ని జోడించండి',
    
    // Calculation Results
    principal: 'అసలు',
    totalGrossInterest: 'మొత్తం వడ్డీ లాభం',
    totalCollect: 'మొత్తం వసూలు చేయాల్సినది',
    investorShare: 'ఇన్వెస్టర్ వాటా',
    agentCommission: 'ఏజెంట్ కమీషన్',
    ownerNetProfit: 'ఓనర్ నికర లాభం',
    
    // Daily Closing
    dailyClosingSummary: 'రోజువారీ ముగింపు నివేదిక',
    dailyClosingDesc: 'ఈ రోజు రికార్డు చేయబడిన లావాదేవీలు మరియు రాబడులు',
    completedCount: 'పూర్తయిన లావాదేవీలు',
    interestReceived: 'వచ్చిన వడ్డీ',
    noActivityOnDay: 'ఈ తేదీన ఎటువంటి లావాదేవీలు లేవు.',
    
    // Calendar
    monthView: 'నెల',
    weekView: 'వారం',
    dayView: 'రోజు',
    today: 'ఈ రోజు',
    
    // Agents & Investors
    addAgent: 'కొత్త ఏజెంట్‌ని జోడించు',
    agentName: 'ఏజెంట్ పేరు',
    phone: 'ఫోన్ నంబర్',
    totalHandled: 'మొత్తం అసలు నిర్వహణ',
    commissionDue: 'చెల్లించాల్సిన కమీషన్',
    totalCommissionPaid: 'చెల్లించిన మొత్తం కమీషన్',
    addInvestorBtn: 'కొత్త ఇన్వెస్టర్‌ని జోడించు',
    investorName: 'ఇన్వెస్టర్ పేరు',
    availableCapital: 'అందుబాటులో ఉన్న పెట్టుబడి',
    activeCapitalUsed: 'ప్రస్తుతం వాడుకలో ఉన్న అసలు',
    totalInterestEarned: 'మొత్తం సంపాదించిన వడ్డీ',
    
    // Security & Basics
    appLocked: 'గోల్డ్ లెడ్జర్ లాక్ చేయబడింది',
    enterPin: 'లెడ్జర్ తెరవడానికి 4-అంకెల PIN నమోదు చేయండి',
    unlockWithPin: 'అన్‌లాక్ చేయండి',
    lockApp: 'యాప్ లాక్ చేయి',
    securityPin: 'సెక్యూరిటీ PIN',
    offlineMode: 'ఆఫ్‌లైన్ మోడ్ (స్థానికంగా సేవ్ చేయబడింది)',
    onlineMode: 'క్లౌడ్ సింక్ యాక్టివ్',
    language: 'భాష',
  },
};

export function getT(lang: Language) {
  return translations[lang] || translations.en;
}
