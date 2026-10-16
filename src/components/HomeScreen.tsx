/**
 * Omnintellx — Home Screen Component
 */

import React from 'react';
import { Project, Checkpoint, ScreenId, ProviderConfig } from '../types';
import {
  FolderPlus,
  Play,
  Bot,
  Code2,
  Cpu,
  Terminal,
  Clock,
  HardDrive,
  Activity,
  BookmarkCheck,
  ChevronRight,
  ShieldCheck,
  Zap,
  RotateCcw
} from 'lucide-react';

interface HomeScreenProps {
  projects?: Project[];
  activeProvider?: ProviderConfig | null;
  checkpoints?: Checkpoint[];
  storageBytes?: number;
  runningTasksCount?: number;
  onNavigate: (screen: ScreenId) => void;
  onOpenNewProject?: () => void;
  onOpenProject?: (projectId: string) => void;
  onRestoreCheckpoint?: (ckptId: string) => void;
  onStartFastPipeline?: (goal: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  projects = [],
  activeProvider = null,
  checkpoints = [],
  storageBytes = 0,
  runningTasksCount = 0,
  onNavigate,
  onOpenNewProject = () => {},
  onOpenProject = (_projectId?: string) => {},
  onRestoreCheckpoint = (_ckptId?: string) => {},
  onStartFastPipeline = (_goal?: string) => {}
}) => {
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Late Night Coding';
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const activeProject = projects?.[0] || null;
  const latestCheckpoint = checkpoints?.[0] || null;
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes < 1024) return `${bytes || 0} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const [promptInput, setPromptInput] = React.useState('');

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-1 sm:px-0">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-indigo-400 font-semibold">
            WORKSPACE READY
          </span>
          <h2 className="font-display text-xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
            {greeting()}, Engineer
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {projects.length > 0 ? `${projects.length} project${projects.length === 1 ? '' : 's'} active · Autonomous Agent Core Ready` : 'Workspace is clean · Ready for your first software mission'}
          </p>
        </div>
        <button
          onClick={() => onNavigate('orchestrator')}
          className="self-start sm:self-auto flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 hover:brightness-110 active:scale-95 transition-all"
        >
          <Bot className="w-4 h-4" />
          <span>Launch Mission</span>
        </button>
      </div>

      {/* PRIMARY: WHAT DO YOU WANT TO CREATE? */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-black border border-indigo-500/30 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="max-w-2xl">
          <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-400 font-bold flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            AUTONOMOUS SOFTWARE & 3D STUDIO
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            What do you want to create?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Omnintellx will understand, design, select the right AI model, write real code, execute, test, and deliver your project.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (promptInput.trim()) onStartFastPipeline(promptInput.trim()); }} className="mt-5 space-y-3">
          <div className="relative">
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Describe your software or 3D web experience in natural language..."
              rows={3}
              className="w-full bg-slate-950/80 border border-white/10 focus:border-indigo-500 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none font-sans"
            />
          </div>

          {/* Example prompt pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500">Benchmarks:</span>
            {[
              "Create a cinematic 3D globe experience.",
              "Build a futuristic cybersecurity website.",
              "Create an immersive 3D portfolio.",
              "Build a convex lens physics simulator."
            ].map((pText) => (
              <button
                key={pText}
                type="button"
                onClick={() => setPromptInput(pText)}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all text-left cursor-pointer"
              >
                {pText}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Active Model: <strong className="text-white">{activeProvider?.name || 'Auto Router'}</strong> ({activeProvider?.defaultModel || 'gemini-flash-latest'})</span>
            </div>

            <button
              type="submit"
              disabled={!promptInput.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>CREATE</span>
            </button>
          </div>
        </form>
      </div>

      {/* AI System Status Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950/80 border border-indigo-500/20 p-4 sm:p-5 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <h3 className="text-sm font-semibold text-white">AI Engineering Core</h3>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Active: <strong className="text-slate-200">{activeProvider?.name || 'Pollinations (Zero-Config)'}</strong> ({activeProvider?.defaultModel || 'openai-large'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {runningTasksCount > 0 ? `${runningTasksCount} Active Tasks` : '100% Operational'}
            </span>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> AppSec Verified
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Activity className="w-3.5 h-3.5 text-indigo-400" /> Multi-Model Fallback
            </span>
          </div>
          <button
            onClick={() => onNavigate('models')}
            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5 self-start sm:self-auto min-h-[36px] sm:min-h-0"
          >
            Manage Providers <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div>
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
          Quick Launch
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <button
            onClick={onOpenNewProject}
            className="flex flex-col items-center text-center p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-indigo-500/30 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FolderPlus className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-200">New Project</span>
          </button>

          <button
            onClick={() => onNavigate('orchestrator')}
            className="flex flex-col items-center text-center p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-indigo-500/30 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Bot className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-200">Agent Team</span>
          </button>

          <button
            onClick={() => onNavigate('editor')}
            className="flex flex-col items-center text-center p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-indigo-500/30 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Code2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-200">Code Editor</span>
          </button>

          <button
            onClick={() => onNavigate('tools')}
            className="flex flex-col items-center text-center p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-indigo-500/30 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Play className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-200">Live Preview</span>
          </button>

          <button
            onClick={() => onNavigate('models')}
            className="flex flex-col items-center text-center p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-indigo-500/30 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-200">Model Router</span>
          </button>

          <button
            onClick={() => onNavigate('tools')}
            className="flex flex-col items-center text-center p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-indigo-500/30 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Terminal className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-200">Shell / Tools</span>
          </button>
        </div>
      </div>

      {/* Continue Working Card or Clean Workspace Prompt */}
      {activeProject ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Continue Working
            </h3>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Updated recently
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-semibold text-white">
                {activeProject.name}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {(activeProject.files || []).length} files · {activeProject.description || 'Production application project'}
              </p>
            </div>
            <button
              onClick={() => {
                onOpenProject(activeProject.id);
                onNavigate('editor');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" /> Open in Editor
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/20 to-slate-900/50 border border-dashed border-indigo-500/30 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                Autonomous Studio Workspace
              </span>
              <h3 className="text-lg font-bold text-white mt-1">Start Your First Software Mission</h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                Omnintellx operates directly on real files, runs real commands, executes builds and tests, and fixes runtime bugs autonomously.
              </p>
            </div>
            <button
              onClick={onOpenNewProject}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shrink-0"
            >
              <FolderPlus className="w-4 h-4" /> New Project
            </button>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              id="quick-mission-input"
              placeholder="e.g. Build a 3D interactive aerospace company website with Three.js"
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) onStartFastPipeline(val);
                }
              }}
            />
            <button
              onClick={() => {
                const el = document.getElementById('quick-mission-input') as HTMLInputElement;
                if (el?.value.trim()) onStartFastPipeline(el.value.trim());
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-indigo-600/20"
            >
              <Play className="w-3.5 h-3.5" /> Launch Mission
            </button>
          </div>
        </div>
      )}

      {/* Recent Projects Grid */}
      {projects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Recent Projects
            </h3>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              View All ({projects.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.slice(0, 4).map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onOpenProject(p.id);
                  onNavigate('projects');
                }}
                className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-indigo-500/20 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors">
                      {p.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-400 border border-white/10">
                      {(p.files || []).length} files
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {p.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5 text-[11px] text-slate-500 font-mono">
                  <span>{(p.files || []).map(f => f.name.split('.').pop()).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).join(', ') || 'HTML'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Resources & Checkpoints */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-slate-300">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-slate-400 font-mono uppercase">Local Storage Quota</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {formatBytes(storageBytes)} used
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(5, (storageBytes / (5 * 1024 * 1024)) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-400 font-mono uppercase">Latest Snapshot</div>
              <div className="text-sm font-semibold text-white truncate mt-0.5">
                {latestCheckpoint ? latestCheckpoint.name : 'Auto-initial snapshot'}
              </div>
            </div>
          </div>

          {latestCheckpoint && (
            <button
              onClick={() => onRestoreCheckpoint(latestCheckpoint.id)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium shrink-0 flex items-center gap-1 border border-white/10"
              title="Restore snapshot"
            >
              <RotateCcw className="w-3 h-3" /> Restore
            </button>
          )}
        </div>
      </div>

      {/* Omnintellx Engine Footer Signature */}
      <div className="pt-2 text-center border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Engineered with precision — <strong className="text-slate-300">Omnintellx</strong></span>
          <span>·</span>
          <span className="text-indigo-400 font-medium">Multi-Agent Core</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span>Real Workspace Execution</span>
          <span>·</span>
          <span>Autonomous Debugging</span>
        </div>
      </div>
    </div>
  );
};
