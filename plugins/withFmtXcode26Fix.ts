import { ConfigPlugin, withDangerousMod } from "expo/config-plugins"
import fs from "fs"
import path from "path"

const MARKER = "# withFmtXcode26Fix"

/**
 * Expo Config Plugin that compiles the `fmt` pod as C++17.
 *
 * React Native 0.79 ships fmt 11.0.2, whose `consteval` format strings fail to compile
 * with the Xcode 26 toolchain ("call to consteval function ... is not a constant expression").
 * Under C++17 fmt does not use `consteval`, so the pod builds.
 *
 * Remove this plugin after upgrading to an Expo SDK / React Native version that ships a fixed fmt.
 */
export const withFmtXcode26Fix: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile")
      const podfile = fs.readFileSync(podfilePath, "utf8")
      if (podfile.includes(MARKER)) return config

      const snippet = [
        `    ${MARKER}`,
        "    installer.pods_project.targets.each do |target|",
        "      next unless target.name == 'fmt'",
        "      target.build_configurations.each do |build_config|",
        "        build_config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'",
        "      end",
        "    end",
      ].join("\n")

      // Must run after react_native_post_install, which sets every pod to C++20.
      const anchor = /react_native_post_install\([\s\S]*?\n\s*\)\n/
      if (!anchor.test(podfile)) {
        throw new Error("withFmtXcode26Fix: could not find react_native_post_install in Podfile")
      }
      fs.writeFileSync(
        podfilePath,
        podfile.replace(anchor, (match) => `${match}${snippet}\n`),
      )
      return config
    },
  ])
