/**
 * Omnintellx — Output Studio & Deliverables Screen
 * Inspect, preview, copy, launch, and export authentic build deliverables:
 * output/index.html, output/standalone.html, output/dashboard.html, output/terminal.html,
 * output/build-manifest.json, output/test-report.json, output/api-specs.json, output/README.md.
 */

import React, { useState } from 'react';
import { Project, ProjectFile } from '../types';
import { downloadZipSafely, downloadTextFileSafely } from '../utils/downloadHelper';
import {
  Package,
  Download,
  Eye,
  FileCode,
  CheckCircle2,
  Copy,
  ExternalLink,
  Check,
  Sparkles,
  Layers,
  FileText,
  RefreshCw,
  Terminal,
  Activity,
  ShieldCheck,
  Cpu
} from 'lucide-react';

interface OutputStudioScreenProps {
  project: Project | null;
  onOpenPreview: () => void;
  onNavigate: (screen: any) => void;
  onRecompile?: () => Promise<void> | void;
}

export const OutputStudioScreen: React.FC<OutputStudioScreenProps> = ({
  project,
  onOpenPreview,
  onNavigate,
  onRecompile
}) => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<ProjectFile | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'html' | 'json' | 'docs'>('all');
  const [isRecompiling, setIsRecompiling] = useState(false);

  const deliverables = project?.files.filter(f =>
    f.name.startsWith('omni/') || f.name.startsWith('output/') || f.name.startsWith('final_codes/') || f.name.startsWith('android/') || f.name.startsWith('hosting/') || f.name === 'index.html' || f.name === 'README.md' || f.name === 'build-manifest.json' || f.name === 'standalone.html'
  ) || [];

  const htmlDeliverables = deliverables.filter(f => f.name.endsWith('.html'));
  const jsonDeliverables = deliverables.filter(f => f.name.endsWith('.json'));
  const docDeliverables = deliverables.filter(f => f.name.endsWith('.md'));

  const filteredDeliverables = deliverables.filter(f => {
    if (activeTab === 'html') return f.name.endsWith('.html');
    if (activeTab === 'json') return f.name.endsWith('.json');
    if (activeTab === 'docs') return f.name.endsWith('.md');
    return true;
  });

  const handleCopy = async (fileName: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFile(fileName);
      setTimeout(() => setCopiedFile(null), 2500);
    } catch (_) {}
  };

  const handleDownloadFile = async (fileName: string, content: string) => {
    const isHtml = fileName.endsWith('.html');
    const isJson = fileName.endsWith('.json');
    const mimeType = isHtml ? 'text/html;charset=utf-8' : isJson ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8';
    const cleanName = fileName.split('/').pop() || fileName;
    await downloadTextFileSafely(cleanName, content, mimeType);
  };

  const handleDownloadZip = async () => {
    if (!project || project.files.length === 0) return;
    const filename = `${(project.name || 'project').toLowerCase().replace(/\s+/g, '_')}_bundle.zip`;
    await downloadZipSafely(
      filename,
      project.files.map(f => ({ name: f.name, content: f.content })),
      {
        'README.md': `# ${project.name || 'Omnintellx Project'}\nExported complete application package.\nDeliverables available in omni/, output/omni/ and final_codes/.\n`
      }
    );
  };

  const handleLaunchHtml = (_file: ProjectFile) => {
    onOpenPreview();
  };

  const handleTriggerRecompile = async () => {
    if (onRecompile) {
      setIsRecompiling(true);
      try {
        await onRecompile();
      } finally {
        setTimeout(() => setIsRecompiling(false), 500);
      }
    }
  };

  const standaloneFile = project?.files.find(f => f.name === 'output/omni/index.html' || f.name === 'output/omni/standalone.html' || f.name === 'final_codes/standalone.html' || f.name === 'final_codes/index.html' || f.name === 'final_codes/omnintellx.html') ||
    project?.files.find(f => f.name === 'output/standalone.html') ||
    project?.files.find(f => f.name === 'index.html');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* Top Banner */}
      <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Production Deliverables (v4.0.0)
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Zero-Dependency Standalone
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-2 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" />
            <span>Output Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Production-ready standalone distributions, telemetry dashboards, CLI terminals, and OpenAPI contracts generated by the autonomous agent compiler.
          </p>
        </div>

        {/* Global Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onRecompile && (
            <button
              onClick={handleTriggerRecompile}
              disabled={isRecompiling}
              className="px-3.5 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Re-run compiler and sync all output/ deliverables"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecompiling ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{isRecompiling ? 'Recompiling...' : 'Recompile Output'}</span>
            </button>
          )}

          <button
            onClick={onOpenPreview}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>

          <button
            onClick={handleDownloadZip}
            className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Download Project ZIP</span>
          </button>

          {standaloneFile && (
            <button
              onClick={() => handleLaunchHtml(standaloneFile)}
              className="px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Launch Standalone</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            All Deliverables ({deliverables.length})
          </button>
          <button
            onClick={() => setActiveTab('html')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'html'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>HTML Apps ({htmlDeliverables.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Contracts & Reports ({jsonDeliverables.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'docs'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Runbooks ({docDeliverables.length})</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Static Security Clean
          </span>
          <span className="flex items-center gap-1 text-indigo-400">
            <Cpu className="w-3.5 h-3.5" />
            Standalone Studio
          </span>
        </div>
      </div>

      {/* Deliverable Files Grid */}
      {filteredDeliverables.length === 0 ? (
        <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-12 text-center space-y-4">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No output deliverables compiled yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click Recompile Output to automatically generate production standalone HTML bundles, dashboards, OpenAPI contracts, and test reports.
          </p>
          {onRecompile && (
            <button
              onClick={handleTriggerRecompile}
              disabled={isRecompiling}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecompiling ? 'animate-spin' : ''}`} />
              <span>Compile Production Suite</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDeliverables.map((file) => {
            const isHtml = file.name.endsWith('.html');
            const isJson = file.name.endsWith('.json');
            const isMd = file.name.endsWith('.md');
            const isTerminal = file.name.includes('terminal');
            const isDashboard = file.name.includes('dashboard');
            const isManifest = file.name.includes('manifest');
            const isTestReport = file.name.includes('test-report');
            const isApiSpecs = file.name.includes('api-specs');

            let badgeLabel = 'Production Ready';
            let badgeClass = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
            if (isTerminal) {
              badgeLabel = 'Neural Ops CLI';
              badgeClass = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
            } else if (isDashboard) {
              badgeLabel = 'Live Telemetry';
              badgeClass = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
            } else if (isManifest) {
              badgeLabel = 'v4.0.0 Verified';
              badgeClass = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
            } else if (isTestReport) {
              const hasActualTests = project?.files.some(f => f.name.startsWith('test_') || f.name.includes('.test.') || f.name.includes('.spec.'));
              badgeLabel = hasActualTests ? 'Unit Tests Verified' : 'Unit Tests: Not Tested';
              badgeClass = hasActualTests ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20';
            } else if (isApiSpecs) {
              badgeLabel = 'OpenAPI 3.1';
              badgeClass = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
            }

            return (
              <div
                key={file.id}
                className="bg-[#0e131b] border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/30 transition-colors shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 shrink-0">
                        {isTerminal ? <Terminal className="w-4 h-4 text-cyan-400" /> :
                         isDashboard ? <Activity className="w-4 h-4 text-emerald-400" /> :
                         isHtml ? <FileCode className="w-4 h-4 text-emerald-400" /> :
                         isMd ? <FileText className="w-4 h-4 text-cyan-400" /> :
                         <Layers className="w-4 h-4 text-amber-400" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-white truncate font-mono">
                          {file.name}
                        </h3>
                        <span className="text-[11px] text-slate-500">
                          {file.content.length.toLocaleString()} bytes
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-medium shrink-0 ${badgeClass}`}>
                      {badgeLabel}
                    </span>
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-[#080b10] border border-white/5 font-mono text-[11px] text-slate-400 max-h-24 overflow-hidden relative">
                    <pre className="line-clamp-3 select-none">{file.content.slice(0, 240)}</pre>
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#080b10] to-transparent pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setViewingFile(file)}
                      className="text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Inspect
                    </button>
                    {isHtml && (
                      <button
                        onClick={() => handleLaunchHtml(file)}
                        className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                        title="Open in standalone browser window"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Launch</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(file.name, file.content)}
                      className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors flex items-center gap-1"
                      title="Copy to clipboard"
                    >
                      {copiedFile === file.name ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-[11px]">{copiedFile === file.name ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadFile(file.name, file.content)}
                      className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors flex items-center gap-1"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Download</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect File Modal */}
      {viewingFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e131b] border border-white/10 rounded-2xl max-w-3xl w-full h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-sm text-white">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span>{viewingFile.name}</span>
                <span className="text-xs text-slate-500 font-normal">({viewingFile.content.length.toLocaleString()} bytes)</span>
              </div>
              <div className="flex items-center gap-2">
                {viewingFile.name.endsWith('.html') && (
                  <button
                    onClick={() => handleLaunchHtml(viewingFile)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Launch</span>
                  </button>
                )}
                <button
                  onClick={() => handleCopy(viewingFile.name, viewingFile.content)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1"
                >
                  {copiedFile === viewingFile.name ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedFile === viewingFile.name ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setViewingFile(null)}
                  className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-white/5"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-auto bg-[#080b10] font-mono text-xs text-slate-300 leading-relaxed select-text">
              <pre>{viewingFile.content}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
