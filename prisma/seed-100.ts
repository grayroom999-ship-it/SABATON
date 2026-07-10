import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

// ─── Connection ──────────────────────────────────────────────
const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ No database connection string found. Set SUPABASE_DB_URL or DATABASE_URL in .env');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

console.log('🔍 Using connection string:', connectionString ? '✅ set' : '❌ missing');

// ─── Helpers ──────────────────────────────────────────────────

function generateSku(productName: string, size: number, color: string | null): string {
  const base = productName.replace(/\s+/g, '-').toLowerCase().slice(0, 20);
  const colorCode = color ? color.slice(0, 3).toLowerCase() : 'n/a';
  return `${base}-${size}-${colorCode}`;
}

function buildSearchText(product: any): string {
  const { name, description, material, category, gender } = product;
  if (category === 'accessory') {
    return `${name} – ${description} Made from ${material}. ${gender ? gender + ' ' : ''}Accessory. Perfect for ${description.toLowerCase().includes('suede') ? 'suede shoes' : 'leather shoes'}.`;
  }
  const style = category === 'formal' ? 'formal' : category === 'casual' ? 'casual' : 'boot';
  const genderLabel = gender === 'male' ? 'men' : gender === 'female' ? 'women' : 'unisex';
  return `${name} – ${description} Made from ${material}. ${style.charAt(0).toUpperCase() + style.slice(1)} ${genderLabel} shoe. Perfect for ${category === 'formal' ? 'business, weddings, and formal events' : category === 'casual' ? 'weekends, travel, and casual outings' : 'all seasons and smart-casual occasions'}.`;
}

// ─── Products ──────────────────────────────────────────────────

