// app/api/chat/route.ts
// ─────────────────────────────────────────────────────────────
// COMPLETE – Pre‑AI FAQ check (skips on buy intent), rich business info, fallback
// + Customer behavior analytics tracking (add‑only)

import { generateText } from 'ai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Product, Variant } from '@prisma/client';
import { createClient } from '@vercel/postgres';
import { trackProductView, trackSearch, trackAddToCart } from '@/lib/analytics';
import { getSessionId } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// ─── FAQ Knowledge Base (full) ──────────────────────────────
const FAQ_RESPONSES: Record<string, string> = {
  "return policy": "↩️ **Return Policy:** We offer a **14-day return policy** for unused items in original packaging. Contact us at hello@sabaton.cm to initiate a return. We'll guide you through the process. 😊",
  "exchange": "🔄 **Exchange Policy:** We offer a **14-day exchange** on unworn items. Just contact us and we'll arrange a size/colour swap.",
  "refund": "💰 **Refunds:** We process refunds within 2–3 business days after we receive the returned item. The refund goes to your original payment method.",
  "warranty": "🛡️ **Warranty:** All our shoes come with a **1-year warranty** against manufacturing defects (sole separation, stitching issues). Normal wear & tear not covered.",
  "mobile money": "✅ Yes! We accept MTN MoMo and Orange Money. Select your preferred method at checkout.",
  "mtn": "✅ We accept MTN Mobile Money. Simply choose it at checkout.",
  "orange": "✅ We accept Orange Money. Select it at checkout.",
  "pay on delivery": "📦 We offer pay-on-delivery for Buea town orders. A 50% deposit is required upfront; balance on delivery.",
  "cash on delivery": "📦 Pay-on-delivery is available in Buea. 50% deposit required.",
  "payment": "💳 We accept Mobile Money (MTN, Orange) and secure online card payments. All transactions are encrypted.",
  "secure": "🔒 Your payment is secure – we never store your card details. All payments are processed via Vercel's secure gateway.",
  "hidden fees": "💰 No hidden fees. The total you see at checkout is the final amount (product + delivery if applicable).",
  "delivery": "🚚 **Delivery:** Buea town – free (same-day dispatch). Outside Buea – fees calculated at checkout (from 1,500 FCFA).",
  "shipping": "🚚 **Shipping:** Same-day dispatch for orders before 2 PM. Delivery times: Buea (24h), Douala (2‑3 days), Yaoundé (3‑4 days).",
  "track": "📦 You'll receive a tracking link via WhatsApp once your order is dispatched.",
  "pick up": "🏬 Yes – you can pick up from our shop in Molyko. Select 'Pick Up' at checkout.",
  "delivery time": "⏱️ Buea: within 24h. Other locations: 2‑5 business days.",
  "international": "🌍 Currently we deliver only within Cameroon. For special requests, contact us.",
  "genuine leather": "👞 Yes! All our shoes are 100% genuine full-grain leather – the highest quality. Sourced from top European tanneries.",
  "full-grain": "🌟 **Full-grain leather** is the best quality – it retains the natural grain and develops a rich patina over time. We use it for all our shoes.",
  "top-grain": "🔝 **Top-grain** is slightly sanded – we prefer full-grain for its durability and natural beauty.",
  "leather quality": "🏆 We use only premium full-grain leather – durable, breathable, and ages beautifully.",
  "handmade": "🧵 Yes! Every pair is handcrafted in Buea by skilled artisans using traditional techniques.",
  "hand-stitched": "🪡 Our shoes are hand-stitched for superior durability and a refined finish.",
  "waterproof": "💧 Our leather is water-resistant, but we recommend applying a waterproofing spray. Avoid prolonged soaking.",
  "rain": "☔ See 'waterproof' – we also recommend boots for heavy rain.",
  "durability": "⏳ With proper care, our shoes last 5‑10+ years. Resoling is possible on select models.",
  "care": "🧴 **Suede & Leather Care:** Use a suede brush and eraser for suede. For leather, wipe with a soft damp cloth, condition every 2-3 months, and polish with matching colour. Apply waterproof spray before wearing. Never use heat to dry.",
  "suede care": "🧴 **Suede Care:** Use a suede brush to gently remove dirt and restore the nap. For stains, use a suede eraser or specialised suede cleaner. Apply a waterproof spray before wearing to protect from rain and moisture. Always let suede dry naturally – never use heat.",
  "leather care": "🧴 **Leather Care:** Wipe with a soft, damp cloth to remove dirt. Apply leather conditioner every 2-3 months to keep leather supple. Use polish that matches your shoe color. Store in a cool, dry place with shoe trees to maintain shape.",
  "break in": "⏳ Allow 3‑5 wears for the leather to soften. Wear them with thick socks initially.",
  "location": "📍 Molyko, Buea (near the main roundabout). Open Mon–Sat, 8 AM – 6 PM.",
  "hours": "🕐 **Business Hours:** Monday – Saturday, 8:00 AM – 6:00 PM (WAT). Closed Sundays.",
  "business hours": "🕐 **Business Hours:** Monday – Saturday, 8:00 AM – 6:00 PM (WAT). Closed Sundays.",
  "open": "🕐 **Business Hours:** Monday – Saturday, 8:00 AM – 6:00 PM (WAT). Closed Sundays.",
  "contact": "📞 Phone: +237 6XX XXX XXX | Email: hello@sabaton.cm | WhatsApp: +237 6XX XXX XXX",
  "phone": "📞 +237 6XX XXX XXX",
  "email": "📧 hello@sabaton.cm",
  "discount": "🎉 We occasionally run promotions. Follow us on social media or subscribe to our newsletter.",
  "bulk": "📦 Yes, we offer bulk discounts for 5+ pairs. Contact us for a custom quote.",
  "custom": "🛠️ Custom orders available! Lead time 2‑3 weeks. Contact us with your requirements.",
  "gift": "🎁 Gift wrapping is available for 1,500 FCFA. Add at checkout.",
  "student": "🎓 10% student/teacher discount with valid ID. Contact us to apply.",
  "after-sales": "🔄 Free cleaning and conditioning for 6 months after purchase. Bring them to our shop.",
  "about": "👞 Sabaton handcrafts leather shoes in Buea using full‑grain leather and traditional techniques.",
  "comfort": "😌 All our shoes are designed with comfort in mind! For the most cushioned styles, the **Leather Ballet Flats** and **Struds Ballet Flats** feature memory-foam insoles and flexible soles – perfect for all-day wear. The **Petra Leather Boots** also offer excellent ankle support and a padded footbed. Let me know which style you're considering, and I can share more details!",
  "comfortable": "😌 All our shoes are designed with comfort in mind! For the most cushioned styles, the **Leather Ballet Flats** and **Struds Ballet Flats** feature memory-foam insoles and flexible soles – perfect for all-day wear. The **Petra Leather Boots** also offer excellent ankle support and a padded footbed. Let me know which style you're considering, and I can share more details!",
  "accessories": "🛍️ Yes! We offer a range of shoe care accessories including:\n• **Leather Shoe Cream** (12,500 FCFA) – nourishes and restores leather\n• **Suede Shoe Brush** (18,500 FCFA) – maintains suede and nubuck\n• **Cotton Shoelaces** (6,500 FCFA) – premium waxed cotton laces\n• **Cedar Shoe Trees** (21,500 FCFA) – absorb moisture and maintain shape\n• **Cotton Socks** (12,000 FCFA) – pack of 6, premium quality\n\nWould you like to add any of these to your cart?",
  "accessory": "🛍️ Yes! We offer a range of shoe care accessories including:\n• **Leather Shoe Cream** (12,500 FCFA) – nourishes and restores leather\n• **Suede Shoe Brush** (18,500 FCFA) – maintains suede and nubuck\n• **Cotton Shoelaces** (6,500 FCFA) – premium waxed cotton laces\n• **Cedar Shoe Trees** (21,500 FCFA) – absorb moisture and maintain shape\n• **Cotton Socks** (12,000 FCFA) – pack of 6, premium quality\n\nWould you like to add any of these to your cart?",
};

