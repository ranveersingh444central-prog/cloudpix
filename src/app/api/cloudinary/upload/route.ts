import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryAsset } from '@/types/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { file, folder = 'Uploads', tags = [], filename = 'upload' } = data;

    if (!file) {
      return NextResponse.json({ error: 'No file or image URL provided' }, { status: 400 });
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

    // If live credentials are supplied, execute real Cloudinary upload
    if (apiKey && apiSecret && cloudName !== 'demo') {
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
        description: `Uploaded asset: ${uploadResponse.public_id}`,
      };

      return NextResponse.json({ success: true, asset: newAsset });
    }

    // Demo/Sandbox fallback:
    // If the file is a remote URL or data URL in demo mode:
    const mockPublicId = `samples/${folder.toLowerCase()}/${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now().toString().slice(-4)}`;
    
    // Estimate image attributes for the sandbox
    const isDataUrl = file.startsWith('data:image/');
    const format = isDataUrl ? file.split(';')[0].split('/')[1] || 'png' : 'jpg';
    
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
      url: isDataUrl ? file : file,
      secure_url: isDataUrl ? file : file,
      folder,
      tags: [...tags, 'uploaded'],
      aspect_ratio: '16:9',
      description: `Uploaded asset in ${folder}`,
    };

    return NextResponse.json({
      success: true,
      asset: newAsset,
      note: 'Processed in CloudPix sandbox mode. Provide API Key & Secret in settings for persistent direct cloud storage.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to upload asset to Cloudinary' },
      { status: 500 }
    );
  }
}
