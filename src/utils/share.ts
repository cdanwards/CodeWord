import { Share } from "react-native"
import * as Clipboard from "expo-clipboard"

export async function shareCode(code: string) {
  try {
    await Share.share({ message: `Join my Codeword game. Code: #${code}` })
  } catch {
    // noop
  }
}

/** Copies text to the clipboard (native and web). Returns whether it worked. */
export async function copyToClipboard(text: string) {
  try {
    return await Clipboard.setStringAsync(text)
  } catch {
    return false
  }
}
