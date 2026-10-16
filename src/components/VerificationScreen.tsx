/**
 * Omnintellx — Authentic Verification & QA Gate Screen
 * Zero fake metrics. Real syntax checking, mobile viewport evaluation,
 * DOM integrity, asset linkage, security audit, and runtime observation.
 * Jo check run nahi hua, UI me usse "NOT TESTED" dikhana, pass nahi.
 */

import React, { useState } from 'react';
import { Project, ProjectFile } from '../types';
import { RealProjectValidator, ValidationReport, ValidationCheckItem } from '../engine/realValidator';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Smartphone,
  FileCode,
  Lock,
  Server,
  CheckCircle2,
  ExternalLink,
  Code2,
  Terminal,
  Activity
} from 'lucide-react';

interface VerificationScreenProps {
  project: Project | null;
  onNavigate: (screen: any) => void;
  onOpenPreview: () => void;
}

export const VerificationScreen: React.FC<VerificationScreenProps> = ({
  project,
  onNavigate,
  onOpenPreview
}) => {
  const [filter, setFilter] = useState<'all' | 'PASSED' | 'FAILED' | 'WARNING' | 'NOT_TESTED'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isRunning, setIsRunning] = useState(false);
  const [manualReport, setManualReport] = useState<ValidationReport | null>(null);

  const filesForValidation = project?.files.map(f => ({
    name: f.name,
    content: f.content
  })) || [];

  const currentReport: ValidationReport = manualReport || RealProjectValidator.validateProject(filesForValidation);

  const handleRunVerification = () => {
    setIsRunning(true);
    setTimeout(() => {
      const rep = RealProjectValidator.validateProject(filesForValidation);
      setManualReport(rep);
      setIsRunning(false);
    }, 450);
  };

  const filteredChecks = currentReport.checks.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    return true;
  });

  const getStatusBadge = (status: ValidationCheckItem['status']) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            PASSED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            FAILED
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            WARNING
          </span>
        );
      case 'NOT_TESTED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            NOT TESTED
          </span>
        );
    }
  };

  const hasIndexHtml = project?.files.some(f => f.name.toLowerCase() === 'index.html');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-widest">
              QUALITY & VERIFICATION GATES
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400 font-mono">
              {project ? project.name : 'No Project Selected'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Verification & QA Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Real static analysis, mobile viewport evaluation, syntax integrity, and security audits. Checks that did not execute are strictly reported as <strong className="text-slate-300">NOT TESTED</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunVerification}
            disabled={isRunning}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Auditing...' : 'Run QA Gate Audit'}</span>
          </button>
          {hasIndexHtml && (
            <button
              onClick={onOpenPreview}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold transition-all active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Launch Live Preview</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">PASSED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {currentReport.passed}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Clean verified rules</p>
        </div>

        <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">WARNINGS</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-2">
            {currentReport.warnings}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Non-critical notices</p>
        </div>

        <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">FAILED</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-2">
            {currentReport.failed}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Must fix before delivery</p>
        </div>

        <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">NOT TESTED</span>
            <HelpCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-300 mt-2">
            {currentReport.notTested}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Unexecuted checks</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e131b] border border-white/10 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['all', 'PASSED', 'WARNING', 'FAILED', 'NOT_TESTED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                filter === st
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {st === 'all' ? 'All Checks' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="all">All Categories</option>
            <option value="HTML">HTML & DOM</option>
            <option value="JAVASCRIPT">JavaScript</option>
            <option value="CSS">CSS</option>
            <option value="SECURITY">Security</option>
            <option value="SERVER_RUNTIME">Server Runtime</option>
          </select>
        </div>
      </div>

      {/* Checks Table / List */}
      <div className="bg-[#0e131b] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
        {filteredChecks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm font-mono">
            No verification checks match the active filter.
          </div>
        ) : (
          filteredChecks.map((item) => (
            <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                    {item.category}
                  </span>
                  <h4 className="text-sm font-semibold text-white tracking-tight">
                    {item.name}
                  </h4>
                  {item.file && (
                    <span className="text-xs font-mono text-indigo-400">
                      [{item.file}]
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.message}
                </p>
              </div>

              <div className="shrink-0 self-start sm:self-center">
                {getStatusBadge(item.status)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
