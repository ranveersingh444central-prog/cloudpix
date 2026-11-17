'use client';

import React from 'react';
import { 
  LayoutGrid, 
  List, 
  Upload, 
  Search, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Layers, 
  Terminal,
  Sparkles,
  Cloud
} from 'lucide-react';
import { VerificationResult, CloudinaryConfig } from '@/types/cloudinary';

interface HeaderProps {
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
  onOpenUpload: () => void;
  onOpenConnection: () => void;
  onOpenCommandPalette: () => void;
  verification: VerificationResult | null;
  config: CloudinaryConfig;
  activeFolder: string;
  assetCount: number;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenStudioFromHeader?: () => void;
}

export function Header({
  viewMode,
  setViewMode,
  onOpenUpload,
  onOpenConnection,
  onOpenCommandPalette,
  verification,
  config,
  activeFolder,
  assetCount,
  darkMode,
  setDarkMode,
  onOpenStudioFromHeader,
}: HeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Brand & Context */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs tracking-tighter shadow-xs">
            <Cloud className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground">CloudPix</span>
        </div>

        <div className="hidden md:flex items-center text-xs text-muted-foreground gap-1.5 font-mono">
          <span className="text-border">/</span>
          <span className="text-foreground">{activeFolder}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-muted text-[10px] text-muted-foreground">
            {assetCount}
          </span>
        </div>
      </div>

      {/* Middle: Fast Search Bar & Command Palette Trigger */}
      <div className="flex-1 max-w-md mx-2 hidden sm:block">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-border bg-background/80 hover:bg-muted/50 text-xs text-muted-foreground transition-all shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Search assets, presets, commands...</span>
          </div>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono text-muted-foreground">
            <span className="text-[11px]">&part;</span>K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Cloudinary Status Pill, View Switcher & Theme */}
      <div className="flex items-center gap-2">
        {/* Cloudinary Integration Status Pill */}
        <button
          onClick={onOpenConnection}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted/60 text-xs transition-colors"
          title="Verify Cloudinary Integration & API Settings"
        >
          {verification?.connected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px] hidden md:inline text-foreground">
                {config.cloudName}
              </span>
              <span className="text-[10px] text-emerald-500 font-mono hidden lg:inline">
                ({verification.latencyMs}ms)
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[11px] text-muted-foreground font-mono">Unverified</span>
            </>
          )}
        </button>

        {/* View Switcher */}
        <div className="flex items-center p-0.5 rounded-md border border-border bg-background">
          <button
            onClick={() => setViewMode('grid')}
            title="Grid View (G)"
            className={`p-1.5 rounded text-xs transition-all ${
              viewMode === 'grid'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            title="Table View (L)"
            className={`p-1.5 rounded text-xs transition-all ${
              viewMode === 'table'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-1.5 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground transition-colors"
          title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shadow-xs"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload Asset</span>
        </button>
      </div>
    </header>
  );
}
