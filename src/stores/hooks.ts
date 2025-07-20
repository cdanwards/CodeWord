import { useAuthStore } from "./authStore"
import type { User, Session } from "./authStore"

// Auth hooks
export const useAuth = () => {
  const {
    user,
    session,
    isLoading,
    isAuthenticated,
    error,
    signIn,
    signUp,
    signOut,
    refreshSession,
    checkAuth,
    clearError,
  } = useAuthStore()

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    error,
    signIn,
    signUp,
    signOut,
    refreshSession,
    checkAuth,
    clearError,
  }
}

export const useUser = (): User | null => {
  return useAuthStore((state) => state.user)
}

export const useSession = (): Session | null => {
  return useAuthStore((state) => state.session)
}

export const useIsAuthenticated = (): boolean => {
  return useAuthStore((state) => state.isAuthenticated)
}

export const useIsLoading = (): boolean => {
  return useAuthStore((state) => state.isLoading)
}

export const useAuthError = (): string | null => {
  return useAuthStore((state) => state.error)
}

// Auth actions hooks
export const useAuthActions = () => {
  const { signIn, signUp, signOut, refreshSession, checkAuth, clearError } = useAuthStore()

  return {
    signIn,
    signUp,
    signOut,
    refreshSession,
    checkAuth,
    clearError,
  }
}
