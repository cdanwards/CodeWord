# Elimination & Game Completion Features

## Overview

This document outlines the implementation of the elimination system and game completion features for CodewordApp. These features enable the core gameplay mechanics where players eliminate targets and games reach completion.

## User Stories

### Elimination Flow

- **As a player in an active game**, I can see my current target and attempt to eliminate them
- **As a player**, I can confirm when I've been eliminated by another player
- **As a player**, I can see elimination history and game progress
- **As a host**, I can monitor elimination activity and game state

### Game Completion

- **As a player**, I can see when a game has ended and view final results
- **As a host**, I can end a game early and view final standings
- **As a player**, I can see my performance and placement in completed games

## Requirements

### Functional Requirements

#### 1. Target Assignment Display

- Players must see their current target (name, role, any hints)
- Target information updates when eliminations occur
- Clear indication when no target is assigned

#### 2. Elimination Attempt Flow

- "Eliminate Target" button visible only in active games
- Button triggers elimination confirmation process
- Requires target player confirmation for elimination to be recorded
- Elimination includes optional notes/context

#### 3. Elimination Confirmation System

- Target player receives elimination request
- Target must confirm elimination (not just acknowledge)
- Confirmation includes verification of the elimination method
- Both players see confirmation status

#### 4. Game Completion Handling

- Games automatically end when time expires
- Host can manually end games early
- Final results show all eliminations, survivors, and rankings
- Completed games move to "ended" status

#### 5. Results & History

- Elimination timeline with timestamps
- Final player standings
- Game statistics (total eliminations, survival time, etc.)

### Non-Functional Requirements

- Real-time updates for elimination status
- Secure confirmation system (prevents false eliminations)
- Performance: handle games with many players
- Mobile-friendly confirmation UI

## Technical Design

### Database Updates

#### New Tables

```sql
-- Elimination confirmations
CREATE TABLE elimination_confirmations (
  id SERIAL PRIMARY KEY,
  elimination_id INTEGER REFERENCES eliminations(id),
  target_user_id UUID NOT NULL,
  confirmed_at TIMESTAMP,
  confirmation_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Game results
CREATE TABLE game_results (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id),
  winner_user_id UUID,
  final_standings JSONB,
  game_duration_hours INTEGER,
  total_eliminations INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Schema Updates

```sql
-- Add confirmation_required to eliminations
ALTER TABLE eliminations ADD COLUMN confirmation_required BOOLEAN DEFAULT TRUE;
ALTER TABLE eliminations ADD COLUMN confirmation_status TEXT DEFAULT 'pending';

-- Add completion_reason to games
ALTER TABLE games ADD COLUMN completion_reason TEXT;
```

### API Endpoints

#### Elimination Management

- `POST /api/eliminations/attempt` - Initiate elimination
- `POST /api/eliminations/confirm` - Confirm elimination
- `GET /api/eliminations/pending` - Get pending confirmations
- `GET /api/eliminations/game/:id` - Get game eliminations

#### Game Completion

- `POST /api/games/:id/end` - End game manually
- `GET /api/games/:id/results` - Get final results
- `GET /api/games/completed` - Get completed games list

### State Management

#### Elimination Store

```typescript
interface EliminationState {
  pendingConfirmations: EliminationConfirmation[]
  currentTarget: UserGame | null
  eliminationHistory: Elimination[]
  isConfirming: boolean
}
```

#### Game Completion Store

```typescript
interface GameCompletionState {
  completedGames: Game[]
  gameResults: Record<number, GameResult>
  isEndingGame: boolean
}
```

## UI Components

### 1. Target Card

- Display current target information
- "Eliminate Target" button
- Target status (active, eliminated, etc.)

### 2. Elimination Modal

- Confirmation of elimination attempt
- Notes/context input
- Submit elimination request

### 3. Confirmation Request

- Notification when elimination is requested
- Confirmation form with verification
- Accept/Reject actions

### 4. Game Results Screen

- Final standings table
- Elimination timeline
- Game statistics
- Share results option

### 5. Elimination History

- Chronological list of eliminations
- Player details and timestamps
- Filtering and search options

## User Flow Diagrams

### Elimination Flow

```
Player A → Eliminate Target → Target Player B
    ↓                           ↓
Request Sent → Confirmation Required → Player B Confirms
    ↓                           ↓
Elimination Recorded → Game State Updated → New Targets Assigned
```

### Game Completion Flow

```
Game Active → Time Expires/Manual End → Calculate Results
    ↓                           ↓
Update Status → Generate Final Standings → Show Results Screen
    ↓                           ↓
Archive Game → Update Player Stats → Notify All Players
```

## Implementation Phases

### Phase 1: Core Elimination System

- [ ] Update database schema
- [ ] Implement elimination attempt API
- [ ] Create elimination confirmation flow
- [ ] Basic elimination recording

### Phase 2: Target Management

- [ ] Target assignment system
- [ ] Target display components
- [ ] Target update logic

### Phase 3: Game Completion

- [ ] Game ending logic
- [ ] Results calculation
- [ ] Results display components

### Phase 4: Polish & Real-time

- [ ] Real-time updates
- [ ] UI polish
- [ ] Performance optimization

## Acceptance Criteria

### Elimination System

- [ ] Players can see their current target
- [ ] Elimination attempts require target confirmation
- [ ] Eliminations are recorded with proper metadata
- [ ] Target assignments update after eliminations
- [ ] Elimination history is displayed correctly

### Game Completion

- [ ] Games automatically end when time expires
- [ ] Host can manually end games
- [ ] Final results are calculated and displayed
- [ ] Completed games are properly archived
- [ ] Player statistics are updated

### User Experience

- [ ] Clear elimination flow with confirmation
- [ ] Intuitive target information display
- [ ] Smooth game completion experience
- [ ] Comprehensive results and history views
