'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  CloudinaryAsset, 
  TransformationOptions, 
  CloudinaryConfig,
  CropGravity,
  DeliveryFormat,
  VisualEffect
} from '@/types/cloudinary';
import { TRANSFORMATION_PRESETS } from '@/lib/constants';
import { buildCloudinaryUrl, formatBytes, estimateSavings, generateCodeSnippets, getAssetDeliveryUrls } from '@/lib/cloudinary';
import { 
  Sliders, 
  Sparkles, 
  Download, 
  Copy, 
  ExternalLink, 
  Maximize2, 
  RefreshCcw, 
  Split, 
  Check, 
  Code2, 
  Crop as CropIcon, 
  Zap, 
  Layers,
  Info
} from 'lucide-react';
import { useToast } from './Toast';

interface TransformationStudioProps {
  asset: CloudinaryAsset;
  config: CloudinaryConfig;
  onClose?: () => void;
}

const DEFAULT_OPTIONS: TransformationOptions = {
  width: 1200,
  height: 800,
  crop: 'fill',
  gravity: 'auto',
  format: 'auto',
  quality: 'auto',
  radius: undefined,
  effect: 'none',
  effectValue: 60,
  overlayText: '',
  overlayPosition: 'south_east',
  overlayOpacity: 75,
  background: undefined,
  dpr: 'auto',
};

