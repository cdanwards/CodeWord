# Supabase Authentication Migration

This document outlines the changes made to update the database schema for Supabase authentication.

## Overview

The original schema was set up for Better-Auth, but we're now using Supabase's built-in authentication system. This migration updates the database to work properly with Supabase Auth.

## Changes Made

### 1. Updated Schema (`supabase/schema.ts`)

- **Removed Better-Auth tables**: `users`, `accounts`, `sessions`, `verification_tokens`
- **Updated `user_profiles` table**: Now references `auth.users.id` (UUID) instead of custom users table
- **Added new tables**: `games` and `user_games` for game functionality
- **Updated types**: Removed Better-Auth types, added new types for the updated schema

### 2. SQL Migration (`supabase/migrations/001_update_for_supabase_auth.sql`)

This migration file:

- Drops the old Better-Auth tables
- Creates new tables with proper foreign key constraints to `auth.users`
- Enables Row Level Security (RLS) on all tables
- Creates RLS policies to ensure users can only access their own data
- Adds indexes for better performance
- Creates a trigger to automatically create user profiles when users sign up

### 3. Database Helper (`src/lib/database.ts`)

Created a comprehensive database helper that provides:

- User profile operations (CRUD)
- Game operations (CRUD)
- User game operations (CRUD)
- Utility functions for getting current user and ensuring profiles exist

## How to Apply the Migration

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_update_for_supabase_auth.sql`
4. Run the migration

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
supabase db push
```

### Option 3: Using Drizzle Kit

```bash
# Generate and apply migrations
npx drizzle-kit push
```

## Row Level Security (RLS) Policies

The migration sets up the following RLS policies:

### user_profiles

- Users can only view, insert, update, and delete their own profile
- Uses `auth.uid() = user_id` to ensure data isolation

### games

- Anyone can view games (public read access)
- Admin users would need additional policies for write access

### user_games

- Users can only view, insert, update, and delete their own game records
- Uses `auth.uid() = user_id` to ensure data isolation

## Automatic Profile Creation

The migration includes a trigger that automatically creates a user profile when a new user signs up:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

This ensures that every authenticated user has a corresponding profile record.

## Usage Examples

### Getting User Profile

```typescript
import { db } from "../lib/database"

const userId = await db.getCurrentUserId()
const profile = await db.getUserProfile(userId)
```

### Creating a Game Record

```typescript
import { db } from "../lib/database"

const userId = await db.getCurrentUserId()
const userGame = await db.createUserGame({
  userId,
  gameId: 1,
  score: 100,
})
```

### Ensuring User Profile Exists

```typescript
import { db } from "../lib/database"

const userId = await db.getCurrentUserId()
const profile = await db.ensureUserProfile(userId, {
  email: "user@example.com",
  name: "John Doe",
})
```

## Important Notes

1. **Foreign Key Constraints**: The `user_id` fields in `user_profiles` and `user_games` reference `auth.users.id`, which is managed by Supabase Auth.

2. **Data Types**: User IDs are now UUIDs (not strings) to match Supabase's auth.users table.

3. **RLS**: All tables have Row Level Security enabled. Make sure your Supabase client is properly authenticated to access the data.

4. **Backup**: Before applying this migration, make sure to backup any existing data you want to preserve.

5. **Testing**: Test the migration in a development environment first before applying to production.

## Troubleshooting

### Common Issues

1. **Permission Denied**: Make sure RLS policies are correctly set up and the user is authenticated.

2. **Foreign Key Violations**: Ensure that user IDs in your custom tables match the UUIDs in `auth.users`.

3. **Missing Dependencies**: Make sure `drizzle-orm` is installed:
   ```bash
   yarn add drizzle-orm
   ```

### Verification

After applying the migration, you can verify it worked by:

1. Creating a test user through Supabase Auth
2. Checking that a corresponding profile was created in `user_profiles`
3. Testing the database helper functions
4. Verifying that RLS policies are working correctly

## Next Steps

1. Update your authentication flow to use the new database helper functions
2. Test all CRUD operations with the new schema
3. Update any existing code that references the old Better-Auth tables
4. Consider adding more game-related tables as needed for your application
