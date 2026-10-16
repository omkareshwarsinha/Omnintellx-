/**
 * Omnintellx — Interactive Live Preview Screen
 * Left file navigator, responsive viewport controls (Desktop, Tablet, Mobile),
 * clean iframe renderer with error boundary, console inspector, and standalone export shortcut.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, ProjectFile } from '../types';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  ExternalLink,
  Terminal,
  FileCode,
  AlertCircle,
  Download,
  Eye,
  CheckCircle2
} from 'lucide-react';

interface PreviewScreenProps {
  project: Project | null;
  onNavigate?: (screen: any) => void;
}

export const PreviewScreen: React.FC<PreviewScreenProps> = ({
  project,
  onNavigate
}) => {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedFileName, setSelectedFileName] = useState<string>('index.html');
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: 'log' | 'warn' | 'error'; message: string; time: string }>>([]);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const htmlFiles = useMemo(() => {
    if (!project) return [];
    const h = project.files.filter(f => f.name.endsWith('.html'));
    return h.length > 0 ? h : [{ id: 'synthetic', name: 'index.html', content: '<h1>Loading preview...</h1>' }];
  }, [project]);

  // Set default selection
  useEffect(() => {
    if (htmlFiles.length > 0 && !htmlFiles.some(f => f.name === selectedFileName)) {
      setSelectedFileName(htmlFiles[0].name);
    }
  }, [htmlFiles, selectedFileName]);

  // Bundle HTML + CSS + JS for live rendering in the sandbox iframe
  const bundledSrcDoc = useMemo(() => {
    if (!project) return '<h1>No active project</h1>';

    const currentFile = project.files.find(f => f.name === selectedFileName) || htmlFiles[0];
    if (!currentFile) return '<h1>File not found</h1>';

    let content = currentFile.content;

    // Check if external styles and scripts need to be inlined for preview
    const cssFiles = project.files.filter(f => f.name.endsWith('.css'));
    const jsFiles = project.files.filter(f => f.name.endsWith('.js') && !f.name.includes('config'));

    // If html references styles.css, inline it
    if (content.includes('styles.css')) {
      const stylesContent = cssFiles.map(c => c.content).join('\n');
      content = content.replace(/<link[^>]*href=["'][^"']*styles\.css["'][^>]*>/gi, `<style>\n${stylesContent}\n</style>`);
    }

    // If html references main.js, inline it
    if (content.includes('main.js')) {
      const jsContent = jsFiles.map(j => j.content).join('\n');
      content = content.replace(/<script[^>]*src=["'][^"']*main\.js["'][^>]*><\/script>/gi, `<script>\n${jsContent}\n</script>`);
    }

    // Capture console output into the inspector
    const consoleCaptureScript = `
      <script>
        (function() {
          const origLog = console.log;
          const origWarn = console.warn;
          const origError = console.error;
          function send(type, args) {
            try {
              window.parent.postMessage({
                source: 'preview_console',
                type: type,
                message: Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
              }, '*');
            } catch(e) {}
          }
          console.log = function() { send('log', arguments); origLog.apply(console, arguments); };
          console.warn = function() { send('warn', arguments); origWarn.apply(console, arguments); };
          console.error = function() { send('error', arguments); origError.apply(console, arguments); };
          window.addEventListener('error', function(e) {
            send('error', [e.message + ' at ' + e.filename + ':' + e.lineno]);
          });
        })();
      </script>
    `;

    if (content.includes('<head>')) {
      content = content.replace('<head>', `<head>\n${consoleCaptureScript}`);
    } else {
      content = `${consoleCaptureScript}\n${content}`;
    }

    return content;
  }, [project, selectedFileName, htmlFiles]);

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === 'preview_console') {
        setConsoleLogs(prev => [
          ...prev.slice(-99),
          {
            type: event.data.type,
            message: event.data.message,
            time: new Date().toLocaleTimeString()
          }
        ]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleRefresh = () => {
    setIframeKey(k => k + 1);
  };

  const handleOpenNewTab = () => {
    const blob = new Blob([bundledSrcDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const hasBackendFiles = project?.files.some(f =>
    f.name.includes('server') || f.name.endsWith('.py') || f.name.endsWith('.sql') || f.name.endsWith('.php')
  );

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-3">
      {/* Top Controls Bar */}
      <div className="bg-[#0e131b] border border-white/10 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg shrink-0">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white">Live Application Preview</h2>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            ({selectedFileName})
          </span>
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center gap-1 bg-[#080b10] border border-white/10 rounded-xl p-1 text-xs">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
              viewport === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop 100%"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Desktop</span>
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
              viewport === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Tablet 768px"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Tablet</span>
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
              viewport === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Mobile 375px"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Mobile</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1"
            title="Reload Frame"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setConsoleOpen(c => !c)}
            className={`p-1.5 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1 ${
              consoleOpen
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
            title="Toggle Console"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Console</span>
            {consoleLogs.length > 0 && (
              <span className="text-[10px] px-1.5 rounded-full bg-white/20 ml-0.5">
                {consoleLogs.length}
              </span>
            )}
          </button>
          <button
            onClick={handleOpenNewTab}
            className="p-1.5 rounded-xl border border-indigo-500/30 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium transition-colors flex items-center gap-1"
            title="Open preview in new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Tab</span>
          </button>
        </div>
      </div>

      {/* Backend advisory if applicable */}
      {hasBackendFiles && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl px-4 py-2 text-xs text-amber-300 flex items-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Backend runtime unavailable in browser-only mode. Client application runs with local storage persistence.</span>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* Left Sidebar: HTML File Switcher */}
        <div className="w-44 bg-[#0e131b] border border-white/10 rounded-2xl p-3 flex flex-col shrink-0 hidden sm:flex">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Target Pages
          </span>
          <div className="space-y-1 overflow-y-auto flex-1">
            {htmlFiles.map(file => (
              <button
                key={file.id}
                onClick={() => setSelectedFileName(file.name)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono truncate transition-colors flex items-center gap-2 ${
                  selectedFileName === file.name
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{file.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center: Sandboxed Preview Iframe */}
        <div className="flex-1 bg-slate-900/60 border border-white/10 rounded-2xl flex items-center justify-center p-2 sm:p-4 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-200 shadow-2xl rounded-xl overflow-hidden border border-white/10 bg-white ${
              viewport === 'desktop'
                ? 'w-full'
                : viewport === 'tablet'
                ? 'w-[768px]'
                : 'w-[375px]'
            }`}
          >
            <iframe
              key={iframeKey}
              ref={iframeRef}
              srcDoc={bundledSrcDoc}
              title="Application Live Preview"
              sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
              className="w-full h-full border-0 bg-white"
            />
          </div>
        </div>

        {/* Right: Console Drawer (if open) */}
        {consoleOpen && (
          <div className="w-80 bg-[#0e131b] border border-white/10 rounded-2xl p-3 flex flex-col shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Console Logs
              </span>
              <button
                onClick={() => setConsoleLogs([])}
                className="text-slate-400 hover:text-white text-[11px]"
              >
                Clear
              </button>
            </div>
            <div className="flex-1 overflow-y-auto mt-2 space-y-1.5 font-mono text-[11px]">
              {consoleLogs.length === 0 ? (
                <div className="text-slate-500 py-8 text-center">No console output recorded.</div>
              ) : (
                consoleLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`p-1.5 rounded ${
                      log.type === 'error' ? 'bg-rose-950/40 text-rose-300' :
                      log.type === 'warn' ? 'bg-amber-950/40 text-amber-300' :
                      'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-500 mr-1.5">{log.time}</span>
                    <span>{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
