/**
 * Omnintellx — Dedicated Live Run Screen
 * Top status bar with real bounded concurrency (X / Y), visual task graph, clean agent cards,
 * real event stream with filters, quality loop tracking, and human takeover modal.
 */

import React, { useState, useEffect } from 'react';
import {
  ExecutionStatus,
  TaskItem,
  AgentState,
  RunEvent,
  PendingToolRequest,
  ProjectFile,
  Artifact
} from '../types';
import {
  Play,
  Pause,
  Square,
  UserCheck,
  Bot,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileCode2,
  Cpu,
  RefreshCw,
  Search,
  Filter,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Bug,
  Eye
} from 'lucide-react';

interface LiveRunScreenProps {
  status: ExecutionStatus;
  tasks: TaskItem[];
  agents: AgentState[];
  artifacts: Artifact[];
  workspaceFiles: ProjectFile[];
  runEvents: RunEvent[];
  pendingRequest: PendingToolRequest | null;
  maxConcurrency: number;
  activeConcurrency: number;
  currentGoal?: string;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onTakeControl: () => void;
  onResolvePermission: (approved: boolean) => void;
  onCancelTask: (taskId: string) => void;
  onNavigate: (screen: any) => void;
}

export const LiveRunScreen: React.FC<LiveRunScreenProps> = ({
  status,
  tasks,
  agents,
  artifacts,
  workspaceFiles,
  runEvents,
  pendingRequest,
  maxConcurrency,
  activeConcurrency,
  currentGoal = 'Active Job',
  onPause,
  onResume,
  onStop,
  onTakeControl,
  onResolvePermission,
  onCancelTask,
  onNavigate
}) => {
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [eventFilter, setEventFilter] = useState<'all' | 'agents' | 'files' | 'tests' | 'errors'>('all');
  const [eventSearch, setEventSearch] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let timer: any;
    if (status === 'RUNNING') {
      timer = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Determine current phase
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const totalCount = tasks.length || 1;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const getCurrentPhase = () => {
    const latestEvt = runEvents[0];
    if (latestEvt?.metadata?.state) return latestEvt.metadata.state;
    if (latestEvt?.type === 'test.completed' || latestEvt?.type === 'test.started') return 'VERIFYING';
    if (latestEvt?.type === 'error.detected' || latestEvt?.type === 'repair.started') return 'DEBUGGING';
    if (latestEvt?.type === 'file.created' || latestEvt?.type === 'tool.completed') return 'EXECUTING';
    if (latestEvt?.type === 'task.created') return 'PLANNING';
    if (status === 'COMPLETED') return 'COMPLETED';
    if (status === 'FAILED') return 'FAILED';
    if (status === 'RUNNING') return 'EXECUTING';
    return status;
  };

  // Filter events
  const filteredEvents = runEvents.filter(evt => {
    if (eventSearch.trim()) {
      const q = eventSearch.toLowerCase();
      const match = evt.summary.toLowerCase().includes(q) || (evt.agentName && evt.agentName.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (eventFilter === 'all') return true;
    if (eventFilter === 'agents') return evt.type.startsWith('agent.');
    if (eventFilter === 'files') return evt.type.startsWith('file.');
    if (eventFilter === 'tests') return evt.type.startsWith('test.') || evt.type.startsWith('repair.');
    if (eventFilter === 'errors') return evt.status === 'error' || evt.type === 'error.detected';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* Top Status Bar */}
      <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              status === 'RUNNING' ? 'bg-emerald-400 animate-pulse' :
              status === 'PAUSED' ? 'bg-amber-400' :
              status === 'COMPLETED' ? 'bg-indigo-400' : 'bg-slate-500'
            }`} />
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
              {status}
            </span>
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate max-w-md sm:max-w-lg">
              {currentGoal}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Phase: <strong className="text-indigo-400">{getCurrentPhase()}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatTimer(elapsedSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Concurrency Badge & Pipeline Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5">
          {/* Strictly bounded concurrency badge (matches actual running tasks) */}
          <div className="px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-2 text-xs">
            <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Agents Active:</span>
            <span className="font-bold text-indigo-300">{activeConcurrency} / {maxConcurrency}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {status === 'RUNNING' ? (
              <button
                id="live-pause-btn"
                onClick={onPause}
                className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : status === 'PAUSED' ? (
              <button
                id="live-resume-btn"
                onClick={onResume}
                className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-emerald-300" />
                <span>Resume</span>
              </button>
            ) : null}

            <button
              id="live-stop-btn"
              onClick={onStop}
              className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>

            <button
              id="live-takeover-btn"
              onClick={onTakeControl}
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Pause autonomous pipeline and edit code directly in workspace"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Take Control</span>
            </button>

            {status === 'COMPLETED' && (
              <button
                onClick={() => onNavigate('preview')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Open Preview</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-[#0e131b] border border-white/10 rounded-xl p-3 flex items-center gap-3 text-xs">
        <span className="text-slate-400 font-medium">Pipeline Progress:</span>
        <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-indigo-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="font-bold text-indigo-400">{progressPercent}%</span>
        <span className="text-slate-500">({completedCount}/{totalCount} tasks completed)</span>
      </div>

      {/* Main Grid: Task Graph (Left) + Agent Roster (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Task Graph / Step List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>Production Task Graph</span>
            </h2>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No active tasks. Start a run from the Command Center.
                </div>
              ) : (
                tasks.map((task, idx) => {
                  const isSelected = selectedTask?.id === task.id;
                  const agent = agents.find(a => a.id === task.agentId);

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md'
                          : task.status === 'RUNNING'
                          ? 'bg-indigo-950/20 border-indigo-500/30'
                          : task.status === 'COMPLETED'
                          ? 'bg-emerald-950/10 border-emerald-500/20 hover:border-emerald-500/40'
                          : task.status === 'FAILED'
                          ? 'bg-rose-950/20 border-rose-500/30'
                          : 'bg-[#080b10] border-white/5 hover:border-white/10 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[11px] font-mono font-bold text-slate-500 w-5 text-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-xs text-white truncate">
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>Agent: <strong className="text-slate-300">{agent?.name || task.agentId}</strong></span>
                            {task.producedArtifacts.length > 0 && (
                              <span className="text-emerald-400 font-mono">• {task.producedArtifacts.length} artifact</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          task.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          task.status === 'RUNNING' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse' :
                          task.status === 'FAILED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          task.status === 'SKIPPED' ? 'bg-slate-800 text-slate-400' :
                          'bg-slate-800/80 text-slate-400 border border-white/5'
                        }`}>
                          {task.status}
                        </span>
                        {task.status === 'RUNNING' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCancelTask(task.id);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 text-[10px]"
                            title="Cancel task"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Task Inspection Drawer */}
            {selectedTask && (
              <div className="mt-4 pt-4 border-t border-white/10 bg-[#080b10] p-4 rounded-xl text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span>Task Inspection:</span>
                    <span className="text-indigo-400">{selectedTask.title}</span>
                  </h4>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-slate-400 hover:text-white text-[11px]"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-white/5">
                    <span className="text-slate-500 block">Task ID:</span>
                    <span className="font-mono text-slate-200">{selectedTask.id}</span>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <span className="text-slate-500 block">Agent:</span>
                    <span className="text-slate-200 font-medium">{selectedTask.agentId}</span>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <span className="text-slate-500 block">Status:</span>
                    <span className="text-slate-200 font-medium">{selectedTask.status}</span>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <span className="text-slate-500 block">Artifacts:</span>
                    <span className="text-slate-200">{selectedTask.producedArtifacts.length} produced</span>
                  </div>
                </div>

                {selectedTask.error && (
                  <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300">
                    <strong>Error:</strong> {selectedTask.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active Agent Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Active Agent Specialists</span>
            </h2>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {agents.map((agent) => {
                const isWorking = agent.status === 'WORKING';
                return (
                  <div
                    key={agent.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isWorking
                        ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md'
                        : agent.status === 'COMPLETED'
                        ? 'bg-emerald-950/10 border-emerald-500/20'
                        : 'bg-[#080b10] border-white/5 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isWorking ? 'bg-indigo-600 text-white animate-bounce' : 'bg-white/10 text-slate-300'
                        }`}>
                          {agent.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-xs text-white truncate">{agent.name}</h4>
                          <span className="text-[10px] text-indigo-400 font-mono block truncate">
                            {agent.assignedModel}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        agent.status === 'WORKING' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse' :
                        agent.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' :
                        'bg-white/5 text-slate-500'
                      }`}>
                        {agent.status}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-white/5 text-[11px] text-slate-300">
                      <p className="truncate">
                        <span className="text-slate-500">Action:</span> {agent.currentAction}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Real Event Stream */}
      <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Execution Event Stream</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
              {filteredEvents.length} events
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-[#080b10] border border-white/10 rounded-lg p-0.5 text-xs">
              {(['all', 'agents', 'files', 'tests', 'errors'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setEventFilter(tab)}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                    eventFilter === tab ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search events..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                className="bg-[#080b10] border border-white/10 rounded-lg pl-7 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-36 sm:w-44"
              />
            </div>
          </div>
        </div>

        {/* Events Table / Feed */}
        <div className="mt-3 divide-y divide-white/5 max-h-72 overflow-y-auto font-mono text-xs">
          {filteredEvents.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No matching events in stream.
            </div>
          ) : (
            filteredEvents.map(evt => {
              const dateStr = new Date(evt.timestamp).toLocaleTimeString();
              return (
                <div key={evt.id} className="py-2.5 px-2 flex items-start justify-between gap-3 hover:bg-white/[0.02] rounded transition-colors">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-slate-500 text-[11px] shrink-0 font-normal">
                      {dateStr}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                      evt.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' :
                      evt.status === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                      evt.status === 'error' || evt.status === 'security' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-indigo-500/20 text-indigo-300'
                    }`}>
                      {evt.type}
                    </span>
                    <div className="min-w-0">
                      <p className="text-slate-200 text-xs truncate">
                        {evt.summary}
                      </p>
                      {evt.details && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {evt.details}
                        </p>
                      )}
                    </div>
                  </div>

                  {evt.agentName && (
                    <span className="text-[11px] text-slate-400 shrink-0 font-sans">
                      {evt.agentName}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Human Permission Takeover Modal */}
      {pendingRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e131b] border border-amber-500/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Human Permission Required</h3>
            </div>
            <p className="text-xs text-slate-300">
              An autonomous agent requested permission to perform a potentially impactful action:
            </p>
            <div className="bg-[#080b10] border border-white/10 rounded-xl p-3 text-xs space-y-1.5 font-mono">
              <div><strong className="text-slate-400">Tool:</strong> <span className="text-indigo-400">{pendingRequest.tool}</span></div>
              <div><strong className="text-slate-400">Risk Level:</strong> <span className="text-amber-400">{pendingRequest.riskLevel}</span></div>
              <div><strong className="text-slate-400">Parameters:</strong> <span className="text-slate-300">{JSON.stringify(pendingRequest.args)}</span></div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => onResolvePermission(false)}
                className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Reject Action
              </button>
              <button
                onClick={() => onResolvePermission(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
              >
                Approve & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
