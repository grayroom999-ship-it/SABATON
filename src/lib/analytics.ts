// lib/analytics.ts
import { prisma } from './prisma';

export async function trackProductView(productId: string, sessionId: string) {
  try {
    await prisma.productView.create({
      data: { productId, sessionId },
    });
  } catch (e) {
    console.error('Failed to track product view:', e);
  }
}

export async function trackSearch(query: string, resultCount: number, sessionId: string) {
  try {
    await prisma.searchQuery.create({
      data: { query, sessionId, resultCount },
    });
  } catch (e) {
    console.error('Failed to track search:', e);
  }
}

export async function trackAddToCart(
  productId: string,
  variantId: string | undefined,
  quantity: number,
  cartId: string,
  sessionId: string
) {
  try {
    await prisma.addToCartEvent.create({
      data: { productId, variantId, quantity, cartId, sessionId },
    });
  } catch (e) {
    console.error('Failed to track add to cart:', e);
  }
}

export async function trackPurchase(
  orderId: string,
  totalAmount: number,
  sessionId: string
) {
  try {
    await prisma.purchaseEvent.create({
      data: { orderId, totalAmount, sessionId },
    });
  } catch (e) {
    console.error('Failed to track purchase:', e);
  }
}