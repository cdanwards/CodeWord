import { MMKV } from "react-native-mmkv"

export const storage = new MMKV({
  id: "codeword-app-storage",
  encryptionKey: "codeword-app-key",
})

// Zustand persistence middleware
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
