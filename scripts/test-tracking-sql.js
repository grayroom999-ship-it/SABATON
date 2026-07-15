// scripts/test-tracking-sql.js
const { config } = require('dotenv');
const { resolve } = require('path');
const { Client } = require('pg');

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error('❌ SUPABASE_DB_URL not found in .env.local');
  process.exit(1);
}

console.log('📡 Connecting to Supabase:', dbUrl.replace(/\/\/.*@/, '//***@'));

const client = new Client({ connectionString: dbUrl });

async function run() {
  await client.connect();
  console.log('✅ Connected.');

  // Get two product IDs
  const productRes = await client.query('SELECT id FROM "Product" LIMIT 2');
  if (productRes.rows.length < 2) {
    console.warn('⚠️ Not enough products – need at least 2.');
    return;
  }
  const [p1, p2] = productRes.rows;
  const sessionId = `test-session-${Date.now()}`;

  // 1. Product views
  await client.query(
    'INSERT INTO "ProductView" (id, "productId", "sessionId", "viewedAt") VALUES (gen_random_uuid()::text, $1, $2, NOW())',
    [p1.id, sessionId]
  );
  await client.query(
    'INSERT INTO "ProductView" (id, "productId", "sessionId", "viewedAt") VALUES (gen_random_uuid()::text, $1, $2, NOW())',
    [p2.id, sessionId]
  );
  console.log('✅ Product views logged.');

  // 2. Search
  await client.query(
    'INSERT INTO "SearchQuery" (id, query, "sessionId", "resultCount", "createdAt") VALUES (gen_random_uuid()::text, $1, $2, 0, NOW())',
    ['brown derby', sessionId]
  );
  console.log('✅ Search logged.');

  // 3. Add‑to‑cart: first create a cart
  await client.query(
    'INSERT INTO "Cart" (id, "sessionId", "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, NOW(), NOW())',
    [sessionId]
  );
  const cartRes = await client.query('SELECT id FROM "Cart" WHERE "sessionId" = $1', [sessionId]);
  const cartId = cartRes.rows[0].id;

  // Get a variant for product1
  const variantRes = await client.query('SELECT id FROM "Variant" WHERE "productId" = $1 LIMIT 1', [p1.id]);
  if (variantRes.rows.length === 0) {
    console.warn('⚠️ No variant found – skipping add‑to‑cart.');
  } else {
    const variantId = variantRes.rows[0].id;
    // Add cart item
    await client.query(
      `INSERT INTO "CartItem" (id, quantity, price, "cartId", "productId", "variantId")
       VALUES (gen_random_uuid()::text, 1, 1000, $1, $2, $3)`,
      [cartId, p1.id, variantId]
    );
    // Add event
    await client.query(
      `INSERT INTO "AddToCartEvent" (id, "sessionId", "productId", "variantId", quantity, "cartId", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, 1, $4, NOW())`,
      [sessionId, p1.id, variantId, cartId]
    );
    console.log('✅ Add‑to‑cart logged.');
  }

  console.log('✅ All test data inserted.');
  console.log(`👉 Visit /admin/dashboard?period=7d to see analytics.`);
  console.log(`   Session ID: ${sessionId}`);

  await client.end();
}

run().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});