export function TransformationStudio({
  asset,
  config,
}: TransformationStudioProps) {
  const { toast } = useToast();
  const [options, setOptions] = useState<TransformationOptions>(DEFAULT_OPTIONS);
  const [activeTab, setActiveTab] = useState<'presets' | 'geometry' | 'optimization' | 'effects' | 'export'>('geometry');
  const [viewMode, setViewMode] = useState<'slider' | 'side' | 'single'>('slider');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [copiedCodeTab, setCopiedCodeTab] = useState<string | null>(null);
  const [selectedSnippet, setSelectedSnippet] = useState<'url' | 'html' | 'nextjs' | 'reactCld' | 'markdown'>('url');
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  // Initialize dimensions matching original aspect ratio
  useEffect(() => {
    if (asset) {
      setOptions((prev) => ({
        ...prev,
        width: Math.min(1200, asset.width),
        height: Math.round(Math.min(1200, asset.width) * (asset.height / asset.width)),
      }));
    }
  }, [asset]);

  // Progressive delivery URLs for robust preview across all formats including AVIF
  const deliveryUrls = useMemo(() => getAssetDeliveryUrls(asset), [asset]);
  const transformedUrl = buildCloudinaryUrl(asset, options, config.cloudName);
  const [originalDisplaySrc, setOriginalDisplaySrc] = useState(deliveryUrls.fallbackUrl);
  const [transformedDisplaySrc, setTransformedDisplaySrc] = useState(transformedUrl);

  useEffect(() => {
    setOriginalDisplaySrc(deliveryUrls.fallbackUrl);
  }, [deliveryUrls]);

  useEffect(() => {
    setTransformedDisplaySrc(transformedUrl);
  }, [transformedUrl]);

  // Calculate live savings
  const savings = estimateSavings(asset.bytes, asset.width, asset.height, options);

  // Code snippets
  const snippets = generateCodeSnippets(asset, transformedUrl, options, config.cloudName);

  // Handle slider drag
  const handleSliderMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDraggingSlider(true);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSlider) {
        handleSliderMove(e.clientX);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingSlider && e.touches[0]) {
        handleSliderMove(e.touches[0].clientX);
      }
    };
    const handleGlobalMouseUp = () => setIsDraggingSlider(false);

    if (isDraggingSlider) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDraggingSlider]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeTab(label);
    toast(`Copied ${label} to clipboard`, 'success');
    setTimeout(() => setCopiedCodeTab(null), 2000);
  };

  const applyPreset = (presetId: string) => {
    const preset = TRANSFORMATION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setOptions((prev) => ({
      ...prev,
      ...preset.options,
    }));
    toast(`Applied preset: ${preset.name}`, 'info');
  };

  const resetTransformations = () => {
    setOptions({
      ...DEFAULT_OPTIONS,
      width: Math.min(1200, asset.width),
      height: Math.round(Math.min(1200, asset.width) * (asset.height / asset.width)),
    });
    toast('Transformations reset to defaults', 'info');
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-4rem)] border-t border-border bg-background">
      {/* LEFT STAGE: Visual Preview & Split Slider (65% width on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-border bg-muted/10">
        {/* Stage Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/60 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-medium truncate max-w-[200px] text-foreground">{asset.filename}</span>
            <span className="font-mono text-muted-foreground hidden sm:inline">
              Orig: {asset.width}&times;{asset.height} &bull; {formatBytes(asset.bytes)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center p-0.5 rounded-md bg-muted border border-border">
              <button
                onClick={() => setViewMode('slider')}
                title="Interactive Split Slider (Before vs After)"
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${
                  viewMode === 'slider' ? 'bg-card text-foreground shadow-xs font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Split className="w-3 h-3" />
                <span className="hidden sm:inline">Split</span>
              </button>
              <button
                onClick={() => setViewMode('side')}
                title="Side by Side"
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${
                  viewMode === 'side' ? 'bg-card text-foreground shadow-xs font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span className="hidden sm:inline">Side-by-Side</span>
              </button>
              <button
                onClick={() => setViewMode('single')}
                title="Transformed Only"
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${
                  viewMode === 'single' ? 'bg-card text-foreground shadow-xs font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Single</span>
              </button>
            </div>

            <button
              onClick={resetTransformations}
              title="Reset transformations"
              className="p-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Interactive Canvas */}
        <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden select-none">
          {viewMode === 'slider' && (
            <div
              ref={sliderContainerRef}
              className="relative max-w-full max-h-[70vh] rounded-lg overflow-hidden shadow-lg border border-border bg-checkered cursor-ew-resize group"
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
            >
              {/* After (Transformed) Image - Base layer */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={transformedDisplaySrc}
                alt="Transformed"
                onError={() => setTransformedDisplaySrc(deliveryUrls.fallbackUrl)}
                className="block max-h-[68vh] w-auto max-w-full object-contain pointer-events-none"
              />

              {/* Before (Original) Image - Clipped layer */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalDisplaySrc}
                  alt="Original"
                  onError={() => setOriginalDisplaySrc(deliveryUrls.fallbackUrl)}
                  className="block max-h-[68vh] w-auto max-w-full object-contain"
                />
              </div>

              {/* Draggable Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-sm"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center text-[10px] font-bold">
                  &#8644;
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-white/90">
                Original
              </div>
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-primary/90 backdrop-blur-xs text-[10px] font-mono text-white">
                Transformed ({options.format.toUpperCase()})
              </div>
            </div>
          )}

          {viewMode === 'side' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl">
              <div className="border border-border rounded-lg p-2 bg-card flex flex-col items-center">
                <div className="w-full flex items-center justify-between text-[11px] font-mono text-muted-foreground pb-2 px-1">
                  <span>Original</span>
                  <span>{formatBytes(asset.bytes)}</span>
                </div>
                <div className="w-full h-80 rounded bg-checkered flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={originalDisplaySrc} alt="Original" onError={() => setOriginalDisplaySrc(deliveryUrls.fallbackUrl)} className="max-h-full object-contain" />
                </div>
              </div>
              <div className="border border-border rounded-lg p-2 bg-card flex flex-col items-center">
                <div className="w-full flex items-center justify-between text-[11px] font-mono text-muted-foreground pb-2 px-1">
                  <span className="text-primary font-medium">Transformed</span>
                  <span className="text-emerald-500 font-medium">~{formatBytes(savings.estimatedBytes)}</span>
                </div>
                <div className="w-full h-80 rounded bg-checkered flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={transformedDisplaySrc} alt="Transformed" onError={() => setTransformedDisplaySrc(deliveryUrls.fallbackUrl)} className="max-h-full object-contain" />
                </div>
              </div>
            </div>
          )}

          {viewMode === 'single' && (
            <div className="max-w-full max-h-[70vh] rounded-lg overflow-hidden shadow-lg border border-border bg-checkered">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={transformedDisplaySrc}
                alt="Transformed"
                onError={() => setTransformedDisplaySrc(deliveryUrls.fallbackUrl)}
                className="block max-h-[68vh] w-auto max-w-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Live Savings & Metric Pill Bar */}
        <div className="px-5 py-3 border-t border-border bg-card/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-500 font-medium font-mono">
              <Zap className="w-3.5 h-3.5" />
              {savings.savingsPercent > 0 ? `-${savings.savingsPercent}% Byte Reduction` : 'Original Size'}
            </span>
            <span className="text-muted-foreground font-mono">
              {formatBytes(asset.bytes)} &rarr; ~{formatBytes(savings.estimatedBytes)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={transformedUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open CDN URL
            </a>
            <a
              href={transformedUrl}
              download={`${asset.filename.replace(/\.[^/.]+$/, '')}-transformed.${options.format === 'auto' ? 'webp' : options.format}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          </div>
        </div>
      </div>

      {/* RIGHT CONTROLS PANEL: Precision Parameters & Snippets (35% width on desktop) */}
      <div className="w-full lg:w-[420px] flex flex-col bg-card shrink-0 h-full overflow-y-auto border-l border-border">
        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-border px-2 pt-2 gap-1 bg-muted/20">
          {[
            { id: 'geometry', label: 'Geometry', icon: CropIcon },
            { id: 'optimization', label: 'Delivery', icon: Zap },
            { id: 'effects', label: 'Effects', icon: Sparkles },
            { id: 'presets', label: 'Presets', icon: Sliders },
            { id: 'export', label: 'Code', icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'presets' | 'geometry' | 'optimization' | 'effects' | 'export')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-foreground bg-card'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Geometry & Cropping */}
        {activeTab === 'geometry' && (
          <div className="p-5 space-y-5">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-foreground">Crop Mode</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['fill', 'fit', 'crop', 'scale', 'pad', 'thumb'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setOptions({ ...options, crop: mode })}
                    className={`py-1.5 px-2 rounded-md text-xs font-mono capitalize border transition-all ${
                      options.crop === mode
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    c_{mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Gravity / Focal Point */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-foreground">Gravity & AI Focal Point</label>
                <span className="text-[10px] text-muted-foreground font-mono">g_{options.gravity}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'center', label: 'Center' },
                  { id: 'face', label: 'Face AI' },
                  { id: 'auto', label: 'Subject AI' },
                  { id: 'faces', label: 'Multi-Face' },
                  { id: 'north', label: 'Top' },
                  { id: 'south', label: 'Bottom' },
                  { id: 'east', label: 'Right' },
                  { id: 'west', label: 'Left' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOptions({ ...options, gravity: item.id as CropGravity })}
                    className={`py-1.5 px-2 rounded-md text-xs border text-center transition-all ${
                      options.gravity === item.id
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-foreground">Dimensions (px)</label>
                <div className="flex items-center gap-1">
                  {[
                    { label: '1:1', w: 800, h: 800 },
                    { label: '16:9', w: 1280, h: 720 },
                    { label: '4:5', w: 800, h: 1000 },
                    { label: '4:3', w: 1024, h: 768 },
                  ].map((ratio) => (
                    <button
                      key={ratio.label}
                      type="button"
                      onClick={() => setOptions({ ...options, width: ratio.w, height: ratio.h })}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground font-mono"
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-muted-foreground mb-1 block">Width</span>
                  <input
                    type="number"
                    value={options.width || ''}
                    onChange={(e) => setOptions({ ...options, width: parseInt(e.target.value) || undefined })}
                    placeholder="Width"
                    className="w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground mb-1 block">Height</span>
                  <input
                    type="number"
                    value={options.height || ''}
                    onChange={(e) => setOptions({ ...options, height: parseInt(e.target.value) || undefined })}
                    placeholder="Height"
                    className="w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Corner Radius */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-foreground">Border Radius</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, radius: undefined })}
                  className={`py-1.5 px-2 rounded-md text-xs border text-center transition-all ${
                    options.radius === undefined
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sharp (0)
                </button>
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, radius: 24 })}
                  className={`py-1.5 px-2 rounded-md text-xs border text-center transition-all ${
                    options.radius === 24
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Smooth (24px)
                </button>
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, radius: 'max' })}
                  className={`py-1.5 px-2 rounded-md text-xs border text-center transition-all ${
                    options.radius === 'max'
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Circle (max)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Optimization & Delivery */}
        {activeTab === 'optimization' && (
          <div className="p-5 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-foreground">Delivery Format</label>
                <span className="text-[10px] text-muted-foreground font-mono">f_{options.format}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'auto', label: 'Auto (f_auto)' },
                  { id: 'avif', label: 'AVIF' },
                  { id: 'webp', label: 'WebP' },
                  { id: 'png', label: 'PNG' },
                  { id: 'jpg', label: 'JPG' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setOptions({ ...options, format: fmt.id as DeliveryFormat })}
                    className={`py-1.5 px-2 rounded-md text-xs border text-center transition-all ${
                      options.format === fmt.id
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                <code className="text-foreground font-mono">f_auto</code> serves AVIF to modern browsers and falls back to WebP/JPEG automatically.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-foreground">Quality Compression</label>
                <span className="text-[10px] text-muted-foreground font-mono">q_{options.quality}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'auto', label: 'q_auto (Balanced)' },
                  { id: 'auto:best', label: 'q_auto:best (Retina)' },
                  { id: 'auto:good', label: 'q_auto:good (Web standard)' },
                  { id: 'auto:eco', label: 'q_auto:eco (Lightweight)' },
                ].map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setOptions({ ...options, quality: q.id as TransformationOptions['quality'] })}
                    className={`py-1.5 px-2 rounded-md text-xs border text-center transition-all ${
                      options.quality === q.id
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-foreground">Device Pixel Ratio (DPR)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {['auto', '1.0', '2.0', '3.0'].map((dprVal) => (
                  <button
                    key={dprVal}
                    type="button"
                    onClick={() => setOptions({ ...options, dpr: dprVal as TransformationOptions['dpr'] })}
                    className={`py-1.5 px-2 rounded-md text-xs font-mono border text-center transition-all ${
                      options.dpr === dprVal
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    dpr_{dprVal}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Visual Effects & Watermark */}
        {activeTab === 'effects' && (
          <div className="p-5 space-y-5">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-foreground">Visual Enhancements</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'none', label: 'None' },
                  { id: 'sharpen', label: 'Sharpen (e_sharpen)' },
                  { id: 'grayscale', label: 'Grayscale (e_grayscale)' },
                  { id: 'sepia', label: 'Sepia (e_sepia)' },
                  { id: 'blur', label: 'Gaussian Blur (e_blur)' },
                  { id: 'background_removal', label: 'AI BG Removal' },
                ].map((eff) => (
                  <button
                    key={eff.id}
                    type="button"
                    onClick={() => setOptions({ ...options, effect: eff.id as VisualEffect })}
                    className={`py-1.5 px-2 rounded-md text-xs border text-center transition-all ${
                      options.effect === eff.id
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {eff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Watermarking / Text Overlay */}
            <div className="pt-2 border-t border-border">
              <label className="block text-xs font-medium mb-1.5 text-foreground">Watermark / Overlay Text</label>
              <input
                type="text"
                value={options.overlayText || ''}
                onChange={(e) => setOptions({ ...options, overlayText: e.target.value })}
                placeholder="e.g. CloudPix Studio"
                className="w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary mb-2"
              />

              {options.overlayText && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground mb-1 block">Position</span>
                    <select
                      value={options.overlayPosition || 'south_east'}
                      onChange={(e) => setOptions({ ...options, overlayPosition: e.target.value as TransformationOptions['overlayPosition'] })}
                      className="w-full px-2 py-1 bg-background border border-border rounded-md text-xs"
                    >
                      <option value="south_east">Bottom Right</option>
                      <option value="south_west">Bottom Left</option>
                      <option value="north">Top Center</option>
                      <option value="center">Center</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground mb-1 block">
                      Opacity: {options.overlayOpacity || 75}%
                    </span>
                    <input
                      type="range"
                      min={20}
                      max={100}
                      value={options.overlayOpacity || 75}
                      onChange={(e) => setOptions({ ...options, overlayOpacity: parseInt(e.target.value) })}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: 1-Click Presets */}
        {activeTab === 'presets' && (
          <div className="p-5 space-y-3">
            <p className="text-xs text-muted-foreground mb-1">
              Curated production transformations for web, social, and e-commerce workflows:
            </p>
            {TRANSFORMATION_PRESETS.map((preset) => (
              <div
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className="p-3 border border-border rounded-lg bg-background hover:border-primary/50 hover:bg-muted/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                    {preset.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase font-mono">
                    {preset.category}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">{preset.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: Code Export & Snippets */}
        {activeTab === 'export' && (
          <div className="p-5 space-y-4">
            <div className="flex p-0.5 rounded-md bg-muted border border-border text-xs font-mono">
              {[
                { id: 'url', label: 'URL' },
                { id: 'html', label: 'HTML' },
                { id: 'nextjs', label: 'Next.js' },
                { id: 'reactCld', label: 'React' },
                { id: 'markdown', label: 'MD' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedSnippet(fmt.id as 'url' | 'html' | 'nextjs' | 'reactCld' | 'markdown')}
                  className={`flex-1 py-1 rounded text-center transition-all ${
                    selectedSnippet === fmt.id
                      ? 'bg-card text-foreground font-medium shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <pre className="p-3 rounded-lg bg-muted/60 border border-border text-[11px] font-mono text-foreground overflow-x-auto whitespace-pre-wrap max-h-60">
                {snippets[selectedSnippet]}
              </pre>
              <button
                onClick={() => copyToClipboard(snippets[selectedSnippet], selectedSnippet)}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-xs"
                title="Copy snippet"
              >
                {copiedCodeTab === selectedSnippet ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="text-[11px] text-muted-foreground p-3 rounded-lg border border-border bg-muted/20 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-primary mt-0.5" />
              <span>
                CloudPix dynamically constructs deterministic Cloudinary URLs. All transformations execute and cache on Cloudinary&apos;s global CDN edge nodes upon first request.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
