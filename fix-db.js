const { Client } = require('pg')
require('dotenv').config()

const client = new Client({
  connectionString: process.env.DATABASE_URL,
})

async function main() {
  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Convert gender column to TEXT (removes enum constraint)
    await client.query(`ALTER TABLE "Product" ALTER COLUMN gender TYPE TEXT;`)
    console.log('✅ Gender column is now TEXT')

    // Add hoverImageUrl column if not exists
    await client.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "hoverImageUrl" TEXT;`)
    console.log('✅ hoverImageUrl column added')

    await client.end()
    console.log('🎉 Database fixed! Restart your app.')
  } catch (err) {
    console.error('❌ Error:', err.message)
    await client.end()
  }
}

main()