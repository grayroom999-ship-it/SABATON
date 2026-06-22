import { generateText } from 'ai';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  connectionTimeoutMillis: 10000,
});

async function generateAllDescriptions() {
  console.log('📦 Starting script...');

  // Test connection
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT 1 as test');
    client.release();
    console.log('✅ Connection OK:', res.rows[0].test);
  } catch (err) {
    console.error('❌ Connection failed:', err);
    return;
  }

  console.log('📦 Fetching products without searchText...');
  let products;
  try {
    // Only fetch products that still need a description
    const res = await pool.query(
      'SELECT id, name, category, gender, material FROM "Product" WHERE "searchText" IS NULL'
    );
    products = res.rows;
  } catch (err) {
    console.error('❌ Failed to fetch products:', err);
    return;
  }

  console.log(`📦 Found ${products.length} products to process.`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`🧠 [${i+1}/${products.length}] Processing: ${product.name}`);

    const userMessage = `Write a short, keyword‑rich product description for a shoe called "${product.name}". 
It is a ${product.category || 'shoe'} for ${product.gender || 'unisex'}, made of ${product.material || 'leather'}. 
Mention its style, material, best occasion (e.g., formal, casual, wedding, business), and any special features (e.g., hand-stitched, Italian leather, suede). 
Keep it under 30 words.`;

    try {
      console.log(`   🤖 Calling Claude (timeout: 30s)...`);
      const result = await generateText({
        model: 'anthropic/claude-3-5-haiku-20241022',
        system: 'You are a product description writer for a luxury shoe brand. Be concise, keyword-rich, and descriptive. Do not mention the brand name.',
        messages: [{ role: 'user', content: userMessage }],
        temperature: 0.7,
        timeout: 30000, // ← 30 seconds
        maxRetries: 1,   // ← only one retry to avoid long hangs
      });

      const description = result.text.trim() || product.name;
      console.log(`   📝 Description: ${description.substring(0, 30)}...`);

      console.log(`   💾 Updating database...`);
      await pool.query(
        'UPDATE "Product" SET "searchText" = $1 WHERE id = $2',
        [description, product.id]
      );

      console.log(`✅ [${i+1}/${products.length}] Updated ${product.name}`);
      updated++;
    } catch (err) {
      console.error(`❌ [${i+1}/${products.length}] Failed for ${product.name}:`, err);
      failed++;
    }
  }

  console.log(`🎉 Done! Updated ${updated} products, ${failed} failed.`);
  await pool.end();
}

generateAllDescriptions().catch(console.error);