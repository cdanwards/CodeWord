# Spec 03: MMKV Encryption Key Hardening

**Phase:** 2 (Critical Fixes)
**Priority:** Critical — security vulnerability
**Effort:** 2-4 hours
**Dependencies:** Spec 01 (dead code removal)
**Blocked by:** Phase 1 completion

---

## Objective

Replace the hardcoded MMKV encryption key with a per-device randomly generated key stored in Secure Store. Currently, the key `"codeword-app-key"` ships with the app binary and provides no meaningful protection on jailbroken/decompiled devices.

---

## Current Code

**File:** `src/stores/storage.ts`
```typescript
import { MMKV } from "react-native-mmkv"

export const storage = new MMKV({
  id: "codeword-app-storage",
  encryptionKey: "codeword-app-key",  // <-- HARDCODED
})

export const zustandStorage = {
  setItem: (name: string, value: string) => {
    return storage.set(name, value)
  },
  getItem: (name: string) => {
    const value = storage.getString(name)
    return value ?? null
  },
  removeItem: (name: string) => {
    return storage.delete(name)
  },
}
```

---

## Required Changes

### 1. Create a key management utility

**New file:** `src/utils/storage/encryption-key.ts`

```typescript
import * as SecureStore from "expo-secure-store"
import * as Crypto from "expo-crypto"

const ENCRYPTION_KEY_ID = "codeword-mmkv-encryption-key"

/**
 * Get or generate a per-device encryption key for MMKV.
 * The key is stored in the device's Secure Store (Keychain on iOS, Keystore on Android).
 * Returns null if Secure Store is unavailable (e.g., some simulator configurations).
 */
export async function getOrCreateEncryptionKey(): Promise<string | undefined> {
  try {
    const existing = await SecureStore.getItemAsync(ENCRYPTION_KEY_ID)
    if (existing) return existing

    const newKey = Crypto.randomUUID()
    await SecureStore.setItemAsync(ENCRYPTION_KEY_ID, newKey)
    return newKey
  } catch {
    // Secure Store unavailable (e.g., some CI environments)
    // Fall back to no encryption rather than crashing
    return undefined
  }
}
```

### 2. Update storage initialization

**File:** `src/stores/storage.ts`

The MMKV instance must be created synchronously, but the encryption key comes from an async call. Two approaches:

**Approach A (recommended): Lazy initialization with a setup function**

```typescript
import { MMKV } from "react-native-mmkv"

let storage: MMKV

export async function initializeStorage(encryptionKey?: string): Promise<void> {
  storage = new MMKV({
    id: "codeword-app-storage",
    ...(encryptionKey ? { encryptionKey } : {}),
  })
}

// Fallback for synchronous access before init completes
function getStorage(): MMKV {
  if (!storage) {
    // Create unencrypted instance as fallback; will be replaced after init
    storage = new MMKV({ id: "codeword-app-storage" })
  }
  return storage
}

export const zustandStorage = {
  setItem: (name: string, value: string) => getStorage().set(name, value),
  getItem: (name: string) => getStorage().getString(name) ?? null,
  removeItem: (name: string) => getStorage().delete(name),
}
```

### 3. Call initialization at app startup

**File:** `src/components/AuthProvider.tsx` (or `src/app/_layout.tsx`)

Call `initializeStorage()` with the key from Secure Store before the app renders:

```typescript
import { getOrCreateEncryptionKey } from "@/utils/storage/encryption-key"
import { initializeStorage } from "@/stores/storage"

// In the root layout or AuthProvider, before any store access:
useEffect(() => {
  async function init() {
    const key = await getOrCreateEncryptionKey()
    await initializeStorage(key)
  }
  init()
}, [])
```

### 4. Handle existing data migration

When the encryption key changes from the hardcoded value to a per-device key, existing MMKV data becomes unreadable. The Zustand auth store persists `user`, `session`, and `isAuthenticated`. Since Spec 05 will remove `session` from persistence, and `user`/`isAuthenticated` will be refreshed from Supabase on next launch, it's safe to let the old data be lost — the user will simply need to re-authenticate once.

---

## Files Changed

| File | Change |
|------|--------|
| `src/stores/storage.ts` | Replace hardcoded key with lazy init pattern |
| `src/utils/storage/encryption-key.ts` | **New** — key generation + Secure Store management |
| `src/components/AuthProvider.tsx` or `src/app/_layout.tsx` | Call `initializeStorage()` at startup |
| `src/utils/storage/storage.test.ts` | Update tests to work with new init pattern |

---

## Acceptance Criteria

- [ ] No hardcoded encryption key anywhere in the codebase (`grep -r "codeword-app-key" src/` returns nothing)
- [ ] Encryption key is generated per-device using `expo-crypto`
- [ ] Key is stored in `expo-secure-store` (Keychain/Keystore)
- [ ] App starts successfully on a fresh install (first key generation)
- [ ] App starts successfully on subsequent launches (key retrieval)
- [ ] MMKV storage functions correctly after initialization
- [ ] `yarn compile` passes
- [ ] `yarn test` passes

---

## Risks

- **Data loss on upgrade:** Existing MMKV data will be unreadable after the key change. This is acceptable because the auth session will be refreshed from Supabase's Secure Store adapter, and Spec 05 will remove session tokens from MMKV entirely.
- **Timing:** MMKV must be initialized before any Zustand store access. If the async init hasn't completed, the fallback unencrypted instance handles the gap.
