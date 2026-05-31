// prisma/seed-100.js
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env (if not already loaded)
require('dotenv').config();

// Create a PostgreSQL connection pool using the DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the Prisma adapter
const adapter = new PrismaPg(pool);

// Instantiate PrismaClient with the adapter
const prisma = new PrismaClient({ adapter });

async function main() {
  const productsData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../products-data.json'), 'utf-8')
  );

  for (const p of productsData) {
    const slug = p.name.toLowerCase().replace(/ /g, '-');
    const imageUrl = `/images/${slug}.jpg`;   // or .webp – match your actual files

    // Create product
    const product = await prisma.product.create({
      data: {
        name: p.name,
        price: parseInt(p.price),
        category: p.category,
        description: p.description,
        material: p.material,
        imageUrl: imageUrl,
      }
    });

    // Create variants with a unique sku
    if (p.variants && p.variants.length) {
      for (const v of p.variants) {
        // Generate a unique SKU (product ID + size + color)
        const sku = `${product.id}-${v.size}-${v.color}`.replace(/\s/g, '');
        await prisma.variant.create({
          data: {
            productId: product.id,
            size: v.size,
            color: v.color,
            stock: v.stock,
            sku: sku,
          }
        });
      }
    }
    console.log(`✅ Added ${product.name} → ${imageUrl}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });