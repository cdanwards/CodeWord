-- Add RLS policies for games to allow authenticated users to create and manage their own games

-- Enable RLS (if not already enabled)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert games where they are the host
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'games' AND policyname = 'Users can insert their own games'
  ) THEN
    CREATE POLICY "Users can insert their own games" ON games
      FOR INSERT WITH CHECK (auth.uid() = host_user_id);
  END IF;
END $$;

-- Allow hosts to update their games
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'games' AND policyname = 'Hosts can update their games'
  ) THEN
    CREATE POLICY "Hosts can update their games" ON games
      FOR UPDATE USING (auth.uid() = host_user_id) WITH CHECK (auth.uid() = host_user_id);
  END IF;
END $$;

-- Allow hosts to delete their games
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'games' AND policyname = 'Hosts can delete their games'
  ) THEN
    CREATE POLICY "Hosts can delete their games" ON games
      FOR DELETE USING (auth.uid() = host_user_id);
  END IF;
END $$;

