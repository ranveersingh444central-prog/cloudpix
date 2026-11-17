'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  CloudinaryAsset, 
  CloudinaryConfig, 
  VerificationResult 
} from '@/types/cloudinary';
import { INITIAL_ASSETS, DEFAULT_CLOUD_NAME } from '@/lib/constants';
import { ToastProvider, useToast } from '@/components/Toast';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { AssetGrid } from '@/components/AssetGrid';
import { AssetTable } from '@/components/AssetTable';
import { TransformationStudio } from '@/components/TransformationStudio';
import { AssetInspector } from '@/components/AssetInspector';
import { UploadModal } from '@/components/UploadModal';
import { ConnectionModal } from '@/components/ConnectionModal';
import { CommandPalette } from '@/components/CommandPalette';
import { ArrowLeft, Trash2, Copy, CheckSquare, Search, X } from 'lucide-react';

function CloudPixDashboard() {
  const { toast } = useToast();

  // App Configuration - Non-sensitive state only
  const [config, setConfig] = useState<CloudinaryConfig>({
    cloudName: DEFAULT_CLOUD_NAME,
    isConfigured: true,
    isDemoMode: true,
  });

  // State
  const [assets, setAssets] = useState<CloudinaryAsset[]>(INITIAL_ASSETS);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string>('All');
  const [activeFormat, setActiveFormat] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals & Panels
  const [inspectingAsset, setInspectingAsset] = useState<CloudinaryAsset | null>(null);
  const [studioAsset, setStudioAsset] = useState<CloudinaryAsset | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isConnectionOpen, setIsConnectionOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load assets based on current mode
  const loadAssets = useCallback(async (currentConfig: CloudinaryConfig) => {
    try {
      const mode = currentConfig.isDemoMode ? 'demo' : 'personal';
      const cloudParam = currentConfig.cloudName ? `&cloudName=${encodeURIComponent(currentConfig.cloudName)}` : '';
      const res = await fetch(`/api/cloudinary/assets?mode=${mode}${cloudParam}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.assets)) {
        setAssets(data.assets);
      } else if (data.assets) {
        setAssets(data.assets);
      }
    } catch {
      // Fallback to sample assets in case of offline/network failure
      if (currentConfig.isDemoMode) {
        setAssets(INITIAL_ASSETS);
      }
    }
  }, []);

  // Verification function (checks server session or env vars)
  const verifyConnection = useCallback(async (cfgToVerify: CloudinaryConfig): Promise<VerificationResult | null> => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/cloudinary/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cloudName: cfgToVerify.cloudName,
          isDemoMode: cfgToVerify.isDemoMode,
        }),
      });

      const data: VerificationResult = await res.json();
      setVerification(data);
      return data;
    } catch (err: unknown) {
      const failedResult: VerificationResult = {
        connected: false,
        cloudName: cfgToVerify.cloudName,
        accountType: cfgToVerify.isDemoMode ? 'demo' : 'live',
        latencyMs: 0,
        statusMessage: (err as Error)?.message || 'Connection test failed',
        checkedAt: new Date().toISOString(),
      };
      setVerification(failedResult);
      return failedResult;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Initialize and sanitize localStorage on mount (CRITICAL SECURITY: Strip any previous secrets)
  useEffect(() => {
    const savedConfig = localStorage.getItem('cloudpix_cloudinary_config');
    let initialConfig: CloudinaryConfig = {
      cloudName: DEFAULT_CLOUD_NAME,
      isConfigured: true,
      isDemoMode: true,
    };

    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        // SECURITY ENFORCEMENT: Remove any legacy secrets
        delete parsed.apiKey;
        delete parsed.apiSecret;

        initialConfig = {
          cloudName: parsed.cloudName || DEFAULT_CLOUD_NAME,
          uploadPreset: parsed.uploadPreset || '',
          isConfigured: parsed.isConfigured !== false,
          isDemoMode: parsed.isDemoMode !== false,
        };
        // Re-persist only safe configuration
        localStorage.setItem('cloudpix_cloudinary_config', JSON.stringify(initialConfig));
      } catch (e) {
        console.error('Failed to parse saved config', e);
      }
    }

    setConfig(initialConfig);
    verifyConnection(initialConfig);
    loadAssets(initialConfig);
  }, [verifyConnection, loadAssets]);

  // Save new configuration securely
  const handleSaveConfig = async (params: {
    cloudName: string;
    apiKey?: string;
    apiSecret?: string;
    uploadPreset?: string;
    isDemoMode: boolean;
  }): Promise<VerificationResult | null> => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/cloudinary/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data: VerificationResult = await res.json();
      setVerification(data);

      if (data.connected) {
        // SECURITY: Never save API secret to client storage
        const safeConfig: CloudinaryConfig = {
          cloudName: data.cloudName,
          uploadPreset: params.uploadPreset || '',
          isConfigured: true,
          isDemoMode: params.isDemoMode,
          hasServerCredentials: data.hasServerEnv,
        };
        setConfig(safeConfig);
        localStorage.setItem('cloudpix_cloudinary_config', JSON.stringify(safeConfig));
        // Reload assets for the newly active mode
        loadAssets(safeConfig);
      }
      return data;
    } catch (err: unknown) {
      const failedResult: VerificationResult = {
        connected: false,
        cloudName: params.cloudName,
        accountType: params.isDemoMode ? 'demo' : 'live',
        latencyMs: 0,
        statusMessage: (err as Error)?.message || 'Connection test failed',
        checkedAt: new Date().toISOString(),
      };
      setVerification(failedResult);
      return failedResult;
    } finally {
      setIsVerifying(false);
    }
  };

  // Keyboard Shortcuts (⌘K, G, L, U, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setIsUploadOpen(false);
        setIsConnectionOpen(false);
        setIsCommandPaletteOpen(false);
        setInspectingAsset(null);
        return;
      }

      if (!isInput && !isUploadOpen && !isConnectionOpen && !isCommandPaletteOpen) {
        if (e.key.toLowerCase() === 'g') {
          setViewMode('grid');
        } else if (e.key.toLowerCase() === 'l') {
          setViewMode('table');
        } else if (e.key.toLowerCase() === 'u') {
          e.preventDefault();
          setIsUploadOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUploadOpen, isConnectionOpen, isCommandPaletteOpen]);

  // Filter Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Folder filter
      if (activeFolder !== 'All' && asset.folder !== activeFolder) {
        return false;
      }
      // Format filter
      if (activeFormat !== 'All' && asset.format.toLowerCase() !== activeFormat.toLowerCase()) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = asset.filename.toLowerCase().includes(query);
        const matchesPublicId = asset.public_id.toLowerCase().includes(query);
        const matchesTags = asset.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesName && !matchesPublicId && !matchesTags) return false;
      }
      return true;
    });
  }, [assets, activeFolder, activeFormat, searchQuery]);

  // Total Bytes
  const totalBytes = useMemo(() => {
    return assets.reduce((sum, item) => sum + item.bytes, 0);
  }, [assets]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredAssets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAssets.map((a) => a.id));
    }
  };

  // Batch actions
  const handleBatchCopyUrls = () => {
    const urls = assets
      .filter((a) => selectedIds.includes(a.id))
      .map((a) => a.secure_url || a.url)
      .join('\n');
    navigator.clipboard.writeText(urls);
    toast(`Copied ${selectedIds.length} CDN URLs`, 'success');
  };

  const handleBatchDelete = async () => {
    const count = selectedIds.length;
    // Delete through API
    for (const id of selectedIds) {
      const asset = assets.find((a) => a.id === id);
      if (asset) {
        await fetch('/api/cloudinary/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_id: asset.public_id, isDemoMode: config.isDemoMode }),
        }).catch(() => {});
      }
    }
    setAssets((prev) => prev.filter((a) => !selectedIds.includes(a.id)));
    toast(`Deleted ${count} assets`, 'info');
    setSelectedIds([]);
  };

  // Asset deletion
  const handleDeleteAsset = async (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (asset) {
      await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id: asset.public_id, isDemoMode: config.isDemoMode }),
      }).catch(() => {});
    }
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
  };

  // Asset uploaded
  const handleAssetUploaded = (newAsset: CloudinaryAsset) => {
    setAssets((prev) => [newAsset, ...prev]);
  };

  // Open Transformation Studio for an asset
  const handleOpenStudio = (asset?: CloudinaryAsset) => {
    const targetAsset = asset || inspectingAsset || assets[0];
    if (targetAsset) {
      setStudioAsset(targetAsset);
      setIsStudioOpen(true);
      setInspectingAsset(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Navigation */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenConnection={() => setIsConnectionOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        verification={verification}
        config={config}
        activeFolder={activeFolder}
        assetCount={filteredAssets.length}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Content Area */}
      {isStudioOpen && studioAsset ? (
        // TRANSFORMATION STUDIO WORKSPACE VIEW
        <div className="flex-1 flex flex-col">
          {/* Studio Top Return Bar */}
          <div className="h-10 border-b border-border bg-card/60 px-4 sm:px-6 flex items-center justify-between text-xs">
            <button
              onClick={() => setIsStudioOpen(false)}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Asset Library</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-mono">Active Cloud:</span>
              <span className={`font-mono px-2 py-0.5 rounded text-[11px] font-semibold ${config.isDemoMode ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                {config.cloudName} {config.isDemoMode ? '(Demo)' : '(Personal)'}
              </span>
            </div>
          </div>

          {/* Transformation Studio Component */}
          <TransformationStudio
            asset={studioAsset}
            config={config}
            onClose={() => setIsStudioOpen(false)}
          />
        </div>
      ) : (
        // ASSET LIBRARY / DAM VIEW
        <div className="flex-1 flex">
          {/* Left Sidebar */}
          <Sidebar
            activeFolder={activeFolder}
            setActiveFolder={setActiveFolder}
            activeFormat={activeFormat}
            setActiveFormat={setActiveFormat}
            totalAssetsCount={assets.length}
            totalBytes={totalBytes}
            config={config}
            verification={verification}
            onOpenConnection={() => setIsConnectionOpen(true)}
            onVerifyNow={() => verifyConnection(config)}
            isVerifying={isVerifying}
            onOpenStudio={() => handleOpenStudio()}
          />

          {/* Center Main Stage */}
          <main className="flex-1 min-w-0 p-4 sm:p-6 space-y-4 overflow-y-auto">
            {/* Filter and Quick Search Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-border/60">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter current view..."
                  className="w-full pl-8 pr-7 py-1.5 bg-background border border-border rounded-lg text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Showing</span>
                <span className="font-mono font-medium text-foreground">{filteredAssets.length}</span>
                <span>of</span>
                <span className="font-mono text-muted-foreground">
                  {config.isDemoMode ? `${assets.length} demo assets` : `${assets.length} assets`}
                </span>
              </div>
            </div>

            {/* Batch Action Bar if items selected */}
            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-primary/40 shadow-sm animate-fade-in text-xs">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">
                    {selectedIds.length} asset{selectedIds.length > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBatchCopyUrls}
                    className="px-2.5 py-1.5 rounded-md border border-border hover:bg-muted text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy URLs
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    className="px-2.5 py-1.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            {/* Content View: Grid or Table */}
            {viewMode === 'grid' ? (
              <AssetGrid
                assets={filteredAssets}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onInspect={(asset) => setInspectingAsset(asset)}
                onOpenStudio={(asset) => handleOpenStudio(asset)}
                isPersonalMode={!config.isDemoMode}
                cloudName={config.cloudName}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            ) : (
              <AssetTable
                assets={filteredAssets}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
                onInspect={(asset) => setInspectingAsset(asset)}
                onOpenStudio={(asset) => handleOpenStudio(asset)}
                isPersonalMode={!config.isDemoMode}
                cloudName={config.cloudName}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            )}
          </main>

          {/* Right Slide-over Inspector */}
          {inspectingAsset && (
            <AssetInspector
              asset={inspectingAsset}
              onClose={() => setInspectingAsset(null)}
              onOpenStudio={(asset) => handleOpenStudio(asset)}
              onDeleteAsset={handleDeleteAsset}
            />
          )}
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        config={config}
        onAssetUploaded={handleAssetUploaded}
        onOpenSettings={() => setIsConnectionOpen(true)}
      />

      {/* Cloudinary Connection & Verification Modal */}
      <ConnectionModal
        isOpen={isConnectionOpen}
        onClose={() => setIsConnectionOpen(false)}
        config={config}
        verification={verification}
        onSaveConfig={handleSaveConfig}
        isVerifying={isVerifying}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        assets={assets}
        onSelectAsset={(asset) => setInspectingAsset(asset)}
        onOpenStudio={(asset) => handleOpenStudio(asset)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenConnection={() => setIsConnectionOpen(true)}
        onSetViewMode={(mode) => setViewMode(mode)}
        onToggleTheme={() => setDarkMode((prev) => !prev)}
      />
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <CloudPixDashboard />
    </ToastProvider>
  );
}
