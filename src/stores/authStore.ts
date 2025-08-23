import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

import { authClient } from "@/lib/auth-client"

import { zustandStorage } from "./storage"

// Types
export interface User {
  id: string
  email: string
  name?: string
  image?: string | null
  emailVerified: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Session {
  id: string
  userId: string
  expires?: string
  sessionToken?: string
  token?: string
  expiresAt?: Date
}

export interface AuthState {
  // State
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null

  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  // Auth Actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      // State setters
      setUser: (user) => {
        set({ user, isAuthenticated: !!user })
      },

      setSession: (session) => {
        set({ session })
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      setError: (error) => {
        set({ error })
      },

      clearError: () => {
        set({ error: null })
      },

      // Auth actions
      signIn: async (email: string, password: string) => {
        const { setLoading, setError, setUser } = get()

        setLoading(true)
        setError(null)

        try {
          const { data, error } = await authClient.signInWithPassword(email, password)

          if (error) {
            setError(error.message || "Login failed")
            return { success: false, error: error.message }
          }

          if (data?.user) {
            // Transform Supabase user to our User interface
            const user: User = {
              id: data.user.id,
              email: data.user.email || "",
              name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "",
              image: data.user.user_metadata?.avatar_url || null,
              emailVerified: true, // Email confirmation disabled for now
              createdAt: data.user.created_at,
              updatedAt: data.user.updated_at || data.user.created_at,
            }

            setUser(user)
            return { success: true }
          }

          setError("Login failed - no user data received")
          return { success: false, error: "Login failed - no user data received" }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Login failed"
          setError(errorMessage)
          return { success: false, error: errorMessage }
        } finally {
          setLoading(false)
        }
      },

      signUp: async (email: string, password: string, name: string) => {
        const { setLoading, setError, setUser } = get()

        setLoading(true)
        setError(null)

        try {
          // Sign up with user metadata
          const { data, error } = await authClient.signUp(email, password, {
            data: {
              name: name.trim(),
            },
          })

          if (error) {
            setError(error.message || "Signup failed")
            return { success: false, error: error.message }
          }

          if (data?.user) {
            // Transform Supabase user to our User interface
            const user: User = {
              id: data.user.id,
              email: data.user.email || "",
              name: name.trim() || data.user.email?.split("@")[0] || "",
              image: data.user.user_metadata?.avatar_url || null,
              emailVerified: true, // Email confirmation disabled for now
              createdAt: data.user.created_at,
              updatedAt: data.user.updated_at || data.user.created_at,
            }

            setUser(user)
            return { success: true }
          }

          setError("Signup failed - no user data received")
          return { success: false, error: "Signup failed - no user data received" }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Signup failed"
          setError(errorMessage)
          return { success: false, error: errorMessage }
        } finally {
          setLoading(false)
        }
      },

      signOut: async () => {
        console.log("[authStore] signOut")
        const { setLoading, setError, setUser, setSession } = get()

        setLoading(true)

        try {
          console.log("[authStore] signOut try")
          await authClient.signOut()
          console.log("[authStore] signOut try done")
          setUser(null)
          setSession(null)
          setError(null)
          console.log("[authStore] signOut done")
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Signout failed"
          console.log("[authStore] signOut error", errorMessage)
          setError(errorMessage)
        } finally {
          setLoading(false)
          console.log("[authStore] signOut finally")
        }
      },

      refreshSession: async () => {
        const { setLoading, setError, setUser, setSession } = get()

        setLoading(true)

        try {
          const { session, error } = await authClient.getSession()

          if (error) {
            setUser(null)
            setSession(null)
            return
          }

          if (session?.user) {
            // Transform Supabase user to our User interface
            const user: User = {
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "",
              image: session.user.user_metadata?.avatar_url || null,
              emailVerified: true, // Email confirmation disabled for now
              createdAt: session.user.created_at,
              updatedAt: session.user.updated_at || session.user.created_at,
            }

            setUser(user)
            setSession({
              id: session.access_token,
              userId: session.user.id,
              token: session.access_token,
              expiresAt: new Date(session.expires_at! * 1000),
            })
            setError(null)
          } else {
            setUser(null)
            setSession(null)
          }
        } catch {
          setUser(null)
          setSession(null)
        } finally {
          setLoading(false)
        }
      },

      checkAuth: async () => {
        const { refreshSession } = get()
        await refreshSession()
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
