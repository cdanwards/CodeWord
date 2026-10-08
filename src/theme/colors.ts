// Codeword "spy dossier" palette. Source of truth is dossier.css in the Claude Design project
// "Codeword — Spy Dossier" (OKLCH there, converted to hex here because React Native has no OKLCH).
// The Ignite palette keys are kept and remapped so older components inherit the look.
const palette = {
  neutral100: "#F8F4EC", // paper
  neutral200: "#F1EBDE", // paper 2
  neutral300: "#D5D1C9", // rule on paper, opaque
  neutral400: "#B1ACA5",
  neutral500: "#857F7A", // ink 3
  neutral600: "#554E49", // ink 2
  neutral700: "#36302B",
  neutral800: "#1D1713", // ink
  neutral900: "#120D0A", // night

  primary100: "#F3D9D2",
  primary200: "#E8B1A9",
  primary300: "#DC8A80",
  primary400: "#CF5A51",
  primary500: "#BE241F", // stamp red
  primary600: "#9E1C18",

  secondary100: "#F4ECDC",
  secondary200: "#E9D7B4", // manila
  secondary300: "#DEC59D", // manila 2
  secondary400: "#8C7A5A",
  secondary500: "#5C4E36",

  accent100: "#F4ECDC",
  accent200: "#E9D7B4",
  accent300: "#DEC59D",
  accent400: "#C9AE80",
  accent500: "#B39466",

  angry100: "#F3D9D2",
  angry500: "#BE241F",

  overlay20: "rgba(29, 23, 19, 0.2)",
  overlay50: "rgba(8, 5, 3, 0.55)",
} as const

export const colors = {
  /**
   * The palette is available to use, but prefer using the name.
   * This is only included for rare, one-off cases. Try to use
   * semantic names as much as possible.
   */
  palette,
  /**
   * A helper for making something see-thru.
   */
  transparent: "rgba(0, 0, 0, 0)",
  /**
   * The default text color in many components.
   */
  text: palette.neutral800,
  /**
   * Secondary text information.
   */
  textDim: palette.neutral600,
  /**
   * The default color of the screen background.
   */
  background: palette.neutral100,
  /**
   * The default border color.
   */
  border: palette.neutral400,
  /**
   * The main tinting color.
   */
  tint: palette.primary500,
  /**
   * The inactive tinting color.
   */
  tintInactive: palette.neutral300,
  /**
   * A subtle color used for lines.
   */
  separator: palette.neutral300,
  /**
   * Error messages.
   */
  error: palette.angry500,
  /**
   * Error Background.
   */
  errorBackground: palette.angry100,
  /**
   * Semantic roles
   */
  success: "#3F6B3A",
  successBackground: "#E3E9D6",
  warning: "#8C5A12",
  warningBackground: "#F4ECDC",
  info: palette.neutral800,
  infoBackground: palette.neutral200,
  /**
   * Dossier surfaces and inks. Prefer these in new code.
   */
  paper: palette.neutral100,
  paper2: palette.neutral200,
  manila: palette.secondary200,
  manila2: palette.secondary300,
  ink: palette.neutral800,
  ink2: palette.neutral600,
  ink3: palette.neutral500,
  red: palette.primary500,
  redWash: "rgba(190, 36, 31, 0.08)",
  night: palette.neutral900,
  night2: "#201B16",
  onNight: palette.neutral100,
  onNight2: "#BBB7AF",
  rule: "rgba(29, 23, 19, 0.16)",
  ruleStrong: "rgba(29, 23, 19, 0.55)",
  nightRule: "rgba(248, 244, 236, 0.14)",
  folderBorder: "rgba(29, 23, 19, 0.12)",
  scrim: palette.overlay50,
  /**
   * Game status stamps
   */
  status: {
    waiting: { bg: palette.neutral100, text: palette.neutral800 },
    active: { bg: palette.neutral100, text: palette.primary500 },
    ended: { bg: palette.neutral200, text: palette.neutral500 },
  },
} as const
