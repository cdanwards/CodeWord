import { colors as colorsLight } from "./colors"
import { colors as colorsDark } from "./colorsDark"
import { spacing as spacingLight } from "./spacing"
import { spacing as spacingDark } from "./spacingDark"
import { timing } from "./timing"
import { borderWidth, elevation, opacities, radii, size, zIndices } from "./tokens"
import type { Theme } from "./types"
import { typography } from "./typography"

// Here we define our themes.
export const lightTheme: Theme = {
  colors: colorsLight,
  spacing: spacingLight,
  typography,
  timing,
  radii,
  borderWidth,
  elevation,
  opacities,
  zIndices,
  size,
  isDark: false,
}
export const darkTheme: Theme = {
  colors: colorsDark,
  spacing: spacingDark,
  typography,
  timing,
  radii,
  borderWidth,
  elevation,
  opacities,
  zIndices,
  size,
  isDark: true,
}
