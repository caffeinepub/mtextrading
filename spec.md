# Mtextrading — Bug Fixes: Deposits, Withdrawals, Admin UI, Session Persistence

## Current State
The platform is a full-stack trading/investment app with email-based auth, admin/super-admin dashboards, crypto deposit flow, and withdrawal management. Multiple bugs have been identified in the deposit/withdrawal UI, admin dashboard display, and session persistence.

## Requested Changes (Diff)

### Add
- Real QR code image (using `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=<walletAddress>`) in the user-facing deposit flow where there is currently a gray placeholder box
- Copy address button next to the crypto wallet address in the admin Withdrawals table
- User name and email columns in both the admin Deposits table and admin Withdrawals table (look up from `users` state by matching `owner` principal)
- `useEmailAuth` identity fallback in `useActor` hook: if an email identity exists from `useEmailAuth` context, use it preferentially over `useInternetIdentity`

### Modify
- **`useActor.ts`**: Change to use `useEmailAuth().identity` when available. If `useEmailAuth().identity` is non-null, create the actor with that identity (and call `_initializeAccessControlWithSecret("")`). Only fall back to `useInternetIdentity` if no email identity exists. This fixes the page-refresh logout bug.
- **AdminPage.tsx — Users table**: Change `text-white` to `text-gray-900` on the Name `<span>` (line ~1777). Change `text-white` to `text-gray-900` on the Type `<SelectTrigger>` className (line ~1799).
- **AdminPage.tsx — Withdrawals table**: Change `text-white` to `text-gray-900` on the amount `<td>` cell (where `w.amount` is rendered). Add a small Copy icon button next to the wallet/bank address in the details cell for crypto withdrawals.
- **AdminPage.tsx — Deposits table**: Add a User column showing the user's name and email (matched from `users` state by `t.accountId` → find the user who owns that account). If no match, show the account ID.
- **AdminPage.tsx — Crypto Deposits tab**: The status check for pending deposits uses `dep.status?.pending != null` which may fail when the backend returns the string `"pending"` directly. Fix the status detection to also check `String(dep.status) === "pending"` (same pattern used for withdrawals). Show the user name/email next to the truncated owner principal.
- **DashboardPage.tsx — Deposit QR code**: Replace the gray placeholder `<div>` (currently showing "QR Code\n{coin}") with an actual `<img src=\`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(walletEntry.address)}\`` that shows the real QR code for the wallet address.

### Remove
- Nothing removed

## Implementation Plan

1. **`src/frontend/src/hooks/useActor.ts`**: Import `useEmailAuth`. At the top of `queryFn`, check `emailAuth.identity` first. If present, create actor with that identity and call `_initializeAccessControlWithSecret("")`. Only use `useInternetIdentity` identity if no email identity. The `queryKey` should include both identities so it reacts to changes.

2. **`src/frontend/src/pages/DashboardPage.tsx`**: Find the QR code placeholder (around line 4805: `<div className="w-32 h-32 bg-gray-900...">`). Replace with:
   ```tsx
   <div className="flex items-center justify-center my-4">
     <div className="p-2 bg-white border border-gray-200 rounded-xl inline-block">
       <img
         src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(walletEntry.address)}`}
         alt={`${selectedCryptoCoin.coin} QR Code`}
         width={180}
         height={180}
         className="rounded"
       />
       <p className="text-[10px] text-gray-400 mt-1 text-center">{selectedCryptoCoin.coin} Address</p>
     </div>
   </div>
   ```

3. **`src/frontend/src/pages/AdminPage.tsx`** — Users table:
   - Line ~1777: change `className="text-white"` to `className="text-gray-900 font-medium"` on the name span
   - Line ~1799: change `className="bg-gray-50 border-gray-200 text-white h-7 text-xs w-24"` to `className="bg-gray-50 border-gray-200 text-gray-900 h-7 text-xs w-24"`

4. **`src/frontend/src/pages/AdminPage.tsx`** — Withdrawals table:
   - Amount cell: change `text-white` to `text-gray-900`
   - Wallet/Bank Details cell: for crypto withdrawals (where `cryptoMatch` is truthy), add a small copy button after the address text:
     ```tsx
     <button onClick={() => navigator.clipboard.writeText(cryptoMatch[2])} className="text-xs text-blue-600 hover:underline ml-1">Copy</button>
     ```
   - User column: add a new `<td>` showing the user's name+email. Look up the user by matching `String(w.owner)` against `users` array: `users.find(([p]) => String(p) === String(w.owner))`

5. **`src/frontend/src/pages/AdminPage.tsx`** — Deposits table:
   - Replace the `Account ID` column with a `User` column showing name + email looked up from `users` state
   - Amount cell: change `text-white` to `text-gray-900`

6. **`src/frontend/src/pages/AdminPage.tsx`** — Crypto Deposits tab:
   - Fix status detection: the current code checks `dep.status?.pending != null`. The backend may return the string directly. Add a fallback: `const statusStr = dep.status?.pending != null ? "pending" : dep.status?.approved != null ? "approved" : dep.status?.rejected != null ? "rejected" : String(dep.status) === CryptoDepositStatus.pending ? "pending" : String(dep.status) === CryptoDepositStatus.approved ? "approved" : "rejected";`
   - Show user name/email: look up from `users` by `String(dep.owner)` and show name if found, else show short principal
