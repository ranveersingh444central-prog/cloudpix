'use client';

import React, { useState, useRef } from 'react';
import { X, UploadCloud, Link as LinkIcon, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { CloudinaryAsset, CloudinaryConfig } from '@/types/cloudinary';
import { FOLDERS } from '@/lib/constants';
import { formatBytes } from '@/lib/cloudinary';
import { useToast } from './Toast';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CloudinaryConfig;
  onAssetUploaded: (newAsset: CloudinaryAsset) => void;
}

export function UploadModal({
  isOpen,
  onClose,
  config,
  onAssetUploaded,
}: UploadModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [folder, setFolder] = useState<string>('Marketing');
  const [tagsInput, setTagsInput] = useState<string>('production, web');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('Please upload an image file (JPEG, PNG, WebP, AVIF, SVG)', 'error');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast('File exceeds 15MB limit', 'error');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const tags = tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

        const res = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cloudinary-cloud-name': config.cloudName,
            ...(config.apiKey ? { 'x-cloudinary-api-key': config.apiKey } : {}),
            ...(config.apiSecret ? { 'x-cloudinary-api-secret': config.apiSecret } : {}),
          },
          body: JSON.stringify({
            file: base64Data,
            folder: folder || 'General',
            tags,
            filename: selectedFile.name.replace(/\.[^/.]+$/, ''),
          }),
        });

        const data = await res.json();
        if (res.ok && data.asset) {
          toast(`Asset '${data.asset.filename}' uploaded successfully`, 'success');
          onAssetUploaded(data.asset);
          handleClose();
        } else {
          toast(data.error || 'Upload failed', 'error');
        }
        setIsUploading(false);
      };
    } catch (err: any) {
      toast(err?.message || 'Error processing file', 'error');
      setIsUploading(false);
    }
  };

  const handleUrlUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    setIsUploading(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cloudinary-cloud-name': config.cloudName,
          ...(config.apiKey ? { 'x-cloudinary-api-key': config.apiKey } : {}),
          ...(config.apiSecret ? { 'x-cloudinary-api-secret': config.apiSecret } : {}),
        },
        body: JSON.stringify({
          file: imageUrl.trim(),
          folder: folder || 'General',
          tags,
          filename: 'imported_asset',
        }),
      });

      const data = await res.json();
      if (res.ok && data.asset) {
        toast('Asset imported successfully from URL', 'success');
        onAssetUploaded(data.asset);
        handleClose();
      } else {
        toast(data.error || 'Failed to import URL', 'error');
      }
    } catch (err: any) {
      toast(err?.message || 'Error importing URL', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageUrl('');
    setIsUploading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Upload Media Asset</h2>
              <p className="text-xs text-muted-foreground">Ingest assets directly into CloudPix DAM</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-5 pt-4">
          <div className="flex p-0.5 rounded-lg bg-muted border border-border text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-md transition-all ${
                activeTab === 'file'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              File Upload
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-md transition-all ${
                activeTab === 'url'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Import via URL
            </button>
          </div>
        </div>

        {activeTab === 'file' ? (
          <form onSubmit={handleFileUpload} className="p-5 space-y-4">
            {/* Drop Zone */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {!selectedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border/80 hover:border-border hover:bg-muted/30'
                }`}
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-foreground mb-1">
                  Click to select, or drag and drop image here
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Supports PNG, JPG, WebP, AVIF, SVG up to 15MB
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-muted/40 border border-border rounded-lg">
                {previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded object-cover border border-border"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-foreground">{selectedFile.name}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {formatBytes(selectedFile.size)} &bull; {selectedFile.type}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="p-1 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Folder & Tags */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-foreground">Target Folder</label>
                <select
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {FOLDERS.filter((f) => f !== 'All').map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-foreground">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. hero, web, marketing"
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    Upload Asset
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleUrlUpload} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-foreground">
                Public Image URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-foreground">Target Folder</label>
                <select
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {FOLDERS.filter((f) => f !== 'All').map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-foreground">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. web, external"
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!imageUrl.trim() || isUploading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-3.5 h-3.5" />
                    Import Image
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
