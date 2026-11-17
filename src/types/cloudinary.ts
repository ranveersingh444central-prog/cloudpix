export type AssetFormat = 'jpg' | 'jpeg' | 'png' | 'webp' | 'avif' | 'svg' | 'gif';

export type CropMode = 'fill' | 'fit' | 'crop' | 'scale' | 'pad' | 'thumb' | 'limit' | 'fill_pad';

export type CropGravity = 'center' | 'face' | 'faces' | 'auto' | 'north' | 'south' | 'east' | 'west';

export type DeliveryFormat = 'auto' | 'webp' | 'avif' | 'png' | 'jpg';

export type VisualEffect = 
  | 'none'
  | 'sharpen'
  | 'blur'
  | 'grayscale'
  | 'sepia'
  | 'vignette'
  | 'background_removal'
  | 'contrast'
  | 'brightness';

export interface CloudinaryAsset {
  id: string;
  public_id: string;
  filename: string;
  format: string;
  version?: number;
  resource_type: 'image' | 'video' | 'raw';
  type: string;
  created_at: string;
  bytes: number;
  width: number;
  height: number;
  url: string;
  secure_url: string;
  folder: string;
  tags: string[];
  aspect_ratio: string;
  dominant_colors?: string[];
  description?: string;
}

export interface TransformationOptions {
  width?: number;
  height?: number;
  crop: CropMode;
  gravity: CropGravity;
  format: DeliveryFormat;
  quality: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low' | number;
  radius?: number | 'max';
  effect: VisualEffect;
  effectValue?: number;
  overlayText?: string;
  overlayPosition?: 'north' | 'south' | 'south_east' | 'south_west' | 'center';
  overlayOpacity?: number;
  background?: string;
  angle?: number;
  dpr?: 'auto' | '1.0' | '2.0' | '3.0';
}

export interface CloudinaryConfig {
  cloudName: string;
  apiKey?: string;
  apiSecret?: string;
  uploadPreset?: string;
  isConfigured: boolean;
  isDemoMode: boolean;
}

export interface VerificationResult {
  connected: boolean;
  cloudName: string;
  accountType: 'live' | 'demo';
  latencyMs: number;
  statusMessage: string;
  checkedAt: string;
  details?: {
    plan?: string;
    creditsUsage?: number;
    storageFormatted?: string;
    transformationsFormatted?: string;
  };
}

export interface TransformationPreset {
  id: string;
  name: string;
  description: string;
  category: 'web' | 'social' | 'ecommerce' | 'effects';
  options: Partial<TransformationOptions>;
}