// ─── Semantic FAQ Index ──────────────────────────────────────
interface FaqEntry {
  key: string;
  embedding: number[];
  response: string;
}

let faqIndex: FaqEntry[] = [];
let faqIndexBuilt = false;

async function buildFAQIndex() {
  if (faqIndexBuilt) return;
  console.log('🧠 Building FAQ index...');
  const { pipeline } = await import('@xenova/transformers');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
    const result = await extractor(key, { pooling: 'mean', normalize: true });
    const embedding = Array.from(result.data);
    faqIndex.push({ key, embedding, response });
  }
  faqIndexBuilt = true;
  console.log(`✅ FAQ index built with ${faqIndex.length} entries.`);
}

// ─── Local embedding model ──────────────────────────────────
let localExtractor: any = null;
let modelLoading: Promise<any> | null = null;

async function getLocalEmbedding(text: string): Promise<number[]> {
  if (!localExtractor) {
    if (!modelLoading) {
      console.log('🧠 Loading local embedding model...');
      const { pipeline } = await import('@xenova/transformers');
      modelLoading = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    localExtractor = await modelLoading;
    console.log('✅ Local model ready');
  }
  const result = await localExtractor(text, { pooling: 'mean', normalize: true });
  return Array.from(result.data);
}

// ─── Cosine similarity ─────────────────────────────────────
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (magA * magB);
}

// ─── Caching utilities ─────────────────────────────────────
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setCache<T>(key: string, value: T, ttlMs: number = 300000) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// ─── Product name cache ──────────────────────────────────────
let allProductNames: string[] = [];
let productNameCacheTime = 0;

async function getAllProductNames(): Promise<string[]> {
  const now = Date.now();
  if (allProductNames.length > 0 && (now - productNameCacheTime) < 300000) {
    return allProductNames;
  }
  const products = await prisma.product.findMany({ select: { name: true } });
  allProductNames = products.map(p => p.name);
  productNameCacheTime = now;
  return allProductNames;
}

// ─── Fuzzy product matching ────────────────────────────────
function scoreMatch(query: string, productName: string): number {
  const q = query.toLowerCase().trim();
  const p = productName.toLowerCase().trim();
  if (p === q) return 100;
  if (p.includes(q)) return 80;
  if (q.includes(p)) return 70;
  const qWords = q.split(/\s+/);
  const pWords = p.split(/\s+/);
  const common = qWords.filter(w => pWords.some(pw => pw.includes(w) || w.includes(pw)));
  if (common.length === 0) return 0;
  return Math.min(60, (common.length / Math.max(qWords.length, pWords.length)) * 60);
}

async function findBestProductMatch(query: string): Promise<string | null> {
  const names = await getAllProductNames();
  if (names.length === 0) return null;
  let best = null;
  let bestScore = 0;
  for (const name of names) {
    const score = scoreMatch(query, name);
    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }
  return bestScore > 30 ? best : null;
}

// ─── Helper: re‑order results to put exact match first ────
function reorderExactMatch(products: any[], queryText: string): any[] {
  if (!products || products.length === 0 || !queryText) return products;
  const trimmed = queryText.trim();
  if (!trimmed) return products;
  const exactIndex = products.findIndex(
    (p) => p.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (exactIndex > 0) {
    const matched = products.splice(exactIndex, 1);
    products.unshift(matched[0]);
  } else if (exactIndex === -1) {
    const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);
    for (const p of sortedProducts) {
      if (trimmed.toLowerCase().includes(p.name.toLowerCase())) {
        const idx = products.findIndex(item => item.id === p.id);
        if (idx > 0) {
          const matched = products.splice(idx, 1);
          products.unshift(matched[0]);
        }
        break;
      }
    }
  }
  return products;
}

