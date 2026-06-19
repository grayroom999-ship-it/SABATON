import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest) {
  try {
    // 1. Get session ID from header
    const sessionId = req.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // 2. Parse and validate request body
    const { itemId, quantity } = await req.json();

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    // Convert quantity to a number and validate it's a non-negative integer
    const quantityNum = Number(quantity);
    if (isNaN(quantityNum) || quantityNum < 0 || !Number.isInteger(quantityNum)) {
      return NextResponse.json(
        { error: 'Quantity must be a non-negative integer' },
        { status: 400 }
      );
    }

    // 3. Check that the cart exists for this session
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      select: { id: true }, // we only need the ID for ownership check
    });

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    // 4. Verify the item belongs to this cart using a single database query (efficient & safe)
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id, // ensures ownership
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found in your cart' },
        { status: 404 }
      );
    }

    // 5. If quantity is 0, delete the item; otherwise update its quantity
    if (quantityNum === 0) {
      await prisma.cartItem.delete({
        where: { id: itemId },
      });
      return NextResponse.json({
        success: true,
        message: 'Item removed from cart',
      });
    }

    // 6. Update the item with the new quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: quantityNum },
      // Optionally include product/variant details for the response
      // include: { variant: true, product: true }, // if you need extra data
    });

    return NextResponse.json({
      success: true,
      item: updatedItem,
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}