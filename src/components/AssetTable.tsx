'use client';

import React from 'react';
import { CloudinaryAsset } from '@/types/cloudinary';
import { formatBytes } from '@/lib/cloudinary';
import { Sparkles, Info, Copy, Download, Check, ExternalLink } from 'lucide-react';
import { useToast } from './Toast';

interface AssetTableProps {
  assets: CloudinaryAsset[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onInspect: (asset: CloudinaryAsset) => void;
  onOpenStudio: (asset: CloudinaryAsset) => void;
}

export function AssetTable({
  assets,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onInspect,
  onOpenStudio,
}: AssetTableProps) {
  const { toast } = useToast();
  const allSelected = assets.length > 0 && selectedIds.length === assets.length;

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
          No media matches your current folder or search query.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 border-b border-border text-[11px] font-medium text-muted-foreground uppercase tracking-wider select-none">
            <tr>
              <th className="w-10 px-3 py-2.5 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-border accent-primary cursor-pointer"
                />
              </th>
              <th className="w-12 py-2.5">Preview</th>
              <th className="px-3 py-2.5">Asset / Public ID</th>
              <th className="px-3 py-2.5">Format</th>
              <th className="px-3 py-2.5">Dimensions</th>
              <th className="px-3 py-2.5">Size</th>
              <th className="px-3 py-2.5">Folder</th>
              <th className="px-3 py-2.5">Created</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono">
            {assets.map((asset) => {
              const isSelected = selectedIds.includes(asset.id);
              const imageUrl = asset.secure_url || asset.url;

              return (
                <tr
                  key={asset.id}
                  onClick={() => onInspect(asset)}
                  className={`cursor-pointer transition-colors hover:bg-muted/30 group ${
                    isSelected ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(asset.id)}
                      className="rounded border-border accent-primary cursor-pointer"
                    />
                  </td>
                  <td className="py-2">
                    <div className="w-10 h-10 rounded border border-border bg-checkered overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={asset.filename}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-sans font-medium text-foreground text-xs">{asset.filename}</div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                      {asset.public_id}
                    </div>
                  </td>
                  <td className="px-3 py-2 uppercase text-muted-foreground text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-medium">
                      {asset.format}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-[11px]">
                    {asset.width}&times;{asset.height}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-[11px]">
                    {formatBytes(asset.bytes)}
                  </td>
                  <td className="px-3 py-2 font-sans text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px]">
                      {asset.folder}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[11px] text-muted-foreground">
                    {new Date(asset.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => onOpenStudio(asset)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                        title="Open in Transformation Studio"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleCopyUrl(e, imageUrl)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy CDN URL"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={imageUrl}
                        download={asset.filename}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Download Asset"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
