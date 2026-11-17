import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { INITIAL_ASSETS } from '@/lib/constants';
import { CloudinaryAsset } from '@/types/cloudinary';
import { parseSessionCookie } from '@/lib/session';

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
    const { searchParams } = new URL(req.url);
    const requestedMode = searchParams.get('mode'); // 'personal' or 'demo'
    const sessionCookie = parseSessionCookie(req);

    const isDemoMode = requestedMode === 'demo';

    // 1. Explicit Demo Mode requested
    if (isDemoMode) {
      return NextResponse.json({ 
        assets: INITIAL_ASSETS, 
        source: 'demo',
        totalBytes: INITIAL_ASSETS.reduce((sum, item) => sum + item.bytes, 0)
      });
    }

    // 2. Personal Mode: Resolve credentials
    const cloudName = 
      searchParams.get('cloudName') || 
      process.env.CLOUDINARY_CLOUD_NAME || 
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
      sessionCookie?.cloudName;

    const apiKey = 
      process.env.CLOUDINARY_API_KEY || 
      sessionCookie?.apiKey;

    const apiSecret = 
      process.env.CLOUDINARY_API_SECRET || 
      sessionCookie?.apiSecret;

    // If personal mode was requested but credentials are missing
    if (requestedMode === 'personal' && (!apiKey || !apiSecret || !cloudName || cloudName === 'demo')) {
      return NextResponse.json(
        { 
          error: 'Missing Cloudinary configuration: API Key and API Secret are required to fetch personal assets.',
          assets: [], 
          source: 'personal',
          isConfigMissing: true
        },
        { status: 400 }
      );
    }

    // If live credentials are valid and available, query Cloudinary Admin API
    if (apiKey && apiSecret && cloudName && cloudName !== 'demo') {
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

        const liveAssets: CloudinaryAsset[] = (response.resources || []).map((res: CloudinaryApiResource, idx: number) => {
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

        // Return personal assets (even if 0, do NOT substitute with demo assets!)
        return NextResponse.json({ 
          assets: liveAssets, 
          source: 'personal',
          cloudName,
          totalBytes: liveAssets.reduce((sum, item) => sum + item.bytes, 0)
        });
      } catch (adminError: unknown) {
        const message = (adminError as Error)?.message || 'Failed to fetch resources from Cloudinary Admin API';
        return NextResponse.json(
          { 
            error: message, 
            assets: [], 
            source: 'personal',
            cloudName 
          },
          { status: 400 }
        );
      }
    }

    // Default when no personal credentials configured: Return demo catalog
    return NextResponse.json({ 
      assets: INITIAL_ASSETS, 
      source: 'demo',
      totalBytes: INITIAL_ASSETS.reduce((sum, item) => sum + item.bytes, 0)
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error)?.message || 'Failed to fetch assets', assets: [], source: 'error' },
      { status: 500 }
    );
  }
}
