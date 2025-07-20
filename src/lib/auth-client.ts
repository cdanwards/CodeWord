import { supabase } from "../../supabase/database"

// Export the supabase client for use in React components
export { supabase }

// Create a React-friendly auth client
export const authClient = {
  // Get the current session
  getSession: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    return { session, error }
  },

  // Get the current user
  getUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    return { user, error }
  },

  // Sign in with email and password
  signInWithPassword: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password })
  },

  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password })
  },

  // Sign out
  signOut: async () => {
    return await supabase.auth.signOut()
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },
}
