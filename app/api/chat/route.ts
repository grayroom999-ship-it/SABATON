import { generateText } from 'ai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Product, Variant, ShoeCategoryName } from '@prisma/client';
import { createClient } from '@vercel/postgres';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// ─── FAQ Knowledge Base ──────────────────────────────────────
// Broad, encompassing keyword mapping (case-insensitive)
const FAQ_RESPONSES: Record<string, string> = {
  // ─── Returns & Exchanges ──────────────────────────────────
  "return policy": "↩️ **Return Policy:** We offer a **14-day return policy** for unused items in original packaging. Contact us at hello@sabaton.cm to initiate a return. We'll guide you through the process. 😊",
  "exchange": "🔄 **Exchange Policy:** We offer a **14-day exchange** on unworn items. Just contact us and we'll arrange a size/colour swap.",
  "refund": "💰 **Refunds:** We process refunds within 2–3 business days after we receive the returned item. The refund goes to your original payment method.",
  "warranty": "🛡️ **Warranty:** All our shoes come with a **1-year warranty** against manufacturing defects (sole separation, stitching issues). Normal wear & tear not covered.",
  "return": "↩️ **14-day return policy** – unused, original packaging. Contact us to start your return.",

  // ─── Payment ────────────────────────────────────────────────
  "mobile money": "✅ Yes! We accept MTN MoMo and Orange Money. Select your preferred method at checkout.",
  "mtn": "✅ We accept MTN Mobile Money. Simply choose it at checkout.",
  "orange": "✅ We accept Orange Money. Select it at checkout.",
  "pay on delivery": "📦 We offer pay-on-delivery for Buea town orders. A 50% deposit is required upfront; balance on delivery.",
  "cash on delivery": "📦 Pay-on-delivery is available in Buea. 50% deposit required.",
  "payment": "💳 We accept Mobile Money (MTN, Orange) and secure online card payments. All transactions are encrypted.",
  "secure": "🔒 Your payment is secure – we never store your card details. All payments are processed via Vercel's secure gateway.",
  "hidden fees": "💰 No hidden fees. The total you see at checkout is the final amount (product + delivery if applicable).",

  // ─── Delivery ──────────────────────────────────────────────
  "delivery": "🚚 **Delivery:** Buea town – free (same-day dispatch). Outside Buea – fees calculated at checkout (from 1,500 FCFA).",
  "shipping": "🚚 **Shipping:** Same-day dispatch for orders before 2 PM. Delivery times: Buea (24h), Douala (2‑3 days), Yaoundé (3‑4 days).",
  "track": "📦 You'll receive a tracking link via WhatsApp once your order is dispatched.",
  "pick up": "🏬 Yes – you can pick up from our shop in Molyko. Select 'Pick Up' at checkout.",
  "delivery time": "⏱️ Buea: within 24h. Other locations: 2‑5 business days.",
  "international": "🌍 Currently we deliver only within Cameroon. For special requests, contact us.",

  // ─── Product Quality & Material ────────────────────────────
  "genuine leather": "👞 Yes! All our shoes are 100% genuine full-grain leather – the highest quality. Sourced from top European tanneries.",
  "full-grain": "🌟 **Full-grain leather** is the best quality – it retains the natural grain and develops a rich patina over time. We use it for all our shoes.",
  "top-grain": "🔝 **Top-grain** is slightly sanded – we prefer full-grain for its durability and natural beauty.",
  "leather quality": "🏆 We use only premium full-grain leather – durable, breathable, and ages beautifully.",
  "handmade": "🧵 Yes! Every pair is handcrafted in Buea by skilled artisans using traditional techniques.",
  "hand-stitched": "🪡 Our shoes are hand-stitched for superior durability and a refined finish.",
  "waterproof": "💧 Our leather is water-resistant, but we recommend applying a waterproofing spray. Avoid prolonged soaking.",
  "rain": "☔ See 'waterproof' – we also recommend boots for heavy rain.",
  "durability": "⏳ With proper care, our shoes last 5‑10+ years. Resoling is possible on select models.",
  "care": "🧴 Care: wipe with a damp cloth, condition monthly, use cedar shoe trees, and avoid direct heat.",

  // ─── Sizing & Fit ──────────────────────────────────────────
  "size": "📏 To find your size: trace your foot on a piece of paper while standing. Measure the distance from your heel to your longest toe, and use that length to find your size on a brand's sizing chart.",
  "fit": "👣 Most styles run true to size. If between sizes, we recommend sizing up.",
  "wide": "📐 We offer standard (D) width for men, (B) for women. Some styles available in wide (E). Contact us for custom width.",
  "narrow": "📐 Standard width only. We can accommodate custom requests – contact us.",
  "comfort": "😌 Our shoes have cushioned insoles and leather linings for all‑day comfort. They mould to your feet over time.",
  "break in": "⏳ Allow 3‑5 wears for the leather to soften. Wear them with thick socks initially.",

  // ─── Store Info ────────────────────────────────────────────
  "location": "📍 Molyko, Buea (near the main roundabout). Open Mon–Sat, 8 AM – 6 PM.",
  "hours": "🕐 Monday – Saturday, 8 AM – 6 PM (WAT). Closed Sundays.",
  "contact": "📞 Phone: +237 6XX XXX XXX | Email: hello@sabaton.cm | WhatsApp: +237 6XX XXX XXX",
  "phone": "📞 +237 6XX XXX XXX",
  "email": "📧 hello@sabaton.cm",

  // ─── General ──────────────────────────────────────────────
  "discount": "🎉 We occasionally run promotions. Follow us on social media or subscribe to our newsletter.",
  "bulk": "📦 Yes, we offer bulk discounts for 5+ pairs. Contact us for a custom quote.",
  "custom": "🛠️ Custom orders available! Lead time 2‑3 weeks. Contact us with your requirements.",
  "gift": "🎁 Gift wrapping is available for 1,500 FCFA. Add at checkout.",
  "student": "🎓 10% student/teacher discount with valid ID. Contact us to apply.",
  "after-sales": "🔄 Free cleaning and conditioning for 6 months after purchase. Bring them to our shop.",
  "about": "👞 Sabaton handcrafts leather shoes in Buea using full‑grain leather and traditional techniques.",
};

