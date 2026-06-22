import { pipeline } from '@xenova/transformers';

async function preloadEmbeddingModel() {
  console.log('📥 Downloading embedding model (Xenova/all-MiniLM-L6-v2)...');
  console.log('📦 Model size ~80‑100 MB, please wait...');
  const start = Date.now();

  try {
    // This downloads the model to the local cache
    await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`✅ Model ready in ${elapsed}s`);
    console.log('✅ Pre‑load complete!');
  } catch (error) {
    console.error('❌ Download failed:', error);
    process.exit(1);
  }
}

preloadEmbeddingModel();