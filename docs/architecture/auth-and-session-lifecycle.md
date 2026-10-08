# Auth and session lifecycle

## Pieces

| Piece | File | Role |
|---|---|---|
| Supabase client | `supabase/database.ts` | Holds the session, persisted in Expo SecureStore, auto-refreshes tokens |
| Auth client | `src/lib/auth-client.ts` | Thin wrapper over `supabase.auth` with timeouts |
| Auth store | `src/stores/authStore.ts` | Zustand store (`user`, `session`, `isAuthenticated`, `isLoading`, `signIn`, `signUp`, `signOut`, `checkAuth`), persisted to MMKV under `auth-storage` |
| Auth provider | `src/components/AuthProvider.tsx` | Runs `checkAuth` at launch; listens to `onAuthStateChange`; makes sure a profile row exists |
| Route guards | `src/app/index.tsx`, `src/app/(app)/_layout.tsx`, `src/app/(auth)/_layout.tsx` | Send signed-out users to login and signed-in users to HQ |

## Sign-up

1. Signup screen validates (name, email, 8+ character passphrase, matching confirmation) and calls `authStore.signUp(email, password, name)`.
2. Supabase creates the auth user with `name` in its metadata. The `handle_new_user` trigger (migration 001) creates the `user_profiles` row.
3. Email confirmation is off locally (`supabase/config.toml`), so the user is signed in immediately.

## Sign-in and launch

1. `AuthProvider` calls `checkAuth()`, which reads the stored session. A 4.5-second guard stops the loading state from hanging if SecureStore is slow.
2. `onAuthStateChange` fires `SIGNED_IN` / `INITIAL_SESSION`; the provider copies the user and session into the store, then calls `db.ensureUserProfile` **deferred with `setTimeout(…, 0)`**.
3. The guards redirect once `isLoading` is false.

> **Never `await` a Supabase call inside the `onAuthStateChange` callback.** Supabase holds its auth lock while the callback runs; a query inside it waits for the same lock, and every later `getSession` times out. This made the app sign itself out until it was fixed.

## Sign-out

`authStore.signOut()` calls `supabase.auth.signOut()` and clears the store even if that call fails, then the guards send the user to login.

## Known issues

- **Session size.** The Supabase session is larger than SecureStore's 2KB recommendation and logs a warning. Spec `VerifiedSpecs/03-mmkv-encryption-hardening.md` covers moving it to encrypted MMKV.
- **Stale sessions.** If the auth user behind a stored session is deleted (e.g. after `supabase db reset`), the app still thinks it's signed in until the next failed call. Sign out and back in.
- **Simulator keychain prompt.** iOS asks to save or update the password after sign-in and sign-up. That's the OS, not the app.
