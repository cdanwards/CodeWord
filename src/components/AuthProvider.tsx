import { useEffect } from "react"

import { useAuth } from "@/stores"

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth } = useAuth()

  useEffect(() => {
    // Check authentication status when the app starts
    checkAuth()
  }, [checkAuth])

  return <>{children}</>
}
