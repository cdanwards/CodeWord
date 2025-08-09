## Design

### Architecture

- Expo Router app with two route groups:
  - `(auth)`: `login.tsx`, `signup.tsx`
  - `(app)`: tabbed `home.tsx`, `games.tsx`, `profile.tsx`
- Root wrappers: `ThemeProvider`, `AuthProvider`, i18n init, fonts
- State: Zustand `authStore` persisted to MMKV; hooks in `src/stores/hooks.ts`
- Auth: `src/lib/auth-client.ts` wraps Supabase client
- DB: `src/lib/database.ts` provides typed helpers for `user_profiles`, `games`, `user_games`

### Data model (Supabase)

- `auth.users` managed by Supabase Auth
- Public tables:
  - `user_profiles(id, user_id, full_name, phone, avatar_url, bio, created_at, updated_at)`
  - `games(id, name, description, created_at, updated_at)`
  - `user_games(id, user_id, game_id, score, played_at, created_at)`
- RLS policies restrict rows to the current user where appropriate

### Routing and guards

- `src/app/index.tsx` redirects to `(auth)/login` when `!isAuthenticated`, otherwise to `/home`
- `AuthProvider` listens to `onAuthStateChange` and sets `user` + `session`

### Components & UX

- Login/Signup: simple forms with validation and Alert-based errors
- Profile: displays user info and sign out action
- Games: empty state and entry point for joining by code (to be implemented)

### Environment / config

- Supabase URL and anon key injected via `app.config.ts` `extra`
- API layer (Apisausage) remains generic for future backend needs

### Open decisions

- Game code scheme and validation (e.g., 6-char alphanumeric)
- How users discover or create games (out of current scope)
- Password reset strategy (Magic Link vs. OTP)
