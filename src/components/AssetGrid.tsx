'use client';

import React from 'react';
import { CloudinaryAsset } from '@/types/cloudinary';
import { formatBytes } from '@/lib/cloudinary';
import { Sparkles, Info, Copy, Download, Check } from 'lucide-react';
import { useToast } from './Toast';

interface AssetGridProps {
  assets: CloudinaryAsset[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onInspect: (asset: CloudinaryAsset) => void;
  onOpenStudio: (asset: CloudinaryAsset) => void;
}

export function AssetGrid({
  assets,
  selectedIds,
  onToggleSelect,
  onInspect,
  onOpenStudio,
}: AssetGridProps) {
  const { toast } = useToast();

  const handleCopyUrl = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    toast('CDN URL copied to clipboard', 'success');
  };

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground mb-3">
          <Info className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">No assets found</h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          No media matches your current folder or search query. Try adjusting your filters or upload a new asset.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {assets.map((asset) => {
        const isSelected = selectedIds.includes(asset.id);
        const imageUrl = asset.secure_url || asset.url;

        return (
          <div
            key={asset.id}
            onClick={() => onInspect(asset)}
            className={`group relative rounded-lg border bg-card overflow-hidden cursor-pointer transition-all hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md ${
              isSelected ? 'ring-2 ring-primary border-primary' : 'border-border'
            }`}
          >
            {/* Thumbnail Box */}
            <div className="relative aspect-[4/3] w-full bg-checkered overflow-hidden border-b border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={asset.filename}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />

              {/* Selection Checkbox */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(asset.id);
                }}
                className={`absolute top-2.5 left-2.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-black/40 border-white/40 text-transparent opacity-0 group-hover:opacity-100 hover:bg-black/60'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </button>

              {/* Hover Overlay with Quick Actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-3 pointer-events-none">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenStudio(asset);
                  }}
                  className="pointer-events-auto p-2 rounded-md bg-card/90 backdrop-blur-xs text-foreground hover:bg-card hover:text-primary transition-all shadow-sm"
                  title="Open in Transformation Studio"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCopyUrl(e, imageUrl)}
                  className="pointer-events-auto p-2 rounded-md bg-card/90 backdrop-blur-xs text-foreground hover:bg-card transition-all shadow-sm"
                  title="Copy CDN URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <a
                  href={imageUrl}
                  download={asset.filename}
                  onClick={(e) => e.stopPropagation()}
                  className="pointer-events-auto p-2 rounded-md bg-card/90 backdrop-blur-xs text-foreground hover:bg-card transition-all shadow-sm"
                  title="Download Asset"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>

              {/* Format Badge */}
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono uppercase text-white/90">
                {asset.format}
              </div>
            </div>

            {/* Asset Metadata Footer */}
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-medium text-foreground truncate">{asset.filename}</h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium shrink-0">
                  {asset.folder}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-0.5">
                <span>
                  {asset.width}&times;{asset.height}
                </span>
                <span>{formatBytes(asset.bytes)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
