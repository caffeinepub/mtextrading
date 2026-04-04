# Mtextrading -- 6 Bug Fixes

## Current State
- DashboardPage uses `useActor()` which only reads from `useInternetIdentity`. Email-logged-in users' identity is stored in `useEmailAuth` state but `useActor` never reads it, so on page refresh the actor is anonymous.
- Order placement: `getInstrumentBySymbol` is called but if it returns null, `instrumentId` stays as `BigInt(1)`. `createOrder` then calls `getInstrumentById(1)` which fails with "Instrument not found" because backend instruments map is empty.
- Transaction history: `ownDeposits` is loaded in a `useEffect` that depends on `[actor]`. On page refresh the actor is anonymous so `getOwnCryptoDepositRequests()` returns empty. `pendingWithdrawals` is only local state (not fetched from backend on load).
- Admin adjust balance dialog: `SelectTrigger` and `Input` have `text-white` class on white background -- invisible text.
- Backend deposit notification: uses `req.amount.toText() # " " # req.coin` which produces "10000.0000 BTC" instead of "$10,000".
- ResetPasswordPage exists and correctly parses `?token=` from the hash URL. ForgotPasswordPage correctly calls `sendPasswordResetEmail`. App.tsx detects `#/reset-password` and shows `ResetPasswordPage`. This flow appears correct but needs verification that the reset link in the email uses the app's hash-based URL.

## Requested Changes (Diff)

### Add
- Auto-create instrument in backend before placing order if `getInstrumentBySymbol` returns null: call `actor.createInstrument(name, symbol, category, bidPrice, askPrice)` to get a real `instrumentId`, then use that for `createOrder`.
- Load pending withdrawals from backend on dashboard mount: call `actor.getOwnWithdrawalRequests()` (or equivalent) in the same `useEffect` as deposits.

### Modify
- **useActor.ts**: Read email identity from `useEmailAuth` context first. If `emailAuth.identity` is non-null, use it as the actor identity instead of Internet Identity. Query key should include the email identity principal so it updates when email identity changes.
- **DashboardPage.tsx order placement**: Before calling `createOrder`, if `getInstrumentBySymbol` returns null/undefined, call `actor.createInstrument` with the instrument's name, symbol, appropriate category, and current bid/ask prices to create it, then use the returned `instrumentId`.
- **DashboardPage.tsx transaction history**: Also fetch `getOwnWithdrawalRequests()` on mount and combine with deposits for the history tab. Ensure the `useEffect` re-fires when actor changes and the actor is authenticated.
- **AdminPage.tsx AdjustBalanceDialog**: Change `text-white` to `text-gray-900` on `SelectTrigger` and `Input` for the adjust balance dialog.
- **backend/main.mo approveCryptoDeposit**: Change the email body from `req.amount.toText() # " " # req.coin` to a dollar-formatted string. Use `Float.toText(Float.fromInt(Int.abs(Float.toInt(req.amount))))` with dollar sign, or simply format the amount as `"$" # Nat.toText(Int.abs(Float.toInt(req.amount)))` for whole numbers.

### Remove
- Nothing removed.

## Implementation Plan

1. **Fix useActor.ts** -- Import `useEmailAuth`. Add email identity to the query key. In `queryFn`, check `emailAuthIdentity` first; if present, use it instead of Internet Identity. This fixes page refresh logout.
2. **Fix order placement in DashboardPage** -- In `handleSubmitOrder`, after `getInstrumentBySymbol` returns null, call `actor.createInstrument(...)` with the instrument details and current prices. Map category string to `InstrumentCategory` variant. Use returned ID.
3. **Fix transaction history persistence** -- In the deposits `useEffect`, also call `actor.getOwnWithdrawalRequests()` (check backend.d.ts for exact function name) and set `pendingWithdrawals` from real backend data, not just local state.
4. **Fix admin adjust balance text colors** -- Find the two `text-white` class instances in `AdjustBalanceDialog` component (SelectTrigger and Input) and change to `text-gray-900`.
5. **Fix backend deposit notification message** -- In `main.mo` around line 787, change the amount display from `req.amount.toText() # " " # req.coin` to `"$" # Int.toText(Float.toInt(req.amount))` (or use proper formatting) so the email reads "Your account has been funded with $10,000".
6. **Verify forgot password reset link** -- Check that `sendPasswordResetEmail` in the backend generates a link using the app's hash-based URL format `/#/reset-password?token=...` so clicking it lands on `ResetPasswordPage`.
