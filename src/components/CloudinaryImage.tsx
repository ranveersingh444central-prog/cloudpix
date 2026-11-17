'use client';

import React, { useState } from 'react';
import { CloudinaryAsset } from '@/types/cloudinary';
import { getAssetDeliveryUrls } from '@/lib/cloudinary';

interface CloudinaryImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  asset: CloudinaryAsset;
  options?: {
    width?: number;
    height?: number;
    crop?: string;
  };
}

export function CloudinaryImage({
  asset,
  alt,
  className,
  loading = 'lazy',
  options,
  ...props
}: CloudinaryImageProps) {
  const urls = getAssetDeliveryUrls(asset, options);
  const [currentSrc, setCurrentSrc] = useState(urls.fallbackUrl);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      // Switch to reliable fallback URL
      setCurrentSrc(urls.fallbackUrl);
    }
  };

  const isCloudinary = Boolean(asset.secure_url?.includes('res.cloudinary.com') || asset.url?.includes('res.cloudinary.com'));

  if (!isCloudinary) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={asset.secure_url || asset.url}
        alt={alt || asset.filename}
        loading={loading}
        className={className}
        {...props}
      />
    );
  }

  return (
    <picture className="w-full h-full block">
      {/* Primary source: AVIF for browsers that natively decode AVIF */}
      <source srcSet={urls.avifUrl} type="image/avif" />
      {/* Secondary source: WebP for all modern browsers */}
      <source srcSet={urls.webpUrl} type="image/webp" />
      {/* Fallback image: Auto/JPEG ensures universal compatibility */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={currentSrc}
        alt={alt || asset.filename}
        loading={loading}
        onError={handleError}
        className={className}
        {...props}
      />
    </picture>
  );
}
