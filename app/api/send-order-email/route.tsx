// app/api/send-order-email/route.tsx
import { Resend } from 'resend';
import { OrderNotification } from '@/emails/OrderNotification';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order } = body;

    if (!order || !order.orderNumber || !order.items?.length) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      );
    }

    const recipientEmail = process.env.VENDOR_EMAIL || 'grayroom999@gmail.com';
    const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev'; // fallback to test

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY missing');
      return NextResponse.json({ error: 'Email not configured' }, { status: 500 });
    }

    const { data, error } = await resend.emails.send({
      from: `Buea Leather Shoes <${senderEmail}>`,
      to: [recipientEmail],
      subject: `🛍️ New Order #${order.orderNumber}`,
      react: <OrderNotification order={order} />,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}