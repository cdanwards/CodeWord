import { pgTable, serial, text, varchar, timestamp, uuid } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

// Supabase Auth automatically manages these tables:
// - auth.users (contains user authentication data)
// - auth.identities (contains OAuth identities)
// - auth.sessions (contains active sessions)

// Your custom tables that reference Supabase auth.users
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(), // References auth.users.id (managed by Supabase)
  fullName: text("full_name"),
  phone: varchar("phone", { length: 256 }),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Example: Game-related tables that reference user profiles
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const userGames = pgTable("user_games", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(), // References auth.users.id (managed by Supabase)
  gameId: serial("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  score: serial("score"),
  playedAt: timestamp("played_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Zod schemas for type safety
export const insertUserProfileSchema = createInsertSchema(userProfiles)
export const selectUserProfileSchema = createSelectSchema(userProfiles)
export const insertGameSchema = createInsertSchema(games)
export const selectGameSchema = createSelectSchema(games)
export const insertUserGameSchema = createInsertSchema(userGames)
export const selectUserGameSchema = createSelectSchema(userGames)

// Type exports
export type UserProfile = z.infer<typeof selectUserProfileSchema>
export type NewUserProfile = z.infer<typeof insertUserProfileSchema>
export type Game = z.infer<typeof selectGameSchema>
export type NewGame = z.infer<typeof insertGameSchema>
export type UserGame = z.infer<typeof selectUserGameSchema>
export type NewUserGame = z.infer<typeof insertUserGameSchema>

// Helper type for Supabase user (from auth.users)
export interface SupabaseUser {
  id: string
  email: string
  email_confirmed_at?: string
  phone?: string
  confirmed_at?: string
  last_sign_in_at?: string
  app_metadata: Record<string, any>
  user_metadata: Record<string, any>
  aud: string
  created_at: string
  updated_at: string
}
