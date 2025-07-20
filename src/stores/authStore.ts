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
          const { data, error } = await authClient.signIn.email({
            email: email.trim(),
            password,
          })

          if (error) {
            setError(error.message || "Login failed")
            return { success: false, error: error.message }
          }

          if (data?.user) {
            setUser(data.user)
            // Better Auth doesn't return session in the same object, we'll handle it separately
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
          const { data, error } = await authClient.signUp.email({
            email: email.trim(),
            password,
            name: name.trim(),
          })

          if (error) {
            setError(error.message || "Signup failed")
            return { success: false, error: error.message }
          }

          if (data?.user) {
            setUser(data.user)
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
        const { setLoading, setError, setUser, setSession } = get()

        setLoading(true)

        try {
          await authClient.signOut()
          setUser(null)
          setSession(null)
          setError(null)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Signout failed"
          setError(errorMessage)
        } finally {
          setLoading(false)
        }
      },

      refreshSession: async () => {
        const { setLoading, setError, setUser, setSession } = get()

        setLoading(true)

        try {
          const { data, error } = await authClient.getSession()

          if (error) {
            setUser(null)
            setSession(null)
            return
          }

          if (data?.user && data?.session) {
            setUser(data.user)
            setSession(data.session)
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
