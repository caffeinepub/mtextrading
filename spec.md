# Mtextrading

## Current State
The app is a full-stack trading and investment platform with:
- Email + password + OTP registration, email OTP staff admin login
- FXTM-style dashboard with 5 tabs: Home, Trade, Positions, Funds, Hub
- Crypto-only deposit flow (BTC, ETH, SOL, USDT, USDC, BNB, LTC, XRP)
- Withdrawal requests (bank and crypto)
- Admin dashboard with sidebar navigation
- Demo/live account switching
- In-app support chat (floating button)
- Notification bell
- AI assistant (robot head)
- Promo carousel

## Requested Changes (Diff)

### Add
- QR code display on admin Wallet Addresses tab (toggle between address text and QR code)
- "Deposit Pending" persistent status shown in user transaction history after submitting deposit
- "Pending Withdrawal" persistent status shown in user transaction history after submitting withdrawal
- Live account auto-created when admin approves first deposit (unique code, deposited balance)
- Demo account badge ("DEMO" label in amber) clearly shown in header when on demo account
- Withdrawal notification to user (email + in-app bell + browser push) when admin approves withdrawal
- "Payment Verified" button on admin Withdrawals tab (rename from "Approve")
- Notification to user when deposit is approved (if not already wired)

### Modify
- Transaction history in Funds tab: replace hardcoded mock data with real backend data (deposits + withdrawals)
- Demo account starting balance: $10,000 → $100,000
- Crypto withdrawal timing label: show "Processed instantly – 30 minutes" instead of "1-3 business days"
- Admin Withdrawals tab: rename bank details column/field to "Wallet / Bank Details" for crypto withdrawal display
- Demo account created automatically on new user registration (backend must create demo account record on profile completion)
- When admin approves deposit: create live account if user has no live account yet, credit that live account
- Switch Account sheet: show both demo and live account balances with correct labels

### Remove
- Hardcoded/mock transaction history entries from Funds tab

## Implementation Plan
1. **Backend changes (main.mo)**:
   - Add/confirm `getDemoAccount`, `getLiveAccount` query for user
   - Add `getUserTransactions` query returning real deposits + withdrawals per user with status fields
   - On deposit approval: if user has no live account, create one with unique code; credit live account balance
   - Add `approveWithdrawal` function that marks withdrawal as completed and sends notification
   - Ensure demo account is created with $100,000 on profile completion
   - Withdrawal status field: pending → completed when admin approves
   - Deposit status field: pending → completed when admin approves

2. **Frontend - Funds tab (DashboardPage.tsx)**:
   - Replace mock transaction history with real `getUserTransactions` call
   - Show "Deposit Pending" status badge on pending deposits, "Deposit Completed" on approved
   - Show "Pending Withdrawal" on pending withdrawals, "Withdrawal Completed" on approved
   - Crypto withdrawal form: show "Processed instantly – 30 minutes"
   - Bank transfer form: keep "Processed within 1-3 business days"

3. **Frontend - Header/Account switcher (DashboardPage.tsx)**:
   - Show DEMO badge in amber when active account is demo
   - Switch Account sheet shows demo balance ($100,000) and live account (if created) with balance
   - DEMO label clearly visible next to account code in header

4. **Frontend - Admin Withdrawals tab (AdminPage.tsx)**:
   - Rename "Approve" button to "Payment Verified"
   - Show crypto wallet address for crypto withdrawals; bank details for bank withdrawals
   - Label column as "Wallet / Bank Details"

5. **Frontend - Admin Wallet Addresses tab (AdminPage.tsx)**:
   - Add QR code display for each wallet address using a QR code library
   - Toggle button between showing text address and QR code

6. **Notifications**:
   - When admin clicks "Payment Verified" on a withdrawal: fire email + in-app bell + browser push to user
   - When admin approves deposit: fire email + in-app bell + browser push to user (confirm this is working)
