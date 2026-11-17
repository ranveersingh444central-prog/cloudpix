import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { VerificationResult } from '@/types/cloudinary';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    
    // Check credentials from request body, headers, or environment variables
    const cloudName = 
      body.cloudName || 
      req.headers.get('x-cloudinary-cloud-name') || 
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
      process.env.CLOUDINARY_CLOUD_NAME || 
      'demo';

    const apiKey = 
      body.apiKey || 
      req.headers.get('x-cloudinary-api-key') || 
      process.env.CLOUDINARY_API_KEY;

    const apiSecret = 
      body.apiSecret || 
      req.headers.get('x-cloudinary-api-secret') || 
      process.env.CLOUDINARY_API_SECRET;

    // Case 1: Live Cloudinary account with API Key & Secret
    if (apiKey && apiSecret && cloudName !== 'demo') {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      // Execute ping
      const pingResult = await cloudinary.api.ping();
      const latencyMs = Date.now() - startTime;

      // Optional: Fetch usage stats if available
      let usageDetails: VerificationResult['details'] = undefined;
      try {
        const usage = await cloudinary.api.usage();
        usageDetails = {
          plan: usage.plan || 'Free / Developer',
          creditsUsage: usage.credits ? Math.round((usage.credits.usage / usage.credits.limit) * 100) : undefined,
          storageFormatted: usage.storage?.usage ? `${(usage.storage.usage / (1024 * 1024)).toFixed(1)} MB` : undefined,
          transformationsFormatted: usage.transformations?.usage ? `${usage.transformations.usage.toLocaleString()} / ${usage.transformations.limit?.toLocaleString() || '∞'}` : undefined,
        };
      } catch {
        // Usage endpoint may require admin privileges, ping alone is sufficient
      }

      const result: VerificationResult = {
        connected: pingResult.status === 'ok',
        cloudName,
        accountType: 'live',
        latencyMs,
        statusMessage: `Authenticated & operational on Cloudinary '${cloudName}'`,
        checkedAt: new Date().toISOString(),
        details: usageDetails,
      };

      return NextResponse.json(result);
    }

    // Case 2: Demo or Public CDN mode (cloudName provided without secret, e.g. 'demo' or custom public cloud)
    const testUrl = `https://res.cloudinary.com/${cloudName}/image/upload/sample.jpg`;
    const cdnResponse = await fetch(testUrl, { method: 'HEAD', cache: 'no-store' });
    const latencyMs = Date.now() - startTime;

    if (cdnResponse.ok) {
      const result: VerificationResult = {
        connected: true,
        cloudName,
        accountType: cloudName === 'demo' ? 'demo' : 'live',
        latencyMs,
        statusMessage: cloudName === 'demo' 
          ? 'Cloudinary Demo CDN active with full dynamic transformations enabled'
          : `Cloudinary CDN active for cloud '${cloudName}'`,
        checkedAt: new Date().toISOString(),
        details: {
          plan: cloudName === 'demo' ? 'Cloudinary Demo Cloud' : 'Public CDN Access',
          transformationsFormatted: 'Uncapped Dynamic Transforms',
        },
      };

      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        {
          connected: false,
          cloudName,
          accountType: 'live',
          latencyMs,
          statusMessage: `Cloudinary returned HTTP status ${cdnResponse.status} for cloud '${cloudName}'. Verify that the cloud name exists.`,
          checkedAt: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    return NextResponse.json(
      {
        connected: false,
        cloudName: 'unknown',
        accountType: 'live',
        latencyMs,
        statusMessage: error?.message || 'Failed to connect to Cloudinary endpoint',
        checkedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Allow GET as a quick healthcheck
  return POST(req);
}
