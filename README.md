# GoldLedger 🪙📊

> **The definitive gold loan balance transfer & bridge capital ledger for financiers, brokers, and deal managers.**

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Overview

**GoldLedger** is a specialized, mobile-first financial management system engineered for gold loan balance transfer operators. It handles short-term bridge capital workflows—from pledging capital and releasing mortgaged gold jewelry at pawn shops or NBFCs to transferring loans to target banking institutions, syndicating investor funds, settling daily interest, and "calling the day."

Designed with an intuitive Android interface and bilingual support (**English & Telugu / తెలుగు**), GoldLedger eliminates paper ledgers, manual spreadsheet errors, and calculation disputes.

---

## ✨ Key Capabilities

### 1. ⚡ Rapid Deal Entry & Instant Calculations
- **Fast Capital Input**: Quick-add buttons for `+₹1L`, `+₹2L`, `+₹5L`, `+₹10L` and custom principal entries.
- **Daily Interest per Lakh**: Instant interest calculators with `1K+` quick-adds (e.g. `+₹1,000`, `+₹2,000`, `+₹5,000` per ₹1,00,000/day) and standard presets (`₹100`, `₹120`, `₹150`).
- **Real-Time Earnings Breakdown**: Computes gross daily earnings, investor payouts, agent commission cuts, and net owner profit on the fly.

### 2. 🤝 Syndicated Investor & Agent Profit Sharing
- **Multi-Investor Portions**: Split deal funding across multiple capital partners with customizable interest rates per investor.
- **Agent Commission Tracking**: Track field broker and agent payouts (`+100+` quick-adds) with automated settlement tracking upon loan transfer completion.
- **Automated Waterfall Accounting**: Protects owner margins while guaranteeing exact investor and agent disbursements.

### 3. 📋 Live Active Deals Dashboard
- **Elapsed Duration Clock**: Real-time counter of days elapsed from initial money deployment to current date.
- **Live Accrued Interest**: Real-time ticker showing current accrued receivables.
- **Status Filtering**: Filter deals by `Active`, `Completed`, and `Needs Followup`.
- **Search & Filter**: Search deals by customer name, release bank, target bank, or broker.

### 4. 🏁 Settlement & "Call the Day" (లెక్క తేల్చడం)
- **One-Tap Deal Closure**: Automatically calculates final gross interest, total money receivable, investor returns, agent commissions, and owner profit.
- **Audit Trails**: Generates immutable audit activity logs for deal creation, edits, closures, and deletions.
- **Full History Log**: Retains complete settlement archives with timestamped performance records.

### 5. 🌐 Bilingual & Regional Optimization
- Full localization in **English** and **Telugu (తెలుగు)** tailored for South Indian gold loan markets and vernacular finance operations.

### 6. 🛡️ Cloud Persistence & Offline Reliability
- **Firebase Firestore**: Multi-device real-time sync partitioned by authenticated user ID (`/users/{userId}/*`).
- **Offline-First Resilience**: Automatic local storage caching ensures zero disruption during low-connectivity fieldwork.
- **PIN Security Lock**: Optional PIN code protection for safeguarding confidential business financials.

---

## 🏗️ Architecture & Tech Stack

```
GoldLedger/
├── src/
│   ├── components/            # UI components and modals
│   │   └── android/           # Mobile Android view layouts & navigation
│   │       ├── ActiveDealsTab.tsx        # Active loan portfolio & management
│   │       ├── NewDealTab.tsx            # Deal creation & rapid calculator
│   │       ├── SettleAndCallDayTab.tsx   # Settlement and payout distribution
│   │       ├── DayDoneTab.tsx            # Historical closed deals archive
│   │       ├── AndroidHeader.tsx         # Mobile app header with balance & auth
│   │       ├── AndroidBottomNav.tsx      # Native tab bar navigation
│   │       └── AndroidStatusBar.tsx      # Phone status bar simulation
│   ├── services/
│   │   └── firestoreService.ts           # Real-time Firestore sync & data sanitization
│   ├── utils/
│   │   └── formatters.ts                 # INR currency, date & interest mathematics
│   ├── types.ts                          # Unified TypeScript schemas & models
│   ├── firebase.ts                       # Firebase initialization & auth state
│   ├── App.tsx                           # Main application controller
│   └── main.tsx                          # App bootstrapping
├── firestore.rules                       # Hardened security rules with user isolation
├── firebase-blueprint.json               # Intermediate schema definition
└── package.json                          # Dependencies and scripts
```

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Lucide React icons, Motion animations
- **Backend & Database**: Firebase Authentication (Google OAuth), Cloud Firestore
- **State & Sync**: Real-time Firestore listeners (`onSnapshot`) + LocalStorage fallback

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) / [bun](https://bun.sh/)
- A [Firebase Project](https://console.firebase.google.com/) with **Firestore** and **Google Authentication** enabled.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/goldledger.git
   cd goldledger
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase credentials:**
   Create or verify `firebase-applet-config.json` in the root directory:
   ```json
   {
     "apiKey": "YOUR_FIREBASE_API_KEY",
     "authDomain": "YOUR_PROJECT.firebaseapp.com",
     "projectId": "YOUR_PROJECT_ID",
     "storageBucket": "YOUR_PROJECT.firebasestorage.app",
     "messagingSenderId": "YOUR_MESSAGING_SENDER_ID",
     "appId": "YOUR_APP_ID",
     "firestoreDatabaseId": "(default)"
   }
   ```

4. **Deploy Firestore Rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Start the local development server:**
   ```bash
   npm run dev
   ```
   The application will be live at `http://localhost:3000`.

---

## 💻 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server on port 3000 |
| `npm run build` | Compiles and bundles production static assets into `dist/` |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs TypeScript compiler checks (`tsc --noEmit`) |
| `npm run clean` | Removes build directories and temporary files |

---

## 🔐 Data Security & Firestore Rules

User data is isolated strictly by authenticated Firebase UID. No user can read, query, or mutate another user's financial deals, investor accounts, or audit logs.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 📱 Mobile Installation (PWA)

GoldLedger is fully optimized as a Progressive Web App (PWA):
1. Open the app in **Google Chrome** on your Android device.
2. Tap the browser menu (three dots) and select **"Add to Home screen"** or **"Install App"**.
3. Launch GoldLedger directly from your home screen for full-screen, native-like operation.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Engineered for reliability, precision, and velocity in gold loan financing.</sub>
</div>
