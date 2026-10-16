/**
 * Omnintellx — Run History & Checkpoints Time-Travel Screen
 * Complete audit trail of past runs, honest test counts, duration, and checkpoint rollback system.
 */

import React, { useState } from 'react';
import { RunHistoryRecord, Checkpoint, Project } from '../types';
import { StorageService } from '../engine/storage';
import {
  History,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Bookmark,
  FileCode2,
  Calendar
} from 'lucide-react';

interface RunHistoryScreenProps {
  runHistory: RunHistoryRecord[];
  checkpoints: Checkpoint[];
  activeProject: Project | null;
  onRestoreCheckpoint: (checkpointId: string) => void;
  onOpenRunInWorkspace: (run: RunHistoryRecord) => void;
  onRerun: (prompt: string) => void;
  onDeleteHistory: (id: string) => void;
}

export const RunHistoryScreen: React.FC<RunHistoryScreenProps> = ({
  runHistory,
  checkpoints,
  activeProject,
  onRestoreCheckpoint,
  onOpenRunInWorkspace,
  onRerun,
  onDeleteHistory
}) => {
  const [activeTab, setActiveTab] = useState<'runs' | 'checkpoints'>('runs');
  const [selectedRun, setSelectedRun] = useState<RunHistoryRecord | null>(null);

  const formatDuration = (ms: number) => {
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}m ${rem}s`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" />
            <span>Run History & Checkpoints</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit past agent runs, review real test counts, and time-travel between workspace checkpoints.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-[#0e131b] border border-white/10 rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveTab('runs')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'runs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Past Runs ({runHistory.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('checkpoints')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'checkpoints' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Checkpoints ({checkpoints.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'runs' ? (
        <div className="space-y-4">
          {runHistory.length === 0 ? (
            <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-12 text-center text-slate-500 text-xs">
              <History className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p className="font-semibold text-slate-300">No execution runs recorded yet</p>
              <p className="text-slate-500 mt-1">Start your first task in the Command Center to record history.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {runHistory.map((run) => {
                const isSuccess = run.finalStatus === 'COMPLETED';
                return (
                  <div
                    key={run.id}
                    className="bg-[#0e131b] border border-white/10 rounded-2xl p-5 hover:border-indigo-500/30 transition-colors shadow-lg space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${isSuccess ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span className="font-mono text-xs font-bold text-slate-400">{run.runId}</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(run.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          isSuccess ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {run.finalStatus}
                        </span>
                        <span className="text-slate-400 font-mono">
                          {formatDuration(run.durationMs)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm text-white">{run.prompt}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
                        <span>Provider: <strong className="text-slate-200">{run.provider}</strong></span>
                        <span>•</span>
                        <span>Model: <strong className="text-slate-200">{run.model}</strong></span>
                        <span>•</span>
                        <span>Agents: <strong className="text-indigo-400">{run.agentsUsed.length}</strong></span>
                        <span>•</span>
                        <span>Files: <strong className="text-slate-200">{run.filesChanged}</strong></span>
                        <span>•</span>
                        <span className="text-emerald-400">
                          Tests: <strong>{run.testsPassed}/{run.testsExecuted} passed</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                      <div className="text-slate-500 text-[11px]">
                        Checkpoints: {run.checkpointsCreated}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onRerun(run.prompt)}
                          className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Rerun</span>
                        </button>
                        <button
                          onClick={() => onDeleteHistory(run.id)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete run record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {checkpoints.length === 0 ? (
            <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-12 text-center text-slate-500 text-xs">
              <Bookmark className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p className="font-semibold text-slate-300">No checkpoints created</p>
              <p className="text-slate-500 mt-1">Checkpoints are created automatically before and after runs.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {checkpoints.map((ckpt) => (
                <div
                  key={ckpt.id}
                  className="bg-[#0e131b] border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-white">{ckpt.name}</h3>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                        {ckpt.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Reason: <span className="text-slate-300">{ckpt.reason}</span>
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>{new Date(ckpt.ts).toLocaleString()}</span>
                      <span>•</span>
                      <span>{ckpt.snapshotFiles?.length || 0} files captured</span>
                      <span>•</span>
                      <span>{ckpt.artifacts?.length || 0} artifacts</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        if (confirm(`Restore workspace to checkpoint "${ckpt.name}"? Current unsaved changes will be overwritten.`)) {
                          onRestoreCheckpoint(ckpt.id);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore Checkpoint</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