function getFAQResponse(text: string): string | null {
  const lower = text.toLowerCase();
  // Try exact key matches first
  for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
    if (lower.includes(key.toLowerCase())) {
      return response;
    }
  }
  // Try matching word boundaries for more precise matches
  const words = lower.split(/\s+/);
  for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
    const keyLower = key.toLowerCase();
    // If the key is a single word, check if it appears as a whole word
    if (!keyLower.includes(' ') && words.some(w => w === keyLower)) {
      return response;
    }
  }
  return null;
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

// ─── Helper: Re‑order results to put exact match first ────
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

// ─── Helpers ──────────────────────────────────────────────────

function isProductQuery(text: string): boolean {
  const businessKeywords = [
    'location', 'address', 'where', 'hours', 'open', 'close', 'return',
    'contact', 'phone', 'email', 'about', 'delivery', 'shipping', 'policy',
    'working', 'business', 'shop', 'store', 'tell me about', 'who are you'
  ];
  const lower = text.toLowerCase();
  if (businessKeywords.some(kw => lower.includes(kw))) return false;

  const productKeywords = [
    'looking for', 'show me', 'show', 'get', 'need', 'want',
    'i would like', 'i want', 'i need', 'shoe', 'boot', 'loafer',
    'oxford', 'accessory', 'lace', 'conditioner', 'cream', 'polish', 'brush',
    'women', 'female'
  ];
  return productKeywords.some(kw => lower.includes(kw));
}

