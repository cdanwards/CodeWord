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
- Profile: view basic account info; ensure a profile row exists on first sign-in
- Games (MVP):
  - Create a game (host) with name/description/duration → generates a code
  - Join a game by code
  - View my games list and navigate to a game detail screen
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
