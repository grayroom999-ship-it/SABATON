import { generateText } from 'ai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Product, Variant, ShoeCategoryName } from '@prisma/client';
import { createClient } from '@vercel/postgres';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

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
    'oxford', 'accessory', 'lace', 'conditioner', 'cream', 'polish', 'brush'
  ];
  return productKeywords.some(kw => lower.includes(kw));
}

// ─── POST handler ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { messages, sessionId } = await req.json();
  const effectiveSessionId = sessionId || 'anonymous';

  console.log('📥 Received messages:', messages);

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
        Search for products by name, category, or style.
        Call this tool when the user is asking to see products (e.g., "show me", "looking for", "do you have").
        Also call this tool when the user says "add" or "buy" without specifying size and colour – this will display product cards so the user can pick.
        Returns at most 4 products with their variants (size/colour).
      `,
      inputSchema: z.object({
        category: z.string().optional(),
        gender: z.string().optional(),
        size: z.number().optional(),
      }),
      execute: async ({ category, gender, size }: any) => {
        console.log(`🔍 showProducts called with:`, { category, gender, size });
        try {
          const supabase = createClient({
            connectionString: process.env.SUPABASE_DB_URL,
          });

          let queryText = category || '';
          if (gender) queryText += ` ${gender}`;
          if (!queryText.trim()) {
            console.log('⚠️ No search text provided');
            return { products: [] };
          }

          // ─── Try vector search ──────────────────────────────
          console.log(`🧠 Generating embedding for: "${queryText}"`);
          const queryVector = await getLocalEmbedding(queryText);
          const vectorString = `[${queryVector.join(',')}]`;

          console.log(`🔎 Performing vector search...`);
          const vectorPromise = supabase.sql`
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
            ORDER BY embedding <=> ${vectorString}::vector
            LIMIT 4;
          `;

          const TIMEOUT_MS = 5000;
          let products;
          try {
            const result = await Promise.race([
              vectorPromise,
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

          // ─── Apply size filter ──────────────────────────────
          let filteredProducts = products;
          if (size !== undefined && size !== null) {
            const productIds = products.map((p: any) => p.id);
            const variants = await prisma.variant.findMany({
              where: {
                productId: { in: productIds },
                size: Number(size),
              },
              select: { productId: true },
            });
            const validProductIds = new Set(variants.map(v => v.productId));
            filteredProducts = products.filter((p: any) => validProductIds.has(p.id));
          }

          // ─── Fetch full details ─────────────────────────────
          const finalProductIds = filteredProducts.map((p: any) => p.id);
          let fullProducts: any[] = [];
          if (finalProductIds.length > 0) {
            fullProducts = await prisma.product.findMany({
              where: { id: { in: finalProductIds } },
              include: { variants: true },
            });
          }

          // ─── Re‑order to put exact match first ──────────────
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
          };
        } catch (error) {
          // ─── Fallback: Prisma keyword search ──────────────
          console.log('⚠️ Falling back to Prisma keyword search...');
          try {
            const words = (category || '').split(/\s+/).filter((w: string) => w.length > 0);
            const where: any = {};
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
            if (gender) where.gender = { equals: gender, mode: 'insensitive' };

            let products = await prisma.product.findMany({
              where,
              include: { variants: true },
              take: 4,
            });

            if (size !== undefined && size !== null) {
              products = products.filter((p) =>
                p.variants.some((v) => v.size === Number(size))
              );
            }

            // ─── Re‑order to put exact match first ──────────────
            products = reorderExactMatch(products, category || '');

            return {
              products: products.map((p) => ({
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
            };
          } catch (fallbackError) {
            console.error('❌ Fallback error:', fallbackError);
            return { products: [] };
          }
        }
      },
    },

    getBusinessInfo: {
      description: `Provide shop information (location, hours, returns, contact, about, delivery).`,
      inputSchema: z.object({ query: z.string().optional() }),
      execute: async (_args: any) => {
        console.log(`📞 getBusinessInfo called`);
        return { info: BUSINESS_INFO };
      },
    },

    addToCart: {
      description: 'Add a product to the cart. Provide productId, size, colour, and quantity. If colour is not provided, the tool will use the first available colour for that size – but the assistant should always ask for colour first.',
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
      execute: async (_args: any) => {
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
      description: 'Analyze cart and recommend accessories.',
      inputSchema: z.object({}),
      execute: async (_args: any) => {
        return { message: 'No recommendations at this time.', recommendations: [] };
      },
    },
  };

  // ─── SYSTEM PROMPT ──────────────────────────────────────────

  const systemPrompt = `
