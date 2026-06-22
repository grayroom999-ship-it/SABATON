import { generateText } from 'ai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Product, Variant, ShoeCategoryName } from '@prisma/client';
import { createClient } from '@vercel/postgres';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// ─── FAQ Knowledge Base ──────────────────────────────────────
const FAQ_RESPONSES: Record<string, string> = {
  "100% genuine leather": "Yes! 👞 All our shoes are crafted from 100% genuine full-grain leather – the highest quality available. We source directly from reputable tanneries to ensure durability and authenticity.",
  "authentic leather": "Yes! 👞 All our shoes are crafted from 100% genuine full-grain leather – the highest quality available. We source directly from reputable tanneries to ensure durability and authenticity.",
  "leather from": "Our leather is sourced from tanneries in Europe and South America, known for their strict quality control and sustainable practices. We select only the finest hides for our handcrafted shoes.",
  "origin of leather": "Our leather is sourced from tanneries in Europe and South America, known for their strict quality control and sustainable practices. We select only the finest hides for our handcrafted shoes.",
  "full-grain": "**Full-grain leather** is the highest quality – it retains the natural grain and develops a beautiful patina over time. **Top-grain** has been sanded to remove imperfections. We use full-grain for superior durability and breathability.",
  "top-grain": "**Full-grain leather** is the highest quality – it retains the natural grain and develops a beautiful patina over time. **Top-grain** has been sanded to remove imperfections. We use full-grain for superior durability and breathability.",
  "care for these shoes": "To maintain your shoes: ① Wipe with a damp cloth after each use. ② Use a quality leather conditioner monthly. ③ Polish with matching colour cream. ④ Stuff with cedar shoe trees to maintain shape. ⑤ Avoid direct sunlight and rain.",
  "clean leather": "To maintain your shoes: ① Wipe with a damp cloth after each use. ② Use a quality leather conditioner monthly. ③ Polish with matching colour cream. ④ Stuff with cedar shoe trees to maintain shape. ⑤ Avoid direct sunlight and rain.",
  "polish": "To maintain your shoes: ① Wipe with a damp cloth after each use. ② Use a quality leather conditioner monthly. ③ Polish with matching colour cream. ④ Stuff with cedar shoe trees to maintain shape. ⑤ Avoid direct sunlight and rain.",
  "condition": "To maintain your shoes: ① Wipe with a damp cloth after each use. ② Use a quality leather conditioner monthly. ③ Polish with matching colour cream. ④ Stuff with cedar shoe trees to maintain shape. ⑤ Avoid direct sunlight and rain.",
  "rainy season": "Our shoes are treated with water-resistant sealants. However, we recommend avoiding prolonged exposure to heavy rain. Use a waterproofing spray and let them air dry naturally away from direct heat if they get wet.",
  "waterproof": "Our shoes are treated with water-resistant sealants. However, we recommend avoiding prolonged exposure to heavy rain. Use a waterproofing spray and let them air dry naturally away from direct heat if they get wet.",
  "good for rain": "Our shoes are treated with water-resistant sealants. However, we recommend avoiding prolonged exposure to heavy rain. Use a waterproofing spray and let them air dry naturally away from direct heat if they get wet.",
  "resistant": "Our shoes are treated with water-resistant sealants. However, we recommend avoiding prolonged exposure to heavy rain. Use a waterproofing spray and let them air dry naturally away from direct heat if they get wet.",
  "how long do these last": "With proper care, our full-grain leather shoes last 5–10+ years. They are hand-stitched and Goodyear-welted (on select models), allowing resoling when needed – extending their life significantly.",
  "durability": "With proper care, our full-grain leather shoes last 5–10+ years. They are hand-stitched and Goodyear-welted (on select models), allowing resoling when needed – extending their life significantly.",
  "lifespan": "With proper care, our full-grain leather shoes last 5–10+ years. They are hand-stitched and Goodyear-welted (on select models), allowing resoling when needed – extending their life significantly.",
  "handmade": "Yes! Every pair is handcrafted in Buea by our skilled artisans using traditional shoemaking techniques – hand-stitching, lasting, and finishing each shoe with precision.",
  "handcrafted": "Yes! Every pair is handcrafted in Buea by our skilled artisans using traditional shoemaking techniques – hand-stitching, lasting, and finishing each shoe with precision.",
  "hand-stitched": "Yes! Every pair is handcrafted in Buea by our skilled artisans using traditional shoemaking techniques – hand-stitching, lasting, and finishing each shoe with precision.",

  "what size should I order": "To find your perfect size: ① Measure your foot length from heel to longest toe (in cm). ② Use our size chart on each product page. ③ Size up if you're between sizes. ④ We offer free size exchanges within 7 days if the fit isn't right.",
  "size guide": "To find your perfect size: ① Measure your foot length from heel to longest toe (in cm). ② Use our size chart on each product page. ③ Size up if you're between sizes. ④ We offer free size exchanges within 7 days if the fit isn't right.",
  "size chart": "To find your perfect size: ① Measure your foot length from heel to longest toe (in cm). ② Use our size chart on each product page. ③ Size up if you're between sizes. ④ We offer free size exchanges within 7 days if the fit isn't right.",
  "run true to size": "Most styles run true to size (TTS). If you're between sizes, we recommend sizing up for comfort, especially if you plan to wear thicker socks. Check each product page for specific fit notes.",
  "fit compared": "Most styles run true to size (TTS). If you're between sizes, we recommend sizing up for comfort, especially if you plan to wear thicker socks. Check each product page for specific fit notes.",
  "wide size": "We offer standard width (D) for men and (B) for women. Select styles are available in wide (E) – check the product page for width options. If you need a custom width, contact us and we'll do our best to accommodate.",
  "narrow": "We offer standard width (D) for men and (B) for women. Select styles are available in wide (E) – check the product page for width options. If you need a custom width, contact us and we'll do our best to accommodate.",
  "comfortable all day": "Yes! Our shoes feature leather-lined footbeds, cushioned insoles, and shock-absorbing soles – designed for all-day comfort. They become even more comfortable as the leather moulds to your foot.",
  "all day wear": "Yes! Our shoes feature leather-lined footbeds, cushioned insoles, and shock-absorbing soles – designed for all-day comfort. They become even more comfortable as the leather moulds to your foot.",
  "break in period": "Full-grain leather requires a break-in period of 3–5 wears. Wear them for short periods initially with thick socks. The leather will soften and mould to your foot. Use a leather conditioner to speed up the process.",
  "stiff": "Full-grain leather requires a break-in period of 3–5 wears. Wear them for short periods initially with thick socks. The leather will soften and mould to your foot. Use a leather conditioner to speed up the process.",
  "insoles": "Our shoes have removable leather-covered insoles. You can replace them with custom orthotics for added arch support if needed – the insoles are easily removable.",
  "arch support": "Our shoes have removable leather-covered insoles. You can replace them with custom orthotics for added arch support if needed – the insoles are easily removable.",
  "orthotics": "Our shoes have removable leather-covered insoles. You can replace them with custom orthotics for added arch support if needed – the insoles are easily removable.",

  "Mobile Money": "Yes! We accept MTN Mobile Money and Orange Money. Simply select your preferred method at checkout and follow the payment prompt. Payment is processed securely via our payment gateway.",
  "MTN MoMo": "Yes! We accept MTN Mobile Money and Orange Money. Simply select your preferred method at checkout and follow the payment prompt. Payment is processed securely via our payment gateway.",
  "Orange Money": "Yes! We accept MTN Mobile Money and Orange Money. Simply select your preferred method at checkout and follow the payment prompt. Payment is processed securely via our payment gateway.",
  "payment secure": "Yes – all payments are processed through Vercel's secure payment gateway. We never store your payment details. Your transaction is encrypted and protected.",
  "pay on delivery": "We offer pay-on-delivery for orders within Buea town. A 50% deposit is required upfront to confirm your order, with the balance paid on delivery. This option is available at checkout.",
  "cash on delivery": "We offer pay-on-delivery for orders within Buea town. A 50% deposit is required upfront to confirm your order, with the balance paid on delivery. This option is available at checkout.",
  "total costs": "The total cost includes: product price + delivery fee (if applicable). There are no hidden charges. The final amount is clearly displayed before you confirm your order.",
  "hidden fees": "The total cost includes: product price + delivery fee (if applicable). There are no hidden charges. The final amount is clearly displayed before you confirm your order.",
  "bulk discount": "Yes – we offer bulk discounts for orders of 5+ pairs. Contact us directly with your requirements and we'll provide a custom quote. The discount increases with volume.",
  "bulk order": "Yes – we offer bulk discounts for orders of 5+ pairs. Contact us directly with your requirements and we'll provide a custom quote. The discount increases with volume.",
  "wholesale": "Yes – we offer bulk discounts for orders of 5+ pairs. Contact us directly with your requirements and we'll provide a custom quote. The discount increases with volume.",
  "discount": "We occasionally run promotions. Follow us on social media or subscribe to our newsletter for exclusive discount codes and early access to sales.",
  "promo": "We occasionally run promotions. Follow us on social media or subscribe to our newsletter for exclusive discount codes and early access to sales.",
  "coupon": "We occasionally run promotions. Follow us on social media or subscribe to our newsletter for exclusive discount codes and early access to sales.",

  "delivery to my area": "We deliver across Cameroon. **Buea town:** Free delivery. **Outside Buea:** Delivery fees are calculated at checkout based on your location. Fees start from 1,500 FCFA.",
  "shipping cost": "We deliver across Cameroon. **Buea town:** Free delivery. **Outside Buea:** Delivery fees are calculated at checkout based on your location. Fees start from 1,500 FCFA.",
  "delivery fee": "We deliver across Cameroon. **Buea town:** Free delivery. **Outside Buea:** Delivery fees are calculated at checkout based on your location. Fees start from 1,500 FCFA.",
  "how long to arrive": "**Buea town:** Same-day dispatch, delivered within 24 hours. **Other locations:** 2–5 business days depending on your region. You'll receive a tracking number once your order is dispatched.",
  "delivery time": "**Buea town:** Same-day dispatch, delivered within 24 hours. **Other locations:** 2–5 business days depending on your region. You'll receive a tracking number once your order is dispatched.",
  "shipping time": "**Buea town:** Same-day dispatch, delivered within 24 hours. **Other locations:** 2–5 business days depending on your region. You'll receive a tracking number once your order is dispatched.",
  "order dispatched": "Orders placed before 2 PM (WAT) are dispatched the same day. You'll receive a WhatsApp message with delivery updates and a tracking link.",
  "shipped": "Orders placed before 2 PM (WAT) are dispatched the same day. You'll receive a WhatsApp message with delivery updates and a tracking link.",
  "pick up from shop": "Yes – you can pick up your order from our shop in Molyko, Buea (near the main roundabout). Select 'Pick Up' at checkout. We'll notify you when your order is ready.",
  "in-store pickup": "Yes – you can pick up your order from our shop in Molyko, Buea (near the main roundabout). Select 'Pick Up' at checkout. We'll notify you when your order is ready.",
  "international delivery": "Currently, we deliver within Cameroon only. We are working on expanding to other countries. For special requests, contact us directly.",
  "outside Cameroon": "Currently, we deliver within Cameroon only. We are working on expanding to other countries. For special requests, contact us directly.",
  "do you ship to Douala": "Yes, we ship nationwide. Delivery to Douala takes 2–3 days, and to Yaoundé 3–4 business days.",
  "do you ship to Yaoundé": "Yes, we ship nationwide. Delivery to Douala takes 2–3 days, and to Yaoundé 3–4 business days.",

  "return policy": "**14‑day return policy.** Unused items in original packaging can be returned within 14 days for a full refund or exchange. Contact us to initiate a return. Return shipping is paid by the customer.",
  "exchange policy": "**14‑day return policy.** Unused items in original packaging can be returned within 14 days for a full refund or exchange. Contact us to initiate a return. Return shipping is paid by the customer.",
  "how to return": "To return/exchange: ① Email us at hello@sabaton.cm with your order number. ② We'll send you return instructions. ③ Package the item securely. ④ Drop off at the nearest courier. ⑤ We process returns within 2–3 business days.",
  "warranty": "We offer a **1‑year warranty** against manufacturing defects (e.g., sole separation, stitching issues). This doesn't cover normal wear and tear, misuse, or water damage. Contact us if you have a warranty claim.",
  "guarantee": "We offer a **1‑year warranty** against manufacturing defects (e.g., sole separation, stitching issues). This doesn't cover normal wear and tear, misuse, or water damage. Contact us if you have a warranty claim.",
  "contact customer service": "You can reach us via: 📞 Phone: +237 6XX XXX XXX | 📧 Email: hello@sabaton.cm | 💬 WhatsApp: +237 6XX XXX XXX. We respond within 1‑2 hours during business hours.",
  "customer support": "You can reach us via: 📞 Phone: +237 6XX XXX XXX | 📧 Email: hello@sabaton.cm | 💬 WhatsApp: +237 6XX XXX XXX. We respond within 1‑2 hours during business hours.",
  "more pictures": "Each product page has multiple images showing different angles. If you need specific photos, contact us and we'll send them directly. We're happy to help!",

  "location": "We're located at **Molyko, Buea, Cameroon** – near the main roundabout. Open Monday–Saturday, 8 AM – 6 PM (WAT). We look forward to welcoming you!",
  "where is shop": "We're located at **Molyko, Buea, Cameroon** – near the main roundabout. Open Monday–Saturday, 8 AM – 6 PM (WAT). We look forward to welcoming you!",
  "help choose right shoe": "Of course! 👞 Tell me: ① The occasion (e.g., work, wedding, weekend). ② Your style preference. ③ Your budget. I'll recommend the perfect pair.",
  "style advice": "Of course! 👞 Tell me: ① The occasion (e.g., work, wedding, weekend). ② Your style preference. ③ Your budget. I'll recommend the perfect pair.",
  "business hours": "We're open **Monday – Saturday, 8 AM – 6 PM (WAT)**. We're closed on Sundays. You can also reach us online 24/7!",
  "other colors": "Available colours are listed on each product page. If your preferred colour isn't listed, contact us – we may have it on special order.",
  "why buy from you": "🔹 100% genuine full-grain leather. 🔹 Handcrafted in Buea. 🔹 Free delivery in Buea. 🔹 14‑day returns. 🔹 1‑year warranty. 🔹 Expert customer support. 🔹 We support local artisans.",
  "sustainable": "Yes! We use sustainable tanning processes, minimise waste, and support local artisans. Our packaging is recyclable. We're committed to ethical, eco‑conscious production.",
  "eco friendly": "Yes! We use sustainable tanning processes, minimise waste, and support local artisans. Our packaging is recyclable. We're committed to ethical, eco‑conscious production.",
  "gift wrapping": "Yes – we offer gift wrapping for an additional 1,500 FCFA. You can select this option at checkout. A personalised message can be included.",
  "custom order": "We offer custom orders! Lead time is 2–3 weeks. Contact us with your requirements – colour, material, size, and design preferences – and we'll create a unique pair just for you.",
  "bespoke": "We offer custom orders! Lead time is 2–3 weeks. Contact us with your requirements – colour, material, size, and design preferences – and we'll create a unique pair just for you.",
  "vegan leather": "Currently, we specialise in genuine leather. We're exploring sustainable vegan alternatives for future collections – stay tuned!",
  "can I try before I buy": "Yes! You can visit our shop in Molyko, Buea, to try on any style. No appointment needed.",
  "student discount": "We offer a 10% discount for students and teachers with a valid ID. Contact us to apply.",
  "teacher discount": "We offer a 10% discount for students and teachers with a valid ID. Contact us to apply.",
  "delivery range": "We deliver across Cameroon. For locations outside major cities, additional fees may apply.",
  "how do I track my order": "You'll receive a tracking link via WhatsApp once your order is dispatched. You can also track in your account.",
  "after-sales service": "Yes – we offer free cleaning and conditioning for 6 months after purchase. Just bring your shoes to our shop.",
  "size exchange": "Yes – we offer free size exchanges within 7 days. Contact us to arrange an exchange.",
};

function getFAQResponse(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
    if (lower.includes(key.toLowerCase())) {
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
        });
      }
    }

    // ─── If not FAQ, proceed with LLM ──────────────────────────

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
    if (lastUserMsg && lastUserMsg.role === 'user') {
      const lower = lastUserMsg.content.toLowerCase();
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
      checkout,
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