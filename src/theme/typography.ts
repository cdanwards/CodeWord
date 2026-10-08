// Codeword "spy dossier" type system (see the Claude Design project "Codeword — Spy Dossier").
// - display: Barlow Condensed, uppercase headlines, buttons and stamps
// - primary: Archivo, body copy
// - mono: IBM Plex Mono, file labels, metadata, codes

import {
  Archivo_400Regular as archivoRegular,
  Archivo_500Medium as archivoMedium,
  Archivo_600SemiBold as archivoSemiBold,
  Archivo_700Bold as archivoBold,
} from "@expo-google-fonts/archivo"
import {
  BarlowCondensed_600SemiBold as barlowCondensedSemiBold,
  BarlowCondensed_700Bold as barlowCondensedBold,
  BarlowCondensed_800ExtraBold as barlowCondensedExtraBold,
} from "@expo-google-fonts/barlow-condensed"
import {
  IBMPlexMono_400Regular as plexMonoRegular,
  IBMPlexMono_500Medium as plexMonoMedium,
  IBMPlexMono_600SemiBold as plexMonoSemiBold,
} from "@expo-google-fonts/ibm-plex-mono"

export const customFontsToLoad = {
  archivoRegular,
  archivoMedium,
  archivoSemiBold,
  archivoBold,
  barlowCondensedSemiBold,
  barlowCondensedBold,
  barlowCondensedExtraBold,
  plexMonoRegular,
  plexMonoMedium,
  plexMonoSemiBold,
}

const fonts = {
  archivo: {
    normal: "archivoRegular",
    medium: "archivoMedium",
    semiBold: "archivoSemiBold",
    bold: "archivoBold",
  },
  barlowCondensed: {
    semiBold: "barlowCondensedSemiBold",
    bold: "barlowCondensedBold",
    extraBold: "barlowCondensedExtraBold",
  },
  plexMono: {
    normal: "plexMonoRegular",
    medium: "plexMonoMedium",
    semiBold: "plexMonoSemiBold",
  },
}

export const typography = {
  /**
   * The fonts are available to use, but prefer using the semantic name.
   */
  fonts,
  /**
   * Body copy.
   */
  primary: fonts.archivo,
  /**
   * Condensed uppercase display face: headlines, buttons, stamps.
   */
  display: fonts.barlowCondensed,
  /**
   * File labels, metadata and codes.
   */
  mono: fonts.plexMono,
}
