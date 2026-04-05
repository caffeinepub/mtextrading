# Mtextrading

## Current State
- `useActor` hook uses `useInternetIdentity` exclusively. Email-logged-in users get an anonymous actor, causing all `#user` permission checks to fail with "Unauthorized".
- `closeOrder` backend requires `#user` permission — fails for email-auth users.
- `BALANCE_HISTORY` is a hardcoded constant with fake transactions (10k deposit, 500 withdrawal, 5k deposit). It renders in two places: Positions > History tab and Hub > Account Statement.
- Backend has `getOwnTransactions()` returning real `Transaction[]` with fields: transactionType, status, amount, timestamp, accountId, transactionId.

## Requested Changes (Diff)

### Add
- Load real transactions from `actor.getOwnTransactions()` and display them in both history locations.

### Modify
- `useActor.ts`: check `useEmailAuth` identity first. If email identity is present, use it for the actor and call `_initializeAccessControlWithSecret("")`. Only fall back to Internet Identity if no email identity exists (Super Admin use case only).
- `DashboardPage.tsx`: replace `BALANCE_HISTORY` constant usage with real transaction state loaded from backend. Show loading/empty states.

### Remove
- `BALANCE_HISTORY` hardcoded constant and its two render usages.
- `useInternetIdentity` import from `useActor.ts` (keep Internet Identity only for Super Admin at `/#/superadmin`).

## Implementation Plan
1. Update `useActor.ts` to import and use `useEmailAuth`, use email identity when available, call `_initializeAccessControlWithSecret("")` with empty string for user role.
2. In `DashboardPage.tsx`, add a `transactions` state, fetch via `actor.getOwnTransactions()` when actor is ready, format and render real transactions in both the Positions > History and Hub > Statement sections.
3. Delete `BALANCE_HISTORY` constant.
4. Validate and deploy.
