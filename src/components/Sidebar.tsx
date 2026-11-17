'use client';

import React from 'react';
import { 
  Folder, 
  Sparkles, 
  ShieldCheck, 
  Filter, 
  HardDrive, 
  Zap, 
  Settings, 
  RefreshCw,
  Info
} from 'lucide-react';
import { FOLDERS, FORMATS } from '@/lib/constants';
import { CloudinaryConfig, VerificationResult } from '@/types/cloudinary';
import { formatBytes } from '@/lib/cloudinary';

interface SidebarProps {
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  activeFormat: string;
  setActiveFormat: (format: string) => void;
  totalAssetsCount: number;
  totalBytes: number;
  config: CloudinaryConfig;
  verification: VerificationResult | null;
  onOpenConnection: () => void;
  onVerifyNow: () => void;
  isVerifying: boolean;
  onOpenStudio: () => void;
}

export function Sidebar({
  activeFolder,
  setActiveFolder,
  activeFormat,
  setActiveFormat,
  totalAssetsCount,
  totalBytes,
  config,
  verification,
  onOpenConnection,
  onVerifyNow,
  isVerifying,
  onOpenStudio,
}: SidebarProps) {
  const isDemo = config.isDemoMode || config.cloudName === 'demo';

  return (
    <aside className="w-64 border-r border-border bg-card/50 flex flex-col shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 select-none">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Transformation Studio CTA */}
        <div>
          <button
            onClick={onOpenStudio}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/15 transition-all group shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>Transformation Studio</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/20 text-primary font-bold">
              CDN
            </span>
          </button>
        </div>

        {/* Folders Navigation */}
        <div className="space-y-1">
          <div className="px-2 pb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Folders</span>
            <Folder className="w-3.5 h-3.5 text-muted-foreground" />
          </div>

          {FOLDERS.map((folder) => {
            const isActive = activeFolder === folder;
            return (
              <button
                key={folder}
                onClick={() => setActiveFolder(folder)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  isActive
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="truncate">{folder}</span>
                </div>
                {folder === 'All' && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {isDemo ? `Demo: ${totalAssetsCount}` : totalAssetsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Format Filter Chips */}
        <div className="space-y-1">
          <div className="px-2 pb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Formats</span>
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-3 gap-1 px-1">
            {FORMATS.map((fmt) => {
              const isActive = activeFormat === fmt;
              return (
                <button
                  key={fmt}
                  onClick={() => setActiveFormat(fmt)}
                  className={`py-1 px-1.5 rounded text-[11px] font-mono uppercase text-center transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {fmt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Storage / Library Statistics - Clearly distinguished between Demo Catalog and Personal Cloud Storage */}
        <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span>{isDemo ? 'Demo Catalog' : 'Account Storage'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isDemo ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              {isDemo ? 'Sandbox' : 'Personal'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" /> 
              {isDemo ? 'Sample Data' : 'Cloud Storage'}
            </span>
            <span className="font-mono text-foreground font-medium">
              {!isDemo && verification?.details?.storageFormatted 
                ? verification.details.storageFormatted 
                : formatBytes(totalBytes)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> CDN Delivery
            </span>
            <span className="font-mono text-emerald-500 font-medium">
              {isDemo ? 'demo.cdn' : 'Active'}
            </span>
          </div>

          {isDemo && (
            <div className="pt-1.5 border-t border-border/60 text-[10px] text-muted-foreground flex items-start gap-1.5 leading-tight">
              <Info className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              <span>Stats reflect preloaded Cloudinary sample assets, not personal cloud usage.</span>
            </div>
          )}
        </div>
      </div>

      {/* Cloudinary Integration Status Card at Footer of Sidebar */}
      <div className="p-3 border-t border-border bg-card/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className={`w-4 h-4 ${isDemo ? 'text-amber-500' : 'text-emerald-500'}`} />
            <span className="text-xs font-semibold text-foreground">
              {isDemo ? 'Demo Mode' : 'Personal Cloud'}
            </span>
          </div>
          <button
            onClick={onOpenConnection}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Configure Cloudinary"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-2.5 rounded-md bg-muted/40 border border-border text-[11px] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Cloud:</span>
            <span className="font-mono text-foreground font-medium truncate max-w-[120px]">
              {config.cloudName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Latency:</span>
            <span className="font-mono text-emerald-500 font-medium">
              {verification?.connected ? `${verification.latencyMs}ms` : '—'}
            </span>
          </div>

          <button
            onClick={onVerifyNow}
            disabled={isVerifying}
            className="w-full mt-1 py-1 px-2 rounded bg-background border border-border hover:bg-muted text-foreground text-[10px] font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
            {isVerifying ? 'Verifying...' : 'Verify Connection'}
          </button>
        </div>
      </div>
    </aside>
  );
}
