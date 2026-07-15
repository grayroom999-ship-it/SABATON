// app/api/checkout/route.ts
// ─────────────────────────────────────────────────────────────
// Creates order, generates tracking number, sends emails

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { trackPurchase } from '@/lib/analytics';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { sessionId, paymentMethod, phoneNumber, deliveryAddress } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // ─── Get cart ──────────────────────────────────────────
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // ─── Calculate total ──────────────────────────────────
    const totalAmount = cart.items.reduce((sum, item) => {
      const price = item.variant?.product?.price ?? 0;
      return sum + (price * item.quantity);
    }, 0);

    // ─── Get or create user profile ──────────────────────
    let profile = await prisma.userProfile.findUnique({
      where: { phone: phoneNumber },
    });

    if (!profile) {
      const session = await prisma.session.findUnique({
        where: { sessionId },
        include: { userProfile: true },
      });
      const existingName = session?.userProfile?.name || 'Customer';
      profile = await prisma.userProfile.create({
        data: {
          phone: phoneNumber,
          name: existingName,
          address: deliveryAddress || 'Unknown',
        },
      });
    } else {
      if (deliveryAddress && deliveryAddress !== profile.address) {
        profile = await prisma.userProfile.update({
          where: { id: profile.id },
          data: { address: deliveryAddress },
        });
      }
    }

    // ─── Link session ────────────────────────────────────
    await prisma.session.upsert({
      where: { sessionId },
      update: { userProfileId: profile.id },
      create: { sessionId, userProfileId: profile.id },
    });

    // ─── Generate order number & tracking ──────────────
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const trackingNumber = `TRK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // ─── Create order ────────────────────────────────────
    const order = await prisma.order.create({
      data: {
        orderNumber,
        trackingNumber,
        userProfileId: profile.id,
        cartId: cart.id,
        customerName: profile.name,
        customerPhone: profile.phone,
        deliveryAddress: profile.address,
        totalAmount,
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
      },
    });

    // ─── Track purchase event ────────────────────────────
    await trackPurchase(order.id, totalAmount, sessionId);

    // ─── Vendor notification (database) ────────────────
    await prisma.vendorNotification.create({
      data: {
        orderId: order.id,
        message: `New order #${orderNumber} from ${profile.name} (${profile.phone}). Total: ${totalAmount} FCFA. Tracking: ${trackingNumber}.`,
      },
    });

    // ─── Emails via Resend ──────────────────────────────
    const orderItemsHtml = cart.items.map((item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${item.variant?.product?.name || item.productName}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${item.variant?.size || 'N/A'}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${item.variant?.color || 'N/A'}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${(item.price * item.quantity).toLocaleString()} FCFA</td>
      </tr>
    `).join('');

    const senderEmail = process.env.SENDER_EMAIL;
    const vendorEmail = process.env.VENDOR_EMAIL;

    // Customer email
    if (profile.email && senderEmail) {
      await resend.emails.send({
        from: senderEmail,
        to: profile.email,
        subject: `Order Confirmation #${orderNumber}`,
        html: `
          <h1>Thank you for your order, ${profile.name}!</h1>
          <p>Order <strong>#${orderNumber}</strong> confirmed.</p>
          <p><strong>Tracking:</strong> ${trackingNumber}</p>
          <p><strong>Address:</strong> ${profile.address}</p>
          <h2>Order Summary</h2>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f5f5f5;">
                <th>Product</th><th>Size</th><th>Colour</th><th>Qty</th><th>Price</th>
              </tr>
            </thead>
            <tbody>${orderItemsHtml}</tbody>
            <tfoot>
              <tr><td colspan="4" style="text-align:right;font-weight:bold;">Total</td>
              <td style="text-align:right;font-weight:bold;">${totalAmount.toLocaleString()} FCFA</td></tr>
            </tfoot>
          </table>
          <p>Delivered within 24 hours in Buea. Thank you!</p>
        `,
      });
    }

    // Vendor email
    if (senderEmail && vendorEmail) {
      await resend.emails.send({
        from: senderEmail,
        to: vendorEmail,
        subject: `🔔 New Order #${orderNumber}`,
        html: `
          <h2>New order!</h2>
          <p><strong>Order:</strong> ${orderNumber}</p>
          <p><strong>Customer:</strong> ${profile.name} (${profile.phone})</p>
          <p><strong>Address:</strong> ${profile.address}</p>
          <p><strong>Total:</strong> ${totalAmount.toLocaleString()} FCFA</p>
          <p><strong>Tracking:</strong> ${trackingNumber}</p>
          <h3>Items</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f5f5f5;">
                <th>Product</th><th>Size</th><th>Colour</th><th>Qty</th><th>Price</th>
              </tr>
            </thead>
            <tbody>${orderItemsHtml}</tbody>
          </table>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders">View in Dashboard</a></p>
        `,
      });
    }

    // ─── Clear cart ──────────────────────────────────────
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber,
      trackingNumber,
      total: totalAmount,
      customer: {
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to process checkout' },
      { status: 500 }
    );
  }
}