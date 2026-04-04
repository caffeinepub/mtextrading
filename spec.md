# Mtextrading — Fix: Order Placement, Session Persistence, Duplicate Demo Account

## Current State
- Trade orders fail with "instrument not found" when the actor used to place the order is anonymous (no email identity loaded) or the catch block silently sets instrumentId to BigInt(0)
- App.tsx always starts at page="landing" on refresh — no localStorage check to restore session to "dashboard"
- useActor hook only uses useInternetIdentity (not email identity), so email-logged-in users get an anonymous actor on refresh
- RegisterPage.tsx calls createDemoAccount() after saveCallerUserProfile — the backend saveCallerUserProfile already auto-creates a demo account, causing duplicates

## Requested Changes (Diff)
### Add
- Session restore in App.tsx: on mount, check localStorage for mtex_current_email and mtex_logged_in flag — if present, start at page="dashboard" instead of "landing"
- useActor hook: check useEmailAuth identity first before useInternetIdentity, so email-logged-in users get a proper actor after refresh

### Modify
- RegisterPage.tsx: remove the explicit createDemoAccount() call after saveCallerUserProfile (backend already handles this)
- DashboardPage.tsx: in handlePlaceOrder, if getInstrumentBySymbol/createInstrument throws, show a proper error toast instead of silently falling back to BigInt(0) which causes the "instrument not found" error
- LoginPage.tsx: when login succeeds, set a "mtex_logged_in" flag in localStorage
- DashboardPage.tsx: on logout, clear "mtex_logged_in" from localStorage

### Remove
- The fallback `instrumentId = BigInt(0)` in the catch block of handlePlaceOrder

## Implementation Plan
1. Modify useActor.ts to use emailAuth.identity when available (before InternetIdentity)
2. Modify App.tsx to restore session page from localStorage on mount
3. Modify RegisterPage.tsx to remove the duplicate createDemoAccount() call
4. Modify DashboardPage.tsx to not fall back to BigInt(0) — throw a clear error instead
5. Ensure LoginPage sets mtex_logged_in flag in localStorage on successful login
6. Ensure logout clears mtex_logged_in from localStorage
