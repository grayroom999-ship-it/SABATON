// prisma/seed-100.js

// Load .env
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Create a PostgreSQL connection pool using your DATABASE_URL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Instantiate PrismaClient with the adapter – no accelerateUrl needed!
const prisma = new PrismaClient({ adapter });

console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? '✅ set' : '❌ missing');

// ------------------------------------------------------------------
// PRODUCT DATA – all 21 items (13 male + 8 female)
// (kept exactly as before)
// ------------------------------------------------------------------
const allProducts = [
  // ============ MEN (13) ============
  {
    name: "Classic Leather Oxford",
    price: 78000,
    category: 'formal',
    description: 'Premium full-grain leather Oxford with high-shine finish. Closed-lacing, stacked heel, cushioned insole. Ideal for boardrooms, weddings, and black-tie events. Timeless formal staple.',
    material: 'leather',
    imageUrl: '/images/classic-oxford.jpg',
    hoverImageUrl: '/images/classic-oxford-2.jpg',
    gender: 'male',
    variants: [
      { size: 8, color: 'Black', stock: 20, price: 78000 },
      { size: 9, color: 'Black', stock: 25, price: 78000 },
      { size: 10, color: 'Brown', stock: 15, price: 78000 },
    ],
  },
  {
    name: "Suede Chukka Boots",
    price: 89400,
    category: 'boots',
    description: 'Soft suede chukka boots with natural crepe rubber sole. Two-eyelet, ankle-height, cushioned footbed. Versatile smart-casual wear – city strolls, creative offices, or weekend getaways.',
    material: 'suede',
    imageUrl: '/images/Sabaton-shoes-oslo-high-boots-last-black-calf-vibram-dainite-sole.jpg',
    hoverImageUrl: '/images/Sabaton-shoes-oslo-2-high-boots-last-black-calf-vibram-dainite-sole.jpg',
    gender: 'male',
    variants: [
      { size: 9, color: 'Black', stock: 18, price: 89400 },
      { size: 10, color: 'Grey', stock: 12, price: 89400 },
    ],
  },
  {
    name: "Suede Loafers",
    price: 54000,
    category: 'casual',
    description: 'Lightweight suede-texture slip-ons with memory-foam insole and flexible rubber outsole. Breathable and cushioned. Ideal for travel, casual Fridays, and warm-weather outings.',
    material: 'fabric',
    imageUrl: '/images/SABATON-Shoes-Handcrafted-suede-.jpg',
    hoverImageUrl: '/images/Tan-Casual-Loafer-Boot.jpg',
    gender: 'male',
    variants: [
      { size: 10, color: 'Tan', stock: 30, price: 54000 },
      { size: 11, color: 'Black', stock: 22, price: 54000 },
    ],
  },
  {
    name: "Balmoral Suede",
    price: 65700,
    category: 'formal',
    description: 'Hand-burnished leather Balmoral with closed-lacing and cushioned leather lining. Sleek, formal silhouette. Perfect for presentations, upscale dinners, and ceremonies.',
    material: 'leather',
    imageUrl: '/images/Sabaton-leather-suede-balmoral.jpg',
    hoverImageUrl: '/images/Sabaton-leather-suede-balmoral-2.jpg',
    gender: 'male',
    variants: [
      { size: 8, color: 'Brown', stock: 14, price: 65700 },
      { size: 9, color: 'Black', stock: 19, price: 65700 },
    ],
  },
  {
    name: "Budapest Bp",
    price: 95400,
    category: 'formal',
    description: 'Classic Budapest full-grain leather with hand-stitched brogue detailing and Goodyear-welt construction. Rich patina over time. Suited for business lunches, gallery openings, and semi-formal events.',
    material: 'leather',
    imageUrl: '/images/Brown-budapest-bp.jpg',
    hoverImageUrl: '/images/Brown-Budapest-Bp-2.jpg',
    gender: 'male',
    variants: [
      { size: 9, color: 'Brown', stock: 10, price: 95400 },
      { size: 10, color: 'Black', stock: 8, price: 95400 },
    ],
  },
  {
    name: "Budapest high Boots",
    price: 84000,
    category: 'boots',
    description: 'High-top Budapest boots in premium leather with brogue detailing and stacked heel. Ankle-hugging, sturdy. Perfect for autumn, countryside, or pairing with tailored trousers.',
    material: 'leather',
    imageUrl: '/images/SABATON-shoes-budapest-high-boots.jpg',
    hoverImageUrl: '/images/SABATON-shoes-budapest-high-boots(2).jpg',
    gender: 'male',
    variants: [
      { size: 9, color: 'Black', stock: 16, price: 84000 },
      { size: 10, color: 'Brown', stock: 13, price: 84000 },
    ],
  },
  {
    name: "Driving Moccasins",
    price: 48000,
    category: 'formal',
    description: 'Hand-stitched leather moccasins with pebble-rubber sole for superior pedal grip. Unlined, molds to foot. Ideal for driving, road trips, and resort lounging.',
    material: 'leather',
    imageUrl: '/images/Balmoral-Casual-Loafer-Boot.jpg',
    hoverImageUrl: '/images/Balmoral-Casual-Loafer-Boot(2).jpg',
    gender: 'male',
    variants: [
      { size: 8, color: 'Brown', stock: 25, price: 48000 },
      { size: 9, color: 'Grey', stock: 20, price: 48000 },
    ],
  },
  {
    name: "Derby Shoes",
    price: 71400,
    category: 'formal',
    description: 'Open-lacing Derby in smooth full-grain leather with burnished toe. Durable leather-rubber sole, accommodates high insteps. Versatile for business-casual, outdoor weddings, and city exploring.',
    material: 'leather',
    imageUrl: '/images/derby-shoes.jpg',
    hoverImageUrl: '/images/derby-shoes-hover.jpg',
    gender: 'male',
    variants: [
      { size: 10, color: 'Black', stock: 12, price: 71400 },
      { size: 11, color: 'Brown', stock: 9, price: 71400 },
    ],
  },
  {
    name: "Budapest Balmoral",
    price: 107400,
    category: 'formal',
    description: 'Waterproof leather Budapest Balmoral with sealed seams and closed-lacing. Military-inspired elegance. Reliable grip for rainy city streets without compromising formality.',
    material: 'leather',
    imageUrl: '/images/Budapest-Balmoral-Leather-2.jpg',
    hoverImageUrl: '/images/Budapest- Balmoral-leather.jpg',
    gender: 'male',
    variants: [
      { size: 10, color: 'Brown', stock: 11, price: 107400 },
      { size: 11, color: 'Olive', stock: 7, price: 107400 },
    ],
  },
  {
    name: "Chukka Boots",
    price: 36000,
    category: 'boots',
    description: 'Breathable leather chukka boots with jute-wrapped rope sole. Two-eyelet, relaxed silhouette. Great for resorts, summer festivals, and casual daytime wear.',
    material: 'leather',
    imageUrl: '/images/shoes-chukka-boots.jpg',
    hoverImageUrl: '/images/shoes-chukka-boots-2.jpg',
    gender: 'male',
    variants: [
      { size: 9, color: 'Beige', stock: 30, price: 36000 },
      { size: 10, color: 'Navy', stock: 28, price: 36000 },
    ],
  },
  {
    name: "Cognac Antigue",
    price: 101400,
    category: 'formal',
    description: 'Striking monk-strap shoes in rich cognac with multitone patina finish. Bold hardware, leather-lined. Modern flair for networking, cocktail parties, and creative studios.',
    material: 'leather',
    imageUrl: '/images/SABATON-last-antique-cognac-1-.jpg',
    hoverImageUrl: '/images/SABATON-last-antique-cognac.jpg',
    gender: 'male',
    variants: [
      { size: 8, color: 'Brown', stock: 10, price: 101400 },
      { size: 9, color: 'Black', stock: 12, price: 101400 },
    ],
  },
  {
    name: "Musuem Calf",
    price: 101400,
    category: 'casual',
    description: 'Exquisite museum calf leather with unique mottled finish. Single comfort sole, lightweight and breathable. Artisan style for gallery openings, travel, and collectors.',
    material: 'leather',
    imageUrl: '/images/SABATON-handcrafted-museum-calf-single-sole.jpg',
    hoverImageUrl: '/images/SABATON-handcrafted-museum-calf-single-sole-2.jpg',
    gender: 'male',
    variants: [
      { size: 8, color: 'Brown', stock: 10, price: 101400 },
      { size: 9, color: 'Black', stock: 12, price: 101400 },
    ],
  },
  {
    name: "Black Budapest Bp",
    price: 101400,
    category: 'formal',
    description: 'Black full-grain Budapest leather with wingtip and brogue perforations. Goodyear-welted, mirror shine. Essential for high-profile meetings, galas, and black-tie occasions.',
    material: 'leather',
    imageUrl: '/images/Black-Budapest-Bp-2.jpg',
    hoverImageUrl: '/images/Black-Budapest-Bp.jpg',
    gender: 'male',
    variants: [
      { size: 8, color: 'Brown', stock: 10, price: 101400 },
      { size: 9, color: 'Black', stock: 12, price: 101400 },
    ],
  },

  // ============ WOMEN (8) ============
  {
    name: "Ballet Flats",
    price: 53400,
    category: 'casual',
    description: 'Elegant leather ballet flats with rounded toe, flexible rubber sole, and cushioned footbed. Breathable leather lining. Perfect for commuting, brunch, or weekend strolls.',
    material: 'leather',
    imageUrl: '/images/ballet-flats.jpg',
    hoverImageUrl: '/images/ballet-flats-hover.jpg',
    gender: 'female',
    variants: [
      { size: 6, color: 'Black', stock: 20, price: 53400 },
      { size: 7, color: 'Nude', stock: 18, price: 53400 },
    ],
  },
  {
    name: "Ankle Boots",
    price: 78000,
    category: 'boots',
    description: 'Chic leather ankle boots with 2-inch block heel, side zipper, and padded insole. Breathable lining. Versatile for desk-to-dinner, pairs with trousers, skirts, or jeans.',
    material: 'leather',
    imageUrl: '/images/ankle-boots.jpg',
    hoverImageUrl: '/images/ankle-boots-hover.jpg',
    gender: 'female',
    variants: [
      { size: 6, color: 'Black', stock: 15, price: 78000 },
      { size: 7, color: 'Tan', stock: 10, price: 78000 },
    ],
  },
  {
    name: "Pointed-Toe Pumps",
    price: 65700,
    category: 'formal',
    description: 'Classic pointed-toe pumps with stiletto heel and leather lining. Padded footbed reduces pressure. Ideal for boardrooms, galas, weddings, and cocktail receptions.',
    material: 'leather',
    imageUrl: '/images/pumps.jpg',
    hoverImageUrl: '/images/pumps-hover.jpg',
    gender: 'female',
    variants: [
      { size: 6, color: 'Black', stock: 12, price: 65700 },
      { size: 7, color: 'Red', stock: 8, price: 65700 },
    ],
  },
  {
    name: "Platform Sandals",
    price: 45000,
    category: 'casual',
    description: 'Trendy fabric platform sandals with 1.5-inch sole, adjustable ankle strap, and contoured foam footbed. Stable and cushioned. Great for festivals, beach, or rooftop parties.',
    material: 'fabric',
    imageUrl: '/images/platform-sandals.jpg',
    hoverImageUrl: '/images/platform-sandals-hover.jpg',
    gender: 'female',
    variants: [
      { size: 7, color: 'White', stock: 22, price: 45000 },
      { size: 8, color: 'Gold', stock: 14, price: 45000 },
    ],
  },
  {
    name: "Petra Leather Boots",
    price: 98500,
    category: 'boots',
    description: 'Full-grain brown leather Petra boots with mid-calf shaft, chunky stacked heel, and side zipper. Cushioned insole. Pairs with dresses, skirts, or denim for city or evening wear.',
    material: 'leather',
    imageUrl: '/images/Sabaton-petra-boots-brown-Buea.jpg',
    hoverImageUrl: '/images/Sabaton-women-petra-boots-petra.jpg',
    gender: 'female',
    variants: [
      { size: 6, color: 'Brown', stock: 12, price: 98500 },
      { size: 7, color: 'Brown', stock: 15, price: 98500 },
      { size: 8, color: 'Brown', stock: 10, price: 98500 },
    ],
  },
  {
    name: "Casual Leather Slip‑Ons",
    price: 62400,
    category: 'casual',
    description: 'Soft pebbled leather slip-ons with memory-foam footbed, breathable lining, and lightweight rubber outsole. Minimalist, quiet, and cushioned. Ideal for coffee runs or relaxed office days.',
    material: 'leather',
    imageUrl: '/images/SABATON-Casual-Women-Leather.jpg',
    hoverImageUrl: '/images/SABATON-Casual-Women-Leather.jpg',
    gender: 'female',
    variants: [
      { size: 6, color: 'Black', stock: 20, price: 62400 },
      { size: 7, color: 'Tan', stock: 18, price: 62400 },
      { size: 8, color: 'Black', stock: 14, price: 62400 },
    ],
  },
  {
    name: "Saddle Oxford Formal Shoes",
    price: 87600,
    category: 'formal',
    description: 'Polished saddle oxfords with contrasting panel, closed-lacing, slightly pointed toe, and 1-inch heel. Leather outsole. Refined choice for boardrooms, luncheons, and elegant evenings.',
    material: 'leather',
    imageUrl: '/images/SABATON-women-fomal-saddle-oxford-2-.jpg',
    hoverImageUrl: '/images/SABATON-women-fomal-saddle-oxford-2-.jpg',
    gender: 'female',
    variants: [
      { size: 6, color: 'Black/White', stock: 9, price: 87600 },
      { size: 7, color: 'Black/White', stock: 11, price: 87600 },
      { size: 8, color: 'Black/White', stock: 7, price: 87600 },
    ],
  },
  {
    name: "Block‑Heel Leather Pumps",
    price: 72300,
    category: 'formal',
    description: 'Polished leather pumps with 2.5-inch block heel, rounded toe, cushioned footbed, and rubber heel cap. Contemporary side cut-out. Perfect for power lunches, weddings, or office wear.',
    material: 'leather',
    imageUrl: '/images/SABATON-women-block-heel-pumps.jpg',
    hoverImageUrl: '/images/SABATON-women-block-heel-pumps-hover.jpg',
    gender: 'female',
    variants: [
      { size: 6, color: 'Black', stock: 16, price: 72300 },
      { size: 7, color: 'Navy', stock: 12, price: 72300 },
      { size: 8, color: 'Black', stock: 14, price: 72300 },
    ],
  },
];

