import { pgTable, serial, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

// Better-Auth required tables
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: timestamp("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
  sessionToken: text("session_token").notNull().unique(),
})

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires").notNull(),
})

// Your custom tables
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  phone: varchar("phone", { length: 256 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Zod schemas for type safety
export const insertUserSchema = createInsertSchema(users)
export const selectUserSchema = createSelectSchema(users)
export const insertAccountSchema = createInsertSchema(accounts)
export const selectAccountSchema = createSelectSchema(accounts)
export const insertSessionSchema = createInsertSchema(sessions)
export const selectSessionSchema = createSelectSchema(sessions)
export const insertVerificationTokenSchema = createInsertSchema(verificationTokens)
export const selectVerificationTokenSchema = createSelectSchema(verificationTokens)

// Type exports
export type User = z.infer<typeof selectUserSchema>
export type NewUser = z.infer<typeof insertUserSchema>
export type Account = z.infer<typeof selectAccountSchema>
export type NewAccount = z.infer<typeof insertAccountSchema>
export type Session = z.infer<typeof selectSessionSchema>
export type NewSession = z.infer<typeof insertSessionSchema>
export type VerificationToken = z.infer<typeof selectVerificationTokenSchema>
export type NewVerificationToken = z.infer<typeof insertVerificationTokenSchema>
