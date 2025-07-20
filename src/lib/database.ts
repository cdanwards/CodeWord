import { supabase } from "../../supabase/database"
import type {
  UserProfile,
  Game,
  UserGame,
  NewUserProfile,
  NewGame,
  NewUserGame,
} from "../../supabase/schema"

// Database helper functions for working with Supabase Auth

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
      const { data, error } = await supabase.from("games").select("*").order("name")

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
      const { data, error } = await supabase.from("games").select("*").eq("id", gameId).single()

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
      const { data, error } = await supabase.from("games").insert(game).select().single()

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

  // User Game operations
  getUserGames: async (userId: string): Promise<UserGame[]> => {
    try {
      const { data, error } = await supabase
        .from("user_games")
        .select(
          `
          *,
          games (*)
        `,
        )
        .eq("user_id", userId)
        .order("played_at", { ascending: false })

      if (error) {
        console.error("Error fetching user games:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getUserGames:", error)
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
