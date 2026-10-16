/**
 * Omnintellx — Models & Provider Management Screen
 * Clean, mobile-first API Gateways & Model Router with instant model switching & auto-discovery.
 */

import React, { useState } from 'react';
import { ProviderConfig, RoutingMode, ProviderType } from '../types';
import { PROVIDER_PRESETS } from '../engine/providers';
import { testProviderConnection } from '../engine/connectionTester';
import {
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Zap,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  Globe,
  Lock,
  Check,
  Search,
  Cpu,
  KeyRound,
  ArrowRight
} from 'lucide-react';

interface ModelsScreenProps {
  providers: ProviderConfig[];
  routingMode: RoutingMode;
  localOnlyMode: boolean;
  onSetRoutingMode: (mode: RoutingMode) => void;
  onToggleLocalOnly: (active: boolean) => void;
  onTestConnection: (providerId: string) => Promise<void>;
  onSetDefaultProvider: (providerId: string) => void;
  onSetDefaultModel: (providerId: string, modelName: string) => void;
  onSaveProvider: (provider: ProviderConfig) => void;
  onDeleteProvider: (providerId: string) => void;
}

export const ModelsScreen: React.FC<ModelsScreenProps> = ({
  providers,
  routingMode,
  localOnlyMode,
  onSetRoutingMode,
  onToggleLocalOnly,
  onTestConnection,
  onSetDefaultProvider,
  onSetDefaultModel,
  onSaveProvider,
  onDeleteProvider
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isCrawlingAll, setIsCrawlingAll] = useState(false);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [customModelInputs, setCustomModelInputs] = useState<Record<string, string>>({});
  const [showAddCustomFor, setShowAddCustomFor] = useState<string | null>(null);
  const [modalTesting, setModalTesting] = useState(false);
  const [modalTestResult, setModalTestResult] = useState<{ status: 'CONNECTED' | 'FAILED'; latency?: number; message?: string; models?: string[] } | null>(null);

  const primaryProvider = providers[0] || null;

  const handleTest = async (id: string) => {
    setTestingId(id);
    await onTestConnection(id);
    setTestingId(null);
  };

  const handleTestAll = async () => {
    setIsCrawlingAll(true);
    for (const p of providers) {
      await onTestConnection(p.id);
    }
    setIsCrawlingAll(false);
  };

  const handleOpenAdd = (presetType: ProviderType = 'openrouter') => {
    const preset = PROVIDER_PRESETS[presetType] || PROVIDER_PRESETS.openrouter;
    setEditingProvider({
      id: `prov_${presetType}_${Date.now()}`,
      name: preset.name,
      type: presetType,
      baseUrl: preset.defaultBaseUrl,
      apiKey: '',
      models: [...preset.models],
      defaultModel: preset.defaultModel,
      status: 'untested',
      isLocalOnly: preset.isLocalOnly || false
    });
    setShowModal(true);
  };

  const handleTypeChange = (type: ProviderType) => {
    if (!editingProvider) return;
    const preset = PROVIDER_PRESETS[type] || PROVIDER_PRESETS.custom;
    setEditingProvider({
      ...editingProvider,
      type,
      name: editingProvider.name === '' || Object.values(PROVIDER_PRESETS).some(p => p.name === editingProvider.name) ? preset.name : editingProvider.name,
      baseUrl: preset.defaultBaseUrl,
      models: [...preset.models],
      defaultModel: preset.defaultModel,
      isLocalOnly: preset.isLocalOnly || false
    });
  };

  const handleSave = () => {
    if (editingProvider && editingProvider.name.trim()) {
      onSaveProvider(editingProvider);
      setShowModal(false);
      setEditingProvider(null);
      setModalTestResult(null);
    }
  };

  const handleModalTest = async () => {
    if (!editingProvider) return;
    setModalTesting(true);
    setModalTestResult(null);
    const startTime = Date.now();

    try {
      const result = await testProviderConnection(editingProvider);

      if (result.ok) {
        const fetchedModels = result.models && result.models.length > 0 ? result.models : editingProvider.models;
        const newDefault = fetchedModels.includes(editingProvider.defaultModel)
          ? editingProvider.defaultModel
          : (fetchedModels[0] || editingProvider.defaultModel);

        setEditingProvider(prev => prev ? {
          ...prev,
          models: fetchedModels,
          defaultModel: newDefault,
          status: 'online',
          latency: result.latencyMs,
          errorMessage: undefined
        } : null);

        setModalTestResult({
          status: 'CONNECTED',
          latency: result.latencyMs,
          message: result.message || 'API verified and connected successfully!',
          models: fetchedModels
        });
      } else {
        const failureMessage = result.message || (result.statusCode ? `HTTP ${result.statusCode} — Verification rejected` : 'Connection verification failed');
        setEditingProvider(prev => prev ? {
          ...prev,
          status: 'offline',
          errorMessage: failureMessage
        } : null);

        setModalTestResult({
          status: 'FAILED',
          latency: result.latencyMs || 0,
          message: failureMessage
        });
      }
    } catch (err: any) {
      setModalTestResult({
        status: 'FAILED',
        message: err.message || 'Network error connecting to API gateway endpoint.'
      });
    } finally {
      setModalTesting(false);
    }
  };

  const handleAddCustomModel = (providerId: string) => {
    const input = customModelInputs[providerId]?.trim();
    if (!input) return;

    const targetProvider = providers.find(p => p.id === providerId);
    if (targetProvider) {
      const updatedModels = targetProvider.models.includes(input)
        ? targetProvider.models
        : [input, ...targetProvider.models];

      onSaveProvider({
        ...targetProvider,
        models: updatedModels,
        defaultModel: input
      });

      setCustomModelInputs(prev => ({ ...prev, [providerId]: '' }));
      setShowAddCustomFor(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-24 px-1 sm:px-2 overflow-x-hidden">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/40 p-4 sm:p-5 rounded-2xl border border-white/10 shadow-lg">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
              Model Gateways &amp; Router
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Live Routing
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Configure multi-model endpoints, switch active inference models with 1 tap, and probe gateways with automatic model discovery.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={handleTestAll}
            disabled={isCrawlingAll}
            className="px-3.5 py-2 min-h-[42px] rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            title="Test all provider gateways in parallel"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCrawlingAll ? 'animate-spin' : ''}`} />
            <span>{isCrawlingAll ? 'Probing...' : 'Test All Gateways'}</span>
          </button>

          <button
            onClick={() => handleOpenAdd('openrouter')}
            className="px-3.5 py-2 min-h-[42px] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Provider</span>
          </button>
        </div>
      </div>

      {/* Active Primary Model Quick Status Card */}
      {primaryProvider && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-slate-900/80 to-slate-950 border border-emerald-500/30 shadow-md space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-mono text-emerald-300 font-semibold uppercase tracking-wider block">
                  Active Primary Gateway
                </span>
                <h3 className="text-sm font-bold text-white truncate">
                  {primaryProvider.name}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 border ${
                primaryProvider.status === 'online'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                <CheckCircle2 className="w-3 h-3" />
                {primaryProvider.status === 'online' ? 'Online' : 'Ready'}
                {primaryProvider.latency ? ` (${primaryProvider.latency}ms)` : ''}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-xs text-slate-300">Selected Model:</span>
              <strong className="text-xs font-mono text-emerald-300 truncate max-w-[240px] sm:max-w-md">
                {primaryProvider.defaultModel}
              </strong>
            </div>

            {primaryProvider.models.length > 1 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-slate-400">Quick Switch:</span>
                <select
                  value={primaryProvider.defaultModel}
                  onChange={(e) => onSetDefaultModel(primaryProvider.id, e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-emerald-500/40 text-xs font-mono text-emerald-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[180px] truncate"
                >
                  {primaryProvider.models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preset Quick-Add Carousel / Badges */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
        <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> One-Click Gateway Presets
        </span>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {[
            { type: 'openrouter' as ProviderType, label: 'OpenRouter', desc: 'Multi-Model' },
            { type: 'pollinations' as ProviderType, label: 'Pollinations AI', desc: '100% Free' },
            { type: 'groq' as ProviderType, label: 'Groq LPUs', desc: 'Ultra-Fast' },
            { type: 'deepseek' as ProviderType, label: 'DeepSeek API', desc: 'R1 Reasoning' },
            { type: 'gemini' as ProviderType, label: 'Google Gemini', desc: 'Multimodal' },
            { type: 'anthropic' as ProviderType, label: 'Anthropic Claude', desc: 'Sonnet 3.7' },
            { type: 'ollama' as ProviderType, label: 'Ollama Local', desc: 'Offline' }
          ].map(p => (
            <button
              key={p.type}
              onClick={() => handleOpenAdd(p.type)}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-indigo-600/20 hover:border-indigo-500/40 border border-white/10 text-slate-200 text-xs font-medium flex items-center gap-1 transition-all group active:scale-95"
            >
              <span className="text-white font-semibold group-hover:text-indigo-300">{p.label}</span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">({p.desc})</span>
              <Plus className="w-3 h-3 text-slate-400 group-hover:text-white" />
            </button>
          ))}
        </div>
      </div>

      {/* Local-Only & Routing Controls Card */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-400" /> Local-Only Mode (Zero Cloud Egress)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              When enabled, prompts and codebase files strictly stay on your local device (Ollama / Local LLM)
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={localOnlyMode}
              onChange={(e) => onToggleLocalOnly(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-semibold text-slate-300 font-mono uppercase">Routing Mode</h4>
            <p className="text-xs text-slate-400">Agent auto-selection vs manual model routing</p>
          </div>

          <div className="flex rounded-xl bg-black/40 border border-white/10 p-1 gap-1 self-start sm:self-auto">
            {(['AUTO', 'MANUAL', 'MIXED'] as RoutingMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onSetRoutingMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  routingMode === mode
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Providers List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-semibold uppercase text-slate-400">
            Configured Gateways ({providers.length})
          </h3>
          <span className="text-[11px] text-indigo-400 font-medium hidden sm:inline">
            Tap any model badge to set as default
          </span>
        </div>

        {providers.map((p, idx) => {
          const isPrimary = idx === 0;
          const filterQuery = searchQueries[p.id]?.toLowerCase() || '';
          const filteredModels = filterQuery
            ? p.models.filter(m => m.toLowerCase().includes(filterQuery))
            : p.models;

          return (
            <div
              key={p.id}
              className={`p-4 sm:p-5 rounded-2xl bg-white/[0.02] border transition-all space-y-3.5 overflow-hidden ${
                isPrimary ? 'border-indigo-500/40 shadow-sm shadow-indigo-500/10' : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Provider Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold font-mono text-sm shrink-0">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm sm:text-base font-bold text-white truncate max-w-[220px] sm:max-w-sm">
                        {p.name}
                      </h4>
                      {isPrimary && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                          PRIMARY
                        </span>
                      )}
                      {p.apiKey ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          <Lock className="w-2.5 h-2.5" /> KEY SET
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                          KEYLESS
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono truncate max-w-[280px] sm:max-w-md mt-0.5">
                      <span className="text-slate-500">TYPE:</span> {p.type.toUpperCase()} · <span className="text-slate-500">{p.baseUrl || 'Default'}</span>
                    </p>
                  </div>
                </div>

                {/* Status & Latency */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border ${
                    p.status === 'online'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : p.status === 'offline'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-white/5 text-slate-400 border-white/10'
                  }`}>
                    {p.status === 'online' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3 text-amber-400" />}
                    <span>{p.status === 'online' ? 'Online' : p.status === 'offline' ? 'Offline' : 'Untested'}</span>
                  </span>

                  {p.latency ? (
                    <span className="text-xs font-mono text-slate-300 bg-black/40 px-2 py-1 rounded-lg border border-white/10">
                      {p.latency} ms
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Models Section with Interactive Selection & Search */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-indigo-400 shrink-0" />
                    Available Models ({p.models.length}):
                    <span className="text-slate-300 font-sans ml-1 text-[11px]">
                      (Default: <strong className="text-indigo-300 font-mono">{p.defaultModel}</strong>)
                    </span>
                  </span>

                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    {p.models.length > 5 && (
                      <div className="relative">
                        <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={searchQueries[p.id] || ''}
                          onChange={(e) => setSearchQueries(prev => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder="Filter models..."
                          className="pl-6 pr-2 py-0.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-white focus:outline-none focus:border-indigo-500 w-28 sm:w-36 font-mono"
                        />
                      </div>
                    )}
                    <button
                      onClick={() => setShowAddCustomFor(showAddCustomFor === p.id ? null : p.id)}
                      className="px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/20 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Custom Model</span>
                    </button>
                  </div>
                </div>

                {/* Inline Custom Model Input */}
                {showAddCustomFor === p.id && (
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-black/50 border border-indigo-500/30">
                    <input
                      type="text"
                      value={customModelInputs[p.id] || ''}
                      onChange={(e) => setCustomModelInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomModel(p.id)}
                      placeholder="e.g. anthropic/claude-3.7-sonnet or gpt-4.5"
                      className="flex-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleAddCustomModel(p.id)}
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0"
                    >
                      Add &amp; Select
                    </button>
                  </div>
                )}

                {/* Model Pills (Clickable for Instant Switch) */}
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {filteredModels.map((m) => {
                    const isDefault = m === p.defaultModel;
                    return (
                      <button
                        key={m}
                        onClick={() => onSetDefaultModel(p.id, m)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all flex items-center gap-1 max-w-[280px] truncate text-left active:scale-95 ${
                          isDefault
                            ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/60 font-bold shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500/40'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'
                        }`}
                        title={`Click to set ${m} as default model`}
                      >
                        {isDefault ? (
                          <Check className="w-3 h-3 text-indigo-400 shrink-0" />
                        ) : null}
                        <span className="truncate">{m}</span>
                        {isDefault && <span className="text-[10px] text-amber-400 ml-0.5">★</span>}
                      </button>
                    );
                  })}
                  {filteredModels.length === 0 && (
                    <span className="text-xs text-slate-500 italic">No models match filter</span>
                  )}
                </div>
              </div>

              {/* Diagnostic Error Message */}
              {p.errorMessage && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold block break-words">{p.errorMessage}</span>
                    {p.type === 'ollama' && (
                      <span className="text-[11px] text-slate-300 block mt-1">
                        💡 Running in browser sandbox. Simulated local engine is active. For live daemon: <code className="text-amber-300 font-mono bg-black/40 px-1 py-0.5 rounded">OLLAMA_ORIGINS="*" ollama serve</code>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic Model Selector Dropdown & Live Discovery Result */}
              {p.status === 'online' && p.models.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">API Verified &amp; Connected</span>
                      <span className="text-[10px] font-mono text-emerald-400/90">Select model to execute agent tasks:</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={p.defaultModel}
                      onChange={(e) => onSetDefaultModel(p.id, e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-emerald-500/40 text-xs font-mono text-emerald-300 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer min-w-[200px]"
                    >
                      {p.models.map(m => (
                        <option key={m} value={m}>
                          {m} {m === p.defaultModel ? '★ (Active)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-white/5 text-xs gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleTest(p.id)}
                    disabled={testingId === p.id}
                    className="px-3.5 py-2 min-h-[40px] rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-all active:scale-95"
                    title="Probe API and auto-crawl accessible models"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingId === p.id ? 'animate-spin text-emerald-400' : ''}`} />
                    <span>{testingId === p.id ? 'Testing...' : 'Test Connection & List Models'}</span>
                  </button>

                  {!isPrimary && (
                    <button
                      onClick={() => onSetDefaultProvider(p.id)}
                      className="px-3 py-2 min-h-[40px] rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium border border-white/10 transition-all active:scale-95"
                    >
                      Make Primary
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      setEditingProvider(p);
                      setShowModal(true);
                    }}
                    className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors active:scale-95"
                    title="Edit Provider & Endpoints"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {providers.length > 1 && (
                    <button
                      onClick={() => onDeleteProvider(p.id)}
                      className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors active:scale-95"
                      title="Delete Provider"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Add Provider Modal */}
      {showModal && editingProvider && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#12161F] border border-white/15 rounded-2xl max-w-lg w-full p-4 sm:p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Configure API Gateway</h3>
                  <p className="text-xs text-slate-400">Endpoint definition &amp; API credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white flex items-center justify-center hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase">Provider Preset</label>
                <select
                  value={editingProvider.type}
                  onChange={(e) => handleTypeChange(e.target.value as ProviderType)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="openrouter">OpenRouter (Unified Multi-Model Gateway)</option>
                  <option value="pollinations">Pollinations AI (100% Free / No Key)</option>
                  <option value="groq">Groq (Ultra-Fast LPUs)</option>
                  <option value="deepseek">DeepSeek API (R1 &amp; V3)</option>
                  <option value="gemini">Google Gemini (Official)</option>
                  <option value="anthropic">Anthropic Claude (Messages API)</option>
                  <option value="openai">OpenAI (GPT-4o, o1, o3-mini)</option>
                  <option value="together">Together AI</option>
                  <option value="mistral">Mistral AI</option>
                  <option value="ollama">Ollama (Local / Offline)</option>
                  <option value="custom">Custom Endpoint (Any OpenAI-Compatible)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase">Display Name</label>
                <input
                  type="text"
                  value={editingProvider.name}
                  onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                  placeholder="e.g. OpenRouter Gateway"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase">API Base URL Endpoint</label>
                <input
                  type="text"
                  value={editingProvider.baseUrl || ''}
                  onChange={(e) => setEditingProvider({ ...editingProvider, baseUrl: e.target.value })}
                  placeholder="https://openrouter.ai/api/v1"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase">
                  API Key <span className="text-slate-500 font-sans lowercase">(Stored securely on device)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={editingProvider.apiKey || ''}
                    onChange={(e) => setEditingProvider({ ...editingProvider, apiKey: e.target.value })}
                    placeholder="sk-..."
                    className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white font-mono focus:outline-none focus:border-indigo-500 min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={handleModalTest}
                    disabled={modalTesting}
                    className="px-3.5 py-2 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-indigo-600/30"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${modalTesting ? 'animate-spin' : ''}`} />
                    <span>{modalTesting ? 'Testing...' : 'Test & Fetch Models'}</span>
                  </button>
                </div>
              </div>

              {/* Test Status Banner */}
              {modalTestResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  modalTestResult.status === 'CONNECTED'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}>
                  {modalTestResult.status === 'CONNECTED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">
                        {modalTestResult.status === 'CONNECTED' ? 'Connection Succeeded' : 'Connection Failed'}
                      </span>
                      {modalTestResult.latency && (
                        <span className="font-mono text-[10px] bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
                          {modalTestResult.latency} ms
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed break-words opacity-90">
                      {modalTestResult.message}
                    </p>
                    {modalTestResult.status === 'FAILED' && editingProvider.type === 'gemini' && (
                      <div className="mt-2 pt-2 border-t border-rose-500/20 flex flex-wrap gap-2 items-center">
                        <a
                          href="https://aistudio.google.com/apikey"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 underline font-medium"
                        >
                          Get Free Gemini API Key from Google AI Studio ↗
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Legacy Model Detected — 1-Tap Upgrade */}
              {editingProvider.type === 'gemini' && (editingProvider.models.some(m => m.includes('2.5-flash')) || editingProvider.defaultModel.includes('2.5-flash')) && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold text-amber-200">Modern Gemini Models Available</div>
                      <div className="text-[10px] text-amber-300/80">Upgrade to verified Gemini 2.0 / Flash models</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-2.0-flash', 'gemini-1.5-pro'];
                      setEditingProvider({
                        ...editingProvider,
                        models: updated,
                        defaultModel: 'gemini-flash-latest'
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] shrink-0 active:scale-95 transition-all shadow-sm"
                  >
                    1-Tap Update
                  </button>
                </div>
              )}

              {/* Model Dropdown & Discovery Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-mono uppercase">Select Active Model</label>
                  <span className="text-[10px] text-indigo-400 font-mono font-medium">
                    {editingProvider.models.length} accessible
                  </span>
                </div>
                <select
                  value={editingProvider.defaultModel}
                  onChange={(e) => setEditingProvider({ ...editingProvider, defaultModel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-indigo-500/40 text-indigo-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[44px] cursor-pointer"
                >
                  {editingProvider.models.map(m => (
                    <option key={m} value={m} className="bg-slate-900 text-white font-mono">
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-mono uppercase">All Configured Models</label>
                  <span className="text-[10px] text-slate-400 font-mono">Tap badge to select</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl bg-black/40 border border-white/10">
                  {editingProvider.models.map(m => {
                    const isSelected = m === editingProvider.defaultModel;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setEditingProvider({ ...editingProvider, defaultModel: m })}
                        className={`px-2 py-1 rounded-lg text-[11px] font-mono border transition-all flex items-center gap-1 active:scale-95 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-400 font-bold shadow-sm'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                        <span className="truncate max-w-[200px]">{m}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 text-white text-xs font-semibold shadow-lg shadow-indigo-500/30 transition-all"
              >
                Save Gateway Config
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
