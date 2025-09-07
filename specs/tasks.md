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
- [x] Wire Games list screen to list current `user_games` for the user; add Create/Join actions (reachable from Home)
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

### 7. Elimination System & Game Completion

#### Phase 1: Core Elimination System

- [ ] Update database schema for elimination confirmations
- [ ] Implement elimination attempt API endpoints
- [ ] Create elimination confirmation flow
- [ ] Basic elimination recording and status tracking

#### Phase 2: Target Management

- [ ] Implement target assignment system
- [ ] Create target display components
- [ ] Add target update logic after eliminations
- [ ] Display current target in game detail screen

#### Phase 3: Game Completion

- [ ] Implement game ending logic (automatic and manual)
- [ ] Create results calculation system
- [ ] Build game results display components
- [ ] Add completed games handling

#### Phase 4: Polish & Real-time

- [ ] Add real-time updates for eliminations
- [ ] Polish elimination UI components
- [ ] Optimize performance for large games
- [ ] Add elimination history and statistics

### Backend / DB Helpers

- [ ] Update `getGameMembers` to join `user_profiles` + `auth.users`.
- [ ] Add `getMyTarget(gameId, userId)`.
- [ ] Add `listEliminations(gameId)`.
- [ ] Add `startGame(id)`, `endGame(id)`.
- [ ] Add `leaveGame(gameId, userId)` + `deleteGame(gameId)` guards.
- [ ] (Optional) Auto-seed words on game creation.
- [ ] **NEW**: Add `attemptElimination(gameId, killerId, targetId, notes)`.
- [ ] **NEW**: Add `confirmElimination(eliminationId, targetId, notes)`.
- [ ] **NEW**: Add `getPendingConfirmations(userId)`.
- [ ] **NEW**: Add `calculateGameResults(gameId)`.

### UI Features

- [ ] **Home tab:** top bar + greeting; large "Enter Code" and "Create Game" buttons; conditional "Resume Game" card; link to "View all games."
- [ ] **Games List (from Home):** show join code with Copy/Share, status chip, time remaining.
- [ ] **Game Detail:**
  - Members list w/ names + roles.
  - Host start/end controls + countdown timer.
  - Target card + eliminations feed.
  - Leave/Delete buttons.
  - Empty-state components for sections.
  - **NEW**: Current target display with "Eliminate Target" button.
  - **NEW**: Elimination confirmation modals.
  - **NEW**: Game results view for completed games.

- [ ] **Create Game Modal:** post-success sheet w/ code + Copy/Share.
- [ ] **Join Game Modal:** post-success sheet, clean styles, good error messages.
- [ ] **Profile tab:** enable display name/codename editing + persist; sections for Account, Stats, Achievements, Game History, Settings.
- [ ] **All Screens:** add toasts, polish empty/error states, remove debug colors.

### Design References

- Link: `specs/design/inspiration.md` contains annotated inspiration for Games List, Home, and activity sections to guide UI polish and acceptance criteria.

### Polish

- [ ] Implement global Copy/Share utility.
- [ ] Implement Toast component for success messages.
- [ ] Add pull-to-refresh behavior on Games list + Game detail.

_Last updated: 2025-08-31_
