import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest) {
  try {
    // 1. Get session ID from header
    const sessionId = req.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // 2. Get itemId from query string (e.g., /api/cart/remove?itemId=cm7x...)
    const itemId = req.nextUrl.searchParams.get('itemId');
    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    // 3. Check that the cart exists for this session
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      select: { id: true }, // we only need the cart ID
    });

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    // 4. Verify the item belongs to this cart with a single query
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,        // using string ID (no parseInt)
        cartId: cart.id,   // ensures ownership
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found in your cart' },
        { status: 404 }
      );
    }

    // 5. Delete the item
    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
    });

  } catch (error) {
    console.error('Error removing cart item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}