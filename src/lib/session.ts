import { NextRequest } from 'next/server';

export interface SessionData {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export function parseSessionCookie(req: NextRequest): SessionData | null {
  const cookie = req.cookies.get('cld_session')?.value;
  if (!cookie) return null;
  try {
    const decoded = Buffer.from(cookie, 'base64').toString('utf-8');
    const data = JSON.parse(decoded);
    if (data.cloudName && data.apiKey && data.apiSecret) {
      return data;
    }
  } catch {
    // Malformed cookie
  }
  return null;
}