You are "ShoeBot", an AI shopping assistant for Sabaton, a men's leather footwear shop in Buea, Cameroon.

**CRITICAL RULES FOR TOOL USE:**
1. FOR "ADD"/"BUY" INTENT: If the user says "add", "buy", "purchase", or "I'd like to buy" → you MUST first call showProducts to display the product card with available variants (size and colour). 
   - After showing the product, you MUST ask the user: "Which size and colour would you like?"
   - Do NOT call addToCart until the user has provided both size and colour.
   - If the user gives you size and colour in the same message (e.g., "size 10 black"), you may call addToCart with that information.

2. FOR SEARCHING: If the user says "show", "looking for", "do you have" → call showProducts.

3. For removing items → call removeFromCart.
4. For business info → call getBusinessInfo.
5. For cart summary → call showCart.

**NEVER** call addToCart without first confirming size and colour with the user – unless the user explicitly provides them.
Be concise, friendly, and always use FCFA for prices.
`;

  // ─── Generate response ─────────────────────────────────────

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const result = await generateText({
      model: 'anthropic/claude-opus-4.8',
      system: systemPrompt,
      messages,
      tools,
      temperature: 0.7,
      timeout: 30000,
      maxRetries: 1,
      fetch: async (url: string, options: RequestInit) => {
        const abortController = new AbortController();
        const id = setTimeout(() => abortController.abort(), 20000);
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

    if (result.toolResults && Array.isArray(result.toolResults)) {
      for (const tr of result.toolResults) {
        const output = (tr as any).output;
        if (tr.toolName === 'getCrossSellRecommendations' && output?.recommendations) {
          recommendations = output.recommendations;
        }
        if (tr.toolName === 'showProducts' && output && Array.isArray(output.products)) {
          productData = output.products;
          console.log(`📦 Tool returned ${productData.length} products`);
        }
        if (tr.toolName === 'getBusinessInfo' && output?.info) {
          businessInfo = output.info;
        }
        if (tr.toolName === 'showCart' && output) {
          cartData = output;
          console.log(`🛒 Cart has ${output.items?.length || 0} items`);
        }
      }
    }

    let finalMessage = result.text;

    // ─── FALLBACK: Force showProducts for add/buy if not called ──
    const lastUserMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    if (lastUserMsg && lastUserMsg.role === 'user') {
      const text = lastUserMsg.content;
      console.log(`📝 Processing user message: "${text}"`);

      const showProductsCalled = result.toolCalls?.some((call: any) => call.toolName === 'showProducts');
      const showCartCalled = result.toolCalls?.some((call: any) => call.toolName === 'showCart');

      const lowerText = text.toLowerCase();
      const isAddQuery = /\b(add|buy|purchase|i'?d\s+like\s+to\s+buy)\b/.test(lowerText);
      const isCartQuery = /\b(cart|checkout|my cart)\b/.test(lowerText);
      const isSearchQuery = /(show|get|looking|need|want|i would like|show me|do you have)/i.test(text);

      if (isAddQuery && !showProductsCalled) {
        console.log('🔧 Fallback: Add/buy intent detected but showProducts not called. Forcing...');
        let query = text
          .replace(/^(i( '?d)? like to|i want|i need|show me|get|looking for|please|do you have)/i, '')
          .replace(/^buy\s*/i, '')
          .replace(/^add\s*/i, '')
          .replace(/\s+to my cart$/i, '')
          .trim();
        if (!query) query = text;
        try {
          const toolResult = await tools.showProducts.execute({ category: query });
          productData = toolResult.products || [];
          console.log(`📦 Manual fetch returned ${productData.length} products`);
        } catch (error) {
          console.error('❌ Manual showProducts call failed:', error);
          productData = [];
        }
      }
      else if (!showProductsCalled && !showCartCalled && isSearchQuery) {
        console.log('🔧 Fallback: LLM did not call showProducts for search. Manually calling...');
        let query = text
          .replace(/^(i( '?d)? like to|i want|i need|show me|get|looking for|please|do you have)/i, '')
          .replace(/^buy\s*/i, '')
          .replace(/\s+to my cart$/i, '')
          .trim();
        if (!query) query = text;
        try {
          const toolResult = await tools.showProducts.execute({ category: query });
          productData = toolResult.products || [];
          console.log(`📦 Manual fetch returned ${productData.length} products`);
        } catch (error) {
          console.error('❌ Manual showProducts call failed:', error);
          productData = [];
        }
      }
      else if (!showCartCalled && isCartQuery && !isAddQuery) {
        console.log('🔧 Fallback: LLM did not call showCart. Manually calling...');
        try {
          const cartResult = await tools.showCart.execute({});
          cartData = cartResult;
          console.log(`🛒 Manual cart fetch returned ${cartResult.items?.length || 0} items`);
        } catch (error) {
          console.error('❌ Manual showCart call failed:', error);
        }
      }
    }

    // ─── CHECKOUT DETECTION ─────────────────────────────────────
    let checkout = false;
    const checkUserMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    if (checkUserMsg && checkUserMsg.role === 'user') {
      const lower = checkUserMsg.content.toLowerCase();
      if (/\b(checkout|proceed to checkout|place order|complete order)\b/.test(lower)) {
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

    // ─── Build final response ───────────────────────────────
    if (productData.length > 0) {
      const productNames = productData.map(p => p.name).slice(0, 3).join(', ');
      const more = productData.length > 3 ? ` and ${productData.length - 3} more` : '';
      finalMessage = `Here are some products matching your search: ${productNames}${more}. Take a look at the cards below! 👟\n\nWhich one would you like? Please specify the size and colour.`;
    }
    else if (cartData && cartData.items && cartData.items.length > 0) {
      const itemList = cartData.items.map((item: any) => 
        `• ${item.name} (${item.size} / ${item.color}) × ${item.quantity} – ${item.subtotal.toLocaleString()} FCFA`
      ).join('\n');
      finalMessage = `🛒 **Your Cart**\n${itemList}\n\n**Total:** ${cartData.total.toLocaleString()} FCFA\n\nYou can proceed to checkout by clicking the cart icon 🛍️ at the top right.`;
    }
    else if (businessInfo) {
      const infoLines = [];
      if (businessInfo.location) infoLines.push(`📍 **Location:** ${businessInfo.location}`);
      if (businessInfo.hours) infoLines.push(`🕒 **Hours:** ${businessInfo.hours}`);
      if (businessInfo.returns) infoLines.push(`↩️ **Returns:** ${businessInfo.returns}`);
      if (businessInfo.contact) infoLines.push(`📞 **Contact:** ${businessInfo.contact}`);
      if (businessInfo.about) infoLines.push(`ℹ️ **About:** ${businessInfo.about}`);
      if (businessInfo.delivery) infoLines.push(`🚚 **Delivery:** ${businessInfo.delivery}`);
      finalMessage = infoLines.join('\n\n');
    }
    else {
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
      checkout, // ← NEW: flag to trigger checkout modal
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
      },
      { status: 500 }
    );
  }
}