// ─── BUSINESS INFO (RICH VERSION) ──────────────────────────
const BUSINESS_INFO = {
  name: 'Sabaton Leather Shoes',
  tagline: 'Handcrafted Leather Footwear for the Modern Man',
  location: 'Molyko, Buea, Cameroon (near the main roundabout, opposite Total Filling Station)',
  hours: 'Monday – Saturday, 8:00 AM – 6:00 PM (WAT). Closed Sundays.',
  contact: {
    phone: '+237 6XX XXX XXX',
    whatsapp: '+237 6XX XXX XXX',
    email: 'hello@sabaton.cm',
    instagram: '@sabatonleather',
    facebook: 'Sabaton Leather Shoes'
  },
  about: {
    summary: 'Sabaton handcrafts premium leather shoes in Buea using full‑grain leather and traditional Cameroonian techniques.',
    story: 'Founded in 2020 by a local artisan with a passion for quality footwear. We combine traditional leatherworking skills with modern designs to create shoes that last.',
    craftsmanship: 'Each pair is hand-cut, stitched, and finished in our Molyko workshop. We source leather from Ethiopian and Nigerian tanneries known for quality.',
    mission: 'To provide Buea men with durable, stylish, and affordable leather footwear while supporting local craftsmanship.'
  },
  products: {
    materials: ['Full-grain leather', 'Top-grain leather', 'Genuine leather', 'Ethiopian leather'],
    categories: ['Casual', 'Formal', 'Boots', 'Sandals'],
    sizes: { range: '38 – 46 (EU sizing)', advice: 'Order your regular EU size. If between sizes, size up.' },
    price_range: '18,000 – 65,000 FCFA'
  },
  delivery: {
    zones: [
      { zone: 'Buea Town', cost: 'Free', time: 'Same day' },
      { zone: 'Limbe', cost: '1,500 FCFA', time: 'Next day' },
      { zone: 'Tiko', cost: '2,000 FCFA', time: '2 days' },
      { zone: 'Mutengene', cost: '1,500 FCFA', time: 'Next day' }
    ],
    dispatch_time: 'Orders before 2 PM (WAT) dispatched same day.',
    tracking: 'Tracking number provided after dispatch.'
  },
  payment: {
    methods: ['MTN Mobile Money', 'Orange Money', 'Cash on Delivery (Buea only)', 'Bank Transfer'],
    security: 'All transactions are secure.'
  },
  returns: {
    policy: '14‑day return or exchange policy for unused items in original packaging.',
    process: 'Contact us via WhatsApp or email for authorization.'
  },
  sizing_advice: {
    how_to_measure: 'Place your foot on paper, mark heel and longest toe, measure in cm, add 0.5cm.',
    fit_guide: 'Our shoes fit snugly at first. Leather will stretch and mold to your foot over 2-3 wears.'
  },
  care_instructions: {
    suede: 'Use a suede brush and eraser. Apply waterproof spray before wearing.',
    leather: 'Wipe with damp cloth, condition every 2-3 months, polish to match color.'
  },
  customer_service: {
    hours: 'Monday – Saturday, 8:00 AM – 6:00 PM',
    response_time: 'We respond within 2 hours during business hours.'
  },
  offers: {
    first_order: '10% off your first order when you sign up for our newsletter.',
    referrals: 'Refer a friend and both get 5% off your next purchase.',
    bulk_discount: 'Buy 3 or more pairs and get 15% off the total.'
  },
  why_sabaton: [
    '100% genuine leather sourced from quality tanneries',
    'Handcrafted in Buea by skilled local artisans',
    'Free delivery within Buea town',
    '14-day exchange policy',
    'Competitive prices without compromising on quality',
    'Mobile Money payment for convenience'
  ],
  faqs: [
    { question: 'How do I know my size?', answer: 'Check our size chart or visit our Molyko shop.' },
    { question: 'Is delivery free?', answer: 'Yes, free within Buea town.' },
    { question: 'What if the shoes don\'t fit?', answer: 'Free exchange within 14 days for Buea deliveries.' },
    { question: 'Can I pay on delivery?', answer: 'Yes, for orders within Buea town.' }
  ]
};

// ─── Helper: resolve product (fallback) ────────────────────
async function resolveProduct(input: string): Promise<any> {
  if (input.startsWith('cmq')) {
    return await prisma.product.findUnique({ where: { id: input }, include: { variants: true } });
  }
  let product = await prisma.product.findFirst({
    where: { name: { equals: input, mode: 'insensitive' } },
    include: { variants: true },
  });
  if (product) return product;
  const bestName = await findBestProductMatch(input);
  if (bestName) {
    return await prisma.product.findFirst({
      where: { name: { equals: bestName, mode: 'insensitive' } },
      include: { variants: true },
    });
  }
  return await prisma.product.findFirst({
    where: { name: { contains: input, mode: 'insensitive' } },
    include: { variants: true },
  });
}

// ─── Conversation State Tracking ──────────────────────────
interface BuyState {
  productName: string | null;
  size: number | null;
  lastBuyIntent: number;
}

const conversationStates = new Map<string, BuyState>();
const STATE_TIMEOUT = 300000;

function getBuyState(sessionId: string): BuyState {
  const existing = conversationStates.get(sessionId);
  if (existing && (Date.now() - existing.lastBuyIntent) < STATE_TIMEOUT) {
    return existing;
  }
  const newState = { productName: null, size: null, lastBuyIntent: Date.now() };
  conversationStates.set(sessionId, newState);
  return newState;
}

function updateBuyState(sessionId: string, updates: Partial<BuyState>) {
  const state = getBuyState(sessionId);
  Object.assign(state, updates);
  state.lastBuyIntent = Date.now();
  conversationStates.set(sessionId, state);
}

function clearBuyState(sessionId: string) {
  conversationStates.delete(sessionId);
}

