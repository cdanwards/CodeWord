import { useEffect } from "react"

import { authClient } from "@/lib/auth-client"
import { useAuth } from "@/stores"

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, setUser, setSession } = useAuth()

  useEffect(() => {
    // Check authentication status when the app starts
    checkAuth()

    // Listen for auth state changes from Supabase
    const {
      data: { subscription },
    } = authClient.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)

      if (event === "SIGNED_IN" && session?.user) {
        // Transform Supabase user to our User interface
        const user = {
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
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setSession(null)
      }
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [checkAuth, setUser, setSession])

  return <>{children}</>
}
