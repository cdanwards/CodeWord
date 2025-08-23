import { supabase } from "../../supabase/database"
import { withDatabaseFallback } from "./network-utils"
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
            10000,
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

      const newMembership: NewUserGame = {
        userId,
        gameId: game.id,
      }

      const { data, error } = await withTimeout<any>(
        supabase
          .from("user_games")
          .insert(newMembership)
          .select()
          .single() as unknown as Promise<any>,
        8000,
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
