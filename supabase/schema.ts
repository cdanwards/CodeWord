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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Example: Game-related tables that reference user profiles
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  code: varchar("code", { length: 8 }).notNull(),
  hostUserId: uuid("host_user_id").notNull(),
  status: text("status").notNull().default("lobby"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationHours: integer("duration_hours").notNull().default(72),
  settings: jsonb("settings").default({}).$type<Record<string, unknown>>(),
  completionReason: text("completion_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
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
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  eliminatedAt: timestamp("eliminated_at", { withTimezone: true }),
  leftAt: timestamp("left_at", { withTimezone: true }),
  playedAt: timestamp("played_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// Shared codeword bank (migration 006). difficulty: 1 hard, 2 medium, 3 easy.
export const wordBank = pgTable("word_bank", {
  id: serial("id").primaryKey(),
  word: text("word").notNull(),
  difficulty: integer("difficulty").notNull(),
})

// Each agent's codewords in a game: one issued per day, plus any inherited from victims.
export const agentWords = pgTable("agent_words", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  userId: uuid("user_id").notNull(),
  word: text("word").notNull(),
  difficulty: integer("difficulty").notNull(),
  grantedDay: integer("granted_day").notNull(),
  issuedTo: uuid("issued_to").notNull(),
  inheritedFrom: uuid("inherited_from"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// Target assignments
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  assassinUserId: uuid("assassin_user_id").notNull(),
  targetUserId: uuid("target_user_id").notNull(),
  round: integer("round").notNull().default(1),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
})

// Elimination records with confirmation system
export const eliminations = pgTable("eliminations", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  assignmentId: integer("assignment_id"),
  killerUserId: uuid("killer_user_id").notNull(),
  victimUserId: uuid("victim_user_id").notNull(),
  word: text("word"),
  notes: text("notes"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
  confirmationRequired: boolean("confirmation_required").notNull().default(true),
  confirmationStatus: text("confirmation_status").notNull().default("pending"),
  confirmationDeadline: timestamp("confirmation_deadline", { withTimezone: true }),
  eliminationMethod: text("elimination_method"),
  targetNotes: text("target_notes"),
  eliminationRound: integer("elimination_round").notNull().default(1),
})

// Elimination confirmations
export const eliminationConfirmations = pgTable("elimination_confirmations", {
  id: serial("id").primaryKey(),
  eliminationId: integer("elimination_id")
    .notNull()
    .references(() => eliminations.id, { onDelete: "cascade" }),
  targetUserId: uuid("target_user_id").notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  confirmationNotes: text("confirmation_notes"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Game results for completed games
export const gameResults = pgTable("game_results", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  winnerUserId: uuid("winner_user_id"),
  finalStandings: jsonb("final_standings").notNull().default([]),
  gameDurationHours: integer("game_duration_hours").notNull(),
  totalEliminations: integer("total_eliminations").notNull().default(0),
  completionReason: text("completion_reason"),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// Zod schemas for type safety
export const insertUserProfileSchema = createInsertSchema(userProfiles)
export const selectUserProfileSchema = createSelectSchema(userProfiles)
export const insertGameSchema = createInsertSchema(games)
export const selectGameSchema = createSelectSchema(games)
export const insertUserGameSchema = createInsertSchema(userGames)
export const selectUserGameSchema = createSelectSchema(userGames)
export const selectAgentWordSchema = createSelectSchema(agentWords)
export const insertAssignmentSchema = createInsertSchema(assignments)
export const selectAssignmentSchema = createSelectSchema(assignments)
export const insertEliminationSchema = createInsertSchema(eliminations)
export const selectEliminationSchema = createSelectSchema(eliminations)
export const insertEliminationConfirmationSchema = createInsertSchema(eliminationConfirmations)
export const selectEliminationConfirmationSchema = createSelectSchema(eliminationConfirmations)
export const insertGameResultSchema = createInsertSchema(gameResults)
export const selectGameResultSchema = createSelectSchema(gameResults)

// Type exports
export type UserProfile = z.infer<typeof selectUserProfileSchema>
export type NewUserProfile = z.infer<typeof insertUserProfileSchema>
export type Game = z.infer<typeof selectGameSchema>
export type NewGame = z.infer<typeof insertGameSchema>
export type UserGame = z.infer<typeof selectUserGameSchema>
export type NewUserGame = z.infer<typeof insertUserGameSchema>
export type AgentWord = z.infer<typeof selectAgentWordSchema>
export type Assignment = z.infer<typeof selectAssignmentSchema>
export type NewAssignment = z.infer<typeof insertAssignmentSchema>
export type Elimination = z.infer<typeof selectEliminationSchema>
export type NewElimination = z.infer<typeof insertEliminationSchema>
export type EliminationConfirmation = z.infer<typeof selectEliminationConfirmationSchema>
export type NewEliminationConfirmation = z.infer<typeof insertEliminationConfirmationSchema>
export type GameResult = z.infer<typeof selectGameResultSchema>
export type NewGameResult = z.infer<typeof insertGameResultSchema>

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

// Rows returned by queries that embed a related table (e.g. `select("*, games (*)")`)
export type UserGameWithGame = UserGame & { games: Game | null }

// ---------------------------------------------------------------------------------------------
// Game engine results (migration 005 functions), after database.ts converts them to camelCase.
// ---------------------------------------------------------------------------------------------
export type GameStatus = "lobby" | "active" | "ended" | "canceled"

export interface MissionWord {
  word: string
  /** 1 hard, 2 medium, 3 easy */
  difficulty: 1 | 2 | 3
  grantedDay: number
  /** Set when the word came from an agent you eliminated. */
  inheritedFromName: string | null
}

/** Everything one agent may see about their operation (`my_mission`). */
export interface Mission {
  game: {
    id: number
    name: string
    code: string
    status: GameStatus
    hostUserId: string
    startedAt: string | null
    endedAt: string | null
    endsAt: string | null
    durationHours: number
    completionReason: "last_agent_standing" | "time_up" | "host_ended" | null
    /** 1-based day of the operation; 0 before it starts. */
    day: number
    daysTotal: number
  }
  me: {
    userId: string
    role: "host" | "player"
    status: "active" | "eliminated" | "left"
    eliminatedAt: string | null
  }
  target: { userId: string; fullName: string } | null
  words: MissionWord[]
  agentsLeft: number
  agentsTotal: number
  /** A report against you, waiting for you to confirm or dispute. */
  incoming: {
    eliminationId: number
    killerName: string
    word: string
    notes: string | null
    occurredAt: string
  } | null
  /** Your report, waiting for your target to answer. */
  outgoing: { eliminationId: number; victimName: string; word: string; occurredAt: string } | null
  eliminatedBy: { killerName: string; word: string; occurredAt: string } | null
  winner: { userId: string; fullName: string } | null
}

export interface BoardMember {
  userId: string
  fullName: string
  role: "host" | "player"
  status: "active" | "eliminated" | "left"
  joinedAt: string
  eliminatedAt: string | null
  /** Confirmed kills. */
  eliminations: number
}

export interface FeedEntry {
  eliminationId: number
  killerUserId: string
  killerName: string
  victimUserId: string
  victimName: string
  /** Only shown to the killer and the victim; null for everyone else. */
  word: string | null
  occurredAt: string
}

/** Roster and kill feed for anyone in the operation (`game_board`). */
export interface Board {
  members: BoardMember[]
  feed: FeedEntry[]
}
