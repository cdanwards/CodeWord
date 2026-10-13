// Push notifications: permission, device registration and tap handling.
//
// The server decides what to send (notification triggers in migration 009) and the send-push
// Edge Function delivers through Expo. This module gets an Expo push token for the device and
// files it under the signed-in agent, so their pushes reach this phone.
import { useEffect, useRef } from "react"
import { Platform } from "react-native"
import Constants from "expo-constants"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { router } from "expo-router"

import { db } from "@/lib/database"
import { loadString, remove, saveString } from "@/utils/storage"

const TOKEN_KEY = "codeword.pushToken"
const ANDROID_CHANNEL = "operations"

/** What the send-push function puts in `data` (supabase/functions/send-push/messages.ts). */
export interface PushData {
  notificationId: number
  gameId: number | null
  kind: string
}

export type PushRegistration = "registered" | "denied" | "undetermined" | "unavailable"

// Show pushes while the app is open too: a report against you matters even mid-scroll.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

function projectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
}

export function pushDataOf(notification: Notifications.Notification): PushData | null {
  const data = notification.request.content.data as Partial<PushData> | undefined
  if (!data || typeof data.kind !== "string") return null
  return {
    notificationId: Number(data.notificationId),
    gameId: typeof data.gameId === "number" ? data.gameId : null,
    kind: data.kind,
  }
}

/**
 * Make sure this device receives the signed-in agent's pushes. With `prompt`, asks for
 * permission if the agent hasn't been asked yet; without it, only refreshes an existing grant.
 * Never throws: a missing permission or project ID just means no pushes.
 */
export async function registerForPush({ prompt }: { prompt: boolean }): Promise<PushRegistration> {
  try {
    if (Platform.OS !== "ios" && Platform.OS !== "android") return "unavailable"

    if (Platform.OS === "android") {
      // Android 13+ only shows the permission prompt once a channel exists.
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
        name: "Operations",
        importance: Notifications.AndroidImportance.HIGH,
      })
    }

    let { status } = await Notifications.getPermissionsAsync()
    if (status === "undetermined" && prompt) {
      status = (await Notifications.requestPermissionsAsync()).status
    }
    if (status !== "granted") return status === "denied" ? "denied" : "undetermined"

    // Simulators can't get an Expo push token, and tokens need the EAS project ID
    // (EAS_PROJECT_ID, see app.config.ts).
    const id = projectId()
    if (!Device.isDevice || !id) return "unavailable"

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id })
    const result = await db.registerPushToken(token, Platform.OS)
    if (!result.ok) {
      console.warn("Push registration failed:", result.message)
      return "unavailable"
    }
    saveString(TOKEN_KEY, token)
    return "registered"
  } catch (e) {
    console.warn("Push registration failed:", e)
    return "unavailable"
  }
}

/** Stop sending this device the current agent's pushes. Call before signing out. */
export async function unregisterFromPush() {
  const token = loadString(TOKEN_KEY)
  if (!token) return
  remove(TOKEN_KEY)
  const result = await db.unregisterPushToken(token)
  if (!result.ok) console.warn("Push unregistration failed:", result.message)
}

/**
 * For the signed-in app shell: refresh this device's registration, and open the operation a
 * push is about when it's tapped (including the tap that launched the app).
 */
export function usePushNotifications() {
  const lastResponse = Notifications.useLastNotificationResponse()
  const handled = useRef<string | null>(null)

  useEffect(() => {
    registerForPush({ prompt: false })
  }, [])

  useEffect(() => {
    if (!lastResponse) return
    const id = lastResponse.notification.request.identifier
    if (handled.current === id) return
    handled.current = id

    const data = pushDataOf(lastResponse.notification)
    if (data?.gameId) router.push(`/game/${data.gameId}`)
    Notifications.clearLastNotificationResponseAsync().catch(() => {})
  }, [lastResponse])
}

/** Call `onPush` when a push about `gameId` arrives while the app is open. */
export function usePushesForGame(gameId: number, onPush: () => void) {
  const callback = useRef(onPush)
  callback.current = onPush

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      if (pushDataOf(notification)?.gameId === gameId) callback.current()
    })
    return () => subscription.remove()
  }, [gameId])
}
