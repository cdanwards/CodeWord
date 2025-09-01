## Design

### Architecture

- Expo Router app with two route groups:
  - `(auth)`: `login.tsx`, `signup.tsx`
  - `(app)`: tabbed `home.tsx`, `profile.tsx`
- Games list becomes a non-tab screen reachable from Home (e.g., `home/games.tsx` or a stack route under `(app)`).
- Root wrappers: `ThemeProvider`, `AuthProvider`, i18n init, fonts
- State: Zustand `authStore` persisted to MMKV; hooks in `src/stores/hooks.ts`
- Auth: `src/lib/auth-client.ts` wraps Supabase client
- DB: `src/lib/database.ts` provides typed helpers for `user_profiles`, `games`, `user_games`, `game_words`, `assignments`, `eliminations`

### Data model (Supabase)

- `auth.users` managed by Supabase Auth
- Public tables:
  - `user_profiles(id, user_id, full_name, phone, avatar_url, bio, created_at, updated_at)`
  - `games(id, name, description, code, host_user_id, status, started_at, ended_at, duration_hours, settings, created_at, updated_at)`
  - `user_games(id, user_id, game_id, score, role, is_ready, status, joined_at, eliminated_at, left_at, played_at, created_at)`
  - `game_words(id, game_id, word, day_number, available_at, created_at)`
  - `assignments(id, game_id, assassin_user_id, target_user_id, word_id, round, status, created_at, resolved_at)`
  - `eliminations(id, game_id, assignment_id, killer_user_id, victim_user_id, notes, occurred_at)`
- RLS policies restrict rows to the current user where appropriate

### Routing and guards

- `src/app/index.tsx` redirects to `(auth)/login` when `!isAuthenticated`, otherwise to `/home`
- `(app)` has a Tab navigator with two tabs: Home and Profile
- Games list is a stack screen pushed from Home. Game Detail remains at `/game/[id]`.
- `AuthProvider` listens to `onAuthStateChange` and sets `user` + `session`

### Components & UX

- Login/Signup: simple forms with validation and Alert-based errors
- Home: top bar with app name "Codeword" and greeting; large buttons for Enter Code and Create Game; conditional Resume Game card; link to view all games
- Games List (from Home): list memberships; Copy/Share code; status/time remaining; tap to Game Detail
- Game Detail: shows members, words, and activity; host-only controls shown conditionally
- Profile: header with avatar (editable), display name/codename, tagline; sections for Account, Stats, Achievements, Game History, Settings as outlined in requirements

### Environment / config

- Supabase URL and anon key injected via `app.config.ts` `extra`
- API layer (Apisausage) remains generic for future backend needs

### Open decisions

- Game code scheme and validation (6-char alphanumeric; client-generated + uniqueness check for MVP)
- In-game real-time updates (realtime channels vs RPCs)
- Password reset strategy (Magic Link vs. OTP)

### References

- See `specs/design/inspiration.md` for annotated UI inspiration and component mapping.
