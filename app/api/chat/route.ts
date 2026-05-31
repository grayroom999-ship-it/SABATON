// app/api/chat/route.ts
import { streamText } from 'ai';
import { xai } from '@ai-sdk/xai';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { messages, sessionId } = await req.json();
  const effectiveSessionId = sessionId || 'anonymous';

  async function getOrCreateCart(sid: string) {
    let cart = await prisma.cart.findUnique({
      where: { sessionId: sid },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true }
            }
          }
        }
      }
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionId: sid },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true }
              }
            }
          }
        }
      });
    }
    return cart;
  }

  const tools = {
    showProducts: {
      description: 'Show available leather shoes to the customer. Use when customer asks to see shoes, browse, or look at products.',
      parameters: z.object({
        category: z.enum(['casual', 'formal', 'boots', 'all']).optional().describe('Filter by category if specified'),
      }),
      execute: async ({ category }: { category?: string }) => {
        const products = await prisma.product.findMany({
          where: category && category !== 'all' ? { category } : {},
          include: { variants: true },
          take: 10
        });
        const productList = products.map(p => ({
          name: p.name,
          price: `${p.price.toLocaleString()} FCFA`,
          sizes: p.variants.map(v => v.size).filter((v,i,a) => a.indexOf(v) === i).join(', '),
          description: p.description
        }));
        return {
          products: productList,
          message: `Here are our ${category === 'all' || !category ? 'leather shoes' : category} shoes:\n${productList.map(p => `• ${p.name} - ${p.price}\n  Sizes: ${p.sizes}\n  ${p.description}`).join('\n\n')}\n\nTo buy, just say "add [product name] size [size]"`
        };
      }
    },
    addToCart: {
      description: 'Add a product to the customer\'s shopping cart. Use when customer wants to buy, purchase, or add an item.',
      parameters: z.object({
        productName: z.string().describe('The name of the product to add'),
        size: z.number().describe('Shoe size (39-44)'),
        color: z.string().optional().describe('Color if specified'),
        quantity: z.number().default(1).describe('How many pairs')
      }),
      execute: async ({ productName, size, color, quantity }: { productName: string; size: number; color?: string; quantity: number }) => {
        const variant = await prisma.productVariant.findFirst({
          where: {
            product: { name: { contains: productName, mode: 'insensitive' } },
            size: size,
            ...(color ? { color: color.toLowerCase() } : {})
          },
          include: { product: true }
        });
        if (!variant) {
          return {
            success: false,
            message: `Sorry, we don't have ${productName} in size ${size}. Would you like to check other sizes?`
          };
        }
        let cart = await prisma.cart.findUnique({ where: { sessionId: effectiveSessionId } });
        if (!cart) {
          cart = await prisma.cart.create({ data: { sessionId: effectiveSessionId } });
        }
        const existingItem = await prisma.cartItem.findFirst({
          where: { cartId: cart.id, variantId: variant.id }
        });
        if (existingItem) {
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity }
          });
        } else {
          await prisma.cartItem.create({
            data: { cartId: cart.id, variantId: variant.id, quantity }
          });
        }
        return {
          success: true,
          message: `✅ Added ${variant.product.name} size ${size} to your cart! Price: ${variant.product.price.toLocaleString()} FCFA. Want to see your cart or continue shopping?`
        };
      }
    },
    showCart: {
      description: 'Show what\'s currently in the customer\'s shopping cart',
      parameters: z.object({}),
      execute: async () => {
        const cart = await getOrCreateCart(effectiveSessionId);
        if (!cart || cart.items.length === 0) {
          return { message: 'Your cart is empty. Say "show shoes" to browse our collection!' };
        }

        // Filter out items with null variant (TypeScript safety)
        const validItems = cart.items.filter(item => item.variant !== null);
        if (validItems.length === 0) {
          return { message: 'Your cart contains invalid items. Please try adding products again.' };
        }

        const items = validItems.map(item => ({
          name: item.variant!.product.name,
          size: item.variant!.size,
          color: item.variant!.color,
          quantity: item.quantity,
          price: item.variant!.product.price,
          subtotal: item.variant!.product.price * item.quantity
        }));

        const total = items.reduce((sum, i) => sum + i.subtotal, 0);
        const cartMessage = `🛒 YOUR CART:\n${items.map((i, idx) => `${idx + 1}. ${i.name} - Size ${i.size} - Quantity: ${i.quantity} - ${i.subtotal.toLocaleString()} FCFA`).join('\n')}\n\n📦 TOTAL: ${total.toLocaleString()} FCFA\n\nType "checkout" to complete your order!`;
        return { message: cartMessage, items, total };
      }
    }
  };

  const systemPrompt = `You are "ShoeBot", a friendly AI shopping assistant for a men's leather footwear shop in Buea, Cameroon.

PERSONALITY:
- Friendly and helpful, like a local shopkeeper
- You can understand English and basic Pidgin English
- Always be polite and patient

YOUR JOB:
1. Help customers find leather shoes (casual, formal, boots)
2. Add items to their cart when they want to buy
3. Show their cart when asked
4. Help with checkout when ready

AVAILABLE ACTIONS:
- Use "showProducts" when customer asks to see shoes
- Use "addToCart" when customer wants to buy something
- Use "showCart" when customer asks about their cart

EXAMPLES:
- "show me casual shoes" → showProducts(category: "casual")
- "add black loafer size 41" → addToCart(productName: "Classic Black Loafer", size: 41)
- "what's in my cart" → showCart()

SHOE SIZES AVAILABLE: 39, 40, 41, 42, 43, 44
PRICES in FCFA (Central African Francs)

Always confirm after adding to cart. Be warm and helpful!`;

  const result = streamText({
    model: xai('grok-4.1-fast-non-reasoning'),
    system: systemPrompt,
    messages: messages,
    tools: tools,
    temperature: 0.7,
  });

  return result.toDataStreamResponse();
}