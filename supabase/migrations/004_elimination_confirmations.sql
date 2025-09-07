-- Migration: Add elimination confirmation system
-- This migration adds support for two-player elimination confirmation
-- and improves the elimination tracking system for multiple eliminations

-- Add confirmation fields to eliminations table
ALTER TABLE eliminations 
ADD COLUMN confirmation_required BOOLEAN DEFAULT TRUE,
ADD COLUMN confirmation_status TEXT DEFAULT 'pending' CHECK (confirmation_status IN ('pending', 'confirmed', 'rejected', 'expired')),
ADD COLUMN confirmation_deadline TIMESTAMP,
ADD COLUMN elimination_method TEXT,
ADD COLUMN target_notes TEXT,
ADD COLUMN elimination_round INTEGER DEFAULT 1;

-- Create elimination confirmations table
CREATE TABLE elimination_confirmations (
  id SERIAL PRIMARY KEY,
  elimination_id INTEGER NOT NULL REFERENCES eliminations(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confirmed_at TIMESTAMP,
  confirmation_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one confirmation per elimination
  UNIQUE(elimination_id, target_user_id)
);

-- Create game results table for completed games
CREATE TABLE game_results (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  winner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  final_standings JSONB NOT NULL DEFAULT '[]',
  game_duration_hours INTEGER NOT NULL,
  total_eliminations INTEGER NOT NULL DEFAULT 0,
  completion_reason TEXT,
  completed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one result per game
  UNIQUE(game_id)
);

-- Add completion reason to games table
ALTER TABLE games 
ADD COLUMN completion_reason TEXT;

-- Create indexes for performance
CREATE INDEX idx_eliminations_confirmation_status ON eliminations(confirmation_status);
CREATE INDEX idx_eliminations_game_status ON eliminations(game_id, confirmation_status);
CREATE INDEX idx_eliminations_round ON eliminations(game_id, elimination_round);
CREATE INDEX idx_elimination_confirmations_target ON elimination_confirmations(target_user_id);
CREATE INDEX idx_elimination_confirmations_pending ON elimination_confirmations(elimination_id) WHERE confirmed_at IS NULL;

-- Add RLS policies for elimination confirmations
ALTER TABLE elimination_confirmations ENABLE ROW LEVEL SECURITY;

-- Users can view confirmations they're involved in
CREATE POLICY "Users can view their own confirmations" ON elimination_confirmations
  FOR SELECT USING (auth.uid() = target_user_id);

-- Users can update confirmations they're involved in
CREATE POLICY "Users can update their own confirmations" ON elimination_confirmations
  FOR UPDATE USING (auth.uid() = target_user_id);

-- Users can insert confirmations for themselves
CREATE POLICY "Users can insert their own confirmations" ON elimination_confirmations
  FOR INSERT WITH CHECK (auth.uid() = target_user_id);

-- Add RLS policies for game results
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

-- Users can view results for games they participated in
CREATE POLICY "Users can view results for their games" ON game_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_games 
      WHERE user_games.user_id = auth.uid() 
      AND user_games.game_id = game_results.game_id
    )
  );

-- Only game hosts can insert/update results
CREATE POLICY "Hosts can manage game results" ON game_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_games 
      WHERE user_games.user_id = auth.uid() 
      AND user_games.game_id = game_results.game_id
      AND user_games.role = 'host'
    )
  );

-- Create function to automatically expire old confirmations
CREATE OR REPLACE FUNCTION expire_old_confirmations()
RETURNS void AS $$
BEGIN
  -- Update eliminations where confirmation deadline has passed
  UPDATE eliminations 
  SET confirmation_status = 'expired'
  WHERE confirmation_status = 'pending' 
    AND confirmation_deadline IS NOT NULL 
    AND confirmation_deadline < NOW();
    
  -- Update elimination_confirmations for expired eliminations
  UPDATE elimination_confirmations 
  SET updated_at = NOW()
  WHERE elimination_id IN (
    SELECT id FROM eliminations WHERE confirmation_status = 'expired'
  );
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically set confirmation deadline
CREATE OR REPLACE FUNCTION set_elimination_deadline()
RETURNS TRIGGER AS $$
BEGIN
  -- Set deadline to 24 hours from now for new eliminations
  NEW.confirmation_deadline = NOW() + INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_elimination_deadline
  BEFORE INSERT ON eliminations
  FOR EACH ROW
  EXECUTE FUNCTION set_elimination_deadline();

-- Create function to handle target reassignment after elimination
CREATE OR REPLACE FUNCTION reassign_targets_after_elimination()
RETURNS TRIGGER AS $$
DECLARE
  current_round INTEGER;
  next_round INTEGER;
  active_players_count INTEGER;
