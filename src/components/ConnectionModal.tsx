'use client';

import React, { useState } from 'react';
import { CloudinaryConfig, VerificationResult } from '@/types/cloudinary';
import { X, CheckCircle2, RefreshCw, Key, ShieldCheck, ExternalLink, AlertCircle, Server } from 'lucide-react';
import { useToast } from './Toast';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CloudinaryConfig;
  verification: VerificationResult | null;
  onSaveConfig: (params: {
    cloudName: string;
    apiKey?: string;
    apiSecret?: string;
    uploadPreset?: string;
    isDemoMode: boolean;
  }) => Promise<VerificationResult | null>;
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
  const [cloudName, setCloudName] = useState(config.isDemoMode ? '' : config.cloudName);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [uploadPreset, setUploadPreset] = useState(config.uploadPreset || '');
  const [activeTab, setActiveTab] = useState<'custom' | 'demo'>(config.isDemoMode ? 'demo' : 'custom');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const targetCloud = cloudName.trim();
    if (!targetCloud) {
      setErrorMessage('Cloud Name is required.');
      return;
    }

    if (!apiKey.trim() || !apiSecret.trim()) {
      setErrorMessage('Both API Key and API Secret are required to connect your personal Cloudinary account.');
      return;
    }

    const res = await onSaveConfig({
      cloudName: targetCloud,
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim(),
      uploadPreset: uploadPreset.trim(),
      isDemoMode: false,
    });

    if (res?.connected) {
      toast(`Connected to Cloudinary account '${targetCloud}' (${res.latencyMs}ms)`, 'success');
      // Wipe secret from memory
      setApiSecret('');
      onClose();
    } else {
      setErrorMessage(res?.statusMessage || 'Verification failed. Please check your Cloud Name, API Key, and API Secret.');
      toast('Cloudinary connection failed', 'error');
    }
  };

  const handleSetDemoMode = async () => {
    setErrorMessage(null);
    setActiveTab('demo');
    const res = await onSaveConfig({
      cloudName: 'demo',
      apiKey: '',
      apiSecret: '',
      uploadPreset: '',
      isDemoMode: true,
    });
    if (res?.connected) {
      toast('Switched to Cloudinary Demo Playground', 'success');
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
              <p className="text-xs text-muted-foreground">Manage API authentication and active Cloudinary mode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Status Banner */}
        <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Current Mode:</span>
            {config.isDemoMode ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Demo Playground (demo)
              </span>
            ) : verification?.connected ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Personal Cloud ({config.cloudName}) &bull; {verification.latencyMs}ms
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Disconnected
              </span>
            )}
          </div>
          {verification?.hasServerEnv && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-500">
              <Server className="w-3 h-3" />
              .env.local active
            </span>
          )}
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-5 pt-4">
          <div className="flex p-0.5 rounded-lg bg-muted border border-border text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setActiveTab('custom');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                activeTab === 'custom'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Personal Cloudinary Account
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('demo');
                setErrorMessage(null);
              }}
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

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

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
                placeholder="e.g. your-cloud-name"
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-foreground">
                  API Key <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="e.g. 748192847291823"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-foreground">
                  API Secret <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="••••••••••••••••"
                  required
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
                placeholder="e.g. ml_default"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Security notice */}
            <div className="p-3 bg-muted/30 border border-border/80 rounded-lg text-xs text-muted-foreground flex items-start gap-2">
              <Key className="w-4 h-4 shrink-0 text-primary mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-foreground font-medium">Security Assurance:</strong> Your API Secret is verified server-side and never saved to LocalStorage, SessionStorage, or client logs. Alternatively, set <code className="font-mono text-foreground">CLOUDINARY_API_KEY</code> and <code className="font-mono text-foreground">CLOUDINARY_API_SECRET</code> in <code className="font-mono text-foreground">.env.local</code>.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <a
                href="https://console.cloudinary.com/settings/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                Find API Keys in Cloudinary <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex items-center gap-2">
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
                      Verifying with Cloudinary...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Authenticate & Connect
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Cloudinary Public Demo Playground
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Uses Cloudinary&apos;s global public sandbox (<code className="font-mono text-foreground">cloud_name: demo</code>). 
                All dynamic transformations (AI face detect, smart cropping, WebP/AVIF compression, overlays, effects) work immediately without requiring API keys.
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
                Switch to Demo Playground
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
