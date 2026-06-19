// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const checkoutSchema = z.object({
  sessionId: z.string().min(1),
  customerId: z.string().optional(),
  paymentMethod: z.enum(['mtn_momo', 'orange_money']).optional(),
  phoneNumber: z.string().optional(),
  deliveryAddress: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[checkout] Request body:', body);

    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      console.error('[checkout] Validation error:', validation.error);
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error },
        { status: 400 }
      );
    }

    const { sessionId, customerId, paymentMethod, phoneNumber, deliveryAddress } = validation.data;

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

      // ─── Create order with phone & address ───────────────────
      const order = await tx.order.create({
        data: {
          customerId: customerId || null,
          total,
          status: 'pending',
          phone: phoneNumber || null,        // <-- store phone
          address: deliveryAddress || null,  // <-- store address
          items: { create: orderItemsData },
        },
      });

      await tx.cart.delete({ where: { id: cart.id } });

      return { order, total, cartItems: cart.items };
    });

    // ─── Send email (pass phone & address) ────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { order, cartItems, total } = result;

    try {
      const emailResponse = await fetch(`${baseUrl}/api/send-order-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            orderNumber: order.id,
            customerName: customerId ? 'Customer' : 'Guest',
            customerPhone: phoneNumber || 'N/A',
            deliveryAddress: deliveryAddress || 'N/A',
            items: cartItems.map((item: any) => ({
              name: item.product.name,
              size: item.variant?.size || 'N/A',
              quantity: item.quantity,
              price: item.variant?.price ?? item.product.price,
            })),
            totalAmount: total,
          },
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('[checkout] Email notification failed:', errorText);
      } else {
        console.log('[checkout] Email notification sent successfully');
      }
    } catch (emailError) {
      console.error('[checkout] Failed to send email notification:', emailError);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      total: total,
      message: 'Order created successfully',
    });
  } catch (error: any) {
    console.error('[checkout] Error:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Checkout failed' },
      { status: 500 }
    );
  }
}