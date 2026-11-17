import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(req: NextRequest) {
  try {
    const { public_id } = await req.json();

    if (!public_id) {
      return NextResponse.json({ error: 'Missing public_id' }, { status: 400 });
    }

    const cloudName = 
      req.headers.get('x-cloudinary-cloud-name') || 
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
      process.env.CLOUDINARY_CLOUD_NAME || 
      'demo';

    const apiKey = 
      req.headers.get('x-cloudinary-api-key') || 
      process.env.CLOUDINARY_API_KEY;

    const apiSecret = 
      req.headers.get('x-cloudinary-api-secret') || 
      process.env.CLOUDINARY_API_SECRET;

    if (apiKey && apiSecret && cloudName !== 'demo') {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      const result = await cloudinary.uploader.destroy(public_id);
      return NextResponse.json({ success: true, result });
    }

    // In demo / sandbox mode, return successful deletion from current session
    return NextResponse.json({ success: true, result: 'ok', demo: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to delete asset from Cloudinary' },
      { status: 500 }
    );
  }
}
