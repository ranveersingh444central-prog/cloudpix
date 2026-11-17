import { CloudinaryAsset, TransformationOptions } from '@/types/cloudinary';
import { DEFAULT_CLOUD_NAME } from './constants';

/**
 * Builds a dynamic, production-ready Cloudinary URL from transformation options
 */
export function buildCloudinaryUrl(
  asset: CloudinaryAsset | string,
  options: Partial<TransformationOptions>,
  cloudName: string = DEFAULT_CLOUD_NAME
): string {
  const publicId = typeof asset === 'string' ? asset : asset.public_id;
  const parts: string[] = [];

  // Cropping and Sizing
  if (options.crop) {
    parts.push(`c_${options.crop}`);
  }
  if (options.gravity && options.crop && ['fill', 'crop', 'thumb', 'pad', 'fill_pad'].includes(options.crop)) {
    parts.push(`g_${options.gravity}`);
  }
  if (options.width) {
    parts.push(`w_${options.width}`);
  }
  if (options.height) {
    parts.push(`h_${options.height}`);
  }

  // Delivery Optimization
  if (options.format) {
    parts.push(`f_${options.format}`);
  }
  if (options.quality) {
    parts.push(`q_${options.quality}`);
  }

  // Styling & Enhancements
  if (options.radius) {
    parts.push(`r_${options.radius}`);
  }
  if (options.background) {
    parts.push(`b_${options.background}`);
  }
  if (options.angle) {
    parts.push(`a_${options.angle}`);
  }
  if (options.dpr && options.dpr !== '1.0') {
    parts.push(`dpr_${options.dpr}`);
  }

  // Visual Effects
  if (options.effect && options.effect !== 'none') {
    if (options.effect === 'sharpen' && options.effectValue) {
      parts.push(`e_sharpen:${options.effectValue}`);
    } else if (options.effect === 'blur' && options.effectValue) {
      parts.push(`e_blur:${options.effectValue}`);
    } else {
      parts.push(`e_${options.effect}`);
    }
  }

  // Watermark / Text Overlay
  if (options.overlayText && options.overlayText.trim().length > 0) {
    const textEncoded = encodeURIComponent(options.overlayText.trim());
    const opacity = options.overlayOpacity ?? 80;
    const position = options.overlayPosition ?? 'south_east';
    parts.push(`l_text:Arial_28_bold:${textEncoded},o_${opacity},g_${position},x_24,y_24`);
  }

  const transformString = parts.length > 0 ? parts.join(',') : '';

  // Clean path format
  const sanitizedPublicId = publicId.replace(/^\//, '');
  
  if (transformString) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${sanitizedPublicId}`;
  }

  return `https://res.cloudinary.com/${cloudName}/image/upload/${sanitizedPublicId}`;
}

/**
 * Formats raw bytes to human-readable string (KB, MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Estimates transformed file size and reduction percentage
 */
export function estimateSavings(
  originalBytes: number,
  originalWidth: number,
  originalHeight: number,
  options: Partial<TransformationOptions>
): { estimatedBytes: number; savingsPercent: number } {
  let scaleFactor = 1.0;

  // Resolution reduction ratio
  if (options.width && originalWidth > 0) {
    const targetWidth = options.width;
    const targetHeight = options.height || (originalHeight * (targetWidth / originalWidth));
    const targetPixels = targetWidth * targetHeight;
    const originalPixels = originalWidth * originalHeight;
    if (targetPixels < originalPixels) {
      scaleFactor = Math.min(1.0, (targetPixels / originalPixels) * 1.05);
    }
  }

  // Compression efficiency from modern formats and quality
  let compressionFactor = 0.85; // default base compression
  if (options.format === 'avif' || options.format === 'auto') {
    compressionFactor *= 0.65; // AVIF/auto gives ~35% extra compression
  } else if (options.format === 'webp') {
    compressionFactor *= 0.75; // WebP gives ~25% extra compression
  }

  if (options.quality === 'auto:eco' || options.quality === 'auto:low') {
    compressionFactor *= 0.70;
  } else if (options.quality === 'auto:good' || options.quality === 'auto') {
    compressionFactor *= 0.82;
  }

  const estimatedBytes = Math.max(12000, Math.round(originalBytes * scaleFactor * compressionFactor));
  const savingsPercent = Math.max(0, Math.min(96, Math.round(((originalBytes - estimatedBytes) / originalBytes) * 100)));

  return { estimatedBytes, savingsPercent };
}

/**
 * Generates code snippets for developer workflows
 */
export function generateCodeSnippets(
  asset: CloudinaryAsset,
  url: string,
  options: Partial<TransformationOptions>,
  cloudName: string = DEFAULT_CLOUD_NAME
) {
  const alt = asset.description || asset.filename;
  const width = options.width || asset.width;
  const height = options.height || asset.height;

  // 1. Plain HTML
  const html = `<img
  src="${url}"
  alt="${alt}"
  width="${width}"
  height="${height}"
  loading="lazy"
  decoding="async"
/>`;

  // 2. Next.js Image Component
  const nextjs = `import Image from 'next/image';

<Image
  src="${url}"
  alt="${alt}"
  width={${width}}
  height={${height}}
  priority={false}
  className="rounded-lg object-cover"
/>`;

  // 3. React Cloudinary CldImage
  const cldProps: string[] = [
    `src="${asset.public_id}"`,
    `width="${width}"`,
    `height="${height}"`,
    `cloudName="${cloudName}"`,
  ];
  if (options.crop) cldProps.push(`crop="${options.crop}"`);
  if (options.gravity && options.gravity !== 'center') cldProps.push(`gravity="${options.gravity}"`);
  if (options.radius) cldProps.push(`radius="${options.radius}"`);
  if (options.effect && options.effect !== 'none') cldProps.push(`effects={[{ ${options.effect}: true }]}`);

  const reactCld = `<CldImage
  ${cldProps.join('\n  ')}
  alt="${alt}"
/>`;

  // 4. Markdown
  const markdown = `![${alt}](${url})`;

  return {
    url,
    html,
    nextjs,
    reactCld,
    markdown,
  };
}
