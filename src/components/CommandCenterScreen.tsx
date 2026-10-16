/**
 * Omnintellx — Command Center (Home Screen)
 * Clean, focused developer-grade start screen with unified prompt, presets, bounded concurrency (1-16),
 * 12-agent roster toggle, execution budget controls, and recent projects list.
 */

import React, { useState } from 'react';
import {
  Project,
  ProviderConfig,
  ExecutionMode,
  TaskItem,
  RunHistoryRecord
} from '../types';
import { INITIAL_AGENT_TEAM } from '../engine/agentDefinitions';
import {
  Sparkles,
  Sliders,
  Play,
  FileSearch,
  CheckCircle2,
  Layers,
  Shield,
  Clock,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Bot,
  Zap,
  Folder,
  ArrowRight
} from 'lucide-react';

interface CommandCenterScreenProps {
  projects: Project[];
  providers: ProviderConfig[];
  runHistory?: RunHistoryRecord[];
  onStartPipeline: (goal: string, mode: ExecutionMode, enabledAgents?: Set<string>) => void;
  onPlanOnly: (goal: string, enabledAgents?: Set<string>) => void;
  onOpenProject: (projectId: string) => void;
  onNavigate: (screen: any) => void;
}

export const CommandCenterScreen: React.FC<CommandCenterScreenProps> = ({
  projects,
  providers,
  runHistory = [],
  onStartPipeline,
  onPlanOnly,
  onOpenProject,
  onNavigate
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('auto');
  const [concurrency, setConcurrency] = useState<number>(4);
  const [mode, setMode] = useState<ExecutionMode>('AUTOMATIC');
  const [checkpointEnabled, setCheckpointEnabled] = useState(true);
  const [targetDir, setTargetDir] = useState('./workspace');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Agent roster selection
  const [enabledAgents, setEnabledAgents] = useState<Set<string>>(
    () => new Set(INITIAL_AGENT_TEAM.map(a => a.id))
  );

  // Budget options
  const [maxRetries, setMaxRetries] = useState<number>(3);
  const [approvalPolicy, setApprovalPolicy] = useState<'safe' | 'risky' | 'delivery'>('risky');
  const [budgetTier, setBudgetTier] = useState<'lightweight' | 'balanced' | 'maximum'>('balanced');

  const presets = [
    {
      label: 'Personal Expense Tracker',
      prompt: 'Build a responsive personal expense tracker using HTML, CSS and JavaScript. It should allow adding expenses, categories, dates, totals, filtering and local persistence.'
    },
    {
      label: 'Full-Stack App',
      prompt: 'Build a full-stack project tracker with responsive dashboard, interactive task statuses, local storage, and export capabilities.'
    },
    {
      label: 'Refactor Code',
      prompt: 'Refactor current workspace code to improve modularity, remove redundant logic, and ensure strict type validation.'
    },
    {
      label: 'Bug Fix & QA',
      prompt: 'Audit current codebase for runtime exceptions, broken HTML tags, or invalid JS syntax, and patch immediately.'
    },
    {
      label: 'Security Audit',
      prompt: 'Run security review on all workspace files to detect secret leakage, unsanitized inputs, and protocol violations.'
    }
  ];

  const handleToggleAgent = (agentId: string) => {
    setEnabledAgents(prev => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        if (next.size > 1) next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  const handleSelectAllAgents = () => {
    setEnabledAgents(new Set(INITIAL_AGENT_TEAM.map(a => a.id)));
  };

  const handleSelectMinimalAgents = () => {
    // Planner, Frontend, QA, Release
    setEnabledAgents(new Set(['agent_planner', 'agent_frontend', 'agent_qa', 'agent_release']));
  };

  const handleSubmit = (isDryRun: boolean) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    if (isDryRun) {
      onPlanOnly(trimmed, enabledAgents);
    } else {
      onStartPipeline(trimmed, mode, enabledAgents);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Autonomous Multi-Agent Workspace
            </span>
            <span className="text-xs text-slate-400">v3.5.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1.5">
            Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Specify a software job and let the 12-agent engineering team design, implement, test, and package it.
          </p>
        </div>
      </div>

      {/* Main Prompt Card */}
      <div className="bg-[#0e131b] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <label htmlFor="command-prompt-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Software Specification or Request
        </label>
        <div className="relative">
          <textarea
            id="command-prompt-input"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what to build or fix (e.g. 'Build a responsive personal expense tracker using HTML, CSS and JavaScript...')"
            className="w-full bg-[#080b10] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none font-sans"
          />
        </div>

        {/* Preset Shortcuts */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Presets:
          </span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(preset.prompt)}
              className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Quick Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
          {/* Target Directory */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Target Directory</label>
            <div className="flex items-center gap-1.5 bg-[#080b10] border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200">
              <Folder className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={targetDir}
                onChange={(e) => setTargetDir(e.target.value)}
                className="bg-transparent w-full text-xs text-slate-200 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Model Provider */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Model Provider</label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full bg-[#080b10] border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="auto">Auto (Intelligent Router)</option>
              <option value="gemini">Google Gemini</option>
              <option value="openrouter">OpenRouter</option>
              <option value="cerebras">Cerebras</option>
              <option value="ollama">Ollama (Local)</option>
              <option value="pollinations">Pollinations (Built-in)</option>
            </select>
          </div>

          {/* Concurrency Slider (1-16 bounded) */}
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="font-medium">Concurrency</span>
              <span className="text-indigo-400 font-bold">{concurrency} agents</span>
            </div>
            <input
              type="range"
              min="1"
              max="16"
              value={concurrency}
              onChange={(e) => setConcurrency(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>1</span>
              <span>8</span>
              <span>16</span>
            </div>
          </div>

          {/* Execution Mode */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Execution Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as ExecutionMode)}
              className="w-full bg-[#080b10] border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="AUTOMATIC">Autonomous (Continuous)</option>
              <option value="SEMI_AUTOMATIC">Collaborative (Key Checkpoints)</option>
              <option value="MANUAL">Guarded (Step-by-Step)</option>
            </select>
          </div>
        </div>

        {/* Checkpoint checkbox + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-white/5">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={checkpointEnabled}
              onChange={(e) => setCheckpointEnabled(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
            />
            <span>Create pre-run safety checkpoint</span>
          </label>

          <div className="flex items-center gap-2.5">
            <button
              id="plan-only-btn"
              onClick={() => handleSubmit(true)}
              disabled={!prompt.trim()}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 font-medium text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSearch className="w-3.5 h-3.5 text-slate-400" />
              <span>Plan Only</span>
            </button>
            <button
              id="start-run-btn"
              onClick={() => handleSubmit(false)}
              disabled={!prompt.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Autonomous Run</span>
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Controls Accordion */}
      <div className="bg-[#0e131b] border border-white/10 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowAdvanced(prev => !prev)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Advanced Controls: Agent Roster & Execution Budget</span>
          </div>
          {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="p-5 border-t border-white/10 space-y-5 bg-[#0a0d13]">
            {/* Agent Roster */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Agent Roster (12 Specialists)</h3>
                  <p className="text-[11px] text-slate-500">Enable or disable agents for this task. Relevant agents activate automatically.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAllAgents}
                    className="text-[11px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleSelectMinimalAgents}
                    className="text-[11px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                  >
                    Minimal (4)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
                {INITIAL_AGENT_TEAM.map(agent => {
                  const isEnabled = enabledAgents.has(agent.id);
                  return (
                    <div
                      key={agent.id}
                      onClick={() => handleToggleAgent(agent.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        isEnabled
                          ? 'bg-indigo-950/30 border-indigo-500/40 text-slate-200'
                          : 'bg-white/5 border-white/5 text-slate-500 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Bot className={`w-3.5 h-3.5 shrink-0 ${isEnabled ? 'text-indigo-400' : 'text-slate-600'}`} />
                        <span className="truncate font-medium">{agent.name}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        readOnly
                        className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0 w-3.5 h-3.5"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Execution Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Max Retries</label>
                <select
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(parseInt(e.target.value, 10))}
                  className="w-full bg-[#080b10] border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  <option value={1}>1 Retry</option>
                  <option value={2}>2 Retries</option>
                  <option value={3}>3 Retries (Recommended)</option>
                  <option value={5}>5 Retries (Deep Fix)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Approval Policy</label>
                <select
                  value={approvalPolicy}
                  onChange={(e) => setApprovalPolicy(e.target.value as any)}
                  className="w-full bg-[#080b10] border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  <option value="safe">Auto-approve safe actions</option>
                  <option value="risky">Ask on risky actions (Shell, Deletions)</option>
                  <option value="delivery">Ask before final delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Budget Tier</label>
                <select
                  value={budgetTier}
                  onChange={(e) => setBudgetTier(e.target.value as any)}
                  className="w-full bg-[#080b10] border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  <option value="lightweight">Lightweight (Fast, lowest token cost)</option>
                  <option value="balanced">Balanced (Standard reasoning)</option>
                  <option value="maximum">Maximum (Deep validation & synthesis)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Projects Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Workspace Projects</span>
          </h2>
          <button
            onClick={() => onNavigate('workspace')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.slice(0, 6).map((proj) => {
            const htmlFile = proj.files.find(f => f.name.endsWith('.html'));
            return (
              <div
                key={proj.id}
                className="bg-[#0e131b] border border-white/10 rounded-xl p-4 hover:border-indigo-500/40 transition-colors group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-white truncate group-hover:text-indigo-300 transition-colors">
                      {proj.name}
                    </h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 shrink-0">
                      {proj.files.length} files
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {proj.description || 'Browser-native software workspace.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    {new Date(proj.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenProject(proj.id)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium transition-colors"
                    >
                      Open Workspace
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
