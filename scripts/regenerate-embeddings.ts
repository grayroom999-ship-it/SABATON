import { Pool } from 'pg';
import { pipeline } from '@xenova/transformers';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  connectionTimeoutMillis: 10000,
});

async function regenerateEmbeddings() {
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

  console.log('📦 Fetching products with searchText...');
  let products;
  try {
    const res = await pool.query(
      'SELECT id, name, "searchText" FROM "Product" WHERE "searchText" IS NOT NULL'
    );
    products = res.rows;
  } catch (err) {
    console.error('❌ Failed to fetch products:', err);
    return;
  }

  console.log(`📦 Found ${products.length} products to update`);

  console.log('🧠 Loading embedding model...');
  let extractor: any;
  try {
    const modelPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Model load timeout after 30s')), 30000)
    );
    extractor = await Promise.race([modelPromise, timeoutPromise]);
    console.log('✅ Model loaded');
  } catch (err) {
    console.error('❌ Failed to load model:', err);
    return;
  }

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const text = product.searchText || product.name;
    console.log(`🧠 [${i+1}/${products.length}] Generating embedding for: ${product.name}`);

    try {
      const result = await extractor(text, { pooling: 'mean', normalize: true });
      const embedding = Array.from(result.data);
      const vectorString = `[${embedding.join(',')}]`;

      await pool.query(
        'UPDATE "Product" SET embedding = $1::vector WHERE id = $2',
        [vectorString, product.id]
      );

      console.log(`✅ [${i+1}/${products.length}] Updated ${product.name}`);
    } catch (err) {
      console.error(`❌ [${i+1}/${products.length}] Failed for ${product.name}:`, err);
    }
  }

  console.log('🎉 All embeddings regenerated!');
  await pool.end();
}

regenerateEmbeddings().catch(console.error);