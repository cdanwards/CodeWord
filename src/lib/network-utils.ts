import { Platform } from "react-native"
import Constants from "expo-constants"

import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../../supabase/database"

// Network connectivity utilities for handling iOS Simulator issues

export interface NetworkStatus {
  isConnected: boolean
  isSimulator: boolean
  canReachSupabase: boolean
  lastChecked: Date
}

export class NetworkManager {
  private static instance: NetworkManager
  private status: NetworkStatus = {
    isConnected: true,
    isSimulator: false,
    canReachSupabase: false,
    lastChecked: new Date(),
  }
  private readonly checksEnabled: boolean = Boolean(
    // Allow enabling via Expo extra or env
    (Constants.expoConfig as any)?.extra?.networkChecksEnabled ||
      process.env.NETWORK_CHECKS_ENABLED === "1",
  )

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager()
    }
    return NetworkManager.instance
  }

  private constructor() {
    this.detectSimulator()
  }

  private detectSimulator(): void {
    // Detect if running in iOS Simulator
    this.status.isSimulator = Platform.OS === "ios" && __DEV__

    if (this.status.isSimulator) {
      console.log("📱 iOS Simulator detected - network issues may occur")
    }
  }

  async checkSupabaseConnectivity(): Promise<boolean> {
    try {
      console.log("🔍 Checking Supabase connectivity...")
      if (!this.checksEnabled) {
        console.log("⏭️  Skipping connectivity check (disabled via config)")
        this.status.canReachSupabase = true
        this.status.lastChecked = new Date()
        return true
      }

      // Use a simple health check with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      // Use the auth health endpoint; include apikey so some projects return 200
      const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
        method: "GET",
        headers: {
          apikey: SUPABASE_ANON_KEY,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Consider 200 OK, and also 401/403 as "reachable" (service responded)
      this.status.canReachSupabase =
        response.ok || response.status === 401 || response.status === 403
      this.status.lastChecked = new Date()

      console.log(`✅ Supabase connectivity: ${this.status.canReachSupabase}`)
      return this.status.canReachSupabase
    } catch (error) {
      console.log("❌ Supabase connectivity check failed:", error)
      this.status.canReachSupabase = false
      this.status.lastChecked = new Date()
      return false
    }
  }

  getStatus(): NetworkStatus {
    return { ...this.status }
  }

  isNetworkAvailable(): boolean {
    return this.status.isConnected && this.status.canReachSupabase
  }

  shouldUseFallback(): boolean {
    return this.status.isSimulator && !this.status.canReachSupabase
  }

  async withNetworkFallback<T>(
    networkCall: () => Promise<T>,
    fallbackValue: T,
    operationName: string = "database operation",
  ): Promise<T> {
    if (this.shouldUseFallback()) {
      console.log(`📱 Using fallback for ${operationName} (iOS Simulator network issue)`)
      return fallbackValue
    }

    try {
      return await networkCall()
    } catch (error) {
      console.error(`❌ Network call failed for ${operationName}:`, error)

      // If it's a network error and we're in simulator, use fallback
      if (this.status.isSimulator && this.isNetworkError(error)) {
        console.log(`📱 Falling back for ${operationName} due to network error`)
        return fallbackValue
      }

      throw error
    }
  }

  private isNetworkError(error: any): boolean {
    return (
      error?.message?.includes("Network request failed") ||
      error?.message?.includes("fetch") ||
      error?.code === "NETWORK_ERROR" ||
      error?.name === "TypeError"
    )
  }
}

// Export singleton instance
export const networkManager = NetworkManager.getInstance()

// Utility function for database operations with fallback
export async function withDatabaseFallback<T>(
  networkCall: () => Promise<T>,
  fallbackValue: T,
  operationName: string = "database operation",
): Promise<T> {
  return networkManager.withNetworkFallback(networkCall, fallbackValue, operationName)
}
