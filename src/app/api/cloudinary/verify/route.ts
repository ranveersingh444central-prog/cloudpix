import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { VerificationResult } from '@/types/cloudinary';
import { parseSessionCookie } from '@/lib/session';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const sessionCookie = parseSessionCookie(req);

    // 1. Resolve cloud name
    const requestedCloud = body.cloudName?.trim();
    const isExplicitDemo = body.isDemoMode === true || requestedCloud === 'demo';

    if (isExplicitDemo) {
      // Connect to demo mode & clear any active personal session cookie
      const testUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
      const cdnRes = await fetch(testUrl, { method: 'HEAD', cache: 'no-store' });
      const latencyMs = Date.now() - startTime;

      const result: VerificationResult = {
        connected: cdnRes.ok,
        cloudName: 'demo',
        accountType: 'demo',
        latencyMs,
        statusMessage: 'Cloudinary Demo Sandbox active. Transformations execute on global demo CDN.',
        checkedAt: new Date().toISOString(),
        hasServerEnv: Boolean(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
        details: {
          plan: 'Cloudinary Demo Cloud',
          transformationsFormatted: 'Uncapped Sandbox Transforms',
        },
      };

      const res = NextResponse.json(result);
      res.cookies.delete('cld_session');
      return res;
    }

    // 2. Personal Mode: Resolve credentials from body (new entry), env variables (server config), or secure session cookie
    const cloudName = 
      requestedCloud || 
      process.env.CLOUDINARY_CLOUD_NAME || 
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
      sessionCookie?.cloudName;

    if (!cloudName) {
      return NextResponse.json(
        {
          connected: false,
          cloudName: '',
          accountType: 'live',
          latencyMs: 0,
          statusMessage: 'Configuration missing: Cloud Name is required.',
          checkedAt: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const apiKey = 
      body.apiKey?.trim() || 
      process.env.CLOUDINARY_API_KEY || 
      sessionCookie?.apiKey;

    const apiSecret = 
      body.apiSecret?.trim() || 
      process.env.CLOUDINARY_API_SECRET || 
      sessionCookie?.apiSecret;

    // Meaningful error when credentials missing for a personal account
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        {
          connected: false,
          cloudName,
          accountType: 'live',
          latencyMs: 0,
          statusMessage: `Personal account '${cloudName}' requires both API Key and API Secret to authenticate. Configure them in Settings or set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in server environment.`,
          checkedAt: new Date().toISOString(),
          hasServerEnv: false,
        },
        { status: 400 }
      );
    }

    // 3. Authenticate with Cloudinary SDK
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const pingResult = await cloudinary.api.ping();
    const latencyMs = Date.now() - startTime;

    if (pingResult.status !== 'ok') {
      return NextResponse.json(
        {
          connected: false,
          cloudName,
          accountType: 'live',
          latencyMs,
          statusMessage: `Cloudinary ping failed for cloud '${cloudName}'. Verify that your credentials are valid.`,
          checkedAt: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // 4. Optionally fetch usage stats for personal account
    let usageDetails: VerificationResult['details'] = undefined;
    try {
      const usage = await cloudinary.api.usage();
      usageDetails = {
        plan: usage.plan || 'Developer / Production',
        creditsUsage: usage.credits ? Math.round((usage.credits.usage / usage.credits.limit) * 100) : undefined,
        storageFormatted: usage.storage?.usage ? `${(usage.storage.usage / (1024 * 1024)).toFixed(1)} MB` : undefined,
        transformationsFormatted: usage.transformations?.usage 
          ? `${usage.transformations.usage.toLocaleString()} / ${usage.transformations.limit ? usage.transformations.limit.toLocaleString() : 'Unlimited'}` 
          : undefined,
      };
    } catch {
      // Usage endpoint might be restricted depending on role, ping is sufficient
    }

    const result: VerificationResult = {
      connected: true,
      cloudName,
      accountType: 'live',
      latencyMs,
      statusMessage: `Personal Cloudinary cloud '${cloudName}' authenticated and operational.`,
      checkedAt: new Date().toISOString(),
      hasServerEnv: Boolean(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
      details: usageDetails,
    };

    const res = NextResponse.json(result);

    // Securely persist credentials in httpOnly cookie only (NEVER expose to client JS/localStorage)
    if (body.apiKey && body.apiSecret) {
      const sessionPayload = JSON.stringify({
        cloudName,
        apiKey: body.apiKey.trim(),
        apiSecret: body.apiSecret.trim(),
      });
      const encoded = Buffer.from(sessionPayload).toString('base64');
      res.cookies.set('cld_session', encoded, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return res;
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;
    const msg = (error as Error)?.message || 'Failed to authenticate with Cloudinary';
    return NextResponse.json(
      {
        connected: false,
        cloudName: 'error',
        accountType: 'live',
        latencyMs,
        statusMessage: `Cloudinary error: ${msg}`,
        checkedAt: new Date().toISOString(),
      },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
