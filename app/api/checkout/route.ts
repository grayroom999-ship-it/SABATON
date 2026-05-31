// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Ensure this file is treated as a module (adds a dummy export)
export const runtime = 'nodejs'; // optional, forces Node.js runtime

const checkoutSchema = z.object({
  sessionId: z.string().min(1),
  customerId: z.string().optional(),
  paymentMethod: z.enum(['mtn_momo', 'orange_money']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error },
        { status: 400 }
      );
    }

    const { sessionId, customerId } = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { sessionId },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      let total = 0;
      const orderItemsData = [];

      for (const item of cart.items) {
        const price = item.variant?.price ?? item.product.price;
        total += price * item.quantity;
        orderItemsData.push({
          quantity: item.quantity,
          price,
          productId: item.productId,
          variantId: item.variantId,
        });
      }

      const order = await tx.order.create({
        data: {
          customerId: customerId || null,
          total,
          status: 'pending',
          items: { create: orderItemsData },
        },
      });

      await tx.cart.delete({ where: { id: cart.id } });

      return { order, total };
    });

    return NextResponse.json({
      success: true,
      orderId: result.order.id,
      total: result.total,
      message: 'Order created successfully',
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}

// Optional: ensure module status (TypeScript likes this sometimes)
export {}; 