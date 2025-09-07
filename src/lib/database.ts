import { withDatabaseFallback } from "./network-utils"
import { supabase } from "../../supabase/database"
import type {
  UserProfile,
  Game,
  UserGame,
  NewUserProfile,
  NewGame,
  NewUserGame,
  GameWord,
  NewGameWord,
  Assignment,
  NewAssignment,
  Elimination,
  NewElimination,
  EliminationConfirmation,
  NewEliminationConfirmation,
  GameResult,
  NewGameResult,
} from "../../supabase/schema"

// Database helper functions for working with Supabase Auth

// Small helper to ensure long requests never hang the UI
async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: any
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })
  try {
    return (await Promise.race([promise, timeoutPromise])) as T
  } finally {
    clearTimeout(timeoutId)
  }
}

export const db = {
  // User Profile operations
  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (error) {
        console.error("Error fetching user profile:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in getUserProfile:", error)
      return null
    }
  },

  createUserProfile: async (profile: NewUserProfile): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase.from("user_profiles").insert(profile).select().single()

      if (error) {
        console.error("Error creating user profile:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in createUserProfile:", error)
      return null
    }
  },

  updateUserProfile: async (
    userId: string,
    updates: Partial<NewUserProfile>,
  ): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .select()
        .single()

      if (error) {
        console.error("Error updating user profile:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in updateUserProfile:", error)
      return null
    }
  },

  // Game operations
  getAllGames: async (): Promise<Game[]> => {
    try {
      const { data, error } = await withTimeout<any>(
        supabase.from("games").select("*").order("name") as unknown as Promise<any>,
        8000,
        "getAllGames",
      )

      if (error) {
        console.error("Error fetching games:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getAllGames:", error)
      return []
    }
  },

  getGame: async (gameId: number): Promise<Game | null> => {
    try {
      const { data, error } = await withTimeout<any>(
        supabase.from("games").select("*").eq("id", gameId).single() as unknown as Promise<any>,
        8000,
        "getGame",
      )

      if (error) {
        console.error("Error fetching game:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in getGame:", error)
      return null
    }
  },

  createGame: async (game: NewGame): Promise<Game | null> => {
    try {
      const { data, error } = await withTimeout<any>(
        supabase.from("games").insert(game).select().single() as unknown as Promise<any>,
        10000,
        "createGame",
      )

      if (error) {
        console.error("Error creating game:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in createGame:", error)
      return null
    }
  },

  createGameHost: async (input: {
    name: string
    description?: string
    durationHours?: number
  }): Promise<Game | null> => {
    try {
      const userId = await db.getCurrentUserId()
      if (!userId) {
        console.error("No authenticated user to create game")
        return null
      }

      // Generate a unique join code
      const generateCode = (length = 6) => {
        const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        let result = ""
        for (let i = 0; i < length; i += 1) {
          result += alphabet[Math.floor(Math.random() * alphabet.length)]
        }
        return result
      }

      let code = generateCode(6)
      for (let attempts = 0; attempts < 5; attempts += 1) {
        const { data: existing, error: existErr } = await supabase
          .from("games")
          .select("id")
          .eq("code", code)
          .maybeSingle()
        if (existErr) {
          console.warn("Error checking code uniqueness (continuing):", existErr.message)
          break
        }
        if (!existing) break
        code = generateCode(6)
      }

      const durationHours = input.durationHours ?? 72
      const insertPayload = {
        name: input.name,
        description: input.description ?? null,
        code,
        host_user_id: userId,
        status: "lobby",
        duration_hours: durationHours,
        settings: {},
      }

      const { data: game, error } = await withTimeout<any>(
        supabase.from("games").insert(insertPayload).select().single() as unknown as Promise<any>,
        12000,
        "createGameHost:insertGame",
      )
      if (error) {
        console.error("Error creating host game:", error)
        return null
      }

      const { error: ugErr } = await withTimeout<any>(
        supabase
          .from("user_games")
          .insert({
            user_id: userId,
            game_id: game.id,
            role: "host",
            status: "active",
            is_ready: false,
          })
          .select() as unknown as Promise<any>,
        8000,
        "createGameHost:insertMembership",
      )
      if (ugErr) {
        console.error("Error inserting host membership:", ugErr)
        // continue; game exists even if membership insert fails
      }

      return game
    } catch (error) {
      console.error("Error in createGameHost:", error)
      return null
    }
  },

  findGameByCode: async (code: string): Promise<Game | null> => {
    try {
      const { data, error } = await supabase.from("games").select("*").eq("code", code).single()

      if (error) {
        console.error("Error finding game by code:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in findGameByCode:", error)
      return null
    }
  },

  // User Game operations
  getUserGames: async (userId: string): Promise<UserGame[]> => {
    return withDatabaseFallback(
      async () => {
        try {
          const { data, error } = await withTimeout<any>(
            supabase
              .from("user_games")
              .select(
                `
                *,
                games (*)
              `,
              )
              .eq("user_id", userId)
              .order("joined_at", { ascending: false }) as unknown as Promise<any>,
            20000,
            "getUserGames",
          )

          if (error) {
            console.error("Error fetching user games:", error)
            return []
          }

          return data || []
        } catch (err) {
          console.warn("getUserGames guarded error:", (err as Error).message)
          return []
        }
      },
      [], // Fallback: empty array
      "getUserGames",
    )
  },

  getGameMembers: async (gameId: number): Promise<UserGame[]> => {
    try {
      const { data, error } = await supabase
        .from("user_games")
        .select(
          `
          *,
          games (*)
        `,
        )
        .eq("game_id", gameId)
        .order("joined_at", { ascending: true })

      if (error) {
        console.error("Error fetching game members:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getGameMembers:", error)
      return []
    }
  },

  createUserGame: async (userGame: NewUserGame): Promise<UserGame | null> => {
    try {
      const { data, error } = await supabase.from("user_games").insert(userGame).select().single()

      if (error) {
        console.error("Error creating user game:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in createUserGame:", error)
      return null
    }
  },

  joinGameByCode: async (userId: string, code: string): Promise<UserGame | null> => {
    try {
      const game = await db.findGameByCode(code)
      if (!game) return null

      // Insert must use snake_case column names expected by the database
      const newMembership = {
        user_id: userId,
        game_id: game.id,
      }

      const { data, error } = await withTimeout<any>(
        supabase
          .from("user_games")
          .insert(newMembership)
          .select()
          .single() as unknown as Promise<any>,
        15000,
        "joinGameByCode",
      )
      if (error) {
        console.error("Error joining game by code:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in joinGameByCode:", error)
      return null
    }
  },

  // Game words
  listGameWords: async (gameId: number): Promise<GameWord[]> => {
    try {
      const { data, error } = await supabase
        .from("game_words")
        .select("*")
        .eq("game_id", gameId)
        .order("day_number", { ascending: true })
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error fetching game words:", error)
        return []
      }
      return data || []
    } catch (error) {
      console.error("Error in listGameWords:", error)
      return []
    }
  },

  addGameWord: async (word: NewGameWord): Promise<GameWord | null> => {
    try {
      const { data, error } = await supabase.from("game_words").insert(word).select().single()
      if (error) {
        console.error("Error adding game word:", error)
        return null
      }
      return data
    } catch (error) {
      console.error("Error in addGameWord:", error)
      return null
    }
  },

  // Assignments
  listAssignments: async (gameId: number): Promise<Assignment[]> => {
    try {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error fetching assignments:", error)
        return []
      }
      return data || []
    } catch (error) {
      console.error("Error in listAssignments:", error)
      return []
    }
  },

  createAssignment: async (assignment: NewAssignment): Promise<Assignment | null> => {
    try {
      const { data, error } = await supabase
        .from("assignments")
        .insert(assignment)
        .select()
        .single()
      if (error) {
        console.error("Error creating assignment:", error)
        return null
      }
      return data
    } catch (error) {
      console.error("Error in createAssignment:", error)
      return null
    }
  },

  // Eliminations
  listEliminations: async (gameId: number): Promise<Elimination[]> => {
    try {
      const { data, error } = await supabase
        .from("eliminations")
        .select("*")
        .eq("game_id", gameId)
        .order("occurred_at", { ascending: false })

      if (error) {
        console.error("Error fetching eliminations:", error)
        return []
      }
      return data || []
    } catch (error) {
      console.error("Error in listEliminations:", error)
      return []
    }
  },

  recordElimination: async (elimination: NewElimination): Promise<Elimination | null> => {
    try {
      const { data, error } = await supabase
        .from("eliminations")
        .insert(elimination)
        .select()
        .single()
      if (error) {
        console.error("Error recording elimination:", error)
        return null
      }
      return data
    } catch (error) {
      console.error("Error in recordElimination:", error)
      return null
    }
  },

  // NEW: Elimination attempt system
  attemptElimination: async (input: {
    gameId: number
    killerUserId: string
    targetUserId: string
    notes?: string
    eliminationMethod?: string
    targetNotes?: string
  }): Promise<Elimination | null> => {
    try {
      // Get current round number for this game
      const { data: currentRoundData } = await supabase
        .from("eliminations")
        .select("elimination_round")
        .eq("game_id", input.gameId)
        .order("elimination_round", { ascending: false })
        .limit(1)

      const currentRound = currentRoundData?.[0]?.elimination_round || 1
      const nextRound = currentRound + 1

      // Create the elimination record
      const elimination: NewElimination = {
        gameId: input.gameId,
        killerUserId: input.killerUserId,
        victimUserId: input.targetUserId,
        notes: input.notes || null,
        eliminationMethod: input.eliminationMethod || null,
        targetNotes: input.targetNotes || null,
        confirmationRequired: true,
        confirmationStatus: "pending",
        eliminationRound: nextRound,
      }

      const { data: eliminationData, error: eliminationError } = await supabase
        .from("eliminations")
        .insert(elimination)
        .select()
        .single()

      if (eliminationError) {
        console.error("Error creating elimination:", eliminationError)
        return null
      }

      // Create the confirmation record for the target
      const confirmation: NewEliminationConfirmation = {
        eliminationId: eliminationData.id,
        targetUserId: input.targetUserId,
      }

      const { error: confirmationError } = await supabase
        .from("elimination_confirmations")
        .insert(confirmation)

      if (confirmationError) {
        console.error("Error creating confirmation:", confirmationError)
        // Continue anyway - the elimination exists
      }

      return eliminationData
    } catch (error) {
      console.error("Error in attemptElimination:", error)
      return null
    }
  },

  // NEW: Confirm elimination
  confirmElimination: async (input: {
    eliminationId: number
    targetUserId: string
    confirmed: boolean
    notes?: string
    rejectionReason?: string
  }): Promise<boolean> => {
    try {
      // Update the elimination status
      const eliminationUpdate = {
        confirmationStatus: input.confirmed ? "confirmed" : "rejected",
      }

      const { error: eliminationError } = await supabase
        .from("eliminations")
        .update(eliminationUpdate)
        .eq("id", input.eliminationId)

      if (eliminationError) {
        console.error("Error updating elimination:", eliminationError)
        return false
      }

      // Update the confirmation record
      const confirmationUpdate = {
        confirmedAt: input.confirmed ? new Date().toISOString() : null,
        confirmationNotes: input.notes || null,
        rejectionReason: !input.confirmed ? input.rejectionReason : null,
        updatedAt: new Date().toISOString(),
      }

      const { error: confirmationError } = await supabase
        .from("elimination_confirmations")
        .update(confirmationUpdate)
        .eq("elimination_id", input.eliminationId)
        .eq("target_user_id", input.targetUserId)

      if (confirmationError) {
        console.error("Error updating confirmation:", confirmationError)
        return false
      }

      // If confirmed, mark the target as eliminated
      if (input.confirmed) {
        const { error: userGameError } = await supabase
          .from("user_games")
          .update({
            eliminatedAt: new Date().toISOString(),
            status: "eliminated",
          })
          .eq(
            "game_id",
            (
              await supabase
                .from("eliminations")
                .select("game_id")
                .eq("id", input.eliminationId)
                .single()
            ).data?.game_id,
          )
          .eq("user_id", input.targetUserId)

        if (userGameError) {
          console.error("Error updating user game status:", userGameError)
          // Continue anyway - the elimination is confirmed
        }
      }

      return true
    } catch (error) {
      console.error("Error in confirmElimination:", error)
      return false
    }
  },

  // NEW: Get pending confirmations for a user
  getPendingConfirmations: async (userId: string): Promise<EliminationConfirmation[]> => {
    try {
      const { data, error } = await supabase
        .from("elimination_confirmations")
        .select(
          `
          *,
          eliminations (*)
        `,
        )
        .eq("target_user_id", userId)
        .is("confirmed_at", null)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching pending confirmations:", error)
        return []
      }
      return data || []
    } catch (error) {
      console.error("Error in getPendingConfirmations:", error)
      return []
    }
  },

  // NEW: Get current target for a player
  getMyTarget: async (gameId: number, userId: string): Promise<UserGame | null> => {
    try {
      // Find the current active assignment for this player
      const { data: assignment, error: assignmentError } = await supabase
        .from("assignments")
        .select("*")
        .eq("game_id", gameId)
        .eq("assassin_user_id", userId)
        .eq("status", "active")
        .order("round", { ascending: false })
        .limit(1)
        .single()

      if (assignmentError || !assignment) {
        return null
      }

      // Get the target player's game info
      const { data: targetUserGame, error: targetError } = await supabase
        .from("user_games")
        .select(
          `
          *,
          games (*)
        `,
        )
        .eq("game_id", gameId)
        .eq("user_id", assignment.targetUserId)
        .eq("status", "active")
        .single()

      if (targetError || !targetUserGame) {
        return null
      }

      return targetUserGame
    } catch (error) {
      console.error("Error in getMyTarget:", error)
      return null
    }
  },

  // NEW: Get elimination history for a game with rounds
  getGameEliminationHistory: async (
    gameId: number,
  ): Promise<{
    eliminations: Elimination[]
    rounds: { round: number; eliminations: Elimination[] }[]
  }> => {
    try {
      const eliminations = await db.listEliminations(gameId)

      // Group eliminations by round
      const roundsMap = new Map<number, Elimination>()
      eliminations.forEach((elimination) => {
        const round = elimination.eliminationRound || 1
        if (!roundsMap.has(round)) {
          roundsMap.set(round, elimination)
        }
      })

      const rounds = Array.from(roundsMap.entries())
        .map(([round, elimination]) => ({
          round,
          eliminations: eliminations.filter((e) => e.eliminationRound === round),
        }))
        .sort((a, b) => a.round - b.round)

      return {
        eliminations,
        rounds,
      }
    } catch (error) {
      console.error("Error in getGameEliminationHistory:", error)
      return { eliminations: [], rounds: [] }
    }
  },

  // NEW: Get current game round
  getCurrentGameRound: async (gameId: number): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from("eliminations")
        .select("elimination_round")
        .eq("game_id", gameId)
        .order("elimination_round", { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        return 1 // Default to round 1 if no eliminations yet
      }

      return data.elimination_round
    } catch (error) {
      console.error("Error in getCurrentGameRound:", error)
      return 1
    }
  },

  // NEW: Get active assignments for current round
  getCurrentRoundAssignments: async (gameId: number): Promise<Assignment[]> => {
    try {
      const currentRound = await db.getCurrentGameRound(gameId)

      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("game_id", gameId)
        .eq("round", currentRound)
        .eq("status", "active")
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error fetching current round assignments:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getCurrentRoundAssignments:", error)
      return []
    }
  },

  // NEW: Start a game
  startGame: async (gameId: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("games")
        .update({
          status: "active",
          startedAt: new Date().toISOString(),
        })
        .eq("id", gameId)

      if (error) {
        console.error("Error starting game:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in startGame:", error)
      return false
    }
  },

  // NEW: End a game
  endGame: async (gameId: number, reason?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("games")
        .update({
          status: "ended",
          endedAt: new Date().toISOString(),
          completionReason: reason || "manual_end",
        })
        .eq("id", gameId)

      if (error) {
        console.error("Error ending game:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in endGame:", error)
      return false
    }
  },

  // NEW: Calculate and store game results
  calculateGameResults: async (gameId: number): Promise<GameResult | null> => {
    try {
      // Get game details
      const game = await db.getGame(gameId)
      if (!game) return null

      // Get all eliminations for the game
      const eliminations = await db.listEliminations(gameId)

      // Get all players and their final status
      const players = await db.getGameMembers(gameId)

      // Calculate final standings
      const finalStandings = players
        .map((player) => ({
          userId: player.userId,
          role: player.role,
          status: player.status,
          eliminatedAt: player.eliminatedAt,
          score: player.score || 0,
        }))
        .sort((a, b) => {
          // Survivors first, then by elimination time (earliest eliminated = lower rank)
          if (a.status === "active" && b.status !== "active") return -1
          if (a.status !== "active" && b.status === "active") return 1
          if (a.eliminatedAt && b.eliminatedAt) {
            return new Date(a.eliminatedAt).getTime() - new Date(b.eliminatedAt).getTime()
          }
          return 0
        })

      // Find winner (last player standing)
      const winner = players.find((p) => p.status === "active")

      // Calculate game duration
      const startTime = game.startedAt ? new Date(game.startedAt) : new Date()
      const endTime = game.endedAt ? new Date(game.endedAt) : new Date()
      const durationHours = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60))

      const gameResult: NewGameResult = {
        gameId,
        winnerUserId: winner?.userId || null,
        finalStandings: finalStandings as any,
        gameDurationHours: durationHours,
        totalEliminations: eliminations.filter((e) => e.confirmationStatus === "confirmed").length,
        completionReason: game.completionReason || "manual_end",
      }

      const { data, error } = await supabase
        .from("game_results")
        .insert(gameResult)
        .select()
        .single()

      if (error) {
        console.error("Error creating game result:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in calculateGameResults:", error)
      return null
    }
  },

  // NEW: Get game results
  getGameResults: async (gameId: number): Promise<GameResult | null> => {
    try {
      const { data, error } = await supabase
        .from("game_results")
        .select("*")
        .eq("game_id", gameId)
        .single()

      if (error) {
        console.error("Error fetching game results:", error)
        return null
      }
      return data
    } catch (error) {
      console.error("Error in getGameResults:", error)
      return null
    }
  },

  updateUserGame: async (id: number, updates: Partial<NewUserGame>): Promise<UserGame | null> => {
    try {
      const { data, error } = await supabase
        .from("user_games")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error updating user game:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in updateUserGame:", error)
      return null
    }
  },

  deleteUserGame: async (id: number): Promise<boolean> => {
    try {
      const { error } = await supabase.from("user_games").delete().eq("id", id)

      if (error) {
        console.error("Error deleting user game:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in deleteUserGame:", error)
      return false
    }
  },

  // Utility functions
  getCurrentUserId: async (): Promise<string | null> => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        return null
      }

      return user.id
    } catch (error) {
      console.error("Error getting current user ID:", error)
      return null
    }
  },

  // Initialize user profile if it doesn't exist
  ensureUserProfile: async (
    userId: string,
    userData?: { email?: string; name?: string },
  ): Promise<UserProfile | null> => {
    try {
      // Check if profile exists
      let profile = await db.getUserProfile(userId)

      if (!profile) {
        // Create profile if it doesn't exist
        const newProfile: NewUserProfile = {
          userId,
          fullName: userData?.name || userData?.email?.split("@")[0] || "User",
        }

        profile = await db.createUserProfile(newProfile)
      }

      return profile
    } catch (error) {
      console.error("Error ensuring user profile:", error)
      return null
    }
  },
}