const shoeProducts: any[] = [
  // ============ MEN (13) ============
  {
    name: "Heritage Full‑Grain Oxford",
    price: 78000,
    category: 'formal',
    description: 'Premium full-grain leather Oxford with high-shine finish. Closed-lacing, stacked heel, cushioned insole. Ideal for boardrooms, weddings, and black-tie events.',
    material: 'leather',
    imageUrl: '/images/classic-oxford.jpg',
    hoverImageUrl: '/images/classic-oxford-2.jpg',
    gender: 'male',
    crossSellScore: 85,
    variants: [
      { size: 8, color: 'Black', stock: 20, price: 78000 },
      { size: 9, color: 'Black', stock: 25, price: 78000 },
      { size: 10, color: 'Brown', stock: 15, price: 78000 },
    ],
  },
  {
    name: "Premium Suede Chukka Boots",
    price: 89400,
    category: 'boots',
    description: 'Soft suede chukka boots with natural crepe rubber sole. Two-eyelet, ankle-height, cushioned footbed. Versatile smart-casual wear.',
    material: 'suede',
    imageUrl: '/images/Sabaton-shoes-oslo-high-boots-last-black-calf-vibram-dainite-sole.jpg',
    hoverImageUrl: '/images/Sabaton-shoes-oslo-2-high-boots-last-black-calf-vibram-dainite-sole.jpg',
    gender: 'male',
    crossSellScore: 70,
    variants: [
      { size: 9, color: 'Black', stock: 18, price: 89400 },
      { size: 10, color: 'Grey', stock: 12, price: 89400 },
    ],
  },
  {
    name: "Suede Weekend Loafers",
    price: 54000,
    category: 'casual',
    description: 'Lightweight suede-texture slip-ons with memory-foam insole and flexible rubber outsole. Breathable and cushioned. Ideal for travel, casual Fridays, and warm-weather outings.',
    material: 'fabric',
    imageUrl: '/images/SABATON-Shoes-Handcrafted-suede-.jpg',
    hoverImageUrl: '/images/Tan-Casual-Loafer-Boot.jpg',
    gender: 'male',
    crossSellScore: 60,
    variants: [
      { size: 10, color: 'Tan', stock: 30, price: 54000 },
      { size: 11, color: 'Black', stock: 22, price: 54000 },
    ],
  },
  {
    name: "Balmoral Suede Oxford",
    price: 65700,
    category: 'formal',
    description: 'Hand-burnished leather Balmoral with closed-lacing and cushioned leather lining. Sleek, formal silhouette. Perfect for presentations, upscale dinners, and ceremonies.',
    material: 'leather',
    imageUrl: '/images/Sabaton-leather-suede-balmoral.jpg',
    hoverImageUrl: '/images/Sabaton-leather-suede-balmoral-2.jpg',
    gender: 'male',
    crossSellScore: 80,
    variants: [
      { size: 8, color: 'Brown', stock: 14, price: 65700 },
      { size: 9, color: 'Black', stock: 19, price: 65700 },
    ],
  },
  {
    name: "Budapest Brogue Oxford",
    price: 95400,
    category: 'formal',
    description: 'Classic Budapest full-grain leather with hand-stitched brogue detailing and Goodyear-welt construction. Rich patina over time. Suited for business lunches, gallery openings, and semi-formal events.',
    material: 'leather',
    imageUrl: '/images/Brown-budapest-bp.jpg',
    hoverImageUrl: '/images/Brown-Budapest-Bp-2.jpg',
    gender: 'male',
    crossSellScore: 90,
    variants: [
      { size: 9, color: 'Brown', stock: 10, price: 95400 },
      { size: 10, color: 'Black', stock: 8, price: 95400 },
    ],
  },
  {
    name: "Budapest High‑Top Boots",
    price: 84000,
    category: 'boots',
    description: 'High-top Budapest boots in premium leather with brogue detailing and stacked heel. Ankle-hugging, sturdy. Perfect for autumn, countryside, or pairing with tailored trousers.',
    material: 'leather',
    imageUrl: '/images/SABATON-shoes-budapest-high-boots.jpg',
    hoverImageUrl: '/images/SABATON-shoes-budapest-high-boots(2).jpg',
    gender: 'male',
    crossSellScore: 75,
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
    crossSellScore: 50,
    variants: [
      { size: 8, color: 'Brown', stock: 25, price: 48000 },
      { size: 9, color: 'Grey', stock: 20, price: 48000 },
    ],
  },
  {
    name: "Classic Derby Shoes",
    price: 71400,
    category: 'formal',
    description: 'Open-lacing Derby in smooth full-grain leather with burnished toe. Durable leather-rubber sole, accommodates high insteps. Versatile for business-casual, outdoor weddings, and city exploring.',
    material: 'leather',
    imageUrl: '/images/derby-shoes.jpg',
    hoverImageUrl: '/images/derby-shoes-hover.jpg',
    gender: 'male',
    crossSellScore: 80,
    variants: [
      { size: 10, color: 'Black', stock: 12, price: 71400 },
      { size: 11, color: 'Brown', stock: 9, price: 71400 },
    ],
  },
  {
    name: "Budapest Balmoral Oxford",
    price: 107400,
    category: 'formal',
    description: 'Waterproof leather Budapest Balmoral with sealed seams and closed-lacing. Military-inspired elegance. Reliable grip for rainy city streets without compromising formality.',
    material: 'leather',
    imageUrl: '/images/Budapest-Balmoral-Leather-2.jpg',
    hoverImageUrl: '/images/Budapest- Balmoral-leather.jpg',
    gender: 'male',
    crossSellScore: 95,
    variants: [
      { size: 10, color: 'Brown', stock: 11, price: 107400 },
      { size: 11, color: 'Olive', stock: 7, price: 107400 },
    ],
  },
  {
    name: "Leather Chukka Boots",
    price: 36000,
    category: 'boots',
    description: 'Breathable leather chukka boots with jute-wrapped rope sole. Two-eyelet, relaxed silhouette. Great for resorts, summer festivals, and casual daytime wear.',
    material: 'leather',
    imageUrl: '/images/shoes-chukka-boots.jpg',
    hoverImageUrl: '/images/shoes-chukka-boots-2.jpg',
    gender: 'male',
    crossSellScore: 40,
    variants: [
      { size: 9, color: 'Beige', stock: 30, price: 36000 },
      { size: 10, color: 'Navy', stock: 28, price: 36000 },
    ],
  },
  {
    name: "Cognac Antique Monk Strap",
    price: 101400,
    category: 'formal',
    description: 'Striking monk-strap shoes in rich cognac with multitone patina finish. Bold hardware, leather-lined. Modern flair for networking, cocktail parties, and creative studios.',
    material: 'leather',
    imageUrl: '/images/SABATON-last-antique-cognac-1-.jpg',
    hoverImageUrl: '/images/SABATON-last-antique-cognac.jpg',
    gender: 'male',
    crossSellScore: 85,
    variants: [
      { size: 8, color: 'Brown', stock: 10, price: 101400 },
      { size: 9, color: 'Black', stock: 12, price: 101400 },
    ],
  },
  {
    name: "Museum Calf Oxford",
    price: 101400,
    category: 'casual',
    description: 'Exquisite museum calf leather with unique mottled finish. Single comfort sole, lightweight and breathable. Artisan style for gallery openings, travel, and collectors.',
    material: 'leather',
    imageUrl: '/images/SABATON-handcrafted-museum-calf-single-sole.jpg',
    hoverImageUrl: '/images/SABATON-handcrafted-museum-calf-single-sole-2.jpg',
    gender: 'male',
    crossSellScore: 90,
    variants: [
      { size: 8, color: 'Brown', stock: 10, price: 101400 },
      { size: 9, color: 'Black', stock: 12, price: 101400 },
    ],
  },
  {
    name: "Black Budapest Brogue Oxford",
    price: 101400,
    category: 'formal',
    description: 'Black full-grain Budapest leather with wingtip and brogue perforations. Goodyear-welted, mirror shine. Essential for high-profile meetings, galas, and black-tie occasions.',
    material: 'leather',
    imageUrl: '/images/Black-Budapest-Bp-2.jpg',
    hoverImageUrl: '/images/Black-Budapest-Bp.jpg',
    gender: 'male',
    crossSellScore: 95,
    variants: [
      { size: 8, color: 'Brown', stock: 10, price: 101400 },
      { size: 9, color: 'Black', stock: 12, price: 101400 },
    ],
  },

  // ============ WOMEN (9) ============
  {
    name: "Leather Ballet Flats",
    price: 53400,
    category: 'casual',
    description: 'Elegant leather ballet flats with rounded toe, flexible rubber sole, and cushioned footbed. Breathable leather lining. Perfect for commuting, brunch, or weekend strolls.',
    material: 'leather',
    imageUrl: '/images/CORIPERLA_BEIGE.jpg',
    hoverImageUrl: '/images/CORI_PERLAROSEWIND.jpg',
    gender: 'female',
    crossSellScore: 50,
    variants: [
      { size: 6, color: 'Beige', stock: 20, price: 53400 },
      { size: 7, color: 'Nude', stock: 18, price: 53400 },
    ],
  },
  {
    name: "Struds Ballet Flats",
    price: 53400,
    category: 'casual',
    description: 'Elegant leather ballet flats with shining studs, flexible rubber sole. Breathable leather lining. Perfect for evenings or weekend strolls.',
    material: 'leather',
    imageUrl: '/images/COMO-STUDSGOLD.jpg',
    hoverImageUrl: '/images/COMOBUSTUDS_HIBISCUS.jpg',
    gender: 'female',
    crossSellScore: 50,
    variants: [
      { size: 6, color: 'Brown', stock: 20, price: 53400 },
      { size: 7, color: 'Red', stock: 18, price: 53400 },
    ],
  },
  {
    name: "Block‑Heel Ankle Boots",
    price: 78000,
    category: 'boots',
    description: 'Chic leather ankle boots with 2-inch block heel, side zipper, and padded insole. Breathable lining. Versatile for desk-to-dinner, pairs with trousers, skirts, or jeans.',
    material: 'leather',
    imageUrl: '/images/Sabaton-women-petra-boots-petra.jpg',
    hoverImageUrl: '/images/Sabaton-women-petra-boots-petra-2.jpg',
    gender: 'female',
    crossSellScore: 75,
    variants: [
      { size: 6, color: 'Black', stock: 15, price: 78000 },
      { size: 7, color: 'Tan', stock: 10, price: 78000 },
    ],
  },
  {
    name: "Petra Leather Boots",
    price: 98500,
    category: 'boots',
    description: 'Full-grain brown leather Petra boots with mid-calf shaft, chunky stacked heel, and side zipper. Cushioned insole. Pairs with dresses, skirts, or denim for city or evening wear.',
    material: 'leather',
    imageUrl: '/images/Sabaton-petra-boots-brown-Buea.jpg',
    hoverImageUrl: '/images/Sabaton-petra-boots-brown-Buea-2.jpg',
    gender: 'female',
    crossSellScore: 85,
    variants: [
      { size: 6, color: 'Brown', stock: 12, price: 98500 },
      { size: 7, color: 'Brown', stock: 15, price: 98500 },
      { size: 8, color: 'Brown', stock: 10, price: 98500 },
    ],
  },
  {
    name: "Leather Slip‑Ons",
    price: 62400,
    category: 'casual',
    description: 'Soft pebbled leather slip-ons with memory-foam footbed, breathable lining, and lightweight rubber outsole. Minimalist, quiet, and cushioned. Ideal for coffee runs or relaxed office days.',
    material: 'leather',
    imageUrl: '/images/SABATON-Casual-Women-Leather.jpg',
    hoverImageUrl: '/images/SABATON-Casual-Women-Leather-2.jpg',
    gender: 'female',
    crossSellScore: 60,
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
    imageUrl: '/images/SABATON-women-fomal-saddle-oxford.jpg',
    hoverImageUrl: '/images/SABATON-women-fomal-saddle-oxford-2-.jpg',
    gender: 'female',
    crossSellScore: 90,
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
    crossSellScore: 80,
    variants: [
      { size: 6, color: 'Black', stock: 16, price: 72300 },
      { size: 7, color: 'Navy', stock: 12, price: 72300 },
      { size: 8, color: 'Black', stock: 14, price: 72300 },
    ],
  },
  {
    name: "Lodi‑due Caramel Rose Flats",
    price: 49500,
    category: 'casual',
    description: 'Elegant Lodi‑due flats in soft caramel rose leather. Rounded toe, cushioned insole, and flexible rubber sole. Feminine and versatile – perfect for brunch, gallery visits, or casual office days.',
    material: 'leather',
    imageUrl: '/images/Lodi-due-Caramel-Rose-Flats.jpg',
    hoverImageUrl: '/images/Lodi-due-Blue-Twill-Loafers-2.jpg',
    gender: 'female',
    crossSellScore: 65,
    variants: [
      { size: 6, color: 'Caramel Rose', stock: 18, price: 49500 },
      { size: 7, color: 'Caramel Rose', stock: 22, price: 49500 },
      { size: 6, color: 'Blue', stock: 12, price: 49500 },
      { size: 7, color: 'Blue', stock: 16, price: 49500 },
      { size: 8, color: 'Rose', stock: 10, price: 49500 },
    ],
  },
  {
    name: "LISA Leather Slides",
    price: 42500,
    category: 'casual',
    description: 'Minimalist LISA slides in premium full‑grain leather. Contoured footbed, soft leather upper, and durable rubber sole. Easy slip‑on style for poolside, weekend errands, or relaxed hot days.',
    material: 'leather',
    imageUrl: '/images/LISASLIDESNEAKERTASSELS_MAUVE-2.jpg',
    hoverImageUrl: '/images/LISASLIDESNEAKERTASSELS_MAUVE.jpg',
    gender: 'female',
    crossSellScore: 55,
    variants: [
      { size: 8, color: 'Brown', stock: 20, price: 42500 },
      { size: 7, color: 'Tan', stock: 22, price: 42500 },
      { size: 8, color: 'Purple', stock: 14, price: 42500 },
      { size: 6, color: 'White', stock: 15, price: 42500 },
    ],
  },
];

