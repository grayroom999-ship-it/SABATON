const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clear existing products
  console.log('🗑️  Clearing existing products...');
  await prisma.product.deleteMany({});
  console.log('✅ Cleared all products.');

  // 2. Create shoe categories
  const categoryNames = ['casual', 'formal', 'boots', 'all'];
  const categories = {};
  for (const name of categoryNames) {
    categories[name] = await prisma.shoeCategory.upsert({
      where: { name: name },
      update: {},
      create: { name: name },
    });
  }
  console.log('✅ Shoe categories created/verified.');

  // 3. Read product data
  const productsData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../products-data.json'), 'utf-8')
  );

  function mapCategoryToShoeCategories(category) {
    if (!category) return ['all'];
    const lower = category.toLowerCase();
    if (lower.includes('boot')) return ['casual', 'boots'];
    if (lower.includes('formal')) return ['formal'];
    if (lower.includes('casual')) return ['casual'];
    return ['all'];
  }

  // 4. Seed shoes – skip the Brown Casual Loafer Boot
  for (const p of productsData) {
    const productType = p.productType || 'shoe';
    if (productType !== 'shoe') continue;

    // 👇 Skip the Brown Casual Loafer Boot by name or any condition
    if (p.name && p.name.toLowerCase().includes('brown casual loafer boot')) {
      console.log(`⏭️ Skipping "${p.name}" as requested.`);
      continue;
    }

    const gender = p.gender || 'mens';
    const material = p.material || 'leather';
    const shoeCategoriesRaw = p.shoeCategories || mapCategoryToShoeCategories(p.category);

    const product = await prisma.product.create({
      data: {
        name: p.name,
        price: parseFloat(p.price),
        category: 'shoe',
        description: p.description,
        material: material,
        imageUrl: p.imageUrl,
        gender: gender,
      },
    });

    for (const catName of shoeCategoriesRaw) {
      const shoeCategory = categories[catName];
      if (shoeCategory) {
        await prisma.shoeCategoryOnProduct.create({
          data: {
            productId: product.id,
            shoeCategoryId: shoeCategory.id,
          },
        });
      } else {
        console.warn(`⚠️ Category "${catName}" not found for shoe ${p.name}`);
      }
    }

    if (p.variants && p.variants.length) {
      for (const v of p.variants) {
        const sku = v.sku || `${product.id}-${v.size}-${v.color}`.replace(/\s/g, '');
        await prisma.variant.create({
          data: {
            productId: product.id,
            size: parseInt(v.size),
            color: v.color,
            stock: v.stock,
            sku: sku,
            price: v.price || p.price,
          },
        });
      }
    }
    console.log(`✅ Added shoe: ${product.name} (gender: ${gender}, categories: ${shoeCategoriesRaw.join(', ')})`);
  }

  // 5. Seed accessories (unchanged – 7 items)
  const accessories = [
    {
      name: 'Premium Cedar Wood Shoe Horn',
      price: 3500,
      accessoryType: 'horn',
      fitsCategories: ['all'],
      crossSellScore: 95,
      gender: 'unisex',
      imageUrl: '/images/accessories/shoe-horn.jpg',
    },
    {
      name: 'Comfort Cotton Dress Socks (Black)',
      price: 2500,
      accessoryType: 'socks',
      fitsCategories: ['formal'],
      crossSellScore: 80,
      gender: 'unisex',
      imageUrl: '/images/accessories/dress-socks.jpg',
    },
    {
      name: 'Waxed Cotton Shoelaces (Black/Brown)',
      price: 1500,
      accessoryType: 'laces',
      fitsCategories: ['casual', 'boots'],
      crossSellScore: 70,
      gender: 'unisex',
      imageUrl: '/images/accessories/waxed-shoe-laces.jpg',
    },
    {
      name: 'Leather Conditioning Cream',
      price: 4500,
      accessoryType: 'cleaner',
      fitsCategories: ['all'],
      crossSellScore: 60,
      gender: 'unisex',
      imageUrl: '/images/accessories/leather-cream.jpg',
    },
    {
      name: 'Horsehair Shoe Brush',
      price: 3900,
      accessoryType: 'cleaner',
      fitsCategories: ['all'],
      crossSellScore: 85,
      gender: 'unisex',
      imageUrl: '/images/accessories/horsehair-brush.jpg',
    },
    {
      name: 'Waterproof Nano cream',
      price: 5900,
      accessoryType: 'cleaner',
      fitsCategories: ['casual', 'boots', 'formal'],
      crossSellScore: 90,
      gender: 'unisex',
      imageUrl: '/images/accessories/waterproof-cream.jpg',
    },
    {
      name: 'Cedar Shoe Trees (Pair)',
      price: 8900,
      accessoryType: 'horn',
      fitsCategories: ['all'],
      crossSellScore: 75,
      gender: 'unisex',
      imageUrl: '/images/accessories/shoe-trees.jpg',
    },
  ];

  for (const acc of accessories) {
    const product = await prisma.product.create({
      data: {
        name: acc.name,
        price: acc.price,
        category: 'accessory',
        description: `High-quality ${acc.accessoryType} for your leather shoes.`,
        imageUrl: acc.imageUrl,
        accessoryType: acc.accessoryType,
        crossSellScore: acc.crossSellScore,
        gender: acc.gender,
      },
    });

    for (const catName of acc.fitsCategories) {
      const shoeCategory = categories[catName];
      if (shoeCategory) {
        await prisma.accessoryShoeCategory.create({
          data: {
            accessoryId: product.id,
            shoeCategoryId: shoeCategory.id,
          },
        });
      } else {
        console.warn(`⚠️ Unknown shoe category: ${catName} for accessory ${acc.name}`);
      }
    }
    console.log(`✅ Added accessory: ${product.name} (fits: ${acc.fitsCategories.join(', ')}, gender: ${acc.gender})`);
  }

  console.log('🌱 Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });