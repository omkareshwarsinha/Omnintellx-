/**
 * Omnintellx — Instant Live Preview Modal
 * Full-fidelity, sandboxed live app runner with Android mobile, tablet, and desktop viewports.
 */

import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { compileProjectToSingleHtml } from '../utils/singleHtmlCompiler';
import { downloadHtmlFile, copyToClipboard } from '../utils/downloadHelper';
import {
  X,
  Smartphone,
  Tablet,
  Laptop,
  RotateCw,
  ExternalLink,
  Download,
  Copy,
  Check,
  Sparkles,
  Maximize2,
  Code2
} from 'lucide-react';

interface LivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onOpenInEditor?: (fileId?: string) => void;
}

export const LivePreviewModal: React.FC<LivePreviewModalProps> = ({
  isOpen,
  onClose,
  project,
  onOpenInEditor
}) => {
  const [device, setDevice] = useState<'android' | 'compact' | 'tablet' | 'desktop'>('android');
  const [key, setKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const compiledHtml = useMemo(() => {
    if (!project) return '';
    // Look for output/index.html first if present
    const outIndex = project.files.find(f => f.name === 'output/index.html');
    if (outIndex && outIndex.content) {
      return outIndex.content;
    }
    return compileProjectToSingleHtml(project);
  }, [project, key]);

  if (!isOpen || !project) return null;

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(compiledHtml);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadHtmlFile(`${project.name.toLowerCase().replace(/\s+/g, '_')}_live.html`, compiledHtml);
  };

  const handleOpenWindow = () => {
    const win = window.open();
    if (win) {
      win.document.open();
      win.document.write(compiledHtml);
      win.document.close();
    }
  };

  const getFrameWidthClass = () => {
    switch (device) {
      case 'compact':
        return 'w-[360px] max-w-full';
      case 'android':
        return 'w-[412px] max-w-full';
      case 'tablet':
        return 'w-[768px] max-w-full';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-2 sm:p-4 animate-in fade-in duration-150">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 bg-[#12161F] border border-white/10 rounded-2xl mb-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
              <span>{project.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                LIVE APP
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              {project.files.length} project files compiled in sandbox
            </p>
          </div>
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setDevice('compact')}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              device === 'compact' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Compact Mobile (360px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice('android')}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              device === 'android' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Android Phone (412px)"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`hidden sm:block p-1.5 rounded-lg text-xs transition-all ${
              device === 'tablet' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Tablet (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              device === 'desktop' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Full Width Responsive"
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleRefresh}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-white/10"
            title="Reload Frame"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reload</span>
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-white/10"
            title="Download Standalone HTML"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Download</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-white/10"
            title="Copy Full Single HTML"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleOpenWindow}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold flex items-center gap-1 border border-indigo-500/30"
            title="Open in Full Browser Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline">New Tab</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors ml-1"
            title="Close Preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 w-full flex items-center justify-center overflow-hidden min-h-0 bg-[#090C10] rounded-2xl border border-white/10 p-1 sm:p-2">
        <div className={`h-full ${getFrameWidthClass()} transition-all duration-200 shadow-2xl rounded-xl overflow-hidden bg-black flex flex-col border border-white/15`}>
          {/* Frame Header / URL bar representation */}
          <div className="h-7 bg-slate-900/90 border-b border-white/10 px-3 flex items-center justify-between text-[10px] text-slate-400 select-none shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500/80" />
              <span className="w-2 h-2 rounded-full bg-amber-500/80" />
              <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
            </div>
            <span className="font-mono text-slate-400 truncate max-w-[200px]">
              https://sandbox.omnintellx.local/{project.name.toLowerCase().replace(/\s+/g, '-')}/
            </span>
            <span className="text-emerald-400 font-mono">100% Client-Side</span>
          </div>

          <iframe
            key={key}
            srcDoc={compiledHtml}
            title={project.name}
            sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups"
            className="w-full flex-1 border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
};
