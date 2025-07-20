import { supabase } from "../../supabase/database"

// Export the supabase client for use in the app
export { supabase }

// Helper functions for authentication
export const auth = {
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, user: data.user }
    } catch {
      return { success: false, error: "An unexpected error occurred" }
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, user: data.user }
    } catch {
      return { success: false, error: "An unexpected error occurred" }
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch {
      return { success: false, error: "An unexpected error occurred" }
    }
  },

  getCurrentUser: async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, user }
    } catch {
      return { success: false, error: "An unexpected error occurred" }
    }
  },

  onAuthStateChange: (callback: (user: any) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null)
    })
  },
}