// ─── Extract product name and size from text ──────────────
async function extractProductDetails(text: string): Promise<{ productName: string | null; size: number | null }> {
  const lower = text.toLowerCase();
  const allProducts = await prisma.product.findMany({ select: { name: true } });
  const productNames = allProducts.map(p => p.name);
  productNames.sort((a, b) => b.length - a.length);

  let productName: string | null = null;
  for (const name of productNames) {
    if (lower.includes(name.toLowerCase())) {
      productName = name;
      break;
    }
  }
  if (!productName) {
    const best = await findBestProductMatch(text);
    if (best) productName = best;
  }

  // ✅ Improved size extraction – accepts "9", "size 9", "EU 42", "us 10", etc.
  let size: number | null = null;
  const sizeMatch = text.match(/\b(?:size|us|eu)?\s*(\d{1,2})\b/i);
  if (sizeMatch) size = parseInt(sizeMatch[1]);

  return { productName, size };
}

// ─── Direct add‑to‑cart function ──────────────────────────
async function executeAddToCart(
  sessionId: string,
  productName: string,
  size: number
): Promise<{ success: boolean; message: string; cartData?: any }> {
  try {
    const product = await prisma.product.findFirst({
      where: { name: { equals: productName, mode: 'insensitive' } },
      include: { variants: true },
    });
    if (!product) {
      return { success: false, message: `Product "${productName}" not found.` };
    }
    let variant = product.variants.find((v: any) => v.size === size);
    if (!variant) variant = product.variants[0];
    if (!variant) {
      return { success: false, message: `No variant found for size ${size}.` };
    }

    let cart = await prisma.cart.findUnique({ where: { sessionId } });
    if (!cart) cart = await prisma.cart.create({ data: { sessionId } });

    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, variantId: variant.id },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + 1, price: product.price },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: variant.productId,
          variantId: variant.id,
          productName: product.name,
          quantity: 1,
          price: product.price,
        },
      });
    }

    // ─── TRACK ADD‑TO‑CART EVENT ──────────────────────────
    await trackAddToCart(
      product.id,
      variant.id,
      1,
      cart.id,
      sessionId
    );

    const updatedCart = await prisma.cart.findUnique({
      where: { sessionId },
      include: { items: { include: { product: true, variant: true } } },
    });
    let cartData = null;
    if (updatedCart && updatedCart.items.length > 0) {
      cartData = {
        items: updatedCart.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.product?.name || item.productName || 'Product',
          size: item.variant?.size || 0,
          color: item.variant?.color || 'N/A',
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
        total: updatedCart.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      };
    }

    clearBuyState(sessionId);
    return {
      success: true,
      message: `✅ Added 1 x ${product.name} (Size ${variant.size}) to your cart.`,
      cartData,
    };
  } catch (err) {
    console.error('Execute add-to-cart failed:', err);
    return { success: false, message: 'Failed to add to cart. Please try again.' };
  }
}

