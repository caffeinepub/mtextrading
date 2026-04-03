# Mtextrading

## Current State

- `useActor` hook only reads from `useInternetIdentity` -- email-registered users get an anonymous actor, which causes all backend calls to fail silently after login
- Login page calls `registerWithEmail` (not `loginWithEmail`) to get identity, but this happens AFTER the anonymous actor already tried to load data
- 30-minute inactivity session timeout is active in DashboardPage
- Admin `getAllUsers()` only returns users with completed profiles (in `userProfiles`), missing anyone who registered email+password but hasn't filled profile form
- Chat `sendChatMessage` silently swallows errors, so failures look like infinite loading
- No backend endpoint to list email-registered users without profiles

## Requested Changes (Diff)

### Add
- Backend: `getEmailRegistrations()` admin query returning all verified emails with their registration status
- `useActor` hook: support for email identity (read from `EmailAuthContext` when Internet Identity not present)

### Modify
- `useActor.ts`: check `useEmailAuth` identity in addition to `useInternetIdentity`; use whichever is present
- `LoginPage.tsx`: use `loginWithEmail` (not `registerWithEmail`) and store result so `useActor` picks it up on next render; navigate to dashboard and let `useActor` reactive re-render handle the actor
- `DashboardPage.tsx`: remove the 30-minute session timeout block entirely
- `FloatingChatButton.tsx`: show error toast on send failure instead of silent swallow
- `AdminPage.tsx`: call `getEmailRegistrations()` and merge with `getAllUsers()` results so incomplete-profile users appear in the Users tab

### Remove
- Session timeout logic (30-min inactivity auto-logout) from DashboardPage

## Implementation Plan

1. Add `getEmailRegistrations` to backend -- returns all verified emails for admin view
2. Fix `useActor.ts` to also check `useEmailAuth` identity; if Internet Identity is absent, use email identity
3. Fix `LoginPage.tsx` to call `loginWithEmail` which saves the identity to state; navigate to dashboard after
4. Remove session timeout from `DashboardPage.tsx`
5. Add error toast to `FloatingChatButton.tsx` send handler
6. Update `AdminPage.tsx` to fetch and merge email-only registrations into the Users list
