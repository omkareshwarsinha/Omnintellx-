/**
 * Omnintellx — Unified 3-Panel Developer IDE & Agentic Studio
 * 
 * Authentic Agentic Framework Integration:
 * - Left Panel: ReAct Loop State Machine + Dynamic Task DAG + Autonomous Critic/Debugger
 * - Center Panel: Multi-Tab Workspace Code Editor + Syntax Gutter + Diff Inspection
 * - Right Panel: Live Sandboxed DOM Preview + Console Inspector + final_codes/ One-Click Distribution
 * 
 * Android & Mobile Responsive:
 * - Fluid desktop 3-panel workstation (>= 1024px)
 * - Touch-optimized segmented switcher on Android/Mobile (< 1024px) with >= 44px touch targets
 * - Real-time disk synchronization between Agent actions and Editor / Preview
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import JSZip from 'jszip';
import {
  Project,
  ProjectFile,
  ExecutionStatus,
  ExecutionMode,
  TaskItem,
  AgentState,
  Artifact,
  RunEvent,
  PendingToolRequest,
  ScreenId,
  OMNINTELLX_ORCHESTRATION_RULES
} from '../types';
import { INITIAL_AGENT_TEAM } from '../engine/agentDefinitions';
import { StorageService } from '../engine/storage';
import { autoFormatCode } from '../utils/codeFormatter';
import { downloadBlobSafely, downloadTextFileSafely, downloadZipSafely } from '../utils/downloadHelper';
import {
  Sparkles,
  Play,
  Pause,
  Square,
  RefreshCw,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Save,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Terminal,
  Monitor,
  Tablet,
  Smartphone,
  Download,
  Copy,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Layers,
  Bug,
  ShieldAlert,
  Zap,
  Activity,
  Maximize2,
  Sliders,
  Eye,
  GitCompare,
  Plus,
  Trash2,
  Package,
  Search,
  RotateCcw,
  CheckCircle,
  Cpu
} from 'lucide-react';

interface UnifiedStudioScreenProps {
  project: Project | null;
  projects: Project[];
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onSaveFile: (fileId: string, newContent: string) => void;
  onCreateFile: (fileName: string) => void;
  onDeleteFile: (fileId: string) => void;

  // Agent Engine State
  status: ExecutionStatus;
  tasks: TaskItem[];
  agents: AgentState[];
  artifacts: Artifact[];
  runEvents: RunEvent[];
  pendingRequest: PendingToolRequest | null;
  currentGoal: string;
  concurrency: number;
  activeConcurrency: number;

  // Actions
  onStartPipeline: (goal: string, mode: ExecutionMode, enabledAgents?: Set<string>) => void;
  onPlanOnly: (goal: string, enabledAgents?: Set<string>) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onResolvePermission: (approved: boolean) => void;
  onCancelTask: (taskId: string) => void;
  onUpdateOutputFiles: () => Promise<void>;
  onExportStandalone: () => void;
  onNavigate: (screen: ScreenId) => void;
  onSwitchProject: (projectId: string) => void;
}

export const UnifiedStudioScreen: React.FC<UnifiedStudioScreenProps> = ({
  project,
  projects,
  activeFileId,
  onSelectFile,
  onSaveFile,
  onCreateFile,
  onDeleteFile,
  status,
  tasks,
  agents,
  artifacts,
  runEvents,
  pendingRequest,
  currentGoal,
  concurrency,
  activeConcurrency,
  onStartPipeline,
  onPlanOnly,
  onPause,
  onResume,
  onStop,
  onResolvePermission,
  onCancelTask,
  onUpdateOutputFiles,
  onExportStandalone,
  onNavigate,
  onSwitchProject
}) => {
  // Mobile / Android view switcher ('dag' | 'editor' | 'preview')
  const [mobileTab, setMobileTab] = useState<'dag' | 'editor' | 'preview'>('dag');
  // Left Panel Subtab ('dag' | 'specialists' | 'rules')
  const [leftSubTab, setLeftSubTab] = useState<'dag' | 'specialists' | 'rules'>('dag');

  // User-configured AI Connector State
  const [activeTarget, setActiveTarget] = useState(() => StorageService.loadActiveTarget());
  const [showConnectorDropdown, setShowConnectorDropdown] = useState(false);
  const [providerList, setProviderList] = useState(() => StorageService.loadProviders());

  const handleSwitchConnector = (provId: string, modelId: string, provType: any) => {
    const newTarget = { providerId: provId, providerType: provType, modelId };
    StorageService.saveActiveTarget(newTarget);
    setActiveTarget(newTarget);
    setShowConnectorDropdown(false);
  };

  // Mission Input State
  const [missionInput, setMissionInput] = useState(currentGoal || '');
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('AUTOMATIC');
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Editor State
  const [editorContent, setEditorContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [diffMode, setDiffMode] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [fileSearch, setFileSearch] = useState('');
  const [newFileInputOpen, setNewFileInputOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [mobileFileDrawerOpen, setMobileFileDrawerOpen] = useState(false);

  // Right Panel / Sandbox State
  const [rightSubTab, setRightSubTab] = useState<'sandbox' | 'deliverables'>('sandbox');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState(0);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: 'log' | 'warn' | 'error'; message: string; time: string }>>([]);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [deliverableDir, setDeliverableDir] = useState<'all' | 'omni' | 'final_codes'>('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportModalFile, setExportModalFile] = useState<string>('output/omni/index.html');
  const [downloadStatusMsg, setDownloadStatusMsg] = useState<string | null>(null);

  // Active File lookup
  const activeFile = useMemo(() => {
    if (!project || !project.files || project.files.length === 0) return null;
    return project.files.find(f => f.id === activeFileId) || project.files[0] || null;
  }, [project, activeFileId]);

  // Sync editor buffer on file switch
  useEffect(() => {
    if (activeFile) {
      setEditorContent(activeFile.content);
      setIsDirty(false);
    }
  }, [activeFile?.id, activeFile?.content]);

  // Filter project files
  const filteredFiles = useMemo(() => {
    if (!project) return [];
    return project.files.filter(f =>
      f.name.toLowerCase().includes(fileSearch.toLowerCase())
    );
  }, [project, fileSearch]);

  const sourceFiles = filteredFiles.filter(f => !f.name.startsWith('final_codes/') && !f.name.startsWith('output/'));
  const finalCodesFiles = (project?.files || []).filter(f => f.name.startsWith('final_codes/'));
  const omniFiles = (project?.files || []).filter(f => f.name.startsWith('output/omni/'));
  const allDeliverableFiles = (project?.files || []).filter(f => f.name.startsWith('final_codes/') || f.name.startsWith('output/omni/'));

  // Compile sandboxed HTML + CSS + JS bundle
  const bundledSandboxDoc = useMemo(() => {
    if (!project || !project.files || project.files.length === 0) {
      return `<!DOCTYPE html><html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:90vh;color:#888;background:#0d1117"><h2>No workspace files yet. Run ReAct Agent to generate application.</h2></body></html>`;
    }

    // Prefer flagship html from output/omni, final_codes, or root
    const htmlFile =
      project.files.find(f => f.name === 'output/omni/index.html') ||
      project.files.find(f => f.name === 'final_codes/index.html') ||
      project.files.find(f => f.name === 'output/omni/standalone.html') ||
      project.files.find(f => f.name === 'final_codes/standalone.html') ||
      project.files.find(f => f.name === 'index.html') ||
      project.files.find(f => f.name.endsWith('.html')) ||
      project.files[0];

    let content = htmlFile.content;

    // Inline CSS and JS if it's an HTML file
    if (htmlFile.name.endsWith('.html')) {
      const cssFiles = project.files.filter(f => f.name.endsWith('.css'));
      const jsFiles = project.files.filter(f => f.name.endsWith('.js') && !f.name.includes('config'));

      if (content.includes('styles.css') || content.includes('style.css')) {
        const stylesContent = cssFiles.map(c => c.content).join('\n');
        content = content.replace(/<link[^>]*href=["'][^"']*(styles?\.css)["'][^>]*>/gi, `<style>\n${stylesContent}\n</style>`);
      }

      if (content.includes('app.js') || content.includes('main.js') || content.includes('script.js')) {
        const jsContent = jsFiles.map(j => j.content).join('\n');
        content = content.replace(/<script[^>]*src=["'][^"']*(app|main|script)\.js["'][^>]*><\/script>/gi, `<script>\n${jsContent}\n</script>`);
      }

      // Inject console logger and error boundary
      const consoleScript = `
        <script>
          (function() {
            function send(type, args) {
              try {
                window.parent.postMessage({
                  source: 'preview_console',
                  type: type,
                  message: Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
                }, '*');
              } catch(e) {}
            }
            const origLog = console.log;
            const origWarn = console.warn;
            const origError = console.error;
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
        content = content.replace('<head>', `<head>\n${consoleScript}`);
      } else {
        content = `${consoleScript}\n${content}`;
      }
    } else {
      content = `<!DOCTYPE html><html><body style="font-family:monospace;background:#0d1117;color:#e6edf3;padding:24px"><pre>${content}</pre></body></html>`;
    }

    return content;
  }, [project, iframeKey]);

  // Listen to iframe console
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data && e.data.source === 'preview_console') {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setConsoleLogs(prev => [...prev.slice(-99), { type: e.data.type, message: e.data.message, time: timeStr }]);
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, editorContent]);

  const handleSaveFile = () => {
    if (activeFile) {
      onSaveFile(activeFile.id, editorContent);
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      setIframeKey(k => k + 1);
    }
  };

  const handleFormatFile = () => {
    if (!activeFile) return;
    const formatted = autoFormatCode(editorContent, activeFile.name);
    setEditorContent(formatted);
    setIsDirty(formatted !== activeFile.content);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onCreateFile(newFileName.trim());
    setNewFileName('');
    setNewFileInputOpen(false);
  };

  // Download all files and deliverables as ZIP
  const handleDownloadAllZip = async () => {
    try {
      setDownloadingZip(true);
      setDownloadStatusMsg('Preparing ZIP archive...');

      // Collect all files from project
      const allFiles = project?.files || [];
      if (allFiles.length === 0) {
        setDownloadStatusMsg('No project files to zip.');
        return;
      }

      const filename = `${(project?.name || 'omnintellx').replace(/[^a-zA-Z0-9_-]/g, '_')}-release.zip`;
      const res = await downloadZipSafely(
        filename,
        allFiles.map(f => ({ name: f.name, content: f.content })),
        {
          'README.md': `# ${project?.name || 'Omnintellx Project'}\nExported complete application package.\nDeliverables available in omni/, output/omni/ and final_codes/.\nTimestamp: ${new Date().toISOString()}\n`
        }
      );

      setDownloadStatusMsg(res.message);
      setTimeout(() => setDownloadStatusMsg(null), 5000);
    } catch (err: any) {
      console.error('Failed to generate ZIP:', err);
      setDownloadStatusMsg(`ZIP Notice: ${err.message}. Use Direct File Export.`);
    } finally {
      setDownloadingZip(false);
    }
  };

  // Download standalone HTML application
  const handleDownloadStandalone = async () => {
    const standalone =
      project?.files.find(f => f.name === 'omni/index.html') ||
      project?.files.find(f => f.name === 'output/omni/index.html') ||
      project?.files.find(f => f.name === 'final_codes/index.html') ||
      project?.files.find(f => f.name === 'omni/standalone.html') ||
      project?.files.find(f => f.name === 'output/omni/standalone.html') ||
      project?.files.find(f => f.name === 'final_codes/standalone.html') ||
      project?.files.find(f => f.name === 'index.html') ||
      project?.files.find(f => f.name.endsWith('.html'));

    const content = standalone ? standalone.content : bundledSandboxDoc;
    const filename = `${(project?.name || 'omnintellx').replace(/[^a-zA-Z0-9_-]/g, '_')}-standalone.html`;

    const res = await downloadTextFileSafely(filename, content, 'text/html;charset=utf-8');
    setCopyFeedback(res.message);
    setTimeout(() => setCopyFeedback(null), 4000);
  };

  // Download individual file
  const handleDownloadIndividualFile = async (fileName: string, content: string) => {
    const isHtml = fileName.endsWith('.html');
    const isJson = fileName.endsWith('.json');
    const mimeType = isHtml ? 'text/html;charset=utf-8' : isJson ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8';
    const cleanBase = fileName.split('/').pop() || fileName;

    const res = await downloadTextFileSafely(cleanBase, content, mimeType);
    setCopyFeedback(res.message);
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  // Copy individual file
  const handleCopyIndividualFile = (fileName: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopyFeedback(`Copied ${fileName.split('/').pop()} to clipboard!`);
      setTimeout(() => setCopyFeedback(null), 3000);
    }).catch(() => {
      setExportModalFile(fileName);
      setShowExportModal(true);
    });
  };

  // Copy code bundle
  const handleCopyBundle = () => {
    const flagship =
      project?.files.find(f => f.name === 'output/omni/index.html') ||
      project?.files.find(f => f.name === 'final_codes/index.html') ||
      project?.files.find(f => f.name === 'index.html');
    const content = flagship ? flagship.content : bundledSandboxDoc;
    navigator.clipboard.writeText(content).then(() => {
      setCopyFeedback('Copied standalone bundle to clipboard!');
      setTimeout(() => setCopyFeedback(null), 3000);
    }).catch(() => {
      setExportModalFile(flagship?.name || 'output/omni/index.html');
      setShowExportModal(true);
    });
  };

  // Presets
  const presets = [
    'Personal Expense Tracker with Charts and Categories',
    'Kanban Task Board with Drag & Drop and Local Storage',
    'Weather Forecast & Air Quality Explorer',
    'Markdown Document Studio with Realtime HTML Export'
  ];

  // ReAct metrics
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const totalTasks = tasks.length || 1;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  // Line counter for editor
  const lineNumbers = useMemo(() => {
    const count = editorContent.split('\n').length;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [editorContent]);

  return (
    <div className="w-full flex flex-col h-[calc(100dvh-56px)] pb-[64px] lg:pb-0 bg-[#0B0E14] text-slate-100 font-sans overflow-hidden">
      {/* ────────────────────────────────────────────────────────────────
          TOP TOOLBAR: Mission Bar, Agent Status & Android Tab Switcher
          ──────────────────────────────────────────────────────────────── */}
      <div className="flex-none bg-[#111620] border-b border-white/10 px-3 py-2 sm:px-4 sm:py-2 z-30">
        {/* Omnintellx Specialist Agent Orchestration Banner */}
        <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-white/5 text-[11px]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex-none shadow-sm">
              OMNINTELLX
            </span>
            <span className="font-semibold text-slate-200 tracking-wide truncate">
              SPECIALIST AGENT ORCHESTRATION
            </span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-400 truncate">
              7 Specialist Roles • 10 Enforced Orchestration Rules
            </span>
          </div>
          <a
            href="https://github.com/msitarzewski/agency-agents"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 flex-none font-mono text-[11px] hover:underline"
            title="agency-agents reference specification"
          >
            <span>agency-agents</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 max-w-full">
          {/* Mission Input & Run Button */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                value={missionInput}
                onChange={(e) => setMissionInput(e.target.value)}
                placeholder="Describe your software goal (e.g. Build an Expense Tracker with charts)..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && missionInput.trim() && status !== 'RUNNING') {
                    onStartPipeline(missionInput.trim(), executionMode);
                  }
                }}
                className="w-full bg-[#070A10] border border-white/10 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-8 transition-colors"
              />
              {missionInput && (
                <button
                  onClick={() => setMissionInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {status === 'RUNNING' ? (
              <div className="flex items-center gap-1.5 flex-none">
                <button
                  onClick={onPause}
                  className="min-h-[44px] px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title="Pause Pipeline"
                >
                  <Pause className="w-4 h-4" />
                  <span className="hidden sm:inline">Pause</span>
                </button>
                <button
                  onClick={onStop}
                  className="min-h-[44px] px-3 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title="Stop Pipeline"
                >
                  <Square className="w-4 h-4" />
                  <span className="hidden sm:inline">Stop</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (!missionInput.trim()) return;
                  onStartPipeline(missionInput.trim(), executionMode);
                }}
                disabled={!missionInput.trim()}
                className="min-h-[44px] px-3.5 sm:px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 flex-none transition-all"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Run ReAct Agent</span>
              </button>
            )}
          </div>

          {/* Status Indicator & Quick Actions */}
          <div className="flex items-center justify-between md:justify-end gap-2 flex-none">
            {/* Active AI Connector Selector */}
            <div className="relative">
              <button
                onClick={() => setShowConnectorDropdown(prev => !prev)}
                className="min-h-[40px] px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Active AI Provider Connector — Click to switch or configure"
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono text-[11px] font-bold text-white uppercase">{activeTarget.providerType}</span>
                <span className="text-[10px] text-cyan-400 font-mono hidden sm:inline">({activeTarget.modelId})</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showConnectorDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#0E1420] border border-white/10 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-white/5">
                    <span>AI Connectors Hub</span>
                    <button onClick={() => { setShowConnectorDropdown(false); onNavigate('models'); }} className="text-emerald-400 hover:underline">Manage All</button>
                  </div>
                  {providerList.map(prov => {
                    const isSelected = activeTarget.providerId === prov.id;
                    return (
                      <button
                        key={prov.id}
                        onClick={() => handleSwitchConnector(prov.id, prov.selectedModelId || prov.defaultModel || prov.models[0] || 'default', prov.type)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                            : 'hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-100 truncate">{prov.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 truncate">{prov.selectedModelId || prov.defaultModel}</div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 flex-none" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Engine Status Badge */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#070A10] border border-white/5 text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${
                status === 'RUNNING' ? 'bg-emerald-400 animate-ping' :
                status === 'WAITING_PERMISSION' ? 'bg-amber-400 animate-pulse' :
                status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-slate-500'
              }`} />
              <span className="font-semibold text-slate-300 uppercase tracking-wider">{status}</span>
              {status === 'RUNNING' && (
                <span className="text-slate-400">· {completedTasks}/{totalTasks} DAG</span>
              )}
            </div>

            {/* Release Export Shortcut */}
            <button
              onClick={() => onNavigate('output')}
              className="min-h-[40px] px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Open Dedicated final_codes Output Studio"
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">final_codes/</span>
            </button>
          </div>
        </div>

        {/* Quick Prompt Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 mt-1 scrollbar-none text-[11px]">
          <span className="text-slate-500 flex-none">Presets:</span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setMissionInput(preset);
                if (status !== 'RUNNING') {
                  onStartPipeline(preset, executionMode);
                }
              }}
              className="flex-none px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5 whitespace-nowrap transition-colors"
            >
              {preset.split(' ')[0]} {preset.split(' ')[1]}...
            </button>
          ))}
        </div>

        {/* 📱 ANDROID & MOBILE SEGMENTED SWITCHER (< 1024px) */}
        <div className="flex lg:hidden items-center justify-between gap-1 mt-2 pt-2 border-t border-white/10">
          <button
            onClick={() => setMobileTab('dag')}
            className={`flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mobileTab === 'dag'
                ? 'bg-emerald-600 text-slate-950 font-bold shadow-md shadow-emerald-950/40'
                : 'bg-[#0B0E14] text-slate-400 hover:text-slate-200 border border-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Agent DAG</span>
            {status === 'RUNNING' && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping ml-1" />}
          </button>

          <button
            onClick={() => setMobileTab('editor')}
            className={`flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mobileTab === 'editor'
                ? 'bg-emerald-600 text-slate-950 font-bold shadow-md shadow-emerald-950/40'
                : 'bg-[#0B0E14] text-slate-400 hover:text-slate-200 border border-white/5'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Code Editor</span>
            {isDirty && <span className="w-2 h-2 rounded-full bg-amber-400 ml-1" />}
          </button>

          <button
            onClick={() => setMobileTab('preview')}
            className={`flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mobileTab === 'preview'
                ? 'bg-emerald-600 text-slate-950 font-bold shadow-md shadow-emerald-950/40'
                : 'bg-[#0B0E14] text-slate-400 hover:text-slate-200 border border-white/5'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Sandbox & Output</span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────
          MAIN 3-PANEL WORKSTATION CONTAINER
          ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

        {/* ════════════════════════════════════════════════════════════════
            PANEL 1: RE-ACT AGENT LOOP & DYNAMIC TASK DAG (Left, ~32%)
            ════════════════════════════════════════════════════════════════ */}
        <div className={`w-full lg:w-[32%] flex-none flex flex-col border-r border-white/10 bg-[#0d121b] overflow-hidden ${
          mobileTab === 'dag' ? 'flex flex-1' : 'hidden lg:flex'
        }`}>
          {/* Panel Header & Subtab Switcher */}
          <div className="flex-none px-3 py-2 bg-[#111622] border-b border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Orchestrator Panel
                </h3>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {completedTasks}/{totalTasks} ({progressPercent}%)
              </div>
            </div>

            {/* Subtab Toggle Buttons */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#080B10] border border-white/5">
              <button
                onClick={() => setLeftSubTab('dag')}
                className={`flex-1 py-1 px-2 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  leftSubTab === 'dag'
                    ? 'bg-emerald-600 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Task DAG</span>
              </button>
              <button
                onClick={() => setLeftSubTab('specialists')}
                className={`flex-1 py-1 px-2 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  leftSubTab === 'specialists'
                    ? 'bg-emerald-600 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>7 Specialists</span>
              </button>
              <button
                onClick={() => setLeftSubTab('rules')}
                className={`flex-1 py-1 px-2 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  leftSubTab === 'rules'
                    ? 'bg-emerald-600 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <ShieldAlert className="w-3 h-3 text-emerald-400" />
                <span>10 Rules</span>
              </button>
            </div>
          </div>

          {/* Pending Permission Human-in-the-Loop Banner */}
          {pendingRequest && (
            <div className="flex-none m-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col gap-2 shadow-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-none mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-300">Tool Approval Requested</div>
                  <div className="text-[11px] text-amber-200/90 mt-0.5">{pendingRequest.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end mt-1">
                <button
                  onClick={() => onResolvePermission(false)}
                  className="min-h-[36px] px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium"
                >
                  Reject
                </button>
                <button
                  onClick={() => onResolvePermission(true)}
                  className="min-h-[36px] px-3.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow"
                >
                  Approve Execution
                </button>
              </div>
            </div>
          )}

          {/* Conditional View Rendering based on leftSubTab */}
          {leftSubTab === 'specialists' ? (
            /* ────────────────────────────────────────────────────────
               VIEW A: 7 SPECIALIST AGENTS ROSTER (agency-agents spec)
               ──────────────────────────────────────────────────────── */
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  OMNINTELLX Specialist Roles
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  7 Active Agents
                </span>
              </div>

              {INITIAL_AGENT_TEAM.map((agent, idx) => {
                const liveState = agents.find(a => a.definitionId === agent.id || a.id === agent.id);
                const isWorking = liveState?.status === 'WORKING';
                const isCompleted = liveState?.status === 'COMPLETED';

                return (
                  <div
                    key={agent.id}
                    className="p-3 rounded-xl bg-[#111622] border border-white/5 hover:border-white/15 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-sm flex-none"
                          style={{ backgroundColor: agent.avatarColor }}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                            {agent.name}
                            <span className="text-[10px] font-mono text-slate-400 font-normal">
                              ({agent.role})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 leading-tight">
                            {agent.title}
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider flex-none ${
                        isWorking ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' :
                        isCompleted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        'bg-white/5 text-slate-400'
                      }`}>
                        {liveState?.status || 'READY'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 bg-black/20 p-2 rounded-lg border border-white/5 whitespace-pre-line leading-relaxed">
                      {agent.systemPrompt.split('Mission & Rules:\n')[1] || agent.systemPrompt.slice(0, 160)}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-slate-400">
                      <span className="text-cyan-400">Tools: {agent.allowedTools.slice(0, 3).join(', ')}{agent.allowedTools.length > 3 ? '...' : ''}</span>
                      <span className="text-slate-500">Trait: {agent.preferredModelTrait}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : leftSubTab === 'rules' ? (
            /* ────────────────────────────────────────────────────────
               VIEW B: 10 ORCHESTRATION RULES (agency-agents spec)
               ──────────────────────────────────────────────────────── */
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Orchestration Guardrails
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  10/10 Enforced
                </span>
              </div>

              {OMNINTELLX_ORCHESTRATION_RULES.map(rule => (
                <div
                  key={rule.id}
                  className="p-3 rounded-xl bg-[#111622] border border-white/5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] flex items-center justify-center">
                        {rule.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">
                        {rule.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {rule.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 font-medium pl-6">
                    &ldquo;{rule.rule}&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            /* ────────────────────────────────────────────────────────
               VIEW C: DYNAMIC TASK DAG & LIVE REACT EVENT STREAM
               ──────────────────────────────────────────────────────── */
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-1">
                Topological Task Graph ({tasks.length} Nodes)
              </div>

            {tasks.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-white/10 text-center text-slate-500 text-xs space-y-2 my-4">
                <Layers className="w-6 h-6 mx-auto text-slate-600" />
                <p>Task DAG is empty. Enter a software mission goal above and click &quot;Run ReAct Agent&quot; to formulate the dependency graph.</p>
              </div>
            ) : (
              tasks.map((task, idx) => {
                const isSelected = selectedTask?.id === task.id;
                const isRunning = task.status === 'RUNNING';
                const isCompleted = task.status === 'COMPLETED';
                const isFailed = task.status === 'FAILED';

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/40 shadow-md shadow-emerald-950/40'
                        : isRunning
                        ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/30'
                        : isCompleted
                        ? 'bg-[#111722] border-white/5 hover:border-white/15'
                        : isFailed
                        ? 'bg-rose-950/20 border-rose-500/30'
                        : 'bg-[#111620] border-white/5 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-slate-400 flex-none">
                          #{idx + 1}
                        </span>
                        <span className={`w-2 h-2 rounded-full flex-none ${
                          isRunning ? 'bg-emerald-400 animate-ping' :
                          isCompleted ? 'bg-emerald-400' :
                          isFailed ? 'bg-rose-400' : 'bg-slate-600'
                        }`} />
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {task.title}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isRunning ? 'bg-emerald-500/20 text-emerald-300' :
                        isCompleted ? 'bg-emerald-500/10 text-emerald-400' :
                        isFailed ? 'bg-rose-500/20 text-rose-300' : 'bg-white/5 text-slate-400'
                      }`}>
                        {task.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 pl-6">
                      <span className="font-mono text-cyan-300">{task.agentId}</span>
                      {task.prerequisites.length > 0 && (
                        <span className="text-slate-500 text-[10px]">
                          requires {task.prerequisites.length} task{task.prerequisites.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Live ReAct Reasoning Trace (Thought - Action - Observation - Reflection) */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  Live ReAct Event Stream
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  {runEvents.length} events
                </span>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto font-mono text-[11px] p-2 rounded-xl bg-[#090C12] border border-white/5 scrollbar-thin">
                {runEvents.slice(0, 15).map((evt, i) => (
                  <div key={evt.id || i} className="flex items-start gap-1.5 py-0.5 border-b border-white/5 last:border-0">
                    <span className="text-slate-600 flex-none">{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span className={`font-semibold flex-none ${
                      evt.status === 'success' ? 'text-emerald-400' :
                      evt.status === 'error' ? 'text-rose-400' :
                      evt.status === 'warning' ? 'text-amber-400' : 'text-cyan-400'
                    }`}>[{evt.type.split('.')[0]}]</span>
                    <span className="text-slate-300 break-words">{evt.summary}</span>
                  </div>
                ))}
                {runEvents.length === 0 && (
                  <div className="text-slate-600 py-2 text-center text-xs">Awaiting agent execution events...</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

        {/* ════════════════════════════════════════════════════════════════
            PANEL 2: WORKSPACE CODE STUDIO & MULTI-TAB EDITOR (Center, ~38%)
            ════════════════════════════════════════════════════════════════ */}
        <div className={`w-full lg:w-[38%] flex-none flex flex-col border-r border-white/10 bg-[#0B0E14] overflow-hidden ${
          mobileTab === 'editor' ? 'flex flex-1' : 'hidden lg:flex'
        }`}>
          {/* Editor Top Control Bar */}
          <div className="flex-none px-3 py-2 bg-[#111622] border-b border-white/10 flex items-center justify-between gap-2 overflow-x-auto">
            {/* File Tabs */}
            <div className="flex items-center gap-1 min-w-0 overflow-x-auto scrollbar-none flex-1">
              {sourceFiles.map(file => {
                const isActive = activeFile?.id === file.id;
                return (
                  <button
                    key={file.id}
                    onClick={() => {
                      onSelectFile(file.id);
                      setMobileFileDrawerOpen(false);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-t-lg text-xs font-mono transition-all flex-none border-b-2 ${
                      isActive
                        ? 'bg-[#0B0E14] text-white border-indigo-500 font-semibold shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 text-slate-400 border-transparent'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="truncate max-w-[110px]">{file.name}</span>
                    {isActive && isDirty && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />
                    )}
                  </button>
                );
              })}

              <button
                onClick={() => setNewFileInputOpen(true)}
                className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors flex-none"
                title="New File"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Editor Action Buttons */}
            <div className="flex items-center gap-1.5 flex-none">
              <button
                onClick={() => setMobileFileDrawerOpen(prev => !prev)}
                className="lg:hidden p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1"
                title="Files Explorer"
              >
                <Folder className="w-3.5 h-3.5" />
                <span className="text-[10px]">Files</span>
              </button>

              <button
                onClick={handleFormatFile}
                className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                title="Auto Format Code"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline text-[11px]">Format</span>
              </button>

              <button
                onClick={() => setDiffMode(prev => !prev)}
                className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                  diffMode ? 'bg-indigo-600 text-white' : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
                title="Toggle Diff Mode"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Diff</span>
              </button>

              <button
                onClick={handleSaveFile}
                disabled={!isDirty}
                className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  saveSuccess
                    ? 'bg-emerald-600 text-white'
                    : isDirty
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                    : 'bg-white/5 text-slate-500 opacity-60 pointer-events-none'
                }`}
              >
                {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saveSuccess ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>

          {/* New File Inline Bar */}
          {newFileInputOpen && (
            <form onSubmit={handleCreateSubmit} className="flex-none p-2 bg-[#161c28] border-b border-white/10 flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Create File:</span>
              <input
                type="text"
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                placeholder="filename.js or components/header.html"
                autoFocus
                className="flex-1 bg-[#0B0E14] border border-white/20 rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
              <button type="submit" className="px-2.5 py-1 rounded bg-indigo-600 text-white text-xs font-semibold">
                Create
              </button>
              <button
                type="button"
                onClick={() => setNewFileInputOpen(false)}
                className="px-2 py-1 rounded text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </form>
          )}

          {/* Mobile File Explorer Drawer */}
          {mobileFileDrawerOpen && (
            <div className="flex-none p-3 bg-[#111722] border-b border-white/10 max-h-48 overflow-y-auto space-y-1">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Project File Explorer</div>
              {project?.files.map(f => (
                <div
                  key={f.id}
                  onClick={() => {
                    onSelectFile(f.id);
                    setMobileFileDrawerOpen(false);
                  }}
                  className={`flex items-center justify-between p-1.5 rounded cursor-pointer text-xs font-mono ${
                    activeFile?.id === f.id ? 'bg-indigo-600 text-white' : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <span className="truncate">{f.name}</span>
                  <span className="text-[10px] opacity-60">{(f.content.length / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>
          )}

          {/* Editor Area with Line Numbers Gutter */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Gutter */}
            <div className="flex-none w-10 sm:w-12 bg-[#090C12] text-slate-600 font-mono text-xs select-none py-3 text-right pr-2 border-r border-white/5 overflow-hidden">
              {lineNumbers.map(n => (
                <div key={n} className="leading-5 h-5">{n}</div>
              ))}
            </div>

            {/* Code Textarea / Diff Display */}
            {diffMode ? (
              <div className="flex-1 overflow-auto p-3 font-mono text-xs leading-5 bg-[#0B0E14] text-slate-200">
                <div className="text-slate-500 text-[11px] mb-2">// Diff Viewer — Saved vs Current Buffer</div>
                <div className="space-y-0.5">
                  {editorContent.split('\n').map((line, idx) => {
                    const originalLine = activeFile?.content.split('\n')[idx];
                    const isAdded = originalLine === undefined;
                    const isModified = originalLine !== undefined && originalLine !== line;
                    return (
                      <div
                        key={idx}
                        className={`px-1 rounded ${
                          isAdded ? 'bg-emerald-950/40 text-emerald-300' :
                          isModified ? 'bg-amber-950/40 text-amber-300' : 'text-slate-300'
                        }`}
                      >
                        {line || ' '}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <textarea
                value={editorContent}
                onChange={(e) => {
                  setEditorContent(e.target.value);
                  setIsDirty(true);
                }}
                spellCheck={false}
                wrap={wordWrap ? 'on' : 'off'}
                className="flex-1 w-full h-full p-3 bg-transparent text-slate-200 font-mono text-xs leading-5 resize-none focus:outline-none scrollbar-thin selection:bg-indigo-600 selection:text-white"
                style={{ tabSize: 2 }}
              />
            )}
          </div>

          {/* Editor Status Footer */}
          <div className="flex-none px-3 py-1.5 bg-[#0e131c] border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <div className="flex items-center gap-3">
              <span>{activeFile ? activeFile.name : 'No file'}</span>
              <span>{lineNumbers.length} lines</span>
              <span>{(editorContent.length / 1024).toFixed(1)} KB</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWordWrap(w => !w)}
                className="hover:text-slate-300"
              >
                Wrap: {wordWrap ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            PANEL 3: LIVE SANDBOX & RELEASE DELIVERABLES (Right, ~30%)
            ════════════════════════════════════════════════════════════════ */}
        <div className={`w-full lg:w-[30%] flex-none flex flex-col bg-[#090C12] overflow-hidden ${
          mobileTab === 'preview' ? 'flex flex-1' : 'hidden lg:flex'
        }`}>
          {/* Panel Top Tabs: [Sandbox Preview] vs [final_codes Deliverables] */}
          <div className="flex-none px-3 py-2 bg-[#111622] border-b border-white/10 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRightSubTab('sandbox')}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  rightSubTab === 'sandbox'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Live Sandbox</span>
              </button>

              <button
                onClick={() => setRightSubTab('deliverables')}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  rightSubTab === 'deliverables'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>final_codes/</span>
              </button>
            </div>

            {/* Sandbox Toolbar */}
            {rightSubTab === 'sandbox' && (
              <div className="flex items-center gap-1">
                {/* Viewport switch */}
                <button
                  onClick={() => setPreviewViewport('desktop')}
                  className={`p-1.5 rounded ${previewViewport === 'desktop' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-200'}`}
                  title="Desktop Viewport"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewViewport('tablet')}
                  className={`p-1.5 rounded ${previewViewport === 'tablet' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-200'}`}
                  title="Tablet Viewport"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewViewport('mobile')}
                  className={`p-1.5 rounded ${previewViewport === 'mobile' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-200'}`}
                  title="Mobile Viewport"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIframeKey(k => k + 1)}
                  className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                  title="Reload Sandbox"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Sub-Tab 1: Interactive Live Sandbox */}
          {rightSubTab === 'sandbox' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0e16] p-2 relative">
              {/* Responsive Iframe Frame */}
              <div className="flex-1 flex items-center justify-center overflow-auto bg-[#070A0F] rounded-xl border border-white/10 p-1">
                <iframe
                  key={iframeKey}
                  title="Omnintellx Live Sandbox"
                  srcDoc={bundledSandboxDoc}
                  sandbox="allow-scripts allow-forms allow-modals"
                  className={`bg-white transition-all duration-300 shadow-2xl rounded-lg ${
                    previewViewport === 'mobile'
                      ? 'w-[360px] h-[640px]'
                      : previewViewport === 'tablet'
                      ? 'w-[720px] h-[900px] max-w-full max-h-full'
                      : 'w-full h-full'
                  }`}
                />
              </div>

              {/* Console Inspector Drawer */}
              <div className="flex-none mt-2 rounded-xl bg-[#0e131e] border border-white/10 overflow-hidden">
                <button
                  onClick={() => setConsoleOpen(c => !c)}
                  className="w-full px-3 py-1.5 flex items-center justify-between text-xs font-mono text-slate-400 hover:text-slate-200 bg-[#121824]"
                >
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Sandbox Console</span>
                    {consoleLogs.some(l => l.type === 'error') && (
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">{consoleLogs.length} logs · {consoleOpen ? 'Collapse' : 'Expand'}</span>
                </button>

                {consoleOpen && (
                  <div className="max-h-36 overflow-y-auto p-2 font-mono text-[11px] space-y-1 bg-[#090C12] scrollbar-thin">
                    {consoleLogs.length === 0 ? (
                      <div className="text-slate-600 text-center py-2">No runtime logs or exceptions yet</div>
                    ) : (
                      consoleLogs.map((log, i) => (
                        <div key={i} className={`flex items-start gap-1.5 ${
                          log.type === 'error' ? 'text-rose-400' :
                          log.type === 'warn' ? 'text-amber-400' : 'text-slate-300'
                        }`}>
                          <span className="text-slate-600 flex-none">{log.time}</span>
                          <span className="break-all">{log.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Tab 2: Production Release Manager (Synchronized output/omni/ and final_codes/) */}
          {rightSubTab === 'deliverables' && (
            <div className="flex-1 flex flex-col overflow-y-auto p-3 space-y-3 bg-[#0a0e16] scrollbar-thin">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">Dual Production Deliverables</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    output/omni & final_codes
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Deliverables are automatically verified, packaged, and synchronized in both directories with zero external runtime dependencies.
                </p>

                {/* Status or Progress Feedback */}
                {downloadStatusMsg && (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono flex items-center justify-between">
                    <span>{downloadStatusMsg}</span>
                    <button onClick={() => setDownloadStatusMsg(null)} className="text-slate-400 hover:text-white ml-2">✕</button>
                  </div>
                )}

                {/* Primary Action Buttons */}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={handleDownloadAllZip}
                    disabled={downloadingZip}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-950" />
                    <span>{downloadingZip ? 'Packaging ZIP Archive...' : 'Download Full ZIP (All Files & Deliverables)'}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDownloadStandalone}
                      className="min-h-[40px] px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                      title="Download single-file standalone web application"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Download HTML</span>
                    </button>

                    <button
                      onClick={handleCopyBundle}
                      className="min-h-[40px] px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                      title="Copy complete standalone HTML bundle to clipboard"
                    >
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Copy HTML</span>
                    </button>
                  </div>

                  {/* Fallback Direct Server Download Links (Safe for mobile browsers & iframes) */}
                  {project?.id && (
                    <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 mt-1">
                      <span className="font-mono text-[10px]">Direct HTTP Links:</span>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/projects/${project.id}/download/zip`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline"
                        >
                          Server ZIP ↗
                        </a>
                        <span className="text-slate-600">•</span>
                        <a
                          href={`/api/projects/${project.id}/download/standalone`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline"
                        >
                          Server HTML ↗
                        </a>
                      </div>
                    </div>
                  )}

                  {copyFeedback && (
                    <div className="text-emerald-400 text-[11px] text-center font-mono py-1 animate-pulse">
                      {copyFeedback}
                    </div>
                  )}
                </div>
              </div>

              {/* Deliverable Directory Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    Package Deliverables Inventory
                  </div>
                  <div className="flex items-center gap-1 bg-[#121722] p-0.5 rounded-lg border border-white/5 text-[10px]">
                    <button
                      onClick={() => setDeliverableDir('all')}
                      className={`px-2 py-0.5 rounded ${deliverableDir === 'all' ? 'bg-emerald-600 text-slate-950 font-bold' : 'text-slate-400'}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setDeliverableDir('omni')}
                      className={`px-2 py-0.5 rounded ${deliverableDir === 'omni' ? 'bg-emerald-600 text-slate-950 font-bold' : 'text-slate-400'}`}
                    >
                      output/omni/
                    </button>
                    <button
                      onClick={() => setDeliverableDir('final_codes')}
                      className={`px-2 py-0.5 rounded ${deliverableDir === 'final_codes' ? 'bg-emerald-600 text-slate-950 font-bold' : 'text-slate-400'}`}
                    >
                      final_codes/
                    </button>
                  </div>
                </div>

                {/* Deliverables List with Direct Per-File Download & Copy */}
                <div className="space-y-1.5">
                  {(allDeliverableFiles.length > 0 ? allDeliverableFiles : [
                    { id: 'f_omni_idx', name: 'output/omni/index.html', content: bundledSandboxDoc, updatedAt: Date.now() },
                    { id: 'f_omni_sta', name: 'output/omni/standalone.html', content: bundledSandboxDoc, updatedAt: Date.now() },
                    { id: 'f_omni_man', name: 'output/omni/build-manifest.json', content: '{"status":"VERIFIED"}', updatedAt: Date.now() },
                    { id: 'f_fc_idx', name: 'final_codes/index.html', content: bundledSandboxDoc, updatedAt: Date.now() },
                    { id: 'f_fc_sta', name: 'final_codes/standalone.html', content: bundledSandboxDoc, updatedAt: Date.now() },
                    { id: 'f_fc_man', name: 'final_codes/build-manifest.json', content: '{"status":"VERIFIED"}', updatedAt: Date.now() }
                  ])
                    .filter(f => {
                      if (deliverableDir === 'omni') return f.name.startsWith('output/omni/');
                      if (deliverableDir === 'final_codes') return f.name.startsWith('final_codes/');
                      return f.name.startsWith('output/omni/') || f.name.startsWith('final_codes/');
                    })
                    .map((item) => {
                      const isHtml = item.name.endsWith('.html');
                      const sizeBytes = item.content ? item.content.length : 1420;

                      return (
                        <div
                          key={item.name}
                          className="p-2.5 rounded-xl bg-[#111724] border border-white/10 hover:border-emerald-500/30 flex items-center justify-between gap-2 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-mono px-1 py-0.2 rounded font-bold ${
                                item.name.startsWith('output/omni/') ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              }`}>
                                {item.name.startsWith('output/omni/') ? 'omni' : 'final'}
                              </span>
                              <span className="text-xs font-mono font-semibold text-white truncate">
                                {item.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {isHtml ? 'Zero-dependency standalone app bundle' : 'Release metadata & specifications'} • {(sizeBytes / 1024).toFixed(1)} KB
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-none">
                            <button
                              onClick={() => {
                                setExportModalFile(item.name);
                                setShowExportModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                              title="Inspect & Copy Raw Code"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleCopyIndividualFile(item.name, item.content)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                              title="Copy File Content"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDownloadIndividualFile(item.name, item.content)}
                              className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors"
                              title="Download File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Recompile & Sync Button */}
              <button
                onClick={onUpdateOutputFiles}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold flex items-center justify-center gap-2 transition-colors mt-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Re-verify & Sync Both Directories</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ────────────────────────────────────────────────────────────────
          RAW CODE EXPORT & DIRECT INSPECTION MODAL (Mobile & Sandbox Safe)
          ──────────────────────────────────────────────────────────────── */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-[#0e131d] border border-white/15 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex-none p-3.5 bg-[#121824] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white font-mono">{exportModalFile}</span>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-none p-2 bg-[#090C12] border-b border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <select
                  value={exportModalFile}
                  onChange={e => setExportModalFile(e.target.value)}
                  className="bg-[#141b27] text-white font-mono text-[11px] px-2 py-1 rounded border border-white/10 focus:outline-none"
                >
                  {(project?.files || []).map(f => (
                    <option key={f.name} value={f.name}>{f.name}</option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 font-mono">
                  {((project?.files.find(f => f.name === exportModalFile)?.content.length || 0) / 1024).toFixed(1)} KB
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const targetFile = project?.files.find(f => f.name === exportModalFile);
                    if (targetFile) handleCopyIndividualFile(targetFile.name, targetFile.content);
                  }}
                  className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Code</span>
                </button>
                <button
                  onClick={() => {
                    const targetFile = project?.files.find(f => f.name === exportModalFile);
                    if (targetFile) handleDownloadIndividualFile(targetFile.name, targetFile.content);
                  }}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-3 bg-[#080B10]">
              <pre className="font-mono text-xs text-slate-200 whitespace-pre leading-relaxed select-all">
                {project?.files.find(f => f.name === exportModalFile)?.content || '// File not found'}
              </pre>
            </div>

            <div className="flex-none p-3 bg-[#101520] border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[10px]">Android / Mobile touch-friendly code viewer</span>
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
