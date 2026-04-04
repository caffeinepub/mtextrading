# Mtextrading — Demo/Live Account System

## Current State
- Backend auto-creates a demo account ($100,000) when user completes profile via `saveCallerUserProfile`
- `approveCryptoDeposit` auto-creates a live account on first deposit approval, BUT also incorrectly credits the original demo account with the deposit amount (double-credit bug)
- `createTradingAccount` creates accounts with $0 balance
- Account codes are raw numeric IDs (1, 2, 3...) not formatted as 0000001, 0000002
- Switch Account bottom sheet shows accounts but has NO "Create Live Account" or "Create Demo Account" buttons
- Frontend header shows account ID and DEMO badge but doesn't format code as 0000001
- Demo account balance shows $0 in some cases because identity mismatch prevents `getOwnAccounts` from returning data

## Requested Changes (Diff)

### Add
- Demo account code display formatted as "DEMO-0000001", "DEMO-0000002" (sequential per user)
- Live account code display formatted as "LIVE-0000001", "LIVE-0000002" etc.
- "Create Live Account" button in Switch Account panel — navigates user to Funds/Deposit tab
- "Create Demo Account" button in Switch Account panel — creates new demo account with $100,000 (limit 3 demo accounts)
- New backend field `accountCode: Text` on TradingAccount with sequential code per user
- New backend function `createDemoAccount()` — creates demo account with $100,000 for the caller (up to 3)
- New backend function `createLiveAccountFromDeposit(currency: Text)` — creates a $0 placeholder live account, returns accountId so user can submit deposit to it

### Modify
- `approveCryptoDeposit`: Fix double-credit bug — do NOT credit the original deposit account; ONLY credit the live account. If no live account exists, create one and credit it with the deposit amount.
- `saveCallerUserProfile`: Ensure demo account code is set to "DEMO-0000001" for the first demo account
- `createTradingAccount`: When accountType is demo, set balance to $100,000; set accountCode correctly
- Switch Account bottom sheet: Show formatted account codes (DEMO-0000001, LIVE-0000001), balances, and the two action buttons
- Header account display: Show formatted account code instead of raw numeric ID
- Deposit flow in Funds tab: When user has no live account, show option to create live account first; deposit must be linked to a live account ID

### Remove
- Raw numeric account ID display in header (replace with formatted code)
- Double-credit logic in `approveCryptoDeposit`

## Implementation Plan

### Backend changes (main.mo)
1. Add `accountCode: Text` field to `TradingAccount` type
2. Add `demoAccountCount: Nat` helper or derive from accounts array per user
3. Add `createDemoAccount()` function: checks caller has ≤2 existing demo accounts, creates new one with balance=$100,000, accountCode="DEMO-000000X" where X = existing demo count + 1
4. Add `createLiveAccountFromDeposit(currency: Text)` function: creates $0 live account for caller, returns accountId; user then submits deposit to this accountId
5. Fix `saveCallerUserProfile`: set demo accountCode = "DEMO-0000001" on auto-created demo account
6. Fix `approveCryptoDeposit`: Remove credit to `req.accountId`; only credit/create the live account
7. Fix `createTradingAccount`: demo type gets $100,000, live gets $0; generate proper accountCode

### Frontend changes (DashboardPage.tsx, FundsTab)
1. Switch Account panel: format and display accountCode (DEMO-0000001 etc.), show balance, add "Create Live Account" and "Create Demo Account" buttons
2. "Create Demo Account" calls new `createDemoAccount()` backend function, refreshes accounts list
3. "Create Live Account" navigates to Funds tab deposit section with a note that deposit creates their live account
4. Header: show `acc.accountCode` instead of raw `acc.accountId`
5. Deposit flow: when user submits deposit, create a live account first if none exists (call `createLiveAccountFromDeposit`), then submit deposit to that accountId
6. Account switching: selecting an account sets it as active and shows its balance everywhere
