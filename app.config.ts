import { ExpoConfig, ConfigContext } from "@expo/config"

/**
 * Use ts-node here so we can use TypeScript for our Config Plugins
 * and not have to compile them to JavaScript
 */
require("ts-node/register")

/**
 * @param config ExpoConfig coming from the static config app.json if it exists
 *
 * You can read more about Expo's Configuration Resolution Rules here:
 * https://docs.expo.dev/workflow/configuration/#configuration-resolution-rules
 */
module.exports = ({ config }: ConfigContext): Partial<ExpoConfig> => {
  const existingPlugins = config.plugins ?? []

  return {
    ...config,
    extra: {
      // Add your environment variables here
      supabaseUrl: process.env.SUPABASE_URL || "https://peuvdwygnzjoexsqildc.supabase.co",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      databaseUrl:
        process.env.DATABASE_URL ||
        "postgresql://postgres:[YOUR-PASSWORD]@db.peuvdwygnzjoexsqildc.supabase.co:5432/postgres",
      betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    },
    ios: {
      ...config.ios,
      // This privacyManifests is to get you started.
      // See Expo's guide on apple privacy manifests here:
      // https://docs.expo.dev/guides/apple-privacy/
      // You may need to add more privacy manifests depending on your app's usage of APIs.
      // More details and a list of "required reason" APIs can be found in the Apple Developer Documentation.
      // https://developer.apple.com/documentation/bundleresources/privacy-manifest-files
      privacyManifests: {
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
            NSPrivacyAccessedAPITypeReasons: ["CA92.1"], // CA92.1 = "Access info from same app, per documentation"
          },
        ],
      },
    },
    plugins: [...existingPlugins, require("./plugins/withSplashScreen").withSplashScreen],
  }
}