// ─── POST handler ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { messages, sessionId } = await req.json();
  const effectiveSessionId = sessionId || 'anonymous';

  console.log('📥 Received messages:', messages);

  const lastUserMsg = messages.length > 0 ? messages[messages.length - 1] : null;

  // ─── PRE‑AI FAQ CHECK – SKIP if buy intent ──────────────
  if (lastUserMsg && lastUserMsg.role === 'user') {
    const lower = lastUserMsg.content.toLowerCase();
    const isBuyIntent = /\b(buy|add|purchase|i'?d\s+like\s+to\s+buy|want\s+to\s+buy)\b/.test(lower);

    if (!isBuyIntent) {
      await buildFAQIndex();

      const userEmbedding = await getLocalEmbedding(lastUserMsg.content);
      let bestMatch: FaqEntry | null = null;
      let bestSimilarity = 0;
      for (const entry of faqIndex) {
        const sim = cosineSimilarity(userEmbedding, entry.embedding);
        if (sim > bestSimilarity) {
          bestSimilarity = sim;
          bestMatch = entry;
        }
      }

      const THRESHOLD = 0.65;
      if (bestMatch && bestSimilarity >= THRESHOLD) {
        console.log(`📚 PRE-AI FAQ match: "${bestMatch.key}" (sim=${bestSimilarity.toFixed(3)}) – returning fact directly.`);
        return Response.json({
          message: bestMatch.response,
          products: [],
          recommendations: [],
          cart: null,
          hasMore: false,
          totalCount: 0,
        });
      }
    } else {
      console.log(`🛍️ Buy intent detected – skipping FAQ check.`);
    }
  }

  // ─── PRE‑PROCESSING: State tracking for buy intent ──────
  if (lastUserMsg && lastUserMsg.role === 'user') {
    const lower = lastUserMsg.content.toLowerCase();
    const isBuyIntent = /\b(buy|add|purchase|i'?d\s+like\s+to\s+buy|want\s+to\s+buy)\b/.test(lower);
    const isCheckoutIntent = /\b(checkout|proceed|place order|complete order)\b/.test(lower);

    if (isBuyIntent && !isCheckoutIntent) {
      const state = getBuyState(effectiveSessionId);
      const { productName } = await extractProductDetails(lastUserMsg.content);
      if (productName) {
        updateBuyState(effectiveSessionId, { productName });
        console.log(`📦 State: Product set to "${productName}"`);
      }
      if (state.productName) {
        const extracted = await extractProductDetails(lastUserMsg.content);
        if (extracted.size) {
          updateBuyState(effectiveSessionId, { size: extracted.size });
          console.log(`📦 State: Size set to ${extracted.size}`);
        }
        const currentState = getBuyState(effectiveSessionId);
        if (currentState.productName && currentState.size) {
          console.log(`🔧 Pre‑processing: Adding "${currentState.productName}" (Size ${currentState.size})`);
          const result = await executeAddToCart(effectiveSessionId, currentState.productName, currentState.size);
          if (result.success) {
            clearBuyState(effectiveSessionId);
            return Response.json({
              message: result.message,
              products: [],
              cart: result.cartData ? result.cartData.items : null,
              checkout: false,
              checkoutData: null,
              recommendations: [],
              hasMore: false,
              totalCount: 0,
            });
          } else {
            clearBuyState(effectiveSessionId);
          }
        }
      }
    }

    // ─── SECOND PRE‑PROCESSING: pending product + size in any message ──
    const state = getBuyState(effectiveSessionId);
    if (state.productName && !state.size) {
      const { size } = await extractProductDetails(lastUserMsg.content);
      if (size) {
        updateBuyState(effectiveSessionId, { size });
        const currentState = getBuyState(effectiveSessionId);
        if (currentState.productName && currentState.size) {
          console.log(`🔧 Auto‑adding (second pass): "${currentState.productName}" (Size ${currentState.size})`);
          const result = await executeAddToCart(effectiveSessionId, currentState.productName, currentState.size);
          if (result.success) {
            clearBuyState(effectiveSessionId);
            return Response.json({
              message: result.message,
              products: [],
              cart: result.cartData ? result.cartData.items : null,
              checkout: false,
              checkoutData: null,
              recommendations: [],
              hasMore: false,
              totalCount: 0,
            });
          } else {
            clearBuyState(effectiveSessionId);
          }
        }
      }
    }
  }

  // ─── ENHANCED SYSTEM PROMPT ──────────────────────────────
  const systemPrompt = `
You are "ShoeBot", a friendly AI shopping assistant for Sabaton, a premium leather footwear shop in Buea, Cameroon.

**CRITICAL RULES – FOLLOW EXACTLY:**

1. **ADDING TO CART (buy intent):**
   - If the user says they want to buy a product (e.g., "I'd like to buy..."), you MUST ask for the size (EU) if not provided.
   - Once the user provides the size, you MUST call the "addToCart" tool IMMEDIATELY – do NOT call "showProducts".
   - DO NOT show product cards when the user has already specified a product and size.

2. **SEARCH / PRODUCT INQUIRY:**
   - Use the "showProducts" tool ONLY when the user explicitly asks to see products (e.g., "show me", "find", "looking for", "do you have", "gift", "price under").
   - For questions about care, hours, policies, or general information, use the FAQ or business info – do NOT search for products.

3. **CHECKOUT:**
   - When user says "checkout", "proceed", "place order", just say: "I'll prepare your checkout." The system will open the checkout modal automatically.

4. **USER PROFILE (SAVE / VIEW):**
   - When the user asks to save their information (e.g., "save my profile", "update my details", "my profile info", "edit my details"), use the "saveUserProfile" tool.
   - You MUST collect the required fields: name, phone, address, and optionally email, city.
   - If the user asks to view their profile, use the "getUserProfile" tool.
   - Example flow: User says "save my profile" → you ask for name, phone, address → user provides them → you call saveUserProfile with those details.

Be concise, friendly, and always use FCFA.

**Available tools:** addToCart, showProducts, showCart, getBusinessInfo, saveUserProfile, getUserProfile, removeFromCart, getCrossSellRecommendations.
`;

  // ─── TOOLS ────────────────────────────────────────────────────
  const tools = {
    showProducts: {
      description: 'Search for products by name, category, gender, size, or maxPrice. Use this ONLY when the user explicitly asks to see or find products.',
      inputSchema: z.object({
        category: z.string().optional(),
        gender: z.string().optional(),
        size: z.number().optional(),
        maxPrice: z.number().optional(),
        offset: z.number().int().min(0).default(0),
      }),
      execute: async ({ category, gender, size, maxPrice, offset = 0 }: any) => {
        console.log(`🔍 showProducts called with:`, { category, gender, size, maxPrice, offset });
        const cacheKey = `search:${category || ''}:${gender || ''}:${size || ''}:${maxPrice || ''}:${offset}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        try {
          const supabase = createClient({
            connectionString: process.env.SUPABASE_DB_URL,
          });
          let normalizedGender = gender;
          if (gender) {
            const g = gender.toLowerCase();
            if (g === 'women' || g === 'female') normalizedGender = 'female';
            else if (g === 'men' || g === 'male') normalizedGender = 'male';
            else normalizedGender = g;
          }
          let queryText = category || '';
          if (normalizedGender) queryText += ` ${normalizedGender}`;
          if (!queryText.trim()) {
            const empty = { products: [], hasMore: false, totalCount: 0 };
            setCache(cacheKey, empty, 60000);
            return empty;
          }
          console.log(`🧠 Generating embedding for: "${queryText}"`);
          const queryVector = await getLocalEmbedding(queryText);
          const vectorString = `[${queryVector.join(',')}]`;
          let whereClause = '';
          const whereParams: any[] = [];
          let paramIndex = 1;
          if (maxPrice !== undefined && maxPrice !== null) {
            whereClause += ` AND price <= $${paramIndex}`;
            whereParams.push(maxPrice);
            paramIndex++;
          }
          if (normalizedGender) {
            whereClause += ` AND gender = $${paramIndex}`;
            whereParams.push(normalizedGender);
            paramIndex++;
          }
          const LIMIT = 4;
          const vectorQuery = supabase.sql`
            SELECT 
              id,
              name,
              price,
              gender,
              material,
              category,
              "imageUrl" as image,
              1 - (embedding <=> ${vectorString}::vector) AS similarity
            FROM "Product"
            WHERE embedding IS NOT NULL
            ${whereClause}
            ORDER BY embedding <=> ${vectorString}::vector
            LIMIT ${LIMIT + 1}
            OFFSET ${offset};
          `;
          const TIMEOUT_MS = 2000;
          let products;
          try {
            const result = await Promise.race([
              vectorQuery,
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('VECTOR_TIMEOUT')), TIMEOUT_MS)
              )
            ]);
            products = (result as any).rows;
          } catch (err: any) {
            if (err.message === 'VECTOR_TIMEOUT') {
              console.warn('⏱️ Vector timed out, falling back to keyword');
              throw new Error('Fallback');
            } else {
              throw err;
            }
          }
          const hasMore = products.length > LIMIT;
          if (hasMore) {
            products = products.slice(0, LIMIT);
          }
          let filteredProducts = products;
          if (size !== undefined && size !== null) {
            const productIds = filteredProducts.map((p: any) => p.id);
            const variants = await prisma.variant.findMany({
              where: {
                productId: { in: productIds },
                size: Number(size),
              },
              select: { productId: true },
            });
            const validProductIds = new Set(variants.map(v => v.productId));
            filteredProducts = filteredProducts.filter((p: any) => validProductIds.has(p.id));
          }
          const finalProductIds = filteredProducts.map((p: any) => p.id);
          let fullProducts: any[] = [];
          if (finalProductIds.length > 0) {
            fullProducts = await prisma.product.findMany({
              where: { id: { in: finalProductIds } },
              include: { variants: true },
            });
          }
          fullProducts = reorderExactMatch(fullProducts, queryText);
          
          // ─── TRACK PRODUCT VIEWS ──────────────────────────
          for (const product of fullProducts) {
            await trackProductView(product.id, effectiveSessionId);
          }
          // ─── TRACK SEARCH ─────────────────────────────────
          if (queryText.trim()) {
            await trackSearch(queryText, fullProducts.length, effectiveSessionId);
          }

          const result = {
            products: fullProducts.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              gender: p.gender,
              material: p.material,
              category: p.category,
              image: p.imageUrl || '/images/placeholder.jpg',
              variants: p.variants.map((v: Variant) => ({
                id: v.id,
                size: v.size,
                stock: v.stock,
                color: v.color,
              })),
            })),
            hasMore,
            totalCount: hasMore ? -1 : fullProducts.length,
          };
          setCache(cacheKey, result, 300000);
          return result;
        } catch (error) {
          console.log('⚠️ Falling back to Prisma contains search...');
          try {
            const words = (category || '').split(/\s+/).filter((w: string) => w.length > 0);
            const where: any = {};
            let normalizedGender = gender;
            if (gender) {
              const g = gender.toLowerCase();
              if (g === 'women' || g === 'female') normalizedGender = 'female';
              else if (g === 'men' || g === 'male') normalizedGender = 'male';
              else normalizedGender = g;
            }
            if (normalizedGender) where.gender = { equals: normalizedGender, mode: 'insensitive' };
            if (maxPrice !== undefined && maxPrice !== null) where.price = { lte: maxPrice };
            if (words.length > 0) {
              where.OR = words.map((word: string) => ({
                OR: [
                  { name: { contains: word, mode: 'insensitive' } },
                  { material: { contains: word, mode: 'insensitive' } },
                  { category: { contains: word, mode: 'insensitive' } },
                  { searchText: { contains: word, mode: 'insensitive' } },
                ]
              }));
            }
            const LIMIT = 4;
            const products = await prisma.product.findMany({
              where,
              include: { variants: true },
              take: LIMIT + 1,
              skip: offset || 0,
            });
            const hasMore = products.length > LIMIT;
            const finalProducts = hasMore ? products.slice(0, LIMIT) : products;
            let filtered = finalProducts;
            if (size !== undefined && size !== null) {
              filtered = filtered.filter((p) =>
                p.variants.some((v) => v.size === Number(size))
              );
            }
            const reordered = reorderExactMatch(filtered, category || '');
            
            for (const product of reordered) {
              await trackProductView(product.id, effectiveSessionId);
            }
            if (category && category.trim()) {
              await trackSearch(category, reordered.length, effectiveSessionId);
            }

            const result = {
              products: reordered.map((p) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                gender: p.gender,
                material: p.material,
                category: p.category,
                image: p.imageUrl || '/images/placeholder.jpg',
                variants: p.variants.map((v: Variant) => ({
                  id: v.id,
                  size: v.size,
                  stock: v.stock,
                  color: v.color,
                })),
              })),
              hasMore,
              totalCount: hasMore ? -1 : reordered.length,
            };
            setCache(cacheKey, result, 300000);
            return result;
          } catch (fallbackError) {
            console.error('❌ Ultimate fallback error:', fallbackError);
            const empty = { products: [], hasMore: false, totalCount: 0 };
            setCache(cacheKey, empty, 60000);
            return empty;
          }
        }
      },
    },

    getBusinessInfo: {
      description: 'Provide detailed shop information including location, hours, contact, about us, delivery, payment, returns, and more.',
      inputSchema: z.object({ query: z.string().optional() }),
      execute: async () => ({ info: BUSINESS_INFO }),
    },

    addToCart: {
      description: 'Add a product to the cart. Use this ONLY when the user has specified a product and size.',
      inputSchema: z.object({
        productName: z.string().describe('The product name as given by the user.'),
        size: z.number().int().positive().describe('The EU shoe size.'),
        quantity: z.number().int().positive().default(1),
      }),
      execute: async ({ productName, size, quantity }: any) => {
        console.log(`🛒 addToCart called with productName: "${productName}", size: ${size}`);
        const result = await executeAddToCart(effectiveSessionId, productName, size);
        if (result.success) {
          cache.delete(`cart:${effectiveSessionId}`);
          return { success: true, message: result.message };
        } else {
          return { error: result.message };
        }
      },
    },

    showCart: {
      description: 'Show current cart contents.',
      inputSchema: z.object({}),
      execute: async () => {
        const cacheKey = `cart:${effectiveSessionId}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;
        const cart = await prisma.cart.findUnique({
          where: { sessionId: effectiveSessionId },
          include: { items: { include: { product: true, variant: true } } },
        });
        if (!cart || cart.items.length === 0) {
          const empty = { items: [], total: 0, message: 'Your cart is empty.' };
          setCache(cacheKey, empty, 60000);
          return empty;
        }
        const items = cart.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.product?.name || item.productName || 'Product',
          size: item.variant?.size || 0,
          color: item.variant?.color || 'N/A',
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        }));
        const total = items.reduce((sum, i) => sum + i.subtotal, 0);
        const result = { items, total, message: `Your cart has ${items.length} item(s) totalling ${total.toLocaleString()} FCFA.` };
        setCache(cacheKey, result, 120000);
        return result;
      },
    },

    removeFromCart: {
      description: 'Remove an item from the cart.',
      inputSchema: z.object({ itemId: z.string().min(1) }),
      execute: async ({ itemId }: any) => {
        const cartItem = await prisma.cartItem.findUnique({
          where: { id: itemId },
          include: { cart: true },
        });
        if (!cartItem) throw new Error('Item not found.');
        if (cartItem.cart.sessionId !== effectiveSessionId) throw new Error('Permission denied.');
        await prisma.cartItem.delete({ where: { id: itemId } });
        cache.delete(`cart:${effectiveSessionId}`);
        return { success: true, message: `✅ Removed ${cartItem.productName} from your cart.` };
      },
    },

    getCrossSellRecommendations: {
      description: 'Recommend accessories based on cart items.',
      inputSchema: z.object({}),
      execute: async () => {
        console.log('🔗 getCrossSellRecommendations called');
        const cart = await prisma.cart.findUnique({
          where: { sessionId: effectiveSessionId },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    shoeCategories: {
                      include: { shoeCategory: true },
                    },
                  },
                },
              },
            },
          },
        });
        if (!cart || cart.items.length === 0) {
          return { message: 'Your cart is empty. Add some shoes to get accessory recommendations.', recommendations: [] };
        }
        const categoryIds = new Set<string>();
        const materials = new Set<string>();
        const hasLaceShoe = cart.items.some(item => {
          const name = item.product.name.toLowerCase();
          return name.includes('oxford') || name.includes('derby') || name.includes('boot');
        });
        for (const item of cart.items) {
          if (item.product.shoeCategories && item.product.shoeCategories.length > 0) {
            item.product.shoeCategories.forEach(sc => categoryIds.add(sc.shoeCategoryId));
          }
          if (item.product.material) {
            materials.add(item.product.material.toLowerCase());
          }
        }
        const accessories = await prisma.product.findMany({
          where: {
            category: 'accessory',
            AND: [
              {
                fitsCategories: {
                  some: {
                    shoeCategoryId: { in: Array.from(categoryIds) },
                  },
                },
              },
              {
                id: { notIn: cart.items.map(item => item.productId) },
              },
            ],
          },
          include: { variants: true, fitsCategories: true },
          take: 10,
        });
        const scored = accessories.map(acc => {
          let score = acc.crossSellScore || 50;
          const accMat = acc.material?.toLowerCase() || '';
          if (accMat.includes('suede') && materials.has('suede')) score += 30;
          else if (accMat.includes('leather') && materials.has('leather')) score += 20;
          else if (accMat.includes('cream') && materials.has('leather')) score += 25;
          if (acc.name.toLowerCase().includes('lace') && hasLaceShoe) score += 25;
          return { ...acc, score };
        });
        const sorted = scored.sort((a, b) => b.score - a.score).slice(0, 3);
        const recommendations = sorted.map(acc => ({
          id: acc.id,
          name: acc.name,
          price: acc.price,
          description: acc.description,
          defaultSize: acc.variants[0]?.size || 0,
          defaultColor: acc.variants[0]?.color || 'N/A',
        }));
        if (recommendations.length === 0) {
          return { message: 'No specific accessories found for your cart items, but we have a great selection of shoe care products.', recommendations: [] };
        }
        return {
          message: `We recommend these accessories to complement your shoes:`,
          recommendations,
        };
      },
    },

    saveUserProfile: {
      description: 'Save or update the customer profile.',
      inputSchema: z.object({
        name: z.string(),
        phone: z.string(),
        address: z.string(),
        email: z.string().optional(),
        city: z.string().optional(),
      }),
      execute: async ({ name, phone, address, email, city }: any) => {
        const profile = await prisma.userProfile.upsert({
          where: { phone },
          update: { name, address, email: email || undefined, city: city || 'Buea' },
          create: { phone, name, address, email: email || undefined, city: city || 'Buea' },
        });
        await prisma.session.upsert({
          where: { sessionId: effectiveSessionId },
          update: { userProfileId: profile.id },
          create: { sessionId: effectiveSessionId, userProfileId: profile.id },
        });
        cache.delete(`profile:${effectiveSessionId}`);
        return { success: true, message: `Thank you, ${name}. Your details are saved for future orders!` };
      },
    },

    getUserProfile: {
      description: 'Retrieve the customer profile.',
      inputSchema: z.object({}),
      execute: async () => {
        const cacheKey = `profile:${effectiveSessionId}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;
        const session = await prisma.session.findUnique({
          where: { sessionId: effectiveSessionId },
          include: { userProfile: true },
        });
        let result;
        if (session?.userProfile) {
          result = {
            exists: true,
            name: session.userProfile.name,
            phone: session.userProfile.phone,
            address: session.userProfile.address,
            email: session.userProfile.email,
            city: session.userProfile.city,
          };
        } else {
          result = { exists: false };
        }
        setCache(cacheKey, result, 600000);
        return result;
      },
    },
  };

  // ─── Generate response ─────────────────────────────────────
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const result = await generateText({
      model: 'anthropic/claude-opus-4.8',
      system: systemPrompt,
      messages,
      tools,
      temperature: 0.2,
      timeout: 45000,
      maxRetries: 1,
      fetch: async (url: string, options: RequestInit) => {
        const abortController = new AbortController();
        const id = setTimeout(() => abortController.abort(), 30000);
        try {
          return await fetch(url, { ...options, signal: abortController.signal });
        } finally {
          clearTimeout(id);
        }
      },
      abortSignal: controller.signal,
    } as any);

    clearTimeout(timeoutId);

    console.log('✅ LLM response received. Tool calls:', result.toolCalls?.length || 0);

    let finalMessage = result.text;
    let productData: any[] = [];
    let cartData: any = null;
    let addToCartCalled = false;
    let hasMore = false;
    let totalCount = 0;

    if (result.toolResults) {
      for (const tr of result.toolResults) {
        const output = (tr as any).output;
        if (tr.toolName === 'addToCart') {
          addToCartCalled = true;
          if (output?.error) finalMessage = output.error;
          else if (output?.success) finalMessage = output.message;
        }
        if (tr.toolName === 'showProducts' && output?.products) {
          productData = output.products;
          hasMore = output.hasMore || false;
          totalCount = output.totalCount || 0;
        }
        if (tr.toolName === 'showCart' && output) {
          cartData = output;
        }
      }
    }

    if (!result.toolCalls || result.toolCalls.length === 0) {
      if (lastUserMsg && lastUserMsg.role === 'user') {
        // ─── FALLBACK: no AI tool call ─────────────────────
        // First, check if it's a buy intent – if so, ask for size
        const lower = lastUserMsg.content.toLowerCase();
        const hasBuy = /\b(buy|add|purchase|i'?d\s+like\s+to\s+buy|want\s+to\s+buy)\b/.test(lower);

        if (hasBuy) {
          const { productName } = await extractProductDetails(lastUserMsg.content);
          if (productName) {
            finalMessage = `Great! What EU size would you like for the **${productName}**?`;
          } else {
            finalMessage = "I'd be happy to help you with that! Please tell me which product you'd like to buy and what EU size you need.";
          }
        } else {
          // Not a buy intent – try FAQ or generic matches
          await buildFAQIndex();
          const userEmbedding = await getLocalEmbedding(lastUserMsg.content);
          let bestMatch: FaqEntry | null = null;
          let bestSimilarity = 0;
          for (const entry of faqIndex) {
            const sim = cosineSimilarity(userEmbedding, entry.embedding);
            if (sim > bestSimilarity) {
              bestSimilarity = sim;
              bestMatch = entry;
            }
          }
          const THRESHOLD = 0.6;
          if (bestMatch && bestSimilarity >= THRESHOLD) {
            console.log(`📚 Final fallback FAQ match: "${bestMatch.key}" (sim=${bestSimilarity.toFixed(3)})`);
            finalMessage = bestMatch.response;
          } else {
            // Keyword fallback for non‑buy messages
            if (/\b(care|clean|condition|polish|brush|protect|waterproof|suede|leather)\b/.test(lower)) {
              finalMessage = FAQ_RESPONSES["care"] || "We have detailed care instructions for suede and leather. Please ask more specifically!";
            } else if (/\b(hours|open|close|business|working|operation|time)\b/.test(lower)) {
              finalMessage = FAQ_RESPONSES["business hours"] || "We're open Monday to Saturday, 8 AM – 6 PM (WAT). Closed Sundays.";
            } else if (/\b(accessories|accessory|shoe care|cream|brush|laces|trees|socks)\b/.test(lower)) {
              finalMessage = FAQ_RESPONSES["accessories"] || "Yes, we have shoe care accessories! Check our collection.";
            } else if (/\b(comfort|comfortable|most comfortable|cushion|support|soft)\b/.test(lower)) {
              finalMessage = FAQ_RESPONSES["comfort"] || "All our shoes are comfortable. The most cushioned styles are the Leather Ballet Flats and Struds Ballet Flats.";
            } else if (/\b(location|where|address|shop|store|molyko)\b/.test(lower)) {
              finalMessage = FAQ_RESPONSES["location"] || "We're located in Molyko, Buea (near the main roundabout).";
            } else {
              finalMessage = "I'm not sure I understood. Could you please rephrase? I can help you find shoes, add items to your cart, or answer questions about our store.";
            }
          }
        }
      }
    }

    if (addToCartCalled && !cartData) {
      const cartResult = await tools.showCart.execute() as { items: any[]; total: number; message: string };
      if (cartResult && cartResult.items && cartResult.items.length > 0) {
        cartData = cartResult;
      }
    }

    let checkoutFlag = false;
    let checkoutData = null;
    if (lastUserMsg && lastUserMsg.role === 'user') {
      const lower = lastUserMsg.content.toLowerCase();
      if (/\b(checkout|proceed|place order|complete order)\b/.test(lower)) {
        checkoutFlag = true;
        if (!cartData) {
          const cartResult = await tools.showCart.execute() as { items: any[]; total: number; message: string };
          if (cartResult && cartResult.items && cartResult.items.length > 0) {
            cartData = cartResult;
          }
        }
        if (cartData && cartData.items.length === 0) {
          checkoutFlag = false;
          finalMessage = 'Your cart is empty. Add some items first!';
        } else {
          checkoutData = cartData;
          finalMessage = '✅ Preparing your checkout. Please review your order in the checkout window.';
        }
      }
    }

    if (productData.length > 0 && !finalMessage.includes('✅')) {
      // keep product data
    } else if (cartData && cartData.items && cartData.items.length > 0 && !checkoutFlag && !addToCartCalled) {
      const itemList = cartData.items.map((item: any) => 
        `• ${item.name} (Size ${item.size}) × ${item.quantity} – ${item.subtotal.toLocaleString()} FCFA`
      ).join('\n');
      finalMessage = `🛒 **Your Cart**\n${itemList}\n\n**Total:** ${cartData.total.toLocaleString()} FCFA\n\nYou can proceed to checkout by saying "checkout".`;
    }

    console.log(`🛍️ Sending ${productData.length} products, checkout: ${checkoutFlag}`);

    return Response.json({
      message: finalMessage,
      products: productData,
      cart: cartData ? cartData.items : null,
      checkout: checkoutFlag,
      checkoutData: checkoutFlag ? checkoutData : null,
      recommendations: [],
      hasMore,
      totalCount,
    });
  } catch (error) {
    console.error('❌ Chat API error:', error);
    return Response.json(
      {
        message: 'The AI service is temporarily unavailable. Please try again later.',
        products: [],
        cart: null,
        checkout: false,
        checkoutData: null,
        hasMore: false,
        totalCount: 0,
      },
      { status: 500 }
    );
  }
}