// ------------------------------------------------------------------
// Helper to generate a unique SKU
// ------------------------------------------------------------------
function generateSku(productName, size, color) {
  const base = productName.replace(/\s+/g, '-').toLowerCase().slice(0, 20);
  const colorCode = color ? color.slice(0, 3).toLowerCase() : 'n/a';
  const random = Math.random().toString(36).substring(2, 6);
  return `${base}-${size}-${colorCode}-${random}`;
}

// ------------------------------------------------------------------
// Main seed function
// ------------------------------------------------------------------
async function main() {
  console.log('🌱 Seeding database...');

  // 1. Clear existing data (order matters due to foreign keys)
  console.log('🧹 Clearing old data...');
  await prisma.$transaction([
    prisma.accessoryShoeCategory.deleteMany(),
    prisma.shoeCategoryOnProduct.deleteMany(),
    prisma.variant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.shoeCategory.deleteMany(),
  ]);

  // 2. Create shoe categories
  const categoryMap = {};
  for (const catName of ['formal', 'casual', 'boots']) {
    const created = await prisma.shoeCategory.create({
      data: { name: catName },
    });
    categoryMap[catName] = created.id;
  }
  console.log('✅ Shoe categories created:', Object.keys(categoryMap));

  // 3. Insert products
  console.log(`📦 Inserting ${allProducts.length} products...`);
  for (const productData of allProducts) {
    const { variants, category, ...productFields } = productData;

    const createdProduct = await prisma.product.create({
      data: {
        ...productFields,
        category: 'shoe',
        variants: {
          create: variants.map((v) => ({
            ...v,
            sku: generateSku(productData.name, v.size, v.color),
          })),
        },
      },
    });

    const shoeCategoryId = categoryMap[category];
    if (shoeCategoryId) {
      await prisma.shoeCategoryOnProduct.create({
        data: {
          productId: createdProduct.id,
          shoeCategoryId: shoeCategoryId,
        },
      });
    } else {
      console.warn(`⚠️ Unknown category "${category}" for product "${productData.name}" – skipping.`);
    }
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });