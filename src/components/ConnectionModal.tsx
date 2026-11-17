'use client';

import React, { useState } from 'react';
import { CloudinaryConfig, VerificationResult } from '@/types/cloudinary';
import { X, CheckCircle2, RefreshCw, Key, ShieldCheck, ExternalLink } from 'lucide-react';
import { useToast } from './Toast';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CloudinaryConfig;
  verification: VerificationResult | null;
  onSaveConfig: (newConfig: CloudinaryConfig) => Promise<VerificationResult | null>;
  isVerifying: boolean;
}

export function ConnectionModal({
  isOpen,
  onClose,
  config,
  verification,
  onSaveConfig,
  isVerifying,
}: ConnectionModalProps) {
  const { toast } = useToast();
  const [cloudName, setCloudName] = useState(config.cloudName || 'demo');
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [apiSecret, setApiSecret] = useState(config.apiSecret || '');
  const [uploadPreset, setUploadPreset] = useState(config.uploadPreset || '');
  const [activeTab, setActiveTab] = useState<'custom' | 'demo'>(config.isDemoMode ? 'demo' : 'custom');

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: CloudinaryConfig = {
      cloudName: activeTab === 'demo' ? 'demo' : cloudName.trim(),
      apiKey: activeTab === 'demo' ? '' : apiKey.trim(),
      apiSecret: activeTab === 'demo' ? '' : apiSecret.trim(),
      uploadPreset: activeTab === 'demo' ? '' : uploadPreset.trim(),
      isConfigured: activeTab === 'demo' || Boolean(apiKey && apiSecret),
      isDemoMode: activeTab === 'demo',
    };

    const res = await onSaveConfig(newConfig);
    if (res?.connected) {
      toast(`Cloudinary connected successfully (${res.latencyMs}ms)`, 'success');
      onClose();
    } else {
      toast(res?.statusMessage || 'Verification failed. Check credentials.', 'error');
    }
  };

  const handleSetDemoMode = async () => {
    setActiveTab('demo');
    const demoConfig: CloudinaryConfig = {
      cloudName: 'demo',
      apiKey: '',
      apiSecret: '',
      uploadPreset: '',
      isConfigured: true,
      isDemoMode: true,
    };
    const res = await onSaveConfig(demoConfig);
    if (res?.connected) {
      toast('Switched to Cloudinary Demo environment', 'success');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Cloudinary Environment</h2>
              <p className="text-xs text-muted-foreground">Manage API authentication and verify CDN connectivity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Status Pill */}
        <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Current Status:</span>
            {verification?.connected ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active ({verification.cloudName}) &bull; {verification.latencyMs}ms
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Unverified
              </span>
            )}
          </div>
          {verification?.details?.plan && (
            <span className="text-muted-foreground font-mono">
              Plan: {verification.details.plan}
            </span>
          )}
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-5 pt-4">
          <div className="flex p-0.5 rounded-lg bg-muted border border-border text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                activeTab === 'custom'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Custom Cloudinary Account
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('demo')}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                activeTab === 'demo'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Demo Playground (No API Key Required)
            </button>
          </div>
        </div>

        {/* Form Body */}
        {activeTab === 'custom' ? (
          <form onSubmit={handleTestAndSave} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-foreground">
                Cloud Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                placeholder="e.g. your-company-cloud"
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-foreground">
                  API Key
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="e.g. 748192847291823"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-foreground">
                  API Secret
                </label>
                <input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-foreground">
                Upload Preset (Optional)
              </label>
              <input
                type="text"
                value={uploadPreset}
                onChange={(e) => setUploadPreset(e.target.value)}
                placeholder="e.g. ml_default or unsigned_preset"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div className="p-3 bg-muted/30 border border-border/80 rounded-lg text-xs text-muted-foreground flex items-start gap-2">
              <Key className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
              <p>
                Credentials are stored securely in your browser session and used for direct API calls to your Cloudinary cloud. You can find your credentials in your{' '}
                <a
                  href="https://console.cloudinary.com/settings/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  Cloudinary Dashboard <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Testing & Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verify & Save Connection
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Cloudinary Public Demo Cloud
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Uses Cloudinary&apos;s global public sandbox (<code className="font-mono text-foreground">cloud_name: demo</code>). 
                All dynamic transformations (AI face detect, smart cropping, WebP/AVIF compression, overlays, effects) work immediately without needing an API key.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSetDemoMode}
                disabled={isVerifying}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shadow-sm"
              >
                Use Demo Environment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
