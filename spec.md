# Mtextrading – 9 Bug Fixes

## Current State

The platform has several persistent bugs across account isolation, session management, balance display, notifications, chat, and support UI.

## Requested Changes (Diff)

### Add
- `EmailIdentityOverrideContext` export to `useInternetIdentity.ts` so the email identity flows into `useActor` correctly
- `last_read_timestamp` to localStorage in `FloatingChatButton.tsx` to permanently clear unread count after chat is opened
- 5-hour auto-logout timer with visible countdown on admin dashboard (in `App.tsx` `StaffAdminSection`)
- `sessionStorage` persistence for `staffEmail` in `StaffAdminSection` so refresh doesn't log out admin
- Withdrawal status polling (`getOwnWithdrawalRequests` every 30s) in `DashboardPage.tsx`
- Email notification call after successful withdrawal submission in `DashboardPage.tsx`
- `onClick` handlers on support page items: email item opens `mailto:mtextradingsupport@gmail.com`, chat item closes profile and opens chat

### Modify
- `useInternetIdentity.ts` line 109–113: make `useInternetIdentity()` read from `EmailIdentityOverrideContext` and return `overrideIdentity ?? context.identity`
- `DashboardPage.tsx` `closedOrders` memo: add `activeAccount.accountId` filter so only current account's closed trades show
- `DashboardPage.tsx` `ownTransactions` load: re-fetch when `activeAccount` changes, not just on `actor` mount; filter by active account ID
- `DashboardPage.tsx` `handleCloseOrder`: also update `equity` in accounts state alongside `balance` (equity = new balance + open P&L)
- `DashboardPage.tsx` support page: replace 5 inert items with exactly 2 items: (1) email support linking to `mailto:mtextradingsupport@gmail.com`, (2) in-app chat that opens the chat
- `DashboardPage.tsx` `allClosedMeta` initial load: only load from `activeAccount.accountId` closed orders key, not all accounts
- `DashboardPage.tsx` new demo account creation: persist `activeAccountIdx` to localStorage after creation
- `FloatingChatButton.tsx`: replace count-all-admin-messages logic with last_read_timestamp comparison

### Remove
- Support page items: "Most common topics", "Explore help centre", "Telegram", "WhatsApp", "Chat with an agent" (replace with 2 new ones)

## Implementation Plan

1. **`useInternetIdentity.ts`** — Add `export const EmailIdentityOverrideContext = createContext<Identity | null>(null)` after imports. Inside `useInternetIdentity()` add `const overrideIdentity = useContext(EmailIdentityOverrideContext)` and change return to `return { ...context, identity: overrideIdentity ?? context.identity }`.

2. **`App.tsx` StaffAdminSection** — Persist `staffEmail` to `sessionStorage.setItem('mtex_staff_email', email)` on login success. Restore on mount from `sessionStorage.getItem('mtex_staff_email')`. Add 5-hour countdown timer starting from login; auto-logout when timer hits 0. Show a small countdown banner in `AdminPage` header (hours:minutes:seconds).

3. **`FloatingChatButton.tsx`** — Replace the second `useEffect` that counts all admin messages with logic that reads `localStorage.getItem('mtex_chat_last_read')` timestamp. Count only admin messages with `timestamp > lastRead`. When chat opens, set `localStorage.setItem('mtex_chat_last_read', Date.now().toString())`.

4. **`DashboardPage.tsx` — closed orders isolation** — In `closedOrders` memo, add filter: `&& o.accountId === activeAccount?.accountId` (or use the localStorage key scoped to `activeAccount.accountId`). In `allClosedMeta` initial load (lines 1350–1380), only read from the active account's key, not all accounts.

5. **`DashboardPage.tsx` — ownTransactions per-account** — Add `activeAccount` to the `useEffect` dependency array for `getOwnTransactions()`. Filter transactions by `activeAccount.accountId` if the transaction has an account field, or just reload on switch.

6. **`DashboardPage.tsx` — equity/freeMargin update** — In `handleCloseOrder`, after updating `balance` in `setAccounts`, also update `equity` to `newBalance + openLivePnL`. Compute `openLivePnL` as the sum of live P&L of remaining open orders.

7. **`DashboardPage.tsx` — withdrawal polling** — Add `setInterval` that calls `actor.getOwnWithdrawalRequests()` every 30 seconds to refresh `pendingWithdrawals` state. Update status labels based on returned data.

8. **`DashboardPage.tsx` — withdrawal email notification** — After successful `actor.submitWithdrawalRequest(...)`, call `actor.sendEmail(...)` to send withdrawal confirmation email to user's email.

9. **`DashboardPage.tsx` — support page** — Replace the 5-item list with exactly 2 items:
   - Item 1: Email icon + "Email Support" + `mtextradingsupport@gmail.com` → `onClick: window.location.href = 'mailto:mtextradingsupport@gmail.com'`
   - Item 2: Chat icon + "In-App Chat" + "Chat with support" → `onClick: close profile panel, open FloatingChatButton`

10. **`DashboardPage.tsx` — new account idx persistence** — After `setActiveAccountIdx(newAccounts.length - 1)` in demo/live account creation, add `localStorage.setItem('mtex_active_account_idx', String(newAccounts.length - 1))`.
