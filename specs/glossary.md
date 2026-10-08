# Glossary

Domain terms as they appear in the app (UI wording in quotes) and in code and the database. Status values here must match the database constraints in `supabase/migrations/005_game_engine.sql`.

## People

| Term | Meaning | In code |
|---|---|---|
| **Agent** | A player in an operation. | a `user_games` row |
| **Host** | The agent who opened the operation. Plays like everyone else, and can start or end it. | `user_games.role = 'host'`, `games.host_user_id` |
| **Target** | The agent you are trying to eliminate. Exactly one at a time. | `assignments.target_user_id` where you are the `assassin_user_id` and `status = 'active'` |

## The game

| Term | Meaning | In code |
|---|---|---|
| **Operation** ("Op.", "case file") | One game, from lobby to debrief. | a `games` row |
| **File number** / **code** | The six-character code agents use to join. Never contains O, 0, I or 1. | `games.code` |
| **Lobby** | Before the start: agents join, nobody has a target. | `games.status = 'lobby'` |
| **Target chain** | At the start every agent is given the next agent in a random circle as their target, so everyone is hunted by exactly one agent. | `assignments`, created by `start_game` |
| **Codeword** | A word you must get your target to say. You hold several; any one counts. | an `agent_words` row |
| **Word bank** | The shared pool codewords are drawn from, tiered hard / medium / easy. | `word_bank.difficulty` 1 / 2 / 3 |
| **Daily issue** | Each day of the operation every surviving agent gets one more codeword: hard on day 1, medium on day 2, easy from day 3. | `agent_words.granted_day`, issued by `_grant_daily_words` |
| **Day** | 1-based day of the operation, counted from the start. | `my_mission().game.day` |
| **Kill report** ("Report elimination", "Form K-1") | An agent's claim that their target said one of their words. Names the word. One pending report at a time. | an `eliminations` row with `confirmation_status = 'pending'` |
| **Confirm** ("Confirm — I said it") | The target agrees: they are eliminated. | `respond_to_elimination(…, true)` |
| **Dispute** | The target denies it: the report is voided and nothing changes. | `respond_to_elimination(…, false)` → `rejected` |
| **Inheritance** | On a confirmed kill the killer takes the victim's target and all the victim's codewords. | `agent_words.inherited_from`, new `assignments` row |
| **Eliminated** ("You've been made", the red stamp) | Out of the operation. You keep watching the feed. | `user_games.status = 'eliminated'` |
| **Intel feed** | The list of confirmed kills. Shows the word only to the killer and the victim. | `game_board().feed` |
| **Last agent standing** | The winner: the agent whose inherited target turns out to be themselves. | `completion_reason = 'last_agent_standing'`, `game_results.winner_user_id` |
| **Debrief** | The end screen: winner and final standings. | `DebriefView` |

## Status values

| Field | Values |
|---|---|
| `games.status` | `lobby` → `active` → `ended`; `canceled` is reserved |
| `games.completion_reason` | `last_agent_standing`, `time_up`, `host_ended` |
| `user_games.role` | `host`, `player` |
| `user_games.status` | `active`, `eliminated`, `left` |
| `assignments.status` | `active` (current), `succeeded` (you got them), `reassigned` (your target was taken by your killer), `void` (game ended) |
| `eliminations.confirmation_status` | `pending`, `confirmed`, `rejected` (disputed), `expired` (game ended, or the reporting agent was eliminated first) |

## UI-only words

| UI | Means |
|---|---|
| HQ | The home tab |
| Agent (tab) / Personnel file | Your profile |
| Case files | Your list of operations |
| Enlist / Form 27-B | Sign up |
| Stamps: Waiting / Active / Closed | `lobby` / `active` / `ended` |
