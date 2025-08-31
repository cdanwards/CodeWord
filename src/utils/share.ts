import { Share } from "react-native"

export async function shareCode(code: string) {
  try {
    await Share.share({ message: `Join my Codeword game. Code: #${code}` })
  } catch {
    // noop
  }
}

export async function copyToClipboard(text: string) {
  try {
    // Web support
    if (typeof navigator !== "undefined" && (navigator as any).clipboard?.writeText) {
      await (navigator as any).clipboard.writeText(text)
      return true
    }
  } catch {
    // ignore
  }
  return false
}
