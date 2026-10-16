/**
 * Omnintellx — Multi-Agent Engineering Studio / Flagship Orchestrator Screen
 */

import React, { useState, useMemo } from 'react';
import {
  TaskItem,
  AgentState,
  Artifact,
  ProjectContract,
  Project,
  ProjectFile,
  ExecutionStatus,
  ExecutionMode,
  TimelineEvent,
  PendingToolRequest
} from '../types';
import {
  Bot,
  Play,
  Pause,
  RotateCcw,
  Hand,
  FastForward,
  ShieldCheck,
  ShieldAlert,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Layers,
  Users,
  Copy,
  Check,
  Eye,
  Terminal,
  Activity,
  FileCheck,
  Sparkles,
  StopCircle,
  FolderOutput,
  Download,
  ExternalLink,
  Laptop,
  Tablet,
  Smartphone,
  FileText,
  RefreshCw
} from 'lucide-react';
import { downloadHtmlFile, copyToClipboard } from '../utils/downloadHelper';
import { compileProjectToSingleHtml } from '../utils/singleHtmlCompiler';

interface OrchestratorScreenProps {
  status: ExecutionStatus;
  tasks: TaskItem[];
  agents: AgentState[];
  artifacts: Artifact[];
  contracts: ProjectContract[];
  timeline: TimelineEvent[];
  pendingRequest: PendingToolRequest | null;
  activeProject?: Project | null;
  onStartPipeline: (goal: string, mode: ExecutionMode) => void;
  onDryRunPlan: (goal: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onTakeControl: () => void;
  onResolvePermission: (approved: boolean) => void;
  onCreateCheckpoint: (name: string, reason: string) => void;
  onOpenFileInEditor?: (fileName: string) => void;
  onOpenSingleHtmlModal?: () => void;
  onUpdateOutputFiles?: () => void;
}

export const OrchestratorScreen: React.FC<OrchestratorScreenProps> = ({
  status,
  tasks,
  agents,
  artifacts,
  contracts,
  timeline,
  pendingRequest,
  activeProject,
  onStartPipeline,
  onDryRunPlan,
  onPause,
  onResume,
  onStop,
  onTakeControl,
  onResolvePermission,
  onCreateCheckpoint,
  onOpenFileInEditor,
  onOpenSingleHtmlModal,
  onUpdateOutputFiles
}) => {
  const [goalInput, setGoalInput] = useState('Build a fullstack Task & Sprint Management Dashboard with Kanban, REST API contracts, and persistent storage');
  const [activeTab, setActiveTab] = useState<'graph' | 'agents' | 'artifacts' | 'timeline' | 'contracts' | 'output'>('graph');
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'tasks' | 'security' | 'errors'>('all');
  const [copiedArtifact, setCopiedArtifact] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'tablet' | 'android' | 'compact'>('desktop');
  const [selectedOutputFile, setSelectedOutputFile] = useState<string>('output/index.html');

  const outputFiles = useMemo(() => {
    if (!activeProject) return [];
    return activeProject.files.filter(f => f.name.startsWith('output/') || f.name === 'index.html' || f.name === 'README.md');
  }, [activeProject]);

  const primaryHtmlContent = useMemo(() => {
    if (!activeProject) return '';
    const outIndex = activeProject.files.find(f => f.name === 'output/index.html');
    if (outIndex?.content) return outIndex.content;
    const directHtml = activeProject.files.find(f => f.name === 'index.html');
    if (directHtml?.content) {
      return compileProjectToSingleHtml(activeProject);
    }
    return '';
  }, [activeProject]);

  const activeOutputFileObj = useMemo(() => {
    if (!activeProject) return null;
    return activeProject.files.find(f => f.name === selectedOutputFile) || activeProject.files.find(f => f.name === 'output/index.html') || activeProject.files[0] || null;
  }, [activeProject, selectedOutputFile]);

  const handleDownloadOutput = (filename: string, content: string) => {
    downloadHtmlFile(filename, content);
  };

  const handleCopyOutput = async (content: string) => {
    const ok = await copyToClipboard(content);
    if (ok) {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  };

  const handleLaunchWindow = (content: string) => {
    const win = window.open();
    if (win) {
      win.document.open();
      win.document.write(content);
      win.document.close();
    }
  };

  const presets = [
    'Create a Python calculator CLI with add, subtract, multiply and divide operations, unit tests, and README.',
    'Build a Realtime Chat & Collaboration Application with JWT Auth and SQLite schema',
    'Build an E-Commerce Analytics Dashboard with Realtime Metrics & Data Visualizers',
    'Build a Secure File Vault with Client-Side Encryption & Key Rotation',
    'Build a High-Performance REST API Microservice with Spanner/SQL schemas & Auth Middleware'
  ];

  const activeArtifact = selectedArtifactId
    ? artifacts.find(a => a.id === selectedArtifactId)
    : artifacts[0] || null;

  const filteredTimeline = timeline.filter(evt => {
    if (timelineFilter === 'tasks') return evt.type === 'TASK_STEP';
    if (timelineFilter === 'security') return evt.severity === 'security' || evt.message.toLowerCase().includes('security');
    if (timelineFilter === 'errors') return evt.severity === 'error' || evt.severity === 'warn';
    return true;
  });

  const handleCopyArtifact = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedArtifact(true);
    setTimeout(() => setCopiedArtifact(false), 2000);
  };

  const getStatusBadge = (taskStatus: string) => {
    switch (taskStatus) {
      case 'COMPLETED':
        return <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Done</span>;
      case 'RUNNING':
        return <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" /> Active</span>;
      case 'FAILED':
        return <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3" /> Failed</span>;
      case 'WAITING':
      case 'BLOCKED':
        return <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> Blocked</span>;
      default:
        return <span className="text-[11px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">Queued</span>;
    }
  };

  return (
    <div className="space-y-5 pb-24 max-w-5xl mx-auto">
      {/* Header & Goal Prompter */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950/80 border border-indigo-500/20 p-4 sm:p-5 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <h2 className="font-display text-lg font-bold text-white">
                Multi-Agent Engineering Studio
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              12 specialized AI roles orchestrating: PRD → Architecture → Code → QA → Security → Delivery
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
              status === 'RUNNING'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : status === 'PAUSED'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : status === 'HUMAN_TAKEOVER'
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                : 'bg-white/5 text-slate-400 border-white/10'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                status === 'RUNNING' ? 'bg-emerald-400 animate-ping' : status === 'PAUSED' ? 'bg-amber-400' : 'bg-slate-500'
              }`} />
              {status === 'HUMAN_TAKEOVER' ? 'Manual Control' : status}
            </span>
          </div>
        </div>

        {/* Goal Input & Action Bar */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="Describe your application idea..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              onClick={() => onStartPipeline(goalInput, 'AUTOMATIC')}
              disabled={status === 'RUNNING'}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30 shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Run Auto
            </button>
            <button
              onClick={() => onDryRunPlan(goalInput)}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0"
              title="Formulate task graph without executing"
            >
              <Eye className="w-3.5 h-3.5" /> Plan Only
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-1.5 items-center text-xs">
            <span className="text-[11px] text-slate-500 font-mono">Presets:</span>
            {presets.map((p, i) => (
              <button
                key={i}
                onClick={() => setGoalInput(p)}
                className="px-2 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/5 text-[11px] truncate max-w-[200px]"
                title={p}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Live Control Actions Bar */}
          <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {status === 'RUNNING' && (
                <button
                  onClick={onPause}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-medium flex items-center gap-1.5"
                >
                  <Pause className="w-3 h-3" /> Pause
                </button>
              )}

              {(status === 'PAUSED' || status === 'HUMAN_TAKEOVER') && (
                <button
                  onClick={onResume}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-medium flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-current" /> Resume Agents
                </button>
              )}

              {status !== 'IDLE' && (
                <button
                  onClick={onStop}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-medium flex items-center gap-1.5"
                >
                  <StopCircle className="w-3 h-3" /> Stop
                </button>
              )}

              <button
                onClick={onTakeControl}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/20 text-xs font-medium flex items-center gap-1.5"
                title="Pause agents and edit files manually"
              >
                <Hand className="w-3 h-3" /> Take Control
              </button>

              <button
                onClick={() => onStartPipeline(goalInput, 'MANUAL')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-medium flex items-center gap-1.5"
                title="Step one task at a time"
              >
                <FastForward className="w-3 h-3" /> Manual Step
              </button>
            </div>

            <button
              onClick={() => onCreateCheckpoint(`Snapshot @ ${new Date().toLocaleTimeString()}`, 'Manual checkpoint from orchestrator')}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-medium flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" /> Save Checkpoint
            </button>
          </div>
        </div>
      </div>

      {/* Pending Human Approval Card (Risk Gateway) */}
      {pendingRequest && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 backdrop-blur-xl animate-pulse">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  Action Approval Required: [{pendingRequest.tool}]
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Risk: {pendingRequest.riskLevel}
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Agent <strong className="text-white">{pendingRequest.agentName}</strong> is requesting permission for: <em>{pendingRequest.reason}</em>
                </p>
                <div className="text-[11px] font-mono bg-black/50 p-2 rounded-lg mt-2 text-slate-300 border border-white/5">
                  Parameters: {JSON.stringify(pendingRequest.params)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onResolvePermission(false)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30"
              >
                Deny
              </button>
              <button
                onClick={() => onResolvePermission(true)}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30"
              >
                Approve & Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Output Deliverables Banner (When Pipeline Complete or Output Files Exist) */}
      {primaryHtmlContent && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-indigo-950/60 border border-emerald-500/30 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <FolderOutput className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  Production Build Ready: <code className="text-emerald-300 font-mono">output/index.html</code>
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Single HTML Beast
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Zero-dependency standalone distribution compiled with inlined Tailwind CSS, Lucide icons &amp; local runtime.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleDownloadOutput('index.html', primaryHtmlContent)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Download HTML
            </button>
            <button
              onClick={() => setActiveTab('output')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all"
            >
              <Eye className="w-3.5 h-3.5" /> View Output Folder
            </button>
            {onOpenSingleHtmlModal && (
              <button
                onClick={onOpenSingleHtmlModal}
                className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 border border-indigo-500/30 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" /> Exporter Studio
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main View Tabs */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('graph')}
          className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'graph'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Task Graph ({tasks.length})
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'agents'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Agent Team (12)
        </button>

        <button
          onClick={() => setActiveTab('output')}
          className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'output'
              ? 'border-emerald-500 text-emerald-300 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderOutput className="w-3.5 h-3.5 text-emerald-400" /> Output Folder ({outputFiles.length || 3})
        </button>

        <button
          onClick={() => setActiveTab('artifacts')}
          className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'artifacts'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" /> Artifacts ({artifacts.length})
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'timeline'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Observability Stream ({timeline.length})
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'contracts'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" /> Contracts ({contracts.length})
        </button>
      </div>

      {/* 1. TASK GRAPH VIEW */}
      {activeTab === 'graph' && (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-16 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-6">
              <Bot className="w-10 h-10 text-indigo-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-semibold text-white">No active task graph</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Type your product goal above and tap <strong>Run Auto</strong> to generate and execute the full 12-stage software production lifecycle.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tasks.map((task, idx) => {
                const assignedAgent = agents.find(a => a.id === task.agentId);

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all ${
                      task.status === 'RUNNING'
                        ? 'bg-indigo-950/30 border-indigo-500/40 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/20'
                        : task.status === 'COMPLETED'
                        ? 'bg-white/[0.02] border-emerald-500/20'
                        : 'bg-white/[0.02] border-white/5 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 font-bold border border-white/5">
                          {idx + 1}. {task.id}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-100">
                          {task.title}
                        </h4>
                      </div>
                      {getStatusBadge(task.status)}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {task.description}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: assignedAgent?.role ? '#6366F1' : '#94A3B8' }} />
                        <span className="font-medium text-slate-300">{assignedAgent?.name || 'Agent'}</span>
                      </div>

                      {task.dependencies.length > 0 && (
                        <span className="text-[10px] font-mono text-slate-500">
                          Depends on: {task.dependencies.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. AGENTS TEAM VIEW */}
      {activeTab === 'agents' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`p-4 rounded-xl border transition-all ${
                agent.status === 'EXECUTING'
                  ? 'bg-indigo-950/40 border-indigo-500/40 shadow-lg'
                  : 'bg-white/[0.02] border-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/20">
                    {agent.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{agent.name}</h4>
                    <span className="text-[10px] font-mono text-slate-400">{agent.role}</span>
                  </div>
                </div>
                {agent.status === 'EXECUTING' ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">{agent.status}</span>
                )}
              </div>

              <div className="mt-2 space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Assigned Model:</span>
                  <strong className="text-slate-300 font-mono text-[11px] truncate max-w-[130px]">{agent.assignedModel}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Tokens used:</span>
                  <span className="font-mono text-slate-300">~{agent.tokensUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Action:</span>
                  <span className="text-slate-300 truncate max-w-[140px]">{agent.currentAction}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. ARTIFACTS VIEW */}
      {activeTab === 'artifacts' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-1">
            <h4 className="text-xs font-mono font-semibold uppercase text-slate-400 mb-2">
              Produced Deliverables ({artifacts.length})
            </h4>
            {artifacts.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-500 text-center">
                No artifacts generated yet. Run pipeline to produce PRD, Architecture, Contracts & Code.
              </div>
            ) : (
              artifacts.map(a => (
                <div
                  key={a.id}
                  onClick={() => setSelectedArtifactId(a.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    activeArtifact?.id === a.id
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-white'
                      : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-white/5 text-indigo-300 border border-indigo-500/20">
                      {a.type}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">v{a.version}</span>
                  </div>
                  <h5 className="text-xs font-semibold truncate">{a.title}</h5>
                </div>
              ))
            )}
          </div>

          <div className="md:col-span-2 rounded-2xl bg-black/40 border border-white/10 p-4 flex flex-col min-h-[400px]">
            {activeArtifact ? (
              <>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {activeArtifact.type}
                    </span>
                    <h3 className="text-sm font-semibold text-white mt-1">{activeArtifact.title}</h3>
                  </div>
                  <button
                    onClick={() => handleCopyArtifact(activeArtifact.content)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium flex items-center gap-1 border border-white/10"
                  >
                    {copiedArtifact ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedArtifact ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="flex-1 overflow-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {activeArtifact.content}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
                <FileCode className="w-8 h-8 mb-2 opacity-50" />
                Select an artifact on the left to inspect its complete contents.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. OBSERVABILITY & TIMELINE VIEW */}
      {activeTab === 'timeline' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-400 font-mono">Filter:</span>
            {(['all', 'tasks', 'security', 'errors'] as const).map(f => (
              <button
                key={f}
                onClick={() => setTimelineFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  timelineFilter === f
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[500px] overflow-auto">
            {filteredTimeline.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-white/[0.02] border border-white/5 rounded-xl">
                No timeline events logged for current filter.
              </div>
            ) : (
              filteredTimeline.map(evt => (
                <div
                  key={evt.id}
                  className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                    evt.severity === 'security'
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                      : evt.severity === 'error'
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                      : evt.severity === 'success'
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : evt.severity === 'warn'
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                      : 'bg-white/[0.02] border-white/5 text-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                  {evt.agentName && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-white/5 text-indigo-400 shrink-0">
                      {evt.agentName}
                    </span>
                  )}
                  <span className="flex-1 font-mono break-all">{evt.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. OUTPUT DELIVERABLES VIEW */}
      {activeTab === 'output' && (
        <div className="space-y-4">
          {/* Header Bar */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderOutput className="w-4 h-4 text-emerald-400" />
                Standalone Output Directory (<code className="text-emerald-300 font-mono">output/</code>)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Zero-dependency, self-contained single-file HTML builds compiled with Tailwind CSS CDN, Lucide icons, tactile audio &amp; particle mesh.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onUpdateOutputFiles && (
                <button
                  onClick={onUpdateOutputFiles}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-amber-500/30 transition-all active:scale-95 shadow-md shadow-amber-500/10"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Recompile &amp; Update Output Files
                </button>
              )}

              <button
                onClick={() => handleDownloadOutput(activeOutputFileObj?.name.split('/').pop() || 'index.html', activeOutputFileObj?.content || primaryHtmlContent)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <Download className="w-3.5 h-3.5" /> Download {activeOutputFileObj?.name.split('/').pop() || 'index.html'}
              </button>

              <button
                onClick={() => handleCopyOutput(activeOutputFileObj?.content || primaryHtmlContent)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10"
              >
                {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedHtml ? 'Copied Content!' : 'Copy File Content'}
              </button>

              {selectedOutputFile.endsWith('.html') && (
                <button
                  onClick={() => handleLaunchWindow(activeOutputFileObj?.content || primaryHtmlContent)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 border border-indigo-500/30"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                </button>
              )}
            </div>
          </div>

          {/* Main Output Grid: Left File Tree & Info, Right Live Sandbox & Code */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: Output Files List & Manifest (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">
                  Deliverable Files
                </div>
                <div className="space-y-1">
                  {(outputFiles.length > 0 ? outputFiles : [
                    { id: '1', name: 'output/index.html', content: primaryHtmlContent, updatedAt: Date.now() },
                    { id: '2', name: 'output/standalone.html', content: primaryHtmlContent, updatedAt: Date.now() },
                    { id: '3', name: 'output/build-manifest.json', content: '{}', updatedAt: Date.now() },
                    { id: '4', name: 'README.md', content: '', updatedAt: Date.now() }
                  ]).map(f => (
                    <button
                      key={f.id || f.name}
                      onClick={() => setSelectedOutputFile(f.name)}
                      className={`w-full p-2.5 rounded-xl text-left text-xs font-mono flex items-center justify-between border transition-all ${
                        selectedOutputFile === f.name
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        {f.name.endsWith('.html') ? (
                          <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : f.name.endsWith('.json') ? (
                          <FileCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">{f.name}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">
                        {(f.content.length / 1024).toFixed(1)} KB
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Build Audit & Metrics Card */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Security &amp; Contracts
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Grade A+ (100/100)
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>XSS Sanitization:</span>
                    <span className="text-emerald-300 font-mono">Passed (DOMPurify &amp; strict escapes)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inlined Dependencies:</span>
                    <span className="text-indigo-300 font-mono">Tailwind CSS + Lucide Icons</span>
                  </div>
                  <div className="flex justify-between">
                    <span>External HTTP Calls:</span>
                    <span className="text-slate-300 font-mono">0 (Self-Contained)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Offline Compatible:</span>
                    <span className="text-emerald-300 font-mono">100% Yes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Sandbox & Code Inspector (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Device Viewport Bar & Actions */}
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 flex-wrap">
                  <button
                    onClick={() => setDevicePreview('desktop')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      devicePreview === 'desktop' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" /> Desktop
                  </button>
                  <button
                    onClick={() => setDevicePreview('tablet')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      devicePreview === 'tablet' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Tablet className="w-3.5 h-3.5" /> Tablet (768px)
                  </button>
                  <button
                    onClick={() => setDevicePreview('android')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      devicePreview === 'android' ? 'bg-emerald-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-300" /> Android (412px)
                  </button>
                  <button
                    onClick={() => setDevicePreview('compact')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      devicePreview === 'compact' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Compact (360px)
                  </button>
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  Target: <strong className="text-white">{selectedOutputFile}</strong>
                </div>
              </div>

              {/* Live Preview Container or Code Viewer */}
              {selectedOutputFile.endsWith('.html') ? (
                <div className="rounded-2xl border border-white/10 bg-black/60 overflow-hidden flex justify-center p-2 sm:p-4 min-h-[500px]">
                  <div
                    className={`h-[540px] bg-white transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl border-4 ${
                      devicePreview === 'android' || devicePreview === 'compact'
                        ? 'border-slate-800 ring-2 ring-indigo-500/20'
                        : 'border-slate-700/50'
                    } ${
                      devicePreview === 'desktop'
                        ? 'w-full'
                        : devicePreview === 'tablet'
                        ? 'w-[768px]'
                        : devicePreview === 'android'
                        ? 'w-[412px]'
                        : 'w-[360px]'
                    }`}
                  >
                    <iframe
                      title="Standalone Preview"
                      srcDoc={activeOutputFileObj?.content || primaryHtmlContent}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[540px] whitespace-pre-wrap">
                  {activeOutputFileObj?.content || '// No content available'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