BEGIN
  -- Only proceed if this is a confirmed elimination
  IF NEW.confirmation_status != 'confirmed' THEN
    RETURN NEW;
  END IF;
  
  -- Get current round number
  SELECT COALESCE(MAX(elimination_round), 1) INTO current_round
  FROM eliminations 
  WHERE game_id = NEW.game_id;
  
  -- Count remaining active players
  SELECT COUNT(*) INTO active_players_count
  FROM user_games 
  WHERE game_id = NEW.game_id 
    AND status = 'active' 
    AND eliminated_at IS NULL;
  
  -- If only one player remains, end the game
  IF active_players_count = 1 THEN
    UPDATE games 
    SET status = 'ended', 
        ended_at = NOW(),
        completion_reason = 'last_player_standing'
    WHERE id = NEW.game_id;
    RETURN NEW;
  END IF;
  
  -- If we have enough players, reassign targets for the next round
  IF active_players_count >= 2 THEN
    next_round := current_round + 1;
    
    -- Create new assignments for the next round
    -- This is a simplified version - in practice you might want more sophisticated logic
    INSERT INTO assignments (game_id, assassin_user_id, target_user_id, round, status)
    SELECT 
      NEW.game_id,
      ug1.user_id,
      ug2.user_id,
      next_round,
      'active'
    FROM user_games ug1
    CROSS JOIN user_games ug2
    WHERE ug1.game_id = NEW.game_id 
      AND ug2.game_id = NEW.game_id
      AND ug1.status = 'active' 
      AND ug2.status = 'active'
      AND ug1.user_id != ug2.user_id
      AND NOT EXISTS (
        SELECT 1 FROM assignments a 
        WHERE a.game_id = NEW.game_id 
          AND a.round = next_round
          AND a.assassin_user_id = ug1.user_id
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reassign_targets_after_elimination
  AFTER UPDATE ON eliminations
  FOR EACH ROW
  WHEN (OLD.confirmation_status != 'confirmed' AND NEW.confirmation_status = 'confirmed')
  EXECUTE FUNCTION reassign_targets_after_elimination();

-- Create function to update game status when all players are eliminated
CREATE OR REPLACE FUNCTION check_game_completion()
RETURNS TRIGGER AS $$
DECLARE
  active_players_count INTEGER;
  total_players_count INTEGER;
BEGIN
  -- Count active players in the game
  SELECT COUNT(*) INTO active_players_count
  FROM user_games 
  WHERE game_id = NEW.game_id 
    AND status = 'active' 
    AND eliminated_at IS NULL;
    
  -- Count total players in the game
  SELECT COUNT(*) INTO total_players_count
  FROM user_games 
  WHERE game_id = NEW.game_id;
  
  -- If only one player remains active, end the game
  IF active_players_count = 1 THEN
    UPDATE games 
    SET status = 'ended', 
        ended_at = NOW(),
        completion_reason = 'last_player_standing'
    WHERE id = NEW.game_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_game_completion
  AFTER UPDATE ON user_games
  FOR EACH ROW
  WHEN (OLD.eliminated_at IS NULL AND NEW.eliminated_at IS NOT NULL)
  EXECUTE FUNCTION check_game_completion();

-- Create function to initialize first round of assignments when game starts
CREATE OR REPLACE FUNCTION initialize_game_assignments()
RETURNS TRIGGER AS $$
DECLARE
  player_count INTEGER;
  assignments_created INTEGER := 0;
BEGIN
  -- Only proceed if game is being started
  IF OLD.status != 'active' AND NEW.status = 'active' THEN
    -- Count players in the game
    SELECT COUNT(*) INTO player_count
    FROM user_games 
    WHERE game_id = NEW.id 
      AND status = 'active';
    
    -- Create initial assignments if we have at least 2 players
    IF player_count >= 2 THEN
      -- Create a circular assignment chain
      WITH player_list AS (
        SELECT user_id, ROW_NUMBER() OVER (ORDER BY joined_at) as rn
        FROM user_games 
        WHERE game_id = NEW.id 
          AND status = 'active'
        ORDER BY joined_at
      )
      INSERT INTO assignments (game_id, assassin_user_id, target_user_id, round, status)
      SELECT 
        NEW.id,
        p1.user_id,
        p2.user_id,
        1,
        'active'
      FROM player_list p1
      JOIN player_list p2 ON p2.rn = (p1.rn % player_count) + 1;
      
      GET DIAGNOSTICS assignments_created = ROW_COUNT;
      
      -- Log the assignments created
      RAISE NOTICE 'Created % initial assignments for game %', assignments_created, NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_initialize_game_assignments
  AFTER UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION initialize_game_assignments();
