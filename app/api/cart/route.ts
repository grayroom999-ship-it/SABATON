import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'

async function getOrCreateCart(sessionId: string) {
  let cart = await prisma.cart.findUnique({
    where: { sessionId },
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
      data: { sessionId },
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

export async function GET(request: NextRequest) {
  const sessionId = request.headers.get('x-session-id');
  if (!sessionId) return NextResponse.json({ items: [], total: 0 });

  try {
    const cart = await getOrCreateCart(sessionId);
    const items = cart.items.map((item: any) => ({
      id: item.id,
      name: item.variant!.product.name,
      size: item.variant!.size,
      color: item.variant!.color,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity
    }));
    const total = items.reduce((sum: number, item: { subtotal: number }) => sum + item.subtotal, 0);
    return NextResponse.json({ items, total, itemCount: items.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sessionId = request.headers.get('x-session-id');
  const { productName, size, color, quantity = 1 } = await request.json();

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  try {
    const variant = await prisma.variant.findFirst({
      where: {
        product: { name: { contains: productName, mode: 'insensitive' } },
        size: size,
        ...(color && { color: color.toLowerCase() })
      },
      include: { product: true }
    });

    if (!variant) {
      return NextResponse.json({ error: 'Product variant not found' }, { status: 404 });
    }

    let cart = await prisma.cart.findUnique({ where: { sessionId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { sessionId } });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: variant.productId,
        variantId: variant.id
      }
    });

    const priceToUse = variant.price ?? variant.product.price;

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: variant.productId,
          variantId: variant.id,
          quantity,
          price: priceToUse,
          productName: variant.product.name
        }
      });
    }

    return NextResponse.json({ success: true, message: `Added ${variant.product.name} size ${size} to cart` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const sessionId = request.headers.get('x-session-id');
  const { itemId, quantity } = await request.json();

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  try {
    const cart = await prisma.cart.findUnique({ where: { sessionId }, select: { id: true } });
    if (!cart) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id }
    });
    if (!cartItem) return NextResponse.json({ error: 'Item not in your cart' }, { status: 404 });

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const sessionId = request.headers.get('x-session-id');
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('itemId');

  if (!sessionId || !itemId) {
    return NextResponse.json({ error: 'Session ID and Item ID required' }, { status: 400 });
  }

  try {
    const cart = await prisma.cart.findUnique({ where: { sessionId }, select: { id: true } });
    if (!cart) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id }
    });
    if (!cartItem) return NextResponse.json({ error: 'Item not in your cart' }, { status: 404 });

    await prisma.cartItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 });
  }
}