// ─── ACCESSORIES (5) ──────────────────────────────────────────

const accessoryProducts: any[] = [
  {
    name: "Leather Shoe Cream (Black)",
    price: 12500,
    category: 'accessory',
    description: 'High-quality black shoe cream nourishes and restores leather. Polishes to a rich shine. Protects and waterproofs. Suitable for all leather shoes.',
    material: 'cream',
    imageUrl: '/images/accessories/waterproof-cream.jpg',
    hoverImageUrl: '/images/accessories/CordovanCreamBlack921001_large.jpg',
    gender: 'unisex',
    accessoryType: 'cleaner',
    crossSellScore: 90,
    variants: [
      { size: 0, color: 'Cream', stock: 50, price: 12500 },
      { size: 0, color: 'Black', stock: 50, price: 12500 },
    ],
  },
  {
    name: "Suede Shoe Brush",
    price: 18500,
    category: 'accessory',
    description: 'Suede brush for maintaining suede and nubuck. Removes dirt, scuffs, and revives nap. Keeps suede looking fresh.',
    material: 'rubber and nylon',
    imageUrl: '/images/accessories/Suede-Brush.jpg',
    hoverImageUrl: '/images/accessories/Suede-Brush-2.jpg',
    gender: 'unisex',
    accessoryType: 'cleaner',
    crossSellScore: 85,
    variants: [
      { size: 0, color: null, stock: 40, price: 18500 },
    ],
  },
  {
    name: "Cotton Shoelaces (Black/Brown)",
    price: 6500,
    category: 'accessory',
    description: 'Premium waxed cotton shoelaces, 120cm, in black and brown. Durable and tangle‑free. Perfect for Oxfords, Derbies, boots, and sneakers.',
    material: 'cotton',
    imageUrl: '/images/accessories/Black-shoelaces.jpg',
    hoverImageUrl: '/images/accessories/Brown-shoelaces.jpg',
    gender: 'unisex',
    accessoryType: 'laces',
    crossSellScore: 70,
    variants: [
      { size: 0, color: 'Brown', stock: 60, price: 6500 },
      { size: 0, color: 'Black', stock: 60, price: 6500 },
    ],
  },
  {
    name: "Cedar Shoe Trees",
    price: 21500,
    category: 'accessory',
    description: 'Natural cedar shoe trees absorb moisture, maintain shape, and deodorise. Prevents creasing and extends shoe life. Essential for formal footwear.',
    material: 'cedar wood',
    imageUrl: '/images/accessories/shoe-trees.jpg',
    hoverImageUrl: '/images/accessories/shoe-trees-2.jpg',
    gender: 'unisex',
    accessoryType: null,
    crossSellScore: 95,
    variants: [
      { size: 0, color: null, stock: 30, price: 21500 },
    ],
  },
  {
    name: "Cotton Socks (Pack of 6)",
    price: 12000,
    category: 'accessory',
    description: 'Premium quality cotton socks for everyday comfort. Soft, breathable, and moisture‑wicking to keep feet dry. Features reinforced toes and heels for superior durability. Machine washable and versatile for casual or formal wear.',
    material: '100% Combed Cotton',
    imageUrl: '/images/accessories/dress-socks.jpg',
    hoverImageUrl: '/images/accessories/dress-socks.jpg',
    gender: 'unisex',
    accessoryType: 'socks',
    crossSellScore: 75,
    variants: [
      { size: 0, color: 'White', stock: 60, price: 12000 },
    ],
  },
];

