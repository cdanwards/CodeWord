import { supabase } from "../../supabase/database"

// Export the supabase client for use in React components
export { supabase }

// Create a React-friendly auth client
export const authClient = {
  // Get the current session
  getSession: async () => {
    const timeoutMs = 10000
    try {
      const result: any = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs)),
      ])
      const {
        data: { session },
        error,
      } = result
      return { session, error }
    } catch (error) {
      console.warn("[authClient] getSession timed out or failed", error)
      return { session: null as any, error }
    }
  },

  // Get the current user
  getUser: async () => {
    const timeoutMs = 10000
    try {
      const result: any = await Promise.race([
        supabase.auth.getUser(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs)),
      ])
      const {
        data: { user },
        error,
      } = result
      return { user, error }
    } catch (error) {
      console.warn("[authClient] getUser timed out or failed", error)
      return { user: null as any, error }
    }
  },

  // Sign in with email and password
  signInWithPassword: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password })
  },

  // Sign up with email and password
  signUp: async (email: string, password: string, options?: { data?: any }) => {
    return await supabase.auth.signUp({
      email,
      password,
      options,
    })
  },

  // Sign out
  signOut: async () => {
    console.log("[authClient] signOut")
    try {
      return await supabase.auth.signOut()
    } catch (error) {
      // Fallback: if network aborts or fails, clear local session to unblock UI
      console.warn("[authClient] signOut failed, applying local fallback", error)
      try {
        // Best-effort local clear of session storage used by supabase auth
        await (supabase as any)?.auth?.removeSession?.()
      } catch {}
      // Return a shape similar to supabase call to avoid blowing up callers
      return { error: null }
    }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },
}
