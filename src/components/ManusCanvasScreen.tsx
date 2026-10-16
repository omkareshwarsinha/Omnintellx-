/**
 * Omnintellx — Manus.im-Inspired Mobile-First Autonomous Studio Canvas
 * Features:
 * - Fullscreen Conversational & Agentic Canvas
 * - Real 7-Specialist Agent Thought Stream (Thought -> Plan -> Tool -> Observation -> Artifact)
 * - Embedded Live Preview Sandbox Card (Run & Test Directly)
 * - Multi-Deliverable Hub (/omni/, Android 9 APK, PHP Hosting Admin, Full ZIP)
 * - Floating Bottom Execution Pill with Quick Model Selector
 * - Slide-Out Workspace Navigation Drawer (Shifts all secondary views to menu)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Project,
  TaskItem,
  AgentState,
  Artifact,
  RunEvent,
  ExecutionStatus,
  ExecutionMode,
  ProviderConfig,
  InferenceTarget,
  ScreenId
} from '../types';
import { downloadZipSafely, downloadTextFileSafely, downloadAppDebugApk } from '../utils/downloadHelper';
import {
  Menu,
  X,
  Sparkles,
  Zap,
  Play,
  Pause,
  Square,
  RefreshCw,
  Cpu,
  Layers,
  FileCode,
  Smartphone,
  Server,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Terminal,
  Shield,
  Activity,
  History,
  Settings,
  FolderOpen,
  ArrowRight,
  Copy,
  ExternalLink,
  Lock,
  Plus
} from 'lucide-react';

interface ManusCanvasScreenProps {
  project: Project | null;
  projects: Project[];
  status: ExecutionStatus;
  tasks: TaskItem[];
  agents: AgentState[];
  artifacts: Artifact[];
  runEvents: RunEvent[];
  currentGoal: string;
  providers: ProviderConfig[];
  activeTarget: InferenceTarget;
  onStartPipeline: (prompt: string, mode: ExecutionMode) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onNavigate: (screen: ScreenId) => void;
  onSwitchProject: (id: string) => void;
  onCreateNewProject?: (name: string, desc: string) => void;
  onSelectTarget: (target: InferenceTarget) => void;
  onOpenLivePreviewModal: () => void;
}

export const ManusCanvasScreen: React.FC<ManusCanvasScreenProps> = ({
  project,
  projects,
  status,
  tasks,
  agents,
  artifacts,
  runEvents,
  currentGoal,
  providers,
  activeTarget,
  onStartPipeline,
  onPause,
  onResume,
  onStop,
  onNavigate,
  onSwitchProject,
  onCreateNewProject,
  onSelectTarget,
  onOpenLivePreviewModal
}) => {
  // Navigation & Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);

  // Input & Execution Mode
  const [promptInput, setPromptInput] = useState('');
  const [execMode, setExecMode] = useState<ExecutionMode>('AUTOMATIC');

  // Expanded thoughts accordions
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    planner: true,
    architect: true,
    designer: true,
    coder: true,
    debugger: true,
    security: true,
    reviewer: true,
    preview: true,
    deliverables: true
  });

  // Download & Copy State
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Auto-scroll stream to bottom when active
  const streamEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (status === 'RUNNING') {
      streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tasks, runEvents, status]);

  // Find active provider & model
  const activeProvider = providers.find(p => p.id === activeTarget.providerId) || providers[0] || null;
  const activeModel = activeTarget.modelId || activeProvider?.defaultModel || 'openai-large';

  // Toggle thought accordion
  const toggleSection = (sec: string) => {
    setExpandedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Build standalone preview doc
  const standaloneHtml =
    project?.files.find(f => f.name === 'omni/index.html')?.content ||
    project?.files.find(f => f.name === 'output/omni/index.html')?.content ||
    project?.files.find(f => f.name === 'final_codes/index.html')?.content ||
    project?.files.find(f => f.name === 'index.html')?.content ||
    project?.files.find(f => f.name.endsWith('.html'))?.content ||
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${project?.name || 'Omnintellx'}</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#0B0E14] text-slate-100 min-h-screen flex items-center justify-center p-6"><div class="text-center space-y-3"><div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-xl font-bold font-mono">Ω</div><h2 class="text-lg font-bold text-white">${project?.name || 'Omnintellx Standalone App'}</h2><p class="text-xs text-slate-400">Ready for autonomous code synthesis.</p></div></body></html>`;

  // Submit Run
  const handleRunSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptInput.trim()) return;
    onStartPipeline(promptInput.trim(), execMode);
    setPromptInput('');
  };

  // Quick Inspiration Prompts
  const inspirationPrompts = [
    {
      title: 'Fullstack E-Commerce Store',
      desc: 'Cart, product catalog, search filters, responsive checkout, and LocalStorage sync.',
      prompt: 'Build a complete, responsive E-Commerce application with product grid, category filter, instant search, shopping cart modal, checkout form with validation, and LocalStorage persistence.'
    },
    {
      title: 'Real-time 3D Particle Visualizer',
      desc: 'Interactive WebGL particle field with physics gravity, touch interaction, and presets.',
      prompt: 'Create a high-performance interactive 3D WebGL particle visualizer with fluid physics, mouse/touch gravity attraction, turbulence slider, color theme switcher, and FPS telemetry.'
    },
    {
      title: 'Kanban Project Studio',
      desc: 'Drag & drop task board, priorities, labels, export to JSON, and mobile touch support.',
      prompt: 'Build an intuitive Kanban project management application with draggable task cards, customizable columns (Todo, In Progress, Review, Done), label tags, subtasks, and JSON export.'
    },
    {
      title: 'Financial Crypto & Stock Terminal',
      desc: 'Live interactive candlesticks, technical indicators, order book, and dark mode.',
      prompt: 'Build a modern financial trading terminal with candlestick price charts, SMA/EMA indicators, simulated order placement, trade history ledger, and clean slate/emerald design.'
    }
  ];

  // Download All Deliverables as ZIP
  const handleDownloadZip = async () => {
    if (!project || project.files.length === 0) return;
    setDownloadingZip(true);
    setFeedback('Packaging complete release ZIP...');

    const filename = `${(project.name || 'omnintellx').toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_release.zip`;
    const res = await downloadZipSafely(
      filename,
      project.files.map(f => ({ name: f.name, content: f.content })),
      {
        'README.md': `# ${project.name || 'Omnintellx'}\nAutonomously generated software package.\nDeliverables available in omni/, output/omni/ and final_codes/.\n`
      }
    );

    setFeedback(res.message);
    setDownloadingZip(false);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Download Standalone HTML
  const handleDownloadHtml = async () => {
    const filename = `${(project?.name || 'omnintellx').toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_standalone.html`;
    const res = await downloadTextFileSafely(filename, standaloneHtml, 'text/html;charset=utf-8');
    setFeedback(res.message);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="relative min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col font-sans overflow-x-hidden">
      {/* 1. Manus-Style Minimalist Top Bar */}
      <header className="sticky top-0 z-30 bg-[#0B0E14]/90 backdrop-blur-md border-b border-white/10 px-3.5 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Hamburger Drawer Trigger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors active:scale-95"
            title="Open Workspace Menu"
          >
            <Menu className="w-5 h-5 text-emerald-400" />
          </button>

          {/* Logo & Project Title */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              {project?.name || 'Omnintellx Studio'}
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold hidden sm:inline">
              MANUS CANV4S
            </span>
          </div>
        </div>

        {/* Top Actions: Model Indicator, Preview & Download */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Model Switcher Pill Trigger */}
          <button
            onClick={() => setModelPickerOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-white/10 text-xs font-mono text-emerald-300 flex items-center gap-1.5 transition-all active:scale-95"
            title="Click to switch AI Model"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="max-w-[100px] sm:max-w-[140px] truncate">{activeModel}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Eye Preview Trigger */}
          <button
            onClick={onOpenLivePreviewModal}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors active:scale-95"
            title="Open Sandbox Preview in Fullscreen"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
          </button>

          {/* ZIP Download */}
          <button
            onClick={handleDownloadZip}
            disabled={downloadingZip}
            className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors active:scale-95 disabled:opacity-50"
            title="Download Full Project ZIP"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Conversational & Agentic Canvas Stream */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-6 pt-4 pb-36 space-y-6">
        {feedback && (
          <div className="sticky top-14 z-20 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono text-center shadow-lg backdrop-blur-md animate-fade-in">
            {feedback}
          </div>
        )}

        {/* STATE A: No Tasks Yet — Clean Manus Welcome Hero */}
        {tasks.length === 0 && (
          <div className="py-6 sm:py-12 space-y-8 animate-fade-in">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-2xl font-bold font-mono shadow-lg shadow-emerald-500/10">
                Ω
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                What do you want Omnintellx to build?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                7-specialist autonomous engineering agency will plan, architect, design, write real code, debug, and deliver verified builds in <code className="text-emerald-400 font-mono">/omni/</code>.
              </p>
            </div>

            {/* Inspiration Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {inspirationPrompts.map((card, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPromptInput(card.prompt);
                    onStartPipeline(card.prompt, execMode);
                  }}
                  className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-white/10 hover:border-emerald-500/40 text-left transition-all group active:scale-98 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{card.title}</span>
                    </h3>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                    {card.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STATE B: Active Mission or Finished Tasks — Real Agent Thought Stream */}
        {tasks.length > 0 && (
          <div className="space-y-5 animate-fade-in">
            {/* Mission Goal Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-semibold block">
                  Active Mission
                </span>
                <h2 className="text-base font-bold text-white truncate mt-0.5">
                  {currentGoal || 'Autonomous Fullstack Application Build'}
                </h2>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-mono">
                  <span>{tasks.length} total tasks</span>
                  <span>•</span>
                  <span className="text-emerald-400">{tasks.filter(t => t.status === 'COMPLETED').length} verified</span>
                  <span>•</span>
                  <span>{project?.files.length || 0} files</span>
                </div>
              </div>

              {/* Engine Run Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {status === 'RUNNING' ? (
                  <button
                    onClick={onPause}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                ) : status === 'PAUSED' ? (
                  <button
                    onClick={onResume}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume</span>
                  </button>
                ) : null}

                {status !== 'IDLE' && status !== 'COMPLETED' && (
                  <button
                    onClick={onStop}
                    className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30"
                    title="Stop Execution"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 1. 7-Specialist Thought Stream Accordions */}
            <div className="space-y-3">
              {/* Step 1: Project Planner */}
              <div className="rounded-2xl bg-slate-900/80 border border-white/10 overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleSection('planner')}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                      01
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                        <span>Project Planner</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">Requirements &amp; Scope</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">Deconstructs objectives, constraints, and acceptance criteria</p>
                    </div>
                  </div>
                  {expandedSections.planner ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {expandedSections.planner && (
                  <div className="p-3.5 pt-0 border-t border-white/5 text-xs text-slate-300 space-y-2 bg-black/20 font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                      <div className="text-[11px] text-emerald-400 font-bold">Planned Tasks ({tasks.length}):</div>
                      {tasks.map((t, idx) => (
                        <div key={t.id} className="flex items-center justify-between text-[11px] py-0.5">
                          <span className="text-slate-300 truncate max-w-[280px] sm:max-w-md">{idx + 1}. {t.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            t.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' :
                            t.status === 'RUNNING' ? 'bg-cyan-500/20 text-cyan-300 animate-pulse' : 'bg-white/5 text-slate-400'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Implementation & Code Generation */}
              <div className="rounded-2xl bg-slate-900/80 border border-emerald-500/30 overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleSection('coder')}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">
                      02
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                        <span>Implementation Specialist</span>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded">Production Code</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">{project?.files.length || 0} files created in project workspace</p>
                    </div>
                  </div>
                  {expandedSections.coder ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {expandedSections.coder && (
                  <div className="p-3.5 pt-0 border-t border-white/5 text-xs text-slate-300 space-y-2 bg-black/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {project?.files.slice(0, 8).map(f => (
                        <div key={f.name} className="p-2 rounded-lg bg-slate-950 border border-white/5 flex items-center justify-between">
                          <span className="text-[11px] font-mono text-white truncate max-w-[200px]">{f.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{(f.content.length / 1024).toFixed(1)} KB</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => onNavigate('workspace')}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                      >
                        <span>Open Full Code Editor &rarr;</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Inline Interactive Live Sandbox Preview */}
              <div className="rounded-2xl bg-slate-900/90 border border-emerald-500/40 overflow-hidden shadow-lg">
                <div className="p-3.5 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-xs sm:text-sm font-bold text-white">Interactive Sandbox Preview</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={onOpenLivePreviewModal}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Fullscreen View</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-black/60">
                  <div className="w-full h-80 rounded-xl overflow-hidden bg-white border border-white/10 shadow-inner">
                    <iframe
                      title="Omnintellx Manus Canvas Sandbox"
                      srcDoc={standaloneHtml}
                      sandbox="allow-scripts allow-forms allow-modals"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Multi-Target Deliverables Hub (/omni/, Android 9, PHP Hosting, ZIP) */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/30 border border-emerald-500/30 p-4 sm:p-5 space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Verified Multi-Delivery Hub</h3>
                      <p className="text-xs text-slate-400">Ready for Android 9, Web, and Self-Hosted PHP servers</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    /omni/ verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Target 1: Standalone HTML */}
                  <button
                    onClick={handleDownloadHtml}
                    className="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-white/10 hover:border-emerald-500/40 text-left transition-all active:scale-95 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Standalone HTML</span>
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-slate-400">Single-file zero-dependency offline app</p>
                  </button>

                  {/* Target 2: Complete Project ZIP */}
                  <button
                    onClick={handleDownloadZip}
                    disabled={downloadingZip}
                    className="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-white/10 hover:border-emerald-500/40 text-left transition-all active:scale-95 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Release ZIP</span>
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <p className="text-[11px] text-slate-400">All code, /omni/, &amp; final_codes/</p>
                  </button>

                  {/* Target 3: Android 9 APK Center */}
                  <button
                    onClick={() => onNavigate('android')}
                    className="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-white/10 hover:border-emerald-500/40 text-left transition-all active:scale-95 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Android 9 APK</span>
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-slate-400">minSdkVersion 28 wrapper &amp; WebAPK</p>
                  </button>

                  {/* Target 4: PHP Hosting & Limits */}
                  <button
                    onClick={() => onNavigate('hosting')}
                    className="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-white/10 hover:border-emerald-500/40 text-left transition-all active:scale-95 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">PHP Admin Panel</span>
                      <Server className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <p className="text-[11px] text-slate-400">Token quotas &amp; per-user rate limits</p>
                  </button>
                </div>
              </div>
            </div>
            <div ref={streamEndRef} />
          </div>
        )}
      </main>

      {/* 3. Floating Bottom Execution Pill (Manus.im Style) */}
      <div className="fixed bottom-[68px] sm:bottom-[74px] left-3 right-3 sm:left-auto sm:right-auto sm:w-[680px] sm:mx-auto z-30">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl p-2.5 sm:p-3 shadow-2xl space-y-2">
          {/* Top Pill Bar: Model Quick Switcher & Mode Switcher */}
          <div className="flex items-center justify-between px-1 text-xs">
            <div className="flex items-center gap-1.5">
              {/* Quick Model Selector Button */}
              <button
                onClick={() => setModelPickerOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-white/10 text-emerald-300 font-mono text-[11px] flex items-center gap-1.5"
              >
                <Cpu className="w-3 h-3 text-emerald-400" />
                <span className="max-w-[120px] truncate">{activeModel}</span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
              </button>

              {/* Mode Toggle: Auto vs Step */}
              <button
                onClick={() => setExecMode(m => m === 'AUTOMATIC' ? 'MANUAL' : 'AUTOMATIC')}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all ${
                  execMode === 'AUTOMATIC'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {execMode === 'AUTOMATIC' ? '⚡ Auto-Write' : '✋ Step Approval'}
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
              <span className={`w-2 h-2 rounded-full ${status === 'RUNNING' ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
              <span className="hidden sm:inline">{status}</span>
            </div>
          </div>

          {/* Textarea Input Form */}
          <form onSubmit={handleRunSubmit} className="flex items-end gap-2">
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleRunSubmit();
                }
              }}
              placeholder="What would you like Omnintellx to build? (e.g. 3D WebGL game, CRM dashboard, REST client...)"
              rows={2}
              className="flex-1 bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none font-sans"
            />

            <button
              type="submit"
              disabled={status === 'RUNNING' || !promptInput.trim()}
              className="p-3 min-w-[48px] min-h-[48px] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 disabled:opacity-40 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-all shrink-0 cursor-pointer"
              title="Launch Autonomous Agent Loop"
            >
              {status === 'RUNNING' ? (
                <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
              ) : (
                <Zap className="w-5 h-5 fill-current" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 4. Slide-Out Workspace Navigation Drawer (Shifts all developer screens to menu) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
          />

          {/* Drawer Body */}
          <div className="relative w-80 max-w-[85vw] h-full bg-[#0B0E14] border-r border-white/10 p-5 flex flex-col justify-between shadow-2xl z-10 animate-slide-in-left overflow-y-auto">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold font-mono">
                    Ω
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Omnintellx Menu</h2>
                    <p className="text-[11px] text-slate-400">Autonomous Software Studio</p>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold px-2 block mb-1">
                  Workspace Views
                </span>

                {[
                  { id: 'studio', label: 'Manus Canvas (Main)', icon: Sparkles, color: 'text-emerald-400' },
                  { id: 'workspace', label: 'Code Editor & Files', icon: FileCode, color: 'text-cyan-400' },
                  { id: 'liverun', label: '7-Specialist Task DAG', icon: Activity, color: 'text-emerald-400' },
                  { id: 'models', label: 'AI Gateways & Tester', icon: Cpu, color: 'text-amber-400' },
                  { id: 'output', label: 'Deliverables & Downloads', icon: Download, color: 'text-emerald-400' },
                  { id: 'android', label: 'Android 9 APK & WebAPK', icon: Smartphone, color: 'text-cyan-400' },
                  { id: 'hosting', label: 'PHP Hosting & Admin Limits', icon: Server, color: 'text-emerald-400' },
                  { id: 'history', label: 'Run History & Checkpoints', icon: History, color: 'text-slate-300' },
                  { id: 'settings', label: 'Studio Settings', icon: Settings, color: 'text-slate-400' }
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setDrawerOpen(false);
                        onNavigate(item.id as ScreenId);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-3 transition-colors text-left"
                    >
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Projects List Selector */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold px-2 block">
                  Switch Active Project
                </span>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {projects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSwitchProject(p.id);
                        setDrawerOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono text-left truncate transition-colors ${
                        p.id === project?.id
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-white/10 text-[11px] font-mono text-slate-500 space-y-1">
              <div>Active: <span className="text-emerald-400">{activeModel}</span></div>
              <div>Omnintellx Studio v5.2.0 • Android 9+ PWA</div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Instant Model Switcher Modal Sheet */}
      {modelPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            onClick={() => setModelPickerOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md bg-[#111622] border border-white/15 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xl z-10 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Select Active AI Model</h3>
              </div>
              <button
                onClick={() => setModelPickerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Pick the model that powers code generation and reasoning for your tasks:
            </p>

            <div className="space-y-2">
              {providers.map(prov => (
                <div key={prov.id} className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{prov.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400">{prov.status}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {prov.models.map(m => (
                      <button
                        key={m}
                        onClick={() => {
                          onSelectTarget({
                            providerId: prov.id,
                            providerType: prov.type,
                            modelId: m
                          });
                          setModelPickerOpen(false);
                          setFeedback(`Switched active model to ${m}!`);
                          setTimeout(() => setFeedback(null), 2500);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                          m === activeModel
                            ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 font-bold'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        {m} {m === activeModel ? '★' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between items-center text-xs">
              <button
                onClick={() => {
                  setModelPickerOpen(false);
                  onNavigate('models');
                }}
                className="text-emerald-400 hover:underline font-medium"
              >
                Configure Keys &amp; Test Gateways &rarr;
              </button>
              <button
                onClick={() => setModelPickerOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
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
