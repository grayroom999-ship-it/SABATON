const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Converting gender column to TEXT...')
  await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ALTER COLUMN gender TYPE TEXT;`)
  console.log('✅ Gender column is now TEXT')
  
  console.log('🔄 Adding hoverImageUrl column...')
  await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "hoverImageUrl" TEXT;`)
  console.log('✅ hoverImageUrl column added')
  
  await prisma.$disconnect()
  console.log('🎉 Done! Restart your app with "pnpm run dev"')
}

main().catch(console.error)