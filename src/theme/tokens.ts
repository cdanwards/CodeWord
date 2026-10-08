// Centralized design tokens for non-color primitives
// These are imported into the theme and exposed via the Theme interface

export const radii = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
} as const

export const borderWidth = {
  hairline: 0.5,
  thin: 1,
  thick: 2,
} as const

export const elevation = {
  none: 0,
  xs: 1,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
} as const

export const opacities = {
  disabled: 0.5,
  overlay: 0.5,
  muted: 0.7,
} as const

export const zIndices = {
  base: 0,
  dropdown: 1000,
  modal: 2000,
  toast: 3000,
} as const

export const size = {
  controlHeight: 56,
  icon: 20,
  iconSm: 16,
  avatar: 40,
  avatarSm: 32,
  cardPadding: 16,
} as const
