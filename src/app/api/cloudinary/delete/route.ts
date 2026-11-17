import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { parseSessionCookie } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { public_id, isDemoMode } = await req.json();

    if (!public_id) {
      return NextResponse.json({ error: 'Missing public_id' }, { status: 400 });
    }

    if (isDemoMode) {
      return NextResponse.json({ success: true, result: 'ok', demo: true });
    }

    const sessionCookie = parseSessionCookie(req);

    const cloudName = 
      process.env.CLOUDINARY_CLOUD_NAME || 
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
      sessionCookie?.cloudName;

    const apiKey = 
      process.env.CLOUDINARY_API_KEY || 
      sessionCookie?.apiKey;

    const apiSecret = 
      process.env.CLOUDINARY_API_SECRET || 
      sessionCookie?.apiSecret;

    if (apiKey && apiSecret && cloudName && cloudName !== 'demo') {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      const result = await cloudinary.uploader.destroy(public_id);
      return NextResponse.json({ success: true, result });
    }

    // Demo / session fallback
    return NextResponse.json({ success: true, result: 'ok', demo: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error)?.message || 'Failed to delete asset from Cloudinary' },
      { status: 500 }
    );
  }
}
