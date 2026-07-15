// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const sessionId = req.headers.get('x-session-id');
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }
  const session = await prisma.session.findUnique({
    where: { sessionId },
    include: { userProfile: true },
  });
  if (!session?.userProfile) {
    return NextResponse.json({ exists: false });
  }
  return NextResponse.json({
    exists: true,
    name: session.userProfile.name,
    phone: session.userProfile.phone,
    address: session.userProfile.address,
    email: session.userProfile.email,
    city: session.userProfile.city,
  });
}