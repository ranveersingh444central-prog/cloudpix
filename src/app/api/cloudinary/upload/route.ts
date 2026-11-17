import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryAsset } from '@/types/cloudinary';
import { parseSessionCookie } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { file, folder = 'Uploads', tags = [], filename = 'upload', isDemoMode = false } = data;

    if (!file) {
      return NextResponse.json({ error: 'No file or image URL provided' }, { status: 400 });
    }

    const sessionCookie = parseSessionCookie(req);

    // 1. If explicit demo mode
    if (isDemoMode) {
      const isDataUrl = file.startsWith('data:image/');
      const format = isDataUrl ? file.split(';')[0].split('/')[1] || 'png' : 'jpg';
      const mockPublicId = `samples/${folder.toLowerCase()}/${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now().toString().slice(-4)}`;

      const newAsset: CloudinaryAsset = {
        id: `cld-sandbox-${Date.now()}`,
        public_id: mockPublicId,
        filename: `${filename}.${format}`,
        format,
        resource_type: 'image',
        type: 'upload',
        created_at: new Date().toISOString(),
        bytes: isDataUrl ? Math.round(file.length * 0.75) : 850000,
        width: 1920,
        height: 1080,
        url: file,
        secure_url: file,
        folder,
        tags: [...tags, 'demo-upload'],
        aspect_ratio: '16:9',
        description: `Demo session upload in ${folder}`,
      };

      return NextResponse.json({
        success: true,
        asset: newAsset,
        mode: 'demo',
        message: 'Asset added to demo session. Switch to a personal Cloudinary account to persist directly in your cloud storage.',
      });
    }

    // 2. Personal Mode: Resolve credentials
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

    if (!cloudName || !apiKey || !apiSecret || cloudName === 'demo') {
      return NextResponse.json(
        { 
          error: 'Configuration missing: Your personal Cloudinary Cloud Name, API Key, and API Secret must be configured to upload assets to your cloud.',
          isConfigMissing: true,
        },
        { status: 400 }
      );
    }

    // Execute real Cloudinary upload
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const uploadResponse = await cloudinary.uploader.upload(file, {
      folder: folder !== 'All' ? folder : undefined,
      tags: Array.isArray(tags) ? tags : [tags],
      resource_type: 'image',
    });

    const newAsset: CloudinaryAsset = {
      id: `cld-live-${uploadResponse.public_id}`,
      public_id: uploadResponse.public_id,
      filename: `${uploadResponse.public_id.split('/').pop()}.${uploadResponse.format}`,
      format: uploadResponse.format,
      version: uploadResponse.version,
      resource_type: 'image',
      type: uploadResponse.type || 'upload',
      created_at: uploadResponse.created_at || new Date().toISOString(),
      bytes: uploadResponse.bytes,
      width: uploadResponse.width,
      height: uploadResponse.height,
      url: uploadResponse.url,
      secure_url: uploadResponse.secure_url,
      folder,
      tags: uploadResponse.tags || tags,
      aspect_ratio: `${uploadResponse.width}:${uploadResponse.height}`,
      description: `Uploaded to ${cloudName}/${uploadResponse.public_id}`,
    };

    return NextResponse.json({ 
      success: true, 
      asset: newAsset, 
      mode: 'personal',
      cloudName,
      message: `Asset successfully uploaded to personal Cloudinary cloud '${cloudName}'`
    });
  } catch (error: unknown) {
    const message = (error as Error)?.message || 'Cloudinary upload failed';
    return NextResponse.json(
      { error: `Upload error: ${message}` },
      { status: 400 }
    );
  }
}
