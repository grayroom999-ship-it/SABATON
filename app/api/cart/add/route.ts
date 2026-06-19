import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const { productId, size, color, quantity } = await req.json();

    // Validate inputs
    if (!productId || !size || !color || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Convert quantity to number (safety)
    const quantityNum = Number(quantity);
    if (isNaN(quantityNum) || quantityNum < 1) {
      return NextResponse.json({ error: 'Quantity must be a positive number' }, { status: 400 });
    }

    // Find or create cart
    let cart = await prisma.cart.findUnique({
      where: { sessionId },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionId },
      });
    }

    // Find the product variant
    const variant = await prisma.variant.findFirst({
      where: {
        productId,
        size: Number(size),
        color,
      },
    });
    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    // Check if item already in cart
    let cartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        variantId: variant.id,
      },
    });

    if (cartItem) {
      // Update quantity
      cartItem = await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity: cartItem.quantity + quantityNum },
      });
    } else {
      // Create new cart item – NOW INCLUDING productId
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,           // <-- FIX: required field
          variantId: variant.id,
          quantity: quantityNum,
          price: variant.price || 0,      // fallback if variant.price is null
        },
      });
    }

    return NextResponse.json({ success: true, item: cartItem });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}