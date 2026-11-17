'use client';

import React, { useState } from 'react';
import { CloudinaryAsset } from '@/types/cloudinary';
import { formatBytes } from '@/lib/cloudinary';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  Trash2, 
  Sparkles, 
  Tag, 
  Folder, 
  Calendar, 
  Maximize2,
  FileCode
} from 'lucide-react';
import { useToast } from './Toast';

interface AssetInspectorProps {
  asset: CloudinaryAsset | null;
  onClose: () => void;
  onOpenStudio: (asset: CloudinaryAsset) => void;
  onDeleteAsset: (assetId: string) => void;
}

export function AssetInspector({
  asset,
  onClose,
  onOpenStudio,
  onDeleteAsset,
}: AssetInspectorProps) {
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!asset) return null;

  const copyValue = (value: string, key: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    toast(`Copied ${label}`, 'success');
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDeleteAsset(asset.id);
    toast(`Deleted ${asset.filename}`, 'info');
    onClose();
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-primary shrink-0" />
          <h2 className="text-sm font-semibold truncate tracking-tight text-foreground">{asset.filename}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Visual Preview */}
        <div className="relative rounded-lg overflow-hidden border border-border bg-checkered flex items-center justify-center p-2 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset.secure_url || asset.url}
            alt={asset.filename}
            className="max-h-56 w-auto object-contain rounded"
          />
          <a
            href={asset.secure_url || asset.url}
            target="_blank"
            rel="noreferrer"
            className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            title="Open original in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Quick Launch Studio CTA */}
        <button
          onClick={() => onOpenStudio(asset)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shadow-xs"
        >
          <Sparkles className="w-4 h-4" />
          Launch in Transformation Studio
        </button>

        {/* Technical Properties Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Technical Metadata
          </h3>

          <div className="rounded-lg border border-border divide-y divide-border text-xs">
            {/* Format & Dimensions */}
            <div className="flex items-center justify-between p-2.5">
              <span className="text-muted-foreground">Dimensions</span>
              <span className="font-mono font-medium text-foreground">
                {asset.width} &times; {asset.height} px ({asset.aspect_ratio})
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5">
              <span className="text-muted-foreground">Format & Size</span>
              <span className="font-mono font-medium text-foreground">
                {asset.format.toUpperCase()} &bull; {formatBytes(asset.bytes)}
              </span>
            </div>

            {/* Public ID */}
            <div className="flex items-center justify-between p-2.5">
              <span className="text-muted-foreground">Public ID</span>
              <button
                onClick={() => copyValue(asset.public_id, 'public_id', 'Public ID')}
                className="flex items-center gap-1.5 font-mono text-xs hover:text-primary transition-colors text-right max-w-[220px] truncate"
              >
                <span className="truncate">{asset.public_id}</span>
                {copiedKey === 'public_id' ? (
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                ) : (
                  <Copy className="w-3 h-3 text-muted-foreground shrink-0" />
                )}
              </button>
            </div>

            {/* Folder */}
            <div className="flex items-center justify-between p-2.5">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5" />
                Folder
              </span>
              <span className="font-medium text-foreground">{asset.folder}</span>
            </div>

            {/* Created */}
            <div className="flex items-center justify-between p-2.5">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Created
              </span>
              <span className="font-mono text-muted-foreground">
                {new Date(asset.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Color Palette Extraction */}
        {asset.dominant_colors && asset.dominant_colors.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Dominant Palette
            </h3>
            <div className="flex items-center gap-2">
              {asset.dominant_colors.map((hex, index) => (
                <button
                  key={index}
                  onClick={() => copyValue(hex, `hex-${index}`, `HEX ${hex}`)}
                  className="flex-1 h-9 rounded-md border border-border relative group flex items-center justify-center transition-transform hover:scale-105"
                  style={{ backgroundColor: hex }}
                  title={`Click to copy: ${hex}`}
                >
                  <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100 px-1 py-0.5 rounded bg-black/80 text-white transition-opacity">
                    {copiedKey === `hex-${index}` ? '✓' : hex}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {asset.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-muted border border-border text-[11px] font-mono text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Action Buttons */}
      <div className="p-4 border-t border-border bg-card/60 flex items-center justify-between gap-2">
        <button
          onClick={handleDelete}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
            confirmDelete
              ? 'bg-rose-500/10 border-rose-500 text-rose-500 hover:bg-rose-500/20'
              : 'border-border text-muted-foreground hover:text-rose-500 hover:border-rose-500/30'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          {confirmDelete ? 'Confirm Delete?' : 'Delete'}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => copyValue(asset.secure_url || asset.url, 'cdn_url', 'CDN URL')}
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium text-foreground transition-colors flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy URL
          </button>
          <a
            href={asset.secure_url || asset.url}
            download={asset.filename}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
