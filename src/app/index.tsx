import { useEffect } from "react"
import { router } from "expo-router"

import { useAuth } from "@/stores"

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth()

  console.log("[Index]", { isLoading, isAuthenticated })

  useEffect(() => {
    if (isLoading) return
    console.log("[(index)]", { isLoading, isAuthenticated })
    const target = isAuthenticated ? "/(app)/(tabs)/home" : "/(auth)/login"
    router.replace(target)
  }, [isLoading, isAuthenticated])

  return null
}