// ─── POST handler ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { messages, sessionId } = await req.json();
  const effectiveSessionId = sessionId || 'anonymous';

  console.log('📥 Received messages:', messages);

  // ─── FIRST: Check FAQ ──────────────────────────────────────
  const lastUserMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  if (lastUserMsg && lastUserMsg.role === 'user') {
    const faqResponse = getFAQResponse(lastUserMsg.content);
    if (faqResponse) {
      console.log('📚 FAQ match found – returning instant response.');
      return Response.json({
        message: faqResponse,
        products: [],
        recommendations: [],
        cart: null,
        checkout: false,
        hasMore: false,
        totalCount: 0,
      });
    }
  }

  const BUSINESS_INFO = {
    location: 'Molyko, Buea, Cameroon (near the main roundabout)',
    hours: 'Monday – Saturday, 8:00 AM – 6:00 PM (WAT). Closed on Sundays.',
    returns: '14‑day return policy for unused items in original packaging. Contact us for authorization.',
    contact: 'Phone: +237 6XX XXX XXX | Email: hello@sabaton.cm',
    about: 'Sabaton handcrafts leather shoes in Buea using full‑grain leather and traditional techniques.',
    delivery: 'Free delivery within Buea town. Same‑day dispatch for in‑stock items before 2 PM.',
  };

  // ─── Tools ────────────────────────────────────────────────────

  const tools = {
    showProducts: {
      description: `
        Search for products by name, category, style, gender, size, or price.
        Use 'gender' with 'female' for women, 'male' for men.
        Use 'maxPrice' for budget filters.
        Use 'offset' for pagination (0, 4, 8, ...).
        Returns up to 4 products and a 'hasMore' flag.
      `,
      inputSchema: z.object({
        category: z.string().optional(),
        gender: z.string().optional(),
        size: z.number().optional(),
        maxPrice: z.number().optional(),
        offset: z.number().int().min(0).default(0),
      }),
      execute: async ({ category, gender, size, maxPrice, offset = 0 }: any) => {
        console.log(`🔍 showProducts called with:`, { category, gender, size, maxPrice, offset });
        try {
          const supabase = createClient({
            connectionString: process.env.SUPABASE_DB_URL,
          });

          // Normalise gender
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
            return { products: [], hasMore: false, totalCount: 0 };
          }

          // Embedding
          console.log(`🧠 Generating embedding for: "${queryText}"`);
          const queryVector = await getLocalEmbedding(queryText);
          const vectorString = `[${queryVector.join(',')}]`;

          // Build WHERE clause
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

          // ─── Main query: get LIMIT + 1 products to check for more ──
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

          const TIMEOUT_MS = 5000;
          let products;
          try {
            const result = await Promise.race([
              vectorQuery,
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('VECTOR_TIMEOUT')), TIMEOUT_MS)
              )
            ]);
            products = (result as any).rows;
            console.log(`📦 Vector search found ${products.length} products`);
          } catch (err: any) {
            if (err.message === 'VECTOR_TIMEOUT') {
              console.warn('⏱️ Vector timed out, falling back to keyword');
              throw new Error('Fallback');
            } else {
              throw err;
            }
          }

          // Determine if there are more
          const hasMore = products.length > LIMIT;
          if (hasMore) {
            products = products.slice(0, LIMIT);
          }

          // Size filter (applied after)
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

          return {
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
            totalCount: hasMore ? -1 : fullProducts.length, // -1 indicates unknown but there are more
          };
        } catch (error) {
          // Fallback: Prisma keyword search with pagination
          console.log('⚠️ Falling back to Prisma keyword search...');
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

            return {
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
          } catch (fallbackError) {
            console.error('❌ Fallback error:', fallbackError);
            return { products: [], hasMore: false, totalCount: 0 };
          }
        }
      },
    },

    getBusinessInfo: {
      description: `Provide shop information.`,
      inputSchema: z.object({ query: z.string().optional() }),
      execute: async () => {
        console.log(`📞 getBusinessInfo called`);
        return { info: BUSINESS_INFO };
      },
    },

    addToCart: {
      description: 'Add a product to the cart.',
      inputSchema: z.object({
        productId: z.string(),
        size: z.number().int().positive(),
        color: z.string().optional().default(''),
        quantity: z.number().int().positive().default(1),
      }),
      execute: async ({ productId, size, color, quantity }: any) => {
        console.log(`🛒 addToCart called:`, { productId, size, color, quantity });

        let actualProductId = productId;
        if (!productId.startsWith('cmq')) {
          const product = await prisma.product.findFirst({
            where: { name: { equals: productId, mode: 'insensitive' } },
          });
          if (!product) throw new Error(`Product "${productId}" not found.`);
          actualProductId = product.id;
        }

        const parsedSize = typeof size === 'number' ? size : parseInt(size, 10);
        const parsedQuantity = typeof quantity === 'number' ? quantity : parseInt(quantity, 10);

        if (isNaN(parsedSize) || parsedSize <= 0) throw new Error('Invalid size.');
        if (isNaN(parsedQuantity) || parsedQuantity < 1) throw new Error('Quantity must be at least 1.');

        const product = await prisma.product.findUnique({
          where: { id: actualProductId },
          include: { variants: true },
        });
        if (!product) throw new Error('Product not found.');

        let finalColor = color;
        if (!finalColor || finalColor.trim() === '') {
          const availableColors = [...new Set(product.variants.map((v: Variant) => v.color))];
          if (availableColors.length === 0) throw new Error('No variants available.');
          finalColor = availableColors[0];
          console.warn(`⚠️ No colour provided, defaulting to ${finalColor}.`);
        }

        const variant = await prisma.variant.findFirst({
          where: {
            productId: actualProductId,
            size: parsedSize,
            color: { equals: finalColor, mode: 'insensitive' },
          },
          include: { product: true },
        });
        if (!variant) {
          const availableColors = await prisma.variant.findMany({
            where: { productId: actualProductId, size: parsedSize },
            select: { color: true },
          }).then(vs => vs.map(v => v.color));
          const colorList = [...new Set(availableColors)].join(', ');
          throw new Error(
            `No variant for size ${parsedSize} and colour "${finalColor}". Available: ${colorList || 'none'}.`
          );
        }

        let cart = await prisma.cart.findUnique({ where: { sessionId: effectiveSessionId } });
        if (!cart) cart = await prisma.cart.create({ data: { sessionId: effectiveSessionId } });

        const existing = await prisma.cartItem.findFirst({
          where: { cartId: cart.id, productId: actualProductId, variantId: variant.id },
        });

        if (existing) {
          await prisma.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + parsedQuantity, price: variant.product.price },
          });
        } else {
          await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId: actualProductId,
              variantId: variant.id,
              productName: variant.product.name,
              quantity: parsedQuantity,
              price: variant.product.price,
            },
          });
        }

        return {
          success: true,
          message: `✅ Added ${parsedQuantity} x ${variant.product.name} (Size ${parsedSize} / ${finalColor}) to your cart.`,
        };
      },
    },

    showCart: {
      description: 'Display current cart contents.',
      inputSchema: z.object({}),
      execute: async () => {
        const cart = await prisma.cart.findUnique({
          where: { sessionId: effectiveSessionId },
          include: { items: { include: { product: true, variant: true } } },
        });
        if (!cart || cart.items.length === 0) return { items: [], total: 0, message: 'Your cart is empty.' };
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
        return {
          items,
          total,
          message: `Your cart has ${items.length} item(s) totalling ${total.toLocaleString()} FCFA.`,
        };
      },
    },

    removeFromCart: {
      description: 'Remove an item from the cart using itemId.',
      inputSchema: z.object({ itemId: z.string().min(1) }),
      execute: async ({ itemId }: any) => {
        const cartItem = await prisma.cartItem.findUnique({
          where: { id: itemId },
          include: { cart: true },
        });
        if (!cartItem) throw new Error('Item not found.');
        if (cartItem.cart.sessionId !== effectiveSessionId) throw new Error('Permission denied.');
        await prisma.cartItem.delete({ where: { id: itemId } });
        const remaining = await prisma.cartItem.count({ where: { cartId: cartItem.cartId } });
        if (remaining === 0) {
          return { success: true, message: `✅ Removed ${cartItem.productName}. Your cart is now empty.` };
        }
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
          include: {
            variants: true,
            fitsCategories: true,
          },
          take: 10,
        });

        const scored = accessories.map(acc => {
          let score = acc.crossSellScore || 50;
          const accMat = acc.material?.toLowerCase() || '';

          if (accMat.includes('suede') && materials.has('suede')) {
            score += 30;
          } else if (accMat.includes('leather') && materials.has('leather')) {
            score += 20;
          } else if (accMat.includes('cream') && materials.has('leather')) {
            score += 25;
          }

          const isLaceAccessory = acc.name.toLowerCase().includes('lace');
          if (isLaceAccessory && hasLaceShoe) {
            score += 25;
          }

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
  };

  // ─── SYSTEM PROMPT ──────────────────────────────────────────

  const systemPrompt = `
You are "ShoeBot", an AI shopping assistant for Sabaton, a premium leather footwear shop in Buea, Cameroon. We offer shoes for both men and women, and leather accessories.

**CRITICAL RULES:**

1. **ADD/BUY:** If the user says "add", "buy", or "I'd like to buy" – you MUST check if they provided size and colour. If not, you MUST first call showProducts to display the product with variants, then ask: "Which size and colour would you like?" Do NOT call addToCart until you have both. If they provide all three (name, size, colour) in the same message, call addToCart immediately.

2. **SEARCH:** If the user says "show", "looking for", "do you have" → call showProducts. Use 'gender' with 'female' for women, 'male' for men. Use 'maxPrice' for budget.

3. **CHECKOUT:** If the user says "proceed", "checkout", "place order" → do NOT call any tool. The system will trigger the checkout modal.

4. **SIZING/COMFORT:** If the user asks about sizing, fit, or comfort → do NOT call any tool. Give helpful advice.

5. **RECOMMENDATIONS:** If the user asks for accessories → call getCrossSellRecommendations.

6. For removing items → call removeFromCart.
7. For business info → call getBusinessInfo.
8. For cart summary → call showCart.

Be concise, friendly, and always use FCFA for prices.
`;

  // ─── Generate response ─────────────────────────────────────

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const result = await generateText({
      model: 'anthropic/claude-opus-4.8',
      system: systemPrompt,
      messages,
      tools,
      temperature: 0.7,
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

    // ─── Extract tool results ──────────────────────────────
    let recommendations: any[] = [];
    let productData: any[] = [];
    let businessInfo: any = null;
    let cartData: any = null;
    let addToCartCalled = false;
    let hasMore = false;
    let totalCount = 0;

    if (result.toolResults && Array.isArray(result.toolResults)) {
      for (const tr of result.toolResults) {
        const output = (tr as any).output;
        if (tr.toolName === 'getCrossSellRecommendations' && output?.recommendations) {
          recommendations = output.recommendations;
        }
        if (tr.toolName === 'showProducts' && output && Array.isArray(output.products)) {
          productData = output.products;
          hasMore = output.hasMore || false;
          totalCount = output.totalCount || 0;
          console.log(`📦 Tool returned ${productData.length} products, hasMore: ${hasMore}`);
        }
        if (tr.toolName === 'getBusinessInfo' && output?.info) {
          businessInfo = output.info;
        }
        if (tr.toolName === 'showCart' && output) {
          cartData = output;
          console.log(`🛒 Cart has ${output.items?.length || 0} items`);
        }
        if (tr.toolName === 'addToCart' && output) {
          addToCartCalled = true;
        }
      }
    }

    let finalMessage = result.text;

    // ─── Post‑processing: manual add fallback (only if size and colour present) ──
    if (lastUserMsg && lastUserMsg.role === 'user' && !addToCartCalled) {
      const text = lastUserMsg.content;
      const lowerText = text.toLowerCase();

      const isSizingQuery = /\b(size|fit|comfort|all-day|width|narrow|wide)\b/.test(lowerText);
      if (isSizingQuery) {
        console.log('⏭️ Sizing/comfort query – skipping fallback.');
      } else {
        const isAddQuery = /\b(add|buy|purchase|i'?d\s+like\s+to\s+buy)\b/.test(lowerText);
        if (isAddQuery) {
          console.log('🔧 Manual add-to-cart fallback...');
          let productName = '';
          let size: number | undefined;
          let color: string | undefined;

          // List of product names
          const productNames = [
            'Heritage Full‑Grain Oxford', 'Premium Suede Chukka Boots', 'Suede Weekend Loafers',
            'Balmoral Suede Oxford', 'Budapest Brogue Oxford', 'Budapest High‑Top Boots',
            'Driving Moccasins', 'Classic Derby Shoes', 'Budapest Balmoral Oxford',
            'Leather Chukka Boots', 'Cognac Antique Monk Strap', 'Museum Calf Oxford',
            'Black Budapest Brogue Oxford', 'Leather Ballet Flats', 'Struds Ballet Flats',
            'Block‑Heel Ankle Boots', 'Petra Leather Boots', 'Leather Slip‑Ons',
            'Saddle Oxford Formal Shoes', 'Block‑Heel Leather Pumps', 'Lodi‑due Caramel Rose Flats',
            'LISA Leather Slides', 'Leather Shoe Cream (Black)', 'Suede Shoe Brush',
            'Cotton Shoelaces (Black/Brown)', 'Cedar Shoe Trees', 'Cotton Socks (Pack of 6)'
          ];

          for (const name of productNames) {
            const nameLower = name.toLowerCase();
            if (lowerText.includes(nameLower) || nameLower.includes(lowerText)) {
              productName = name;
              break;
            }
          }

          if (!productName) {
            const cleaned = text.replace(/\b(add|buy|to my cart|please|i need|i want)\b/gi, '').trim();
            for (const name of productNames) {
              if (cleaned.toLowerCase().includes(name.toLowerCase())) {
                productName = name;
                break;
              }
            }
          }

          // Extract size and colour – if missing, we will ask
          const sizeMatch = text.match(/size\s*(\d{2})/i);
          if (sizeMatch) size = parseInt(sizeMatch[1]);

          const colorMatch = text.match(/\b(black|brown|tan|grey|blue|red|white|beige|nude|navy|olive|purple|rose|cream)\b/i);
          if (colorMatch) color = colorMatch[1].toLowerCase();

          if (productName && size && color) {
            console.log(`🔧 Attempting manual add: ${productName}, size ${size}, color ${color}`);
            try {
              const product = await prisma.product.findFirst({
                where: { name: { equals: productName, mode: 'insensitive' } },
                include: { variants: true },
              });
              if (product) {
                let variant = product.variants[0];
                if (size) {
                  const matched = product.variants.find(v => v.size === size);
                  if (matched) variant = matched;
                }
                if (variant) {
                  const cartResult = await tools.addToCart.execute({
                    productId: product.id,
                    size: variant.size,
                    color: color || variant.color || 'Brown',
                    quantity: 1,
                  });
                  finalMessage = cartResult.message;
                  console.log('✅ Manual add-to-cart succeeded');
                  addToCartCalled = true;
                  productData = [];
                }
              }
            } catch (err) {
              console.error('❌ Manual add-to-cart failed:', err);
            }
          } else {
            // Missing size or colour – ask the user
            let askMsg = `I'd be happy to add that! Could you please specify the size and colour?`;
            if (productName && !size) {
              askMsg = `What size would you like for the ${productName}?`;
            } else if (productName && !color) {
              askMsg = `What colour would you like for the ${productName}?`;
            } else if (!productName) {
              askMsg = `Could you please tell me the product name, size, and colour you'd like to add?`;
            }
            finalMessage = askMsg;
            // Ensure we don't show product cards
            productData = [];
          }
        }
      }
    }

    // ─── Fallback search ──────────────────────────────────────
    if (lastUserMsg && lastUserMsg.role === 'user' && !addToCartCalled) {
      const text = lastUserMsg.content;
      const showProductsCalled = result.toolCalls?.some((call: any) => call.toolName === 'showProducts');
      const showCartCalled = result.toolCalls?.some((call: any) => call.toolName === 'showCart');

      const lowerText = text.toLowerCase();
      const isAddQuery = /\b(add|buy|purchase|i'?d\s+like\s+to\s+buy)\b/.test(lowerText);
      const isCartQuery = /\b(cart|checkout|my cart)\b/.test(lowerText);
      const isSearchQuery = /(show|get|looking|need|want|i would like|show me|do you have)/i.test(text);
      const isSizingQuery = /\b(size|fit|comfort|all-day|width|narrow|wide)\b/.test(lowerText);
      const isCheckoutQuery = /\b(proceed|checkout|place order|complete order)\b/.test(lowerText);
      const isAccessoryQuery = /\b(accessories|recommend|what else|need for my shoes)\b/.test(lowerText);

      if (isCheckoutQuery) {
        console.log('⏭️ Checkout query – skipping fallback.');
      } else if (isAccessoryQuery && !showProductsCalled) {
        console.log('🔧 Accessory query – calling getCrossSellRecommendations');
        try {
          const recResult = await tools.getCrossSellRecommendations.execute();
          recommendations = recResult.recommendations || [];
          if (recommendations.length > 0) {
            const recList = recommendations.map((r, i) => `${i+1}. ${r.name} – ${r.price.toLocaleString()} FCFA`).join('\n');
            finalMessage = `✨ **Accessory Recommendations:**\n${recList}\n\nWould you like me to add any of these to your cart?`;
          } else {
            finalMessage = "We have a great selection of shoe care products. What type of accessory are you looking for?";
          }
        } catch (err) {
          console.error('❌ Accessory recommendation failed:', err);
        }
      } else if (!showProductsCalled && !showCartCalled && isSearchQuery && !isAddQuery && !isSizingQuery) {
        console.log('🔧 Fallback: manual showProducts for search.');
        let query = text
          .replace(/^(i( '?d)? like to|i want|i need|show me|get|looking for|please|do you have)/i, '')
          .replace(/^buy\s*/i, '')
          .replace(/\s+to my cart$/i, '')
          .trim();
        if (!query) query = text;

        let maxPrice: number | undefined;
        const priceMatch = text.match(/(?:under|less than|below|max|maximum)\s*(\d{1,3}(?:,\d{3})*)/i);
        if (priceMatch) {
          const num = parseFloat(priceMatch[1].replace(/,/g, ''));
          if (!isNaN(num)) maxPrice = num;
        }

        let gender: string | undefined;
        const genderMatch = text.match(/\b(men|women|female|male|unisex)\b/i);
        if (genderMatch) {
          const g = genderMatch[1].toLowerCase();
          if (g === 'women' || g === 'female') gender = 'female';
          else if (g === 'men' || g === 'male') gender = 'male';
          else gender = g;
        }

        // Check if we already have products from this search (maybe from LLM tool call)
        // If not, call showProducts manually
        if (!productData.length) {
          try {
            // Use offset 0 by default, but we could allow the frontend to pass offset via the message
            // For simplicity, we start at 0.
            const toolResult = await tools.showProducts.execute({ category: query, gender, maxPrice, offset: 0 });
            productData = toolResult.products || [];
            hasMore = toolResult.hasMore || false;
            totalCount = toolResult.totalCount || 0;
          } catch (error) {
            console.error('❌ Manual showProducts failed:', error);
          }
        }
      } else if (!showCartCalled && isCartQuery && !isAddQuery && !isSizingQuery && !isCheckoutQuery) {
        console.log('🔧 Fallback: manual showCart.');
        try {
          const cartResult = await tools.showCart.execute();
          cartData = cartResult;
        } catch (error) {
          console.error('❌ Manual showCart failed:', error);
        }
      }
    }

    // ─── Checkout detection ───────────────────────────────────
    let checkout = false;
    if (lastUserMsg && lastUserMsg.role === 'user') {
      const lower = lastUserMsg.content.toLowerCase();
      if (/\b(proceed|checkout|place order|complete order)\b/.test(lower)) {
        const cart = await prisma.cart.findUnique({
          where: { sessionId: effectiveSessionId },
          include: { items: true },
        });
        if (cart && cart.items.length > 0) {
          checkout = true;
        } else {
          finalMessage = "Your cart is empty. Please add items before checking out.";
        }
      }
    }

    // ─── Fetch updated cart after add ────────────────────────
    if (addToCartCalled && !cartData) {
      console.log('🔄 Fetching updated cart after add...');
      const cart = await prisma.cart.findUnique({
        where: { sessionId: effectiveSessionId },
        include: { items: { include: { product: true, variant: true } } },
      });
      if (cart && cart.items.length > 0) {
        cartData = {
          items: cart.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            name: item.product?.name || item.productName || 'Product',
            size: item.variant?.size || 0,
            color: item.variant?.color || 'N/A',
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
          })),
          total: cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        };
      }
    }

    // ─── Build final response ───────────────────────────────
    if (productData.length > 0) {
      const productNames = productData.map(p => p.name).slice(0, 3).join(', ');
      const more = productData.length > 3 ? ` and ${productData.length - 3} more` : '';
      let extra = '';
      if (hasMore) {
        extra = `\n\nThere are more products available. Would you like to see more? Just say "show more" or "load more".`;
      }
      finalMessage = `Here are some products matching your search: ${productNames}${more}. Take a look at the cards below! 👟${extra}\n\nWhich one would you like? Please specify the size and colour.`;
    } else if (cartData && cartData.items && cartData.items.length > 0) {
      const itemList = cartData.items.map((item: any) => 
        `• ${item.name} (${item.size} / ${item.color}) × ${item.quantity} – ${item.subtotal.toLocaleString()} FCFA`
      ).join('\n');
      finalMessage = `🛒 **Your Cart**\n${itemList}\n\n**Total:** ${cartData.total.toLocaleString()} FCFA\n\nYou can proceed to checkout by clicking the cart icon 🛍️ at the top right.`;
    } else if (businessInfo) {
      const infoLines = [];
      if (businessInfo.location) infoLines.push(`📍 **Location:** ${businessInfo.location}`);
      if (businessInfo.hours) infoLines.push(`🕒 **Hours:** ${businessInfo.hours}`);
      if (businessInfo.returns) infoLines.push(`↩️ **Returns:** ${businessInfo.returns}`);
      if (businessInfo.contact) infoLines.push(`📞 **Contact:** ${businessInfo.contact}`);
      if (businessInfo.about) infoLines.push(`ℹ️ **About:** ${businessInfo.about}`);
      if (businessInfo.delivery) infoLines.push(`🚚 **Delivery:** ${businessInfo.delivery}`);
      finalMessage = infoLines.join('\n\n');
    } else if (recommendations.length > 0) {
      const recList = recommendations.map((r, i) => `${i+1}. ${r.name} – ${r.price.toLocaleString()} FCFA`).join('\n');
      finalMessage = `✨ **Accessory Recommendations:**\n${recList}\n\nWould you like me to add any of these to your cart?`;
    } else {
      if (finalMessage.includes("I'm having trouble") || finalMessage.includes("Can you rephrase")) {
        finalMessage = "I'm sorry, I didn't quite understand. Could you please clarify what you're looking for? For example, tell me a product name, or ask about our store hours or location.";
      }
    }

    console.log(`🛍️ Sending ${productData.length} products to frontend.`);

    return Response.json({
      message: finalMessage,
      recommendations,
      products: productData,
      cart: cartData ? cartData.items : null,
      checkout,
      hasMore,
      totalCount,
    });
  } catch (error) {
    console.error('❌ Chat API error:', error);
    return Response.json(
      {
        message: 'The AI service is temporarily unavailable. Please try again later.',
        products: [],
        recommendations: [],
        cart: null,
        checkout: false,
        hasMore: false,
        totalCount: 0,
      },
      { status: 500 }
    );
  }
}