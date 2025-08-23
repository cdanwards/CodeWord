## Tasks

### 0. Repo hygiene

- [x] Fix TypeScript compile error by adding `drizzle-zod`
- [ ] Add `.env.local` guidance and remove placeholder Supabase anon key from `app.config.ts`
- [ ] CI: add type-check and test workflows

### 1. Auth polish

- [ ] Add inline error display on login/signup (beneath fields), not just Alerts
- [ ] Prevent double-submit; disable buttons with loading state
- [ ] Add password visibility toggles
- [ ] Implement forgot password flow via Supabase (send reset email)

### 2. Route protection hardening

- [ ] Guard `(app)` routes with a layout-level check that redirects when unauthenticated
- [ ] Add a splash/loading screen while session restores

### 3. Profile integration

- [ ] On successful auth, call `db.ensureUserProfile(user.id, { email, name })`
- [ ] Show profile fields from `user_profiles` (full name, avatar) and allow editing (UI only now)

### 4. Games MVP

- [x] Create a `CreateGameModal` (name, description optional, duration hours)
- [x] DB helper: `createGameHost({ name, description, durationHours })`
- [x] DB helper: `findGameByCode(code)` and `joinGameByCode(userId, code)`
- [x] Create a `JoinGameModal` with a code input
- [x] Wire `GamesScreen` to list current `user_games` for the user; add Create/Join actions
- [x] Add `GameDetailScreen` route `src/app/(app)/game/[id].tsx` (members, words, activity)
- [x] Add optimistic UI update on create/join

### 5. Developer experience

- [ ] Add `README` project-specific setup (Supabase env, running tests, scripts)
- [x] Add sample data seed script for `games` (`scripts/seed-game.js`)
- [ ] Add Reactotron usage notes and toggle

### 6. Tests

- [ ] Add unit tests for `authStore` actions (signIn, signOut, refreshSession)
- [ ] Add unit tests for DB helpers (mock supabase client), including `createGameHost` and join by code
- [ ] Add integration tests for login/signup screens (React Native Testing Library)
