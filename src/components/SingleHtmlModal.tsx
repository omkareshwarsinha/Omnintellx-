/**
 * Omnintellx — Production Single HTML Compiler & Resilient Exporter Modal
 * Packages projects and workspace state into self-contained single-file HTML applications.
 */

import React, { useState, useMemo } from 'react';
import { Project, Artifact, ProjectContract, ProviderConfig } from '../types';
import { compileProjectToSingleHtml, compileStudioWorkspaceToSingleHtml } from '../utils/singleHtmlCompiler';
import { downloadHtmlFile, copyToClipboard } from '../utils/downloadHelper';
import {
  Download,
  Copy,
  Check,
  X,
  Code,
  Play,
  FileCheck,
  Sparkles,
  ExternalLink,
  Laptop,
  Smartphone,
  Tablet,
  AlertCircle
} from 'lucide-react';

interface SingleHtmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: Project | null;
  allProjects: Project[];
  artifacts: Artifact[];
  contracts: ProjectContract[];
  providers: ProviderConfig[];
}

export const SingleHtmlModal: React.FC<SingleHtmlModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  allProjects,
  artifacts,
  contracts,
  providers
}) => {
  const [exportTarget, setExportTarget] = useState<'current_project' | 'studio_workspace'>('current_project');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProject?.id || allProjects[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'instructions'>('preview');
  const [copied, setCopied] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const selectedProject = useMemo(() => {
    return allProjects.find(p => p.id === selectedProjectId) || activeProject || allProjects[0] || null;
  }, [allProjects, selectedProjectId, activeProject]);

  // Generate self-contained Single HTML bundle for the active project
  const projectSingleHtml = useMemo(() => {
    if (!selectedProject) return '<!DOCTYPE html><html><body><h1>No project selected</h1></body></html>';
    return compileProjectToSingleHtml(selectedProject);
  }, [selectedProject]);

  // Generate full studio workspace export bundle
  const studioSingleHtml = useMemo(() => {
    return compileStudioWorkspaceToSingleHtml(allProjects, artifacts, contracts, providers);
  }, [allProjects, artifacts, contracts, providers]);

  const currentBundleHtml = exportTarget === 'current_project' ? projectSingleHtml : studioSingleHtml;
  const bundleSizeKb = (new Blob([currentBundleHtml]).size / 1024).toFixed(1);

  const filename = useMemo(() => {
    if (exportTarget === 'current_project') {
      const name = (selectedProject?.name || 'app').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      return `${name}_standalone.html`;
    }
    return 'omnintellx_studio_standalone.html';
  }, [exportTarget, selectedProject]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(currentBundleHtml);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setDownloadStatus('Please switch to "Source Code" tab to copy manually.');
      setTimeout(() => setDownloadStatus(null), 3000);
    }
  };

  const handleDownload = () => {
    setDownloadStatus('Downloading...');
    
    // For full workspace package, offer both client blob download and backend download endpoint
    if (exportTarget === 'studio_workspace') {
      try {
        const link = document.createElement('a');
        link.href = '/download/omnintellx.html';
        link.download = 'omnintellx.html';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 300);
        setDownloadStatus('Saved via backend download!');
        setTimeout(() => setDownloadStatus(null), 3000);
        return;
      } catch {
        // Fallback to client generator
      }
    }

    const result = downloadHtmlFile(filename, currentBundleHtml);
    if (result.success) {
      setDownloadStatus('Saved file!');
      setTimeout(() => setDownloadStatus(null), 3000);
    } else {
      setDownloadStatus('Downloaded via fallback');
      setTimeout(() => setDownloadStatus(null), 3000);
    }
  };

  const handleOpenWindow = () => {
    try {
      const win = window.open();
      if (win) {
        win.document.open();
        win.document.write(currentBundleHtml);
        win.document.close();
      } else {
        setDownloadStatus('Popup blocked by browser. Please use "Download Single HTML".');
        setTimeout(() => setDownloadStatus(null), 3500);
      }
    } catch {
      setDownloadStatus('Popup blocked. Please use "Download Single HTML".');
      setTimeout(() => setDownloadStatus(null), 3500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[92vh] bg-[#0D1117] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#161B22]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Single HTML Compiler &amp; Exporter
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {bundleSizeKb} KB
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Zero-dependency, standalone single-file HTML bundle with inlined styling and scripts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Target Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-[#090D13] border-b border-white/5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">Export Target:</span>
            <div className="flex p-0.5 rounded-lg bg-white/5 border border-white/10">
              <button
                onClick={() => setExportTarget('current_project')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  exportTarget === 'current_project'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Project Application
              </button>
              <button
                onClick={() => setExportTarget('studio_workspace')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  exportTarget === 'studio_workspace'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Full Workspace Package
              </button>
            </div>

            {/* Project dropdown if multiple exist */}
            {exportTarget === 'current_project' && allProjects.length > 1 && (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {allProjects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.files.length} files)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Tabs */}
            <div className="flex p-0.5 rounded-lg bg-white/5 border border-white/10">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeTab === 'preview' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Play className="w-3.5 h-3.5" /> Preview
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeTab === 'code' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" /> Source Code
              </button>
              <button
                onClick={() => setActiveTab('instructions')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeTab === 'instructions' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" /> Deployment Info
              </button>
            </div>

            {/* Device Switcher (for preview) */}
            {activeTab === 'preview' && (
              <div className="hidden sm:flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/10">
                <button
                  onClick={() => setDeviceView('desktop')}
                  className={`p-1.5 rounded ${deviceView === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Desktop (100%)"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeviceView('tablet')}
                  className={`p-1.5 rounded ${deviceView === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Tablet (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeviceView('mobile')}
                  className={`p-1.5 rounded ${deviceView === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Mobile (390px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Main Content Body */}
        <div className="flex-1 overflow-hidden bg-[#070A0F] relative">
          {activeTab === 'preview' && (
            <div className="w-full h-full flex items-center justify-center p-3 overflow-auto bg-black/60">
              <div
                className={`h-full bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${
                  deviceView === 'desktop'
                    ? 'w-full'
                    : deviceView === 'tablet'
                    ? 'w-[768px] max-w-full'
                    : 'w-[390px] max-w-full'
                }`}
              >
                <iframe
                  srcDoc={currentBundleHtml}
                  title="Single HTML Live Preview"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                />
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="w-full h-full p-4 overflow-auto">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-xs text-slate-400">
                <span className="font-mono">{filename} ({bundleSizeKb} KB)</span>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied to Clipboard!' : 'Copy Code'}
                </button>
              </div>
              <pre className="text-xs font-mono text-emerald-400 bg-black/80 p-4 rounded-xl border border-white/10 whitespace-pre-wrap leading-relaxed">
                {currentBundleHtml}
              </pre>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="w-full h-full p-6 overflow-auto max-w-3xl mx-auto space-y-6 text-slate-300 text-sm">
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
                <h4 className="text-sm font-bold text-indigo-300 mb-1 flex items-center gap-2">
                  <FileCheck className="w-4 h-4" /> Self-Contained Single HTML Distribution
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The compiled single HTML file bundles all HTML markup, CSS stylesheet rules, JavaScript functions, and mock datasets into a single self-contained document. It runs locally in any web browser without an active web server or internet connection.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-mono font-semibold uppercase text-slate-400">Where to Deploy:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <strong className="text-white block mb-1">Local Computer</strong>
                    <p className="text-slate-400">Double click or drag the downloaded `.html` file into Google Chrome, Safari, or Edge.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <strong className="text-white block mb-1">Static Hosting</strong>
                    <p className="text-slate-400">Drop onto Netlify Drop, Vercel, Cloudflare Pages, or AWS S3 as an instant web application.</p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Troubleshooting Downloads in Sandbox:</strong> If your browser blocks popups or automated file downloads in iframe previews, click <strong>"Copy Code"</strong> to copy the entire single-file HTML into your clipboard and paste it directly into an `index.html` file on your computer.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#161B22] border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>File: <strong className="text-slate-200">{filename}</strong></span>
            <span>·</span>
            <span>Size: <strong className="text-emerald-400">{bundleSizeKb} KB</strong></span>
            {downloadStatus && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-sans font-semibold text-[11px] animate-pulse">
                ✓ {downloadStatus}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenWindow}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
            </button>
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied HTML!' : 'Copy Code'}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Download Single HTML
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
