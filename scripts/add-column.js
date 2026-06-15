// add-column.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$executeRaw`ALTER TABLE product ADD COLUMN IF NOT EXISTS "hoverImageUrl" TEXT;`
    console.log('✅ Column "hoverImageUrl" added successfully')
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()