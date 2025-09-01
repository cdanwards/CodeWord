## CodewordApp Requirements

Status (current)

- Auth screens and session management working
- Supabase schema for games implemented (games, user_games, game_words, assignments, eliminations) with RLS
- Migrations applied locally and to remote
- DB helpers in place: list games, find by code, join by code, words/assignments/eliminations CRUD
- UI for games (create/join/detail) pending

### Scope (current milestone)

- Authentication via Supabase: email/password sign up, sign in, sign out
- Route protection: unauthenticated users see auth screens only; authenticated users see app tabs only
- Tabs reduced to two: Home and Profile
- Home tab (MVP):
  - Prominent actions to Enter Code and Create Game
  - If a game is active, show a Resume Game card
  - Optional link to view All Games (navigates to a non-tab stack screen)
- Profile tab (MVP): view basic account info; ensure a profile row exists on first sign-in
- Games (MVP):
  - Create a game (host) with name/description/duration → generates a code
  - Join a game by code
  - View my games list (as a screen reachable from Home) and navigate to a game detail screen
- Internationalization and theming: continue working as-is
- Basic error handling and loading states

### User stories

- As a visitor, I can create an account with name, email, and password, so I can access the app
  - Acceptance: form validates; on success I land in the app tabs; errors are shown inline/alerts

- As a user, I can sign in with email and password, so I can resume
  - Acceptance: invalid credentials show an error; successful login redirects to home

- As a user, I can sign out from the profile screen, so I can switch accounts
  - Acceptance: confirmation prompt; after sign out I’m redirected to the login screen

- As a user, I can view my profile info (name, email, created date), so I can confirm my account details
  - Acceptance: if I have no profile row yet, it’s created automatically

- As a host, I can create a game with a name and duration, so others can join
  - Acceptance: on create, I see the generated code and the game appears in my list immediately

- As a user, I can see my joined games, so I know what I’m part of
  - Acceptance: if no games, I see an empty state

- As a user, I can enter a game code to join a game, so I can play with others
  - Acceptance: invalid codes error; valid codes add a `user_games` row and the list refreshes

- As a user, I cannot access app tabs unless I’m authenticated
  - Acceptance: direct-linking to app routes redirects to login when not authenticated

### Non-functional

- Type-safe code (TypeScript strict where feasible)
- Persisted auth session (MMKV); auto-refresh via Supabase
- Minimal logging in production; no secrets hardcoded in the client
- Tests: unit coverage for utilities and store; smoke tests for i18n
- Environment variables managed in `.env` (see `.env.example`)

### Out of scope (later)

- Password reset and email verification flows
- In-game real-time features (live assignments/eliminations)
- Analytics and monitoring

# 📄 `specs/requirements.md`

_Last updated: 2025-08-31_

## MVP Acceptance Criteria

### Home tab

- [ ] Top bar shows app name “Codeword” and a personalized greeting.
- [ ] Prominent buttons for “Enter Code” and “Create Game.”
- [ ] If a game is active, a card displays the game title and status with a “Resume Game” CTA.
- [ ] Optional: link to “View all games” that navigates to a non-tab Games screen.
- [ ] Empty state for first-time users highlights Enter Code.

### Games (screen reachable from Home)

- [ ] User sees all their games with name, description, status, role, and code.
- [ ] Copy/share code works from the list.
- [ ] Status chip correct for lobby/active/ended.
- [ ] Active games show time remaining.
- [ ] Tapping navigates to `/game/[id]`.

### Game Detail

- [ ] Members list shows **display name + role** (not game name).
- [ ] Host can **start/end game**.
- [ ] All players see **countdown timer**.
- [ ] Each player sees **“Your Target”** (or placeholder if not assigned).
- [ ] Eliminations list shows **killer, target, word, timestamp**.
- [ ] Players can **leave lobby**.
- [ ] Host can **delete game** before active.
- [ ] Empty-state messaging for members, words, eliminations.
- [ ] Words listed per game (auto-seed or host-managed).

### Create Game

- [ ] After create, user sees **confirmation with join code**, Copy + Share.
- [ ] Optional: auto-seed default word set.

### Join Game

- [ ] After join, success sheet shows: **“Joined GameName”**, Copy + Share code, “Go to Game.”
- [ ] Good error states for invalid code, already joined.
- [ ] Debug styles removed.

### Profile tab

- [ ] Header shows avatar (editable), display name/codename, and a short tagline like “Agent since [date].”

- Account
  - [ ] Username / codename is editable and persists.
  - [ ] Email shown (from Supabase); not editable here.
  - [ ] Change password and Sign out actions available (password may deep-link to Supabase flow).

- Stats
  - [ ] Total games played displayed.
  - [ ] Eliminations achieved displayed.
  - [ ] Survival streak (longest without elimination) displayed.
  - [ ] Words successfully used displayed.
  - [ ] Win count displayed (if applicable to ruleset).

- Achievements / Badges
  - [ ] Achievements list with simple icons and tooltips (e.g., “Silent Assassin,” “Wordsmith,” “Agent Veteran”).

- Game History
  - [ ] List of completed games with game name, completion date, and placement/eliminations.

- Settings
  - [ ] Theme toggle (light/dark, e.g., “Espionage Mode”).
  - [ ] Notification preferences (game updates, eliminations).
  - [ ] Privacy options (visibility of stats/achievements to other players).

### Cross-Cutting

- [ ] Toasts for success, inline text for errors.
- [ ] Empty states for Home, Games, Game Detail sections.
- [ ] Copy/share helpers wherever a code appears.
- [ ] Pull-to-refresh (or refetch on focus) acceptable in place of realtime.

### Ending the game

- [ ] When the end time is reached, the game is ended and the host can see the results.
- [ ] The Status should be updated to "Ended"
- [ ] Players should no longer be able to interact with other players.
- [ ] The host should be able to see the results of the game.
- [ ] The players should be able to see the results of the game.

## Game concept (for onboarding copy)

Codeword is a game where agents eliminate other agents by getting them to say a specific word in conversation. When the target says the word, they are eliminated, and the hitperson receives the eliminated player’s target as their new target. The Home tab introduces this concept and lets users start or resume a game quickly.
