const { Client } = require("pg")
require("dotenv").config()

// Test users data
const testUsers = [
  {
    id: "user_01h123456789abcdef",
    email: "john.doe@example.com",
    name: "John Doe",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    emailVerified: true,
    fullName: "John Michael Doe",
    phone: "+1-555-0123",
  },
  {
    id: "user_02h123456789abcdef",
    email: "jane.smith@example.com",
    name: "Jane Smith",
    image:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    emailVerified: true,
    fullName: "Jane Elizabeth Smith",
    phone: "+1-555-0456",
  },
  {
    id: "user_03h123456789abcdef",
    email: "mike.johnson@example.com",
    name: "Mike Johnson",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    emailVerified: false,
    fullName: "Michael Robert Johnson",
    phone: "+1-555-0789",
  },
  {
    id: "user_04h123456789abcdef",
    email: "sarah.wilson@example.com",
    name: "Sarah Wilson",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    emailVerified: true,
    fullName: "Sarah Anne Wilson",
    phone: "+1-555-0321",
  },
  {
    id: "user_05h123456789abcdef",
    email: "david.brown@example.com",
    name: "David Brown",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    emailVerified: true,
    fullName: "David Christopher Brown",
    phone: "+1-555-0654",
  },
]

// Test accounts data (OAuth providers)
const testAccounts = [
  {
    id: "acc_01h123456789abcdef",
    userId: "user_01h123456789abcdef",
    type: "oauth",
    provider: "google",
    providerAccountId: "123456789",
    accessToken: "mock_access_token_1",
    refreshToken: "mock_refresh_token_1",
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    tokenType: "Bearer",
    scope: "email profile",
  },
  {
    id: "acc_02h123456789abcdef",
    userId: "user_02h123456789abcdef",
    type: "oauth",
    provider: "github",
    providerAccountId: "987654321",
    accessToken: "mock_access_token_2",
    refreshToken: "mock_refresh_token_2",
    expiresAt: new Date(Date.now() + 3600000),
    tokenType: "Bearer",
    scope: "user:email",
  },
]

async function seedUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log("🔗 Connected to database")

    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'user_profiles', 'accounts')
    `)

    console.log(
      "📋 Available tables:",
      tablesResult.rows.map((row) => row.table_name),
    )

    // Insert users
    console.log("👥 Inserting users...")
    for (const user of testUsers) {
      const { id, email, name, image, emailVerified, fullName, phone } = user

      try {
        // Insert into users table
        await client.query(
          `
          INSERT INTO users (id, email, name, image, email_verified, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `,
          [id, email, name, image, emailVerified],
        )

        // Insert into user_profiles table
        await client.query(
          `
          INSERT INTO user_profiles (user_id, full_name, phone, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
        `,
          [id, fullName, phone],
        )

        console.log(`✅ Added user: ${name} (${email})`)
      } catch (error) {
        if (error.code === "23505") {
          // Unique violation
          console.log(`⚠️  User already exists: ${name} (${email})`)
        } else {
          console.error(`❌ Error adding user ${name}:`, error.message)
        }
      }
    }

    // Insert accounts
    console.log("🔐 Inserting OAuth accounts...")
    for (const account of testAccounts) {
      try {
        await client.query(
          `
          INSERT INTO accounts (
            id, user_id, type, provider, provider_account_id, 
            access_token, refresh_token, expires_at, token_type, scope,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        `,
          [
            account.id,
            account.userId,
            account.type,
            account.provider,
            account.providerAccountId,
            account.accessToken,
            account.refreshToken,
            account.expiresAt,
            account.tokenType,
            account.scope,
          ],
        )

        console.log(`✅ Added account for user: ${account.userId}`)
      } catch (error) {
        if (error.code === "23505") {
          // Unique violation
          console.log(`⚠️  Account already exists for user: ${account.userId}`)
        } else {
          console.error(`❌ Error adding account for ${account.userId}:`, error.message)
        }
      }
    }

    // Verify the data
    const userCount = await client.query("SELECT COUNT(*) FROM users")
    const profileCount = await client.query("SELECT COUNT(*) FROM user_profiles")
    const accountCount = await client.query("SELECT COUNT(*) FROM accounts")

    console.log("\n📊 Database Summary:")
    console.log(`   Users: ${userCount.rows[0].count}`)
    console.log(`   User Profiles: ${profileCount.rows[0].count}`)
    console.log(`   OAuth Accounts: ${accountCount.rows[0].count}`)

    console.log("\n🎉 Test data seeding completed successfully!")
  } catch (error) {
    console.error("❌ Error seeding data:", error.message)
  } finally {
    await client.end()
  }
}

// Run the seeding
seedUsers()
