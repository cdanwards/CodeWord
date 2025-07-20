import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import { db, authSecret } from "../../supabase/database"

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: authSecret,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
})
