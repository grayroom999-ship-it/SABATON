// app/api/cart/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Removed 'color' from destructuring – only productId, size, quantity
    const { productId, size, quantity } = await req.json();

    if (!productId || !size || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const quantityNum = Number(quantity);
    if (isNaN(quantityNum) || quantityNum < 1) {
      return NextResponse.json({ error: 'Quantity must be a positive number' }, { status: 400 });
    }

    let cart = await prisma.cart.findUnique({ where: { sessionId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { sessionId } });
    }

    // Find variant by productId and size only – ignore colour
    const variant = await prisma.variant.findFirst({
      where: {
        productId,
        size: Number(size),
        // color removed
      },
    });
    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    let cartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        variantId: variant.id,
      },
    });

    if (cartItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity: cartItem.quantity + quantityNum },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variant.id,
          quantity: quantityNum,
          price: variant.price || 0,
        },
      });
    }

    return NextResponse.json({ success: true, item: cartItem });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}