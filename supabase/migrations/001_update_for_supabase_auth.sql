-- Migration: Update schema for Supabase authentication
-- This migration sets up the database to work with Supabase Auth

-- Drop existing tables if they exist (Better-Auth tables)
DROP TABLE IF EXISTS verification_tokens CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing user_profiles table (since it has incompatible data)
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table with correct structure for Supabase Auth
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT,
  phone VARCHAR(256),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create games table
CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create user_games table
CREATE TABLE user_games (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  score INTEGER,
  played_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add foreign key constraints to reference auth.users
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_games 
ADD CONSTRAINT user_games_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_games ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for games (public read, admin write)
CREATE POLICY "Anyone can view games" ON games
  FOR SELECT USING (true);

-- Create RLS policies for user_games
CREATE POLICY "Users can view their own game records" ON user_games
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game records" ON user_games
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game records" ON user_games
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own game records" ON user_games
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_games_user_id ON user_games(user_id);
CREATE INDEX idx_user_games_game_id ON user_games(game_id);

-- Create a function to automatically create a user profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 