const allProducts = [...shoeProducts, ...accessoryProducts];

// ─── Main Seed ──────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database with products + accessories...');

  console.log('🧹 Clearing old data...');
  await prisma.$transaction([
    prisma.accessoryShoeCategory.deleteMany(),
    prisma.shoeCategoryOnProduct.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.variant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.order.deleteMany(),
    prisma.shoeCategory.deleteMany(),
  ]);

  // Create shoe categories
  const categoryMap: Record<string, string> = {};
  const shoeCategories = ['formal', 'casual', 'boots'] as const;
  for (const catName of shoeCategories) {
    const created = await prisma.shoeCategory.create({
      data: { name: catName },
    });
    categoryMap[catName] = created.id;
  }
  console.log('✅ Shoe categories created:', Object.keys(categoryMap));

  // Insert products
  console.log(`📦 Inserting ${allProducts.length} products...`);
  for (const productData of allProducts) {
    const { variants, category, ...productFields } = productData;
    const searchText = buildSearchText(productData);

    const createdProduct = await prisma.product.create({
      data: {
        ...productFields,
        category: productData.category || 'shoe',
        searchText,
        variants: {
          create: variants.map((v: any) => ({
            ...v,
            sku: generateSku(productData.name, v.size, v.color),
          })),
        },
      },
    });

    if (productData.category === 'accessory') {
      for (const catId of Object.values(categoryMap)) {
        await prisma.accessoryShoeCategory.create({
          data: {
            accessoryId: createdProduct.id,
            shoeCategoryId: catId,
          },
        });
      }
    } else {
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