import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { INITIAL_ASSETS } from '@/lib/constants';
import { CloudinaryAsset } from '@/types/cloudinary';

interface CloudinaryApiResource {
  public_id: string;
  format: string;
  version?: number;
  resource_type?: 'image' | 'video' | 'raw';
  type?: string;
  created_at: string;
  bytes: number;
  width: number;
  height: number;
  url: string;
  secure_url: string;
  tags?: string[];
}

export async function GET(req: NextRequest) {
  try {
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

    // If live credentials are provided and not demo, try querying Cloudinary Admin API
    if (apiKey && apiSecret && cloudName !== 'demo') {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      try {
        const response = await cloudinary.api.resources({
          type: 'upload',
          resource_type: 'image',
          max_results: 50,
          direction: 'desc',
        });

        const liveAssets: CloudinaryAsset[] = response.resources.map((res: CloudinaryApiResource, idx: number) => {
          const width = res.width || 1200;
          const height = res.height || 800;
          const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
          const divisor = gcd(width, height) || 1;
          const simplifiedWidth = Math.round(width / divisor);
          const simplifiedHeight = Math.round(height / divisor);
          const aspectRatio = `${simplifiedWidth}:${simplifiedHeight}`;

          return {
            id: `cld-live-${idx}-${res.public_id}`,
            public_id: res.public_id,
            filename: `${res.public_id.split('/').pop()}.${res.format}`,
            format: res.format,
            version: res.version,
            resource_type: res.resource_type || 'image',
            type: res.type || 'upload',
            created_at: res.created_at,
            bytes: res.bytes,
            width: res.width,
            height: res.height,
            url: res.url,
            secure_url: res.secure_url,
            folder: res.public_id.includes('/') ? res.public_id.split('/')[0] : 'General',
            tags: res.tags || [],
            aspect_ratio: aspectRatio,
            description: `Cloudinary asset: ${res.public_id}`,
          };
        });

        if (liveAssets.length > 0) {
          return NextResponse.json({ assets: liveAssets, source: 'live' });
        }
      } catch (adminError: unknown) {
        console.warn('Could not query live resources from Cloudinary Admin API, falling back to sample library:', (adminError as Error)?.message);
      }
    }

    // Default: Return initial sample library
    return NextResponse.json({ assets: INITIAL_ASSETS, source: 'sample' });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error)?.message || 'Failed to fetch assets', assets: INITIAL_ASSETS, source: 'sample' },
      { status: 500 }
    );
  }
}
