import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Product, Variant, Gender, ShoeCategoryName } from '@prisma/client';

type ProductWithVariants = Product & { variants: Variant[] };

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const gateway = createOpenAI({
  baseURL: 'https://gateway.ai.vercel.sh/v1',
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

// Helper to safely cast string[] to ShoeCategoryName[]
function asShoeCategoryNames(categories: string[]): ShoeCategoryName[] {
  // Filter out any string that isn't a valid ShoeCategoryName
  return categories.filter((cat): cat is ShoeCategoryName =>
    Object.values(ShoeCategoryName).includes(cat as ShoeCategoryName)
  );
}

// Helper to safely cast string | null to Gender | null
function asGenderOrNull(gender: string | null): Gender | null {
  if (gender === null) return null;
  return Object.values(Gender).includes(gender as Gender) ? (gender as Gender) : null;
}

// Helper to get or create a cart (copied from your original code)
async function getOrCreateCart(sessionId: string) {
  let cart = await prisma.cart.findUnique({
    where: { sessionId },
    include: {
      items: {
        include: {
          variant: {
            include: { product: true },
          },
        },
      },
    },
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data: { sessionId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    });
  }
  return cart;
}

export async function POST(req: NextRequest) {
  const { messages, sessionId } = await req.json();
  const effectiveSessionId = sessionId || 'anonymous';

  // ──────────────────────────────────────────────────────────
  // TOOLS
  // ──────────────────────────────────────────────────────────

  const tools: any = {
    // --- your existing tools (keep as they are) ---
    showProducts: {
      // ... your existing implementation
    },
    addToCart: {
      // ... your existing implementation
    },
    showCart: {
      // ... your existing implementation
    },
    getBusinessInfo: {
      // ... your existing implementation
    },

    // --- NEW CROSS‑SELLING TOOL ---
    getCrossSellRecommendations: {
      description:
        'Analyze the user’s cart and recommend relevant shoe accessories (horn, socks, laces, cream). Call this after any cart update or when the user asks for suggestions.',
      parameters: z.object({}), // no arguments – reads cart from session
      execute: async () => {
        // 1. Get the current cart with full product details
        const cart = await prisma.cart.findUnique({
          where: { sessionId: effectiveSessionId },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    shoeCategories: { include: { shoeCategory: true } }, // for shoes
                  },
                },
              },
            },
          },
        });

        if (!cart || cart.items.length === 0) {
          return {
            message: 'Your cart is empty. Add some shoes first, then I can recommend accessories!',
          };
        }

        // 2. Collect data from shoes in the cart
        const shoeCategoryNames = new Set<string>();
        let hasLeather = false;
        let primaryGender: string | null = null;

        for (const item of cart.items) {
          const product = item.product;
          if (product.category === 'shoe') {
            for (const sc of product.shoeCategories ?? []) {
              shoeCategoryNames.add(sc.shoeCategory.name);
            }
            if (product.material?.toLowerCase() === 'leather') hasLeather = true;
            if (product.gender && !primaryGender) primaryGender = product.gender;
          }
        }

        if (shoeCategoryNames.size === 0) {
          return { message: 'No shoes found in your cart to recommend accessories for.' };
        }

        const categoryArray = Array.from(shoeCategoryNames);
        // ✅ Fix 1: convert string[] to ShoeCategoryName[]
        const validCategories = asShoeCategoryNames(categoryArray);
        // ✅ Fix 2: convert string | null to Gender | null
        const validGender = asGenderOrNull(primaryGender);

        // 3. Query accessories that fit the shoe categories
        let accessories = await prisma.product.findMany({
          where: {
            category: 'accessory',
            fitsCategories: {
              some: {
                shoeCategory: { name: { in: validCategories } },
              },
            },
            // Gender filter: null (unisex) or matches the shoe's gender
            OR: [{ gender: null }, { gender: validGender }],
          },
          orderBy: { crossSellScore: 'desc' },
          take: 3,
        });

        // 4. If we have leather shoes and fewer than 3 accessories, add a leather conditioner
        if (hasLeather && accessories.length < 3) {
          const leatherAccessories = await prisma.product.findMany({
            where: {
              category: 'accessory',
              accessoryType: 'cleaner',
              fitsCategories: {
                some: { shoeCategory: { name: { in: validCategories } } },
              },
              OR: [{ gender: null }, { gender: validGender }],
            },
            take: 3 - accessories.length,
          });
          accessories = [...accessories, ...leatherAccessories];
        }

        if (accessories.length === 0) {
          return { message: `No accessories match your ${categoryArray.join(', ')} shoes at the moment.` };
        }

        // 5. Build a friendly, localised response
        const recommendationText = accessories
          .map(
            (acc) =>
              `• ${acc.name} – ${acc.price.toLocaleString()} FCFA – ${
                acc.description || 'Keeps your shoes in great condition'
              }`
          )
          .join('\n');

        return {
          message: `You might also like these accessories for your ${categoryArray.join(', ')} shoes:\n${recommendationText}\n\nWould you like me to add any to your cart?`,
          recommendations: accessories,
        };
      },
    },
  };

  // ──────────────────────────────────────────────────────────
  // SYSTEM PROMPT (with cross‑selling instructions)
  // ──────────────────────────────────────────────────────────
  const systemPrompt = `
You are "ShoeBot", a friendly AI shopping assistant for a men's leather footwear shop in Buea, Cameroon.

Your primary job is to help customers find shoes, answer questions about products, and manage their cart.

**CROSS‑SELLING RULES** (very important):
- After you successfully add an item to the cart (via addToCart), **immediately call** getCrossSellRecommendations.
- When the user asks "what else do I need?" or "any accessories?" – call the tool.
- When showing the cart (showCart), also call getCrossSellRecommendations if you haven't already in that session.
- Always present the recommendations in a friendly, local tone. Example: "A good shoe horn will help your loafers last longer, bro."
- **Never** add an accessory to the cart without asking permission first.
- **Limit**: Show cross‑sell suggestions at most twice per conversation to avoid being annoying.

**TOOL USAGE**:
- getCrossSellRecommendations – use exactly as described above.
- addToCart – use when the user asks to add something (including accessories).
- showProducts, showCart, getBusinessInfo – use as needed.

Keep your answers concise, helpful, and Buea‑friendly. Always use FCFA for prices.
`;

  // ──────────────────────────────────────────────────────────
  // STREAM RESPONSE
  // ──────────────────────────────────────────────────────────
  const result = streamText({
    model: gateway('xai/grok-4-fast-non-reasoning'),
    system: systemPrompt,
    messages,
    tools,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}