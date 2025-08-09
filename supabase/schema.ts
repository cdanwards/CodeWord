import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
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
  code: varchar("code", { length: 8 }).notNull(),
  hostUserId: uuid("host_user_id").notNull(),
  status: text("status").notNull().default("lobby"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  durationHours: integer("duration_hours").notNull().default(72),
  settings: jsonb("settings").default({}).$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const userGames = pgTable("user_games", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(), // References auth.users.id (managed by Supabase)
  gameId: serial("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  score: integer("score"),
  role: text("role").notNull().default("player"),
  isReady: boolean("is_ready").notNull().default(false),
  status: text("status").notNull().default("active"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  eliminatedAt: timestamp("eliminated_at"),
  leftAt: timestamp("left_at"),
  playedAt: timestamp("played_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Words that unlock over time for a game
export const gameWords = pgTable("game_words", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  word: text("word").notNull(),
  dayNumber: integer("day_number").notNull().default(1),
  availableAt: timestamp("available_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Target assignments
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  assassinUserId: uuid("assassin_user_id").notNull(),
  targetUserId: uuid("target_user_id").notNull(),
  wordId: integer("word_id"),
  round: integer("round").notNull().default(1),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
})

// Elimination records
export const eliminations = pgTable("eliminations", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  assignmentId: integer("assignment_id"),
  killerUserId: uuid("killer_user_id").notNull(),
  victimUserId: uuid("victim_user_id").notNull(),
  notes: text("notes"),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
})

// Zod schemas for type safety
export const insertUserProfileSchema = createInsertSchema(userProfiles)
export const selectUserProfileSchema = createSelectSchema(userProfiles)
export const insertGameSchema = createInsertSchema(games)
export const selectGameSchema = createSelectSchema(games)
export const insertUserGameSchema = createInsertSchema(userGames)
export const selectUserGameSchema = createSelectSchema(userGames)
export const insertGameWordSchema = createInsertSchema(gameWords)
export const selectGameWordSchema = createSelectSchema(gameWords)
export const insertAssignmentSchema = createInsertSchema(assignments)
export const selectAssignmentSchema = createSelectSchema(assignments)
export const insertEliminationSchema = createInsertSchema(eliminations)
export const selectEliminationSchema = createSelectSchema(eliminations)

// Type exports
export type UserProfile = z.infer<typeof selectUserProfileSchema>
export type NewUserProfile = z.infer<typeof insertUserProfileSchema>
export type Game = z.infer<typeof selectGameSchema>
export type NewGame = z.infer<typeof insertGameSchema>
export type UserGame = z.infer<typeof selectUserGameSchema>
export type NewUserGame = z.infer<typeof insertUserGameSchema>
export type GameWord = z.infer<typeof selectGameWordSchema>
export type NewGameWord = z.infer<typeof insertGameWordSchema>
export type Assignment = z.infer<typeof selectAssignmentSchema>
export type NewAssignment = z.infer<typeof insertAssignmentSchema>
export type Elimination = z.infer<typeof selectEliminationSchema>
export type NewElimination = z.infer<typeof insertEliminationSchema>

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
