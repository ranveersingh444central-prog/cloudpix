'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Sparkles, 
  Upload, 
  LayoutGrid, 
  List, 
  ShieldCheck, 
  Sun, 
  Image as ImageIcon,
  ArrowRight
} from 'lucide-react';
import { CloudinaryAsset } from '@/types/cloudinary';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  assets: CloudinaryAsset[];
  onSelectAsset: (asset: CloudinaryAsset) => void;
  onOpenStudio: (asset?: CloudinaryAsset) => void;
  onOpenUpload: () => void;
  onOpenConnection: () => void;
  onSetViewMode: (mode: 'grid' | 'table') => void;
  onToggleTheme: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  assets,
  onSelectAsset,
  onOpenStudio,
  onOpenUpload,
  onOpenConnection,
  onSetViewMode,
  onToggleTheme,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter assets
  const matchingAssets = assets
    .filter(
      (a) =>
        a.filename.toLowerCase().includes(query.toLowerCase()) ||
        a.folder.toLowerCase().includes(query.toLowerCase()) ||
        a.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
    )
    .slice(0, 5);

  // System actions
  const systemActions = [
    {
      id: 'action-studio',
      title: 'Open Transformation Studio',
      category: 'Actions',
      icon: Sparkles,
      run: () => onOpenStudio(),
    },
    {
      id: 'action-upload',
      title: 'Upload Media Asset',
      category: 'Actions',
      icon: Upload,
      run: () => onOpenUpload(),
    },
    {
      id: 'action-verify',
      title: 'Verify Cloudinary Connection',
      category: 'Settings',
      icon: ShieldCheck,
      run: () => onOpenConnection(),
    },
    {
      id: 'action-grid',
      title: 'Switch to Grid View',
      category: 'View',
      icon: LayoutGrid,
      run: () => onSetViewMode('grid'),
    },
    {
      id: 'action-table',
      title: 'Switch to Table View',
      category: 'View',
      icon: List,
      run: () => onSetViewMode('table'),
    },
    {
      id: 'action-theme',
      title: 'Toggle Theme (Dark / Light)',
      category: 'Preferences',
      icon: Sun,
      run: () => onToggleTheme(),
    },
  ];

  const matchingActions = systemActions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  const totalItems = matchingAssets.length + matchingActions.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (totalItems || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % (totalItems || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < matchingAssets.length) {
        onSelectAsset(matchingAssets[selectedIndex]);
        onClose();
      } else {
        const action = matchingActions[selectedIndex - matchingAssets.length];
        if (action) {
          action.run();
          onClose();
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-background/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input box */}
        <div className="flex items-center px-4 py-3 border-b border-border gap-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search assets, folders, commands..."
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono text-muted-foreground">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {matchingAssets.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Assets
              </div>
              {matchingAssets.map((asset, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={asset.id}
                    onClick={() => {
                      onSelectAsset(asset);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium truncate">{asset.filename}</span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {asset.folder} &bull; {asset.format.toUpperCase()}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  </button>
                );
              })}
            </div>
          )}

          {matchingActions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-2">
                Quick Actions
              </div>
              {matchingActions.map((action, idx) => {
                const itemIndex = matchingAssets.length + idx;
                const isSelected = selectedIndex === itemIndex;
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.run();
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium">{action.title}</span>
                    </div>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {action.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {totalItems === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching assets or commands found.
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Navigate with &uarr; &darr;</span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
}
