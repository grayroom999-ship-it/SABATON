import { generateText } from 'ai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Product, Variant, ShoeCategoryName, AccessoryType } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// ─── Helpers ──────────────────────────────────────────────────

function asShoeCategoryNames(categories: string[]): ShoeCategoryName[] {
  const validNames = Object.values(ShoeCategoryName);
  return categories.filter((cat): cat is ShoeCategoryName =>
    validNames.includes(cat as ShoeCategoryName)
  );
}

function isProductQuery(text: string): boolean {
  const businessKeywords = [
    'location', 'address', 'where', 'hours', 'open', 'close', 'return',
    'contact', 'phone', 'email', 'about', 'delivery', 'shipping', 'policy',
    'working', 'business', 'shop', 'store', 'tell me about', 'who are you'
  ];
  const lower = text.toLowerCase();
  if (businessKeywords.some(kw => lower.includes(kw))) return false;

  const productKeywords = [
    'buy', 'want', 'looking for', 'show', 'get', 'need',
    'i would like', 'i want', 'i need', 'show me',
    'shoe', 'boot', 'loafer', 'horn', 'accessory',
    'lace', 'conditioner', 'cream', 'polish', 'brush'
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

  // ─── Tools defined inside handler to capture sessionId ──

  const tools = {
    showProducts: {
      description: `
        Search for products (shoes or accessories) by name, category, or style.
        **CRITICAL: You MUST call this tool whenever the user asks about or mentions a product.**
        Do NOT use for business info – use getBusinessInfo instead.
        The 'category' parameter should be a descriptive phrase (e.g., "loafer", "boot", "shoe horn", "wedding shoes").
      `,
      inputSchema: z.object({
        category: z.string().optional(),
        gender: z.string().optional(),
        size: z.number().optional(),
      }),
      execute: async ({ category, gender, size }: any) => {
        console.log(`🔍 showProducts called with:`, { category, gender, size });
        try {
          const where: any = {};

          if (category) {
            const words = category.split(/\s+/).filter((w: string) => w.length > 0);
            if (words.length === 1) {
              where.name = { contains: words[0], mode: 'insensitive' };
            } else if (words.length > 1) {
              where.AND = words.map((word: string) => ({
                name: { contains: word, mode: 'insensitive' }
              }));
            }
          }

          if (gender) where.gender = { equals: gender, mode: 'insensitive' };

          if (Object.keys(where).length === 0) {
            console.log('⚠️ No filters provided to showProducts');
            return { products: [] };
          }

          const products = await prisma.product.findMany({
            where,
            include: { variants: true },
          });

          console.log(`📦 Found ${products.length} products for query`);

          let filteredProducts = products;
          if (size !== undefined && size !== null) {
            filteredProducts = products.filter((product) =>
              product.variants.some((variant) => variant.size === size)
            );
            console.log(`📏 After size filter: ${filteredProducts.length} products`);
          }

          return {
            products: filteredProducts.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              gender: p.gender,
              material: p.material,
              category: p.category,
              image: (p as any).image || '/images/placeholder.jpg',
              variants: p.variants.map((v) => ({
                id: v.id,
                size: v.size,
                stock: v.stock,
                color: v.color,
              })),
            })),
          };
        } catch (error) {
          console.error('❌ showProducts tool error:', error);
          return { products: [] };
        }
      },
    },

    getBusinessInfo: {
      description: `Provide shop information (location, hours, returns, contact, about, delivery). **Call this for any business‑related question.**`,
      inputSchema: z.object({ query: z.string().optional() }),
      execute: async (_args: any) => {
        console.log(`📞 getBusinessInfo called`);
        return { info: BUSINESS_INFO };
      },
    },

    // ─── FIXED addToCart ──────────────────────────────────────
    addToCart: {
      description: 'Add a product to the shopping cart. Provide productId, size, color, and quantity.',
      inputSchema: z.object({
        productId: z.string(),
        size: z.number().int().positive(),
        color: z.string(),
        quantity: z.number().int().positive().default(1),
      }),
      execute: async ({ productId, size, color, quantity }: any) => {
        console.log(`🛒 addToCart called:`, { productId, size, color, quantity });

        // ─── 1. Resolve productId if it's not a valid CUID ──
        let actualProductId = productId;
        // Simple check: CUIDs usually start with 'cmq' or similar; slugs are words with hyphens
        if (!productId.startsWith('cmq')) {
          console.log(`🔍 Resolving product name/slug: "${productId}"`);
          const product = await prisma.product.findFirst({
            where: {
              name: {
                equals: productId,
                mode: 'insensitive',
              },
            },
          });
          if (!product) {
            throw new Error(`Product "${productId}" not found.`);
          }
          actualProductId = product.id;
          console.log(`✅ Resolved to product ID: ${actualProductId} (${product.name})`);
        }

        // ─── 2. Ensure size and quantity are numbers ──────────
        const parsedSize = typeof size === 'number' ? size : parseInt(size, 10);
        const parsedQuantity = typeof quantity === 'number' ? quantity : parseInt(quantity, 10);
        if (isNaN(parsedSize) || parsedSize <= 0) {
          throw new Error('Invalid size. Please provide a valid size number.');
        }
        if (isNaN(parsedQuantity) || parsedQuantity < 1) {
          throw new Error('Quantity must be at least 1.');
        }

        // ─── 3. Find the matching variant ──────────────────────
        const variant = await prisma.variant.findFirst({
          where: {
            productId: actualProductId,
            size: parsedSize,
            color: { equals: color, mode: 'insensitive' },
          },
          include: { product: true },
        });

        if (!variant) {
          throw new Error(`Variant not found for product ${actualProductId}, size ${parsedSize}, color ${color}`);
        }

        // ─── 4. Get or create cart ─────────────────────────────
        let cart = await prisma.cart.findUnique({
          where: { sessionId: effectiveSessionId },
        });
        if (!cart) {
          cart = await prisma.cart.create({
            data: { sessionId: effectiveSessionId },
          });
        }

        // ─── 5. Add or update cart item ────────────────────────
        const existingItem = await prisma.cartItem.findFirst({
          where: {
            cartId: cart.id,
            productId: actualProductId,
            variantId: variant.id,
          },
        });

        if (existingItem) {
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: existingItem.quantity + parsedQuantity,
              price: variant.product.price,
            },
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
          message: `Added ${parsedQuantity} x ${variant.product.name} (${parsedSize} / ${color}) to your cart.`
        };
      },
    },

    showCart: {
      description: 'Display the current cart contents. Call this whenever the user asks about their cart or wants to checkout.',
      inputSchema: z.object({}),
      execute: async (_args: any) => {
        console.log(`🛒 showCart called for session ${effectiveSessionId}`);

        const cart = await prisma.cart.findUnique({
          where: { sessionId: effectiveSessionId },
          include: {
            items: {
              include: { product: true, variant: true },
            },
          },
        });

        if (!cart || cart.items.length === 0) {
          return { items: [], total: 0, message: 'Your cart is empty.' };
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

        return {
          items,
          total,
          message: `Your cart has ${items.length} item(s) totaling ${total.toLocaleString()} FCFA.`,
        };
      },
    },

    getCrossSellRecommendations: {
      description: 'Analyze the cart and recommend accessories.',
      inputSchema: z.object({}),
      execute: async (_args: any) => {
        console.log('🔗 getCrossSellRecommendations called');
        return { message: 'No recommendations at this time.', recommendations: [] };
      },
    },
  };

  // ─── System prompt ──────────────────────────────────────────

  const systemPrompt = `
You are "ShoeBot", an AI shopping assistant for Sabaton, a men's leather footwear shop in Buea, Cameroon.

**Your primary job is to use the right tool.**

- If the user asks about a product (e.g., "black loafers", "shoe horn", "conditioning cream") – **you MUST call the showProducts tool** immediately. Do NOT say "I'll look that up" – just call the tool.
- If the user asks about store hours, location, returns, or contact – **call getBusinessInfo**.
- If the user wants to add an item to cart – **call addToCart** with productId, size, color, quantity.
- If the user asks about their cart, wants to see it, or says "proceed to checkout" – **call showCart**.
- For greetings or casual chat, respond naturally without calling any tool.

**IMPORTANT**: Never respond with "I'm having trouble understanding" or "Can you rephrase?" unless the user's message is completely unintelligible. If you are unsure about a product query, call showProducts with the user's last message as the category.

Be concise, friendly, and always use FCFA for prices.
`;

  // ─── Generate response ─────────────────────────────────────

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    // ✅ Type assertion to bypass missing 'fetch' in type definitions
    const result = await generateText({
      model: 'anthropic/claude-opus-4.8',
      system: systemPrompt,
      messages,
      tools,
      temperature: 0.7,
      timeout: 120000,
      maxRetries: 2,
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

    // ─── Fallback: manual showProducts if needed ────────────
    const lastUserMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    if (lastUserMsg && lastUserMsg.role === 'user') {
      const text = lastUserMsg.content;
      console.log(`📝 Processing user message: "${text}"`);

      const showProductsCalled = result.toolCalls?.some((call: any) => call.toolName === 'showProducts');
      const showCartCalled = result.toolCalls?.some((call: any) => call.toolName === 'showCart');

      if (!showProductsCalled && isProductQuery(text) && !showCartCalled) {
        console.log('🔧 Fallback: LLM did not call showProducts. Manually calling...');
        let query = text
          .replace(/^(i( '?d)? like to|i want|i need|show me|get|looking for|please)/i, '')
          .replace(/^buy\s*/i, '')
          .trim();
        if (!query) query = text;
        console.log(`🔎 Manual query: "${query}"`);
        try {
          const toolResult = await tools.showProducts.execute({ category: query });
          productData = toolResult.products || [];
          console.log(`📦 Manual fetch returned ${productData.length} products`);
        } catch (error) {
          console.error('❌ Manual showProducts call failed:', error);
          productData = [];
        }
      }

      const cartKeywords = ['cart', 'checkout', 'in my cart', 'proceed to checkout', 'my cart'];
      if (!showCartCalled && cartKeywords.some(kw => text.toLowerCase().includes(kw)) && !productData.length) {
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

    // ─── Build final response ───────────────────────────────
    let finalMessage = result.text;

    if (productData.length > 0) {
      const productNames = productData.map(p => p.name).slice(0, 3).join(', ');
      const more = productData.length > 3 ? ` and ${productData.length - 3} more` : '';
      finalMessage = `Here are some products matching your search: ${productNames}${more}. Take a look at the cards below! 👟`;
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
    });
  } catch (error) {
    console.error('❌ Chat API error:', error);
    return Response.json(
      {
        message: 'The AI service is temporarily unavailable. Please try again later.',
        products: [],
        recommendations: [],
        cart: null,
      },
      { status: 500 }
    );
  }
}