// lib/session.ts
import { NextRequest } from 'next/server';

export function getSessionId(req: NextRequest): string | null {
  // First try header (used by cart & checkout)
  const headerId = req.headers.get('x-session-id');
  if (headerId) return headerId;

  // Fallback to cookie (if you use cookies for sessions)
  const cookie = req.cookies.get('sessionId');
  if (cookie) return cookie.value;

  return null;
}