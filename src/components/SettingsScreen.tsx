/**
 * Omnintellx — Settings & Configuration Screen
 * Complete API Gateways & Model Crawlers Management (OpenRouter, Gemini, Cerebras, Grok, Local LLM, Custom API),
 * Universal System Prompt Editor, Theme Controls, and System Architecture.
 */

import React, { useState } from 'react';
import { AppSettings, EditorPrefs, ThemeMode, ProviderConfig, ProviderType } from '../types';
import { DEFAULT_UNIVERSAL_SYSTEM_PROMPT } from '../engine/systemPrompt';
import { PROVIDER_PRESETS } from '../engine/providers';
import {
  Palette,
  Code2,
  HardDrive,
  Download,
  Upload,
  Terminal,
  Info,
  Shield,
  Sparkles,
  Check,
  AlertTriangle,
  Bot,
  Heart,
  Cpu,
  RefreshCw,
  Zap,
  Globe,
  Sliders,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Plus,
  Trash2,
  Star,
  Search,
  Server,
  Layers,
  HelpCircle
} from 'lucide-react';

interface SettingsScreenProps {
  theme: ThemeMode;
  settings: AppSettings;
  editorPrefs: EditorPrefs;
  storageBytes: number;
  providers?: ProviderConfig[];
  onSetTheme: (theme: ThemeMode) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onUpdateEditorPrefs: (prefs: EditorPrefs) => void;
  onExportBackup: (includeKeys: boolean) => void;
  onImportBackup: (json: string) => void;
  onClearCache: () => void;
  onFactoryReset: () => void;
  onSaveProvider?: (provider: ProviderConfig) => void;
  onDeleteProvider?: (providerId: string) => void;
  onTestConnection?: (providerId: string) => Promise<void>;
  onSetDefaultProvider?: (providerId: string) => void;
  onSetDefaultModel?: (providerId: string, modelName: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  theme,
  settings,
  editorPrefs,
  storageBytes,
  providers = [],
  onSetTheme,
  onUpdateSettings,
  onUpdateEditorPrefs,
  onExportBackup,
  onImportBackup,
  onClearCache,
  onFactoryReset,
  onSaveProvider,
  onDeleteProvider,
  onTestConnection,
  onSetDefaultProvider,
  onSetDefaultModel
}) => {
  const [activeTab, setActiveTab] = useState<'apiGateways' | 'systemPrompt' | 'appearance' | 'editor' | 'storage' | 'backup' | 'dev' | 'about'>('apiGateways');
  const [rawStorageVisible, setRawStorageVisible] = useState(false);
  const [includeKeysExport, setIncludeKeysExport] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // API Gateways State
  const [showKeyMap, setShowKeyMap] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [isCrawlingAll, setIsCrawlingAll] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState<Record<string, string>>({});
  const [customModelInputs, setCustomModelInputs] = useState<Record<string, string>>({});
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [newCustomProv, setNewCustomProv] = useState({
    name: 'Custom OpenAI-Compatible API',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    defaultModel: 'custom-model-1'
  });

  const toggleShowKey = (id: string) => {
    setShowKeyMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) onImportBackup(text);
      };
      reader.readAsText(file);
    }
  };

  const handleResetSystemPrompt = () => {
    onUpdateSettings({
      ...settings,
      universalSystemPrompt: DEFAULT_UNIVERSAL_SYSTEM_PROMPT
    });
  };

  // Provider Handlers
  const handleUpdateProviderField = (providerId: string, updates: Partial<ProviderConfig>) => {
    const target = providers.find(p => p.id === providerId);
    if (!target || !onSaveProvider) return;
    const updated: ProviderConfig = {
      ...target,
      ...updates
    };
    onSaveProvider(updated);
  };

  const handleTriggerTest = async (providerId: string) => {
    if (!onTestConnection) return;
    setTestingId(providerId);
    try {
      await onTestConnection(providerId);
    } finally {
      setTestingId(null);
    }
  };

  const handleTriggerTestAll = async () => {
    if (!onTestConnection) return;
    setIsCrawlingAll(true);
    try {
      for (const prov of providers) {
        await onTestConnection(prov.id);
      }
    } finally {
      setIsCrawlingAll(false);
    }
  };

  const handleToggleModelEnabled = (providerId: string, modelName: string) => {
    const target = providers.find(p => p.id === providerId);
    if (!target || !onSaveProvider) return;
    const isCurrentDefault = target.defaultModel === modelName;
    const exists = target.models.includes(modelName);

    let newModels: string[];
    if (exists) {
      if (target.models.length <= 1) return; // Keep at least one model
      newModels = target.models.filter(m => m !== modelName);
    } else {
      newModels = [...target.models, modelName];
    }

    const newDefault = isCurrentDefault && !exists
      ? (newModels[0] || 'default-model')
      : target.defaultModel;

    onSaveProvider({
      ...target,
      models: newModels,
      defaultModel: newDefault
    });
  };

  const handleAddCustomModelToProvider = (providerId: string) => {
    const input = (customModelInputs[providerId] || '').trim();
    if (!input) return;
    const target = providers.find(p => p.id === providerId);
    if (!target || !onSaveProvider) return;

    if (!target.models.includes(input)) {
      onSaveProvider({
        ...target,
        models: [input, ...target.models],
        defaultModel: input
      });
    }
    setCustomModelInputs(prev => ({ ...prev, [providerId]: '' }));
  };

  const handleCreateCustomProvider = () => {
    if (!onSaveProvider) return;
    const newId = `prov_custom_${Date.now()}`;
    const newP: ProviderConfig = {
      id: newId,
      name: newCustomProv.name.trim() || 'Custom Gateway',
      type: 'custom',
      baseUrl: newCustomProv.baseUrl.trim(),
      apiKey: newCustomProv.apiKey.trim(),
      models: [newCustomProv.defaultModel.trim() || 'custom-model-1'],
      defaultModel: newCustomProv.defaultModel.trim() || 'custom-model-1',
      status: 'untested'
    };
    onSaveProvider(newP);
    setShowAddCustomModal(false);
    setNewCustomProv({
      name: 'Custom OpenAI-Compatible API',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      defaultModel: 'custom-model-1'
    });
  };

  // Group primary requested APIs vs secondary
  const primaryTypes: ProviderType[] = ['openrouter', 'gemini', 'cerebras', 'grok', 'ollama', 'custom'];
  const primaryProviders = providers.filter(p => primaryTypes.includes(p.type));
  const otherProviders = providers.filter(p => !primaryTypes.includes(p.type));

  const totalModelsDiscovered = providers.reduce((acc, p) => acc + p.models.length, 0);
  const onlineCount = providers.filter(p => p.status === 'online').length;

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      <div>
        <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2.5">
          <Sliders className="w-6 h-6 text-indigo-400" />
          Settings &amp; API Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure API Gateways (OpenRouter, Gemini, Cerebras, Grok, Local LLM, Custom API), test live connections, auto-crawl allotted models, and manage system directives.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-white/10 overflow-x-auto gap-2 select-none">
        <button
          onClick={() => setActiveTab('apiGateways')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'apiGateways' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 text-indigo-400" /> API Gateways &amp; Models
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">
            {onlineCount}/{providers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('systemPrompt')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'systemPrompt' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" /> Universal System Prompt
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'appearance' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" /> Appearance
        </button>

        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'editor' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" /> Editor
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'storage' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" /> Storage
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'backup' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Download className="w-3.5 h-3.5" /> Backup &amp; Restore
        </button>

        <button
          onClick={() => setActiveTab('dev')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'dev' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" /> Developer
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'about' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Info className="w-3.5 h-3.5" /> About
        </button>
      </div>

      {/* TAB 1: API GATEWAYS & MODEL CRAWLERS */}
      {activeTab === 'apiGateways' && (
        <div className="space-y-6">
          {/* Top Action & Status Banner */}
          <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/40 border border-emerald-500/20 rounded-2xl p-4.5 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live API Engine
                </span>
                <span className="text-xs text-slate-400">
                  {onlineCount} Online Gateways • {totalModelsDiscovered} Available Models
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">Multi-API Model Router &amp; Live Crawlers</h3>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                Add keys for OpenRouter, Google Gemini, Cerebras, Grok (xAI), Local LLM (Ollama), or Custom API. Click <strong>Test Connection &amp; Crawl Models</strong> to verify keys and automatically populate accessible models across the studio.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleTriggerTestAll}
                disabled={isCrawlingAll}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCrawlingAll ? 'animate-spin' : ''}`} />
                {isCrawlingAll ? 'Crawling All APIs...' : 'Test All Connections & Crawl'}
              </button>

              <button
                onClick={() => setShowAddCustomModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                Add Custom API Method
              </button>
            </div>
          </div>

          {/* PRIMARY APIS GRID */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Primary AI Gateways &amp; Endpoints
            </h4>

            <div className="grid grid-cols-1 gap-4">
              {primaryProviders.map(prov => {
                const isOnline = prov.status === 'online';
                const isFailed = prov.status === 'offline';
                const isTestingThis = testingId === prov.id;
                const isShowKey = showKeyMap[prov.id];
                const searchQ = (modelSearchQuery[prov.id] || '').toLowerCase();
                const filteredModels = prov.models.filter(m => m.toLowerCase().includes(searchQ));

                let badgeInfo = { label: 'OpenAI-Compatible', color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10' };
                let docsUrl = '';
                if (prov.type === 'gemini') {
                  badgeInfo = { label: 'Google AI Studio', color: 'text-amber-400 border-amber-500/20 bg-amber-500/10' };
                  docsUrl = 'https://aistudio.google.com/apikey';
                } else if (prov.type === 'openrouter') {
                  badgeInfo = { label: 'Multi-Model Hub', color: 'text-violet-400 border-violet-500/20 bg-violet-500/10' };
                  docsUrl = 'https://openrouter.ai/keys';
                } else if (prov.type === 'cerebras') {
                  badgeInfo = { label: 'Ultra-Fast Compute', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' };
                  docsUrl = 'https://cloud.cerebras.ai';
                } else if (prov.type === 'grok') {
                  badgeInfo = { label: 'xAI Intelligence', color: 'text-blue-400 border-blue-500/20 bg-blue-500/10' };
                  docsUrl = 'https://console.x.ai';
                } else if (prov.type === 'ollama') {
                  badgeInfo = { label: 'Local Daemon / Air-Gapped', color: 'text-slate-400 border-slate-500/20 bg-slate-500/10' };
                  docsUrl = 'https://ollama.com';
                } else if (prov.type === 'custom') {
                  badgeInfo = { label: 'Custom User Gateway', color: 'text-rose-400 border-rose-500/20 bg-rose-500/10' };
                }

                return (
                  <div
                    key={prov.id}
                    className={`bg-slate-900/60 border rounded-2xl p-4 sm:p-5 transition-all ${
                      isOnline
                        ? 'border-emerald-500/30 shadow-md shadow-emerald-500/5'
                        : isFailed
                        ? 'border-red-500/30 shadow-md shadow-red-500/5'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
                          isOnline ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-slate-300 border-white/10'
                        }`}>
                          {prov.type === 'gemini' ? 'G' : prov.type === 'openrouter' ? 'OR' : prov.type === 'cerebras' ? 'CB' : prov.type === 'grok' ? 'X' : prov.type === 'ollama' ? 'OL' : 'API'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{prov.name}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeInfo.color}`}>
                              {badgeInfo.label}
                            </span>
                            {docsUrl && (
                              <a
                                href={docsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 underline transition-colors"
                              >
                                Get API Key <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[11px] truncate max-w-xs">{prov.baseUrl || 'Default Endpoint'}</span>
                            {prov.latency && (
                              <span className="text-[10px] font-mono text-emerald-400">
                                • {prov.latency}ms latency
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status & Test Button */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border bg-slate-950/40">
                          {isOnline ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Online
                            </span>
                          ) : isFailed ? (
                            <span className="flex items-center gap-1 text-red-400 font-semibold">
                              <XCircle className="w-3 h-3" /> Offline
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-400">
                              <HelpCircle className="w-3 h-3" /> Untested
                            </span>
                          )}
                        </div>

                        {onSetDefaultProvider && (
                          <button
                            onClick={() => onSetDefaultProvider(prov.id)}
                            title="Set as Default Studio Provider"
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
                              providers[0]?.id === prov.id
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                            }`}
                          >
                            <Star className={`w-3 h-3 ${providers[0]?.id === prov.id ? 'fill-amber-400 text-amber-400' : ''}`} />
                            {providers[0]?.id === prov.id ? 'Default' : 'Make Default'}
                          </button>
                        )}

                        {prov.type === 'custom' && onDeleteProvider && (
                          <button
                            onClick={() => onDeleteProvider(prov.id)}
                            title="Delete Custom Gateway"
                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Error Banner if connection failed */}
                    {prov.errorMessage && (
                      <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Connection verification failed:</strong> {prov.errorMessage}
                        </div>
                      </div>
                    )}

                    {/* Inputs Area */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      {/* API Key */}
                      <div className="md:col-span-6 space-y-1">
                        <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                          <span>API Key / Secret Token</span>
                          <span className="text-[10px] text-slate-500">
                            {prov.type === 'ollama' ? 'Optional for local' : 'Encrypted in client browser'}
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            type={isShowKey ? 'text' : 'password'}
                            value={prov.apiKey || ''}
                            onChange={(e) => handleUpdateProviderField(prov.id, { apiKey: e.target.value })}
                            placeholder={
                              prov.type === 'gemini'
                                ? 'AIzaSy...'
                                : prov.type === 'openrouter'
                                ? 'sk-or-v1-...'
                                : prov.type === 'cerebras'
                                ? 'csk-...'
                                : prov.type === 'grok'
                                ? 'xai-...'
                                : 'Enter API key or Bearer token'
                            }
                            className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 pr-9 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowKey(prov.id)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                          >
                            {isShowKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Base URL */}
                      <div className="md:col-span-4 space-y-1">
                        <label className="text-[11px] font-semibold text-slate-300">Base API URL Endpoint</label>
                        <input
                          type="text"
                          value={prov.baseUrl || ''}
                          onChange={(e) => handleUpdateProviderField(prov.id, { baseUrl: e.target.value })}
                          placeholder="https://api.openai.com/v1"
                          className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>

                      {/* Test & Crawl Button */}
                      <div className="md:col-span-2">
                        <button
                          type="button"
                          onClick={() => handleTriggerTest(prov.id)}
                          disabled={isTestingThis}
                          className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                        >
                          <Zap className={`w-3.5 h-3.5 ${isTestingThis ? 'animate-bounce text-amber-300' : 'text-amber-400'}`} />
                          {isTestingThis ? 'Crawling...' : 'Test Connection'}
                        </button>
                      </div>
                    </div>

                    {/* Allotted & Discovered Models Section */}
                    <div className="mt-4 pt-3.5 border-t border-white/5 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            Allotted Models by this API
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                            {prov.models.length} active
                          </span>
                        </div>

                        {/* Search filter if models > 4 */}
                        {prov.models.length > 4 && (
                          <div className="relative">
                            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={modelSearchQuery[prov.id] || ''}
                              onChange={(e) => setModelSearchQuery(prev => ({ ...prev, [prov.id]: e.target.value }))}
                              placeholder="Filter crawled models..."
                              className="bg-slate-950/60 border border-white/10 rounded-lg pl-6 pr-2 py-1 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-36 sm:w-48"
                            />
                          </div>
                        )}
                      </div>

                      {/* Interactive Model Chips */}
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                        {filteredModels.map(modelName => {
                          const isDefault = prov.defaultModel === modelName;
                          return (
                            <div
                              key={modelName}
                              className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                                isDefault
                                  ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500/50 shadow-sm shadow-indigo-500/20'
                                  : 'bg-slate-950/60 text-slate-300 border-white/10 hover:border-white/20'
                              }`}
                            >
                              <span
                                onClick={() => onSetDefaultModel && onSetDefaultModel(prov.id, modelName)}
                                className="cursor-pointer hover:text-white"
                                title="Click to set as Default Model"
                              >
                                {modelName}
                              </span>

                              {isDefault ? (
                                <span className="text-[9px] font-sans font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-indigo-500 text-white">
                                  Default
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onSetDefaultModel && onSetDefaultModel(prov.id, modelName)}
                                  title="Make default model"
                                  className="text-slate-500 hover:text-amber-400 transition-colors"
                                >
                                  <Star className="w-2.5 h-2.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleToggleModelEnabled(prov.id, modelName)}
                                title="Remove model from studio"
                                className="text-slate-500 hover:text-red-400 opacity-60 group-hover:opacity-100 transition-all text-xs"
                              >
                                &times;
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Custom Model to this provider */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={customModelInputs[prov.id] || ''}
                          onChange={(e) => setCustomModelInputs(prev => ({ ...prev, [prov.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddCustomModelToProvider(prov.id);
                            }
                          }}
                          placeholder="+ Add custom model ID (e.g. meta-llama/llama-3.3-70b-instruct)"
                          className="flex-1 bg-slate-950/50 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomModelToProvider(prov.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
                        >
                          Add Model
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* OTHER PROVIDERS SECTION */}
          {otherProviders.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                Additional Connected Providers
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {otherProviders.map(prov => {
                  const isOnline = prov.status === 'online';
                  const isTestingThis = testingId === prov.id;
                  return (
                    <div
                      key={prov.id}
                      className="bg-slate-900/40 border border-white/10 rounded-xl p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">{prov.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-xs">{prov.defaultModel}</div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isOnline ? 'Online' : 'Untested'}
                          </span>
                          <button
                            onClick={() => handleTriggerTest(prov.id)}
                            disabled={isTestingThis}
                            className="px-2 py-1 rounded text-[10px] font-semibold bg-indigo-600/80 hover:bg-indigo-600 text-white cursor-pointer"
                          >
                            {isTestingThis ? '...' : 'Test'}
                          </button>
                        </div>
                      </div>

                      <input
                        type="password"
                        value={prov.apiKey || ''}
                        onChange={(e) => handleUpdateProviderField(prov.id, { apiKey: e.target.value })}
                        placeholder="API Key..."
                        className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-600 font-mono"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ADD CUSTOM MODAL */}
          {showAddCustomModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#0B0E13] border border-white/10 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-400" />
                    Add Custom API Method
                  </h3>
                  <button
                    onClick={() => setShowAddCustomModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    &times;
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Provider Display Name</label>
                    <input
                      type="text"
                      value={newCustomProv.name}
                      onChange={(e) => setNewCustomProv(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. My Private vLLM / Company OpenAI Proxy"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Base URL</label>
                    <input
                      type="text"
                      value={newCustomProv.baseUrl}
                      onChange={(e) => setNewCustomProv(prev => ({ ...prev, baseUrl: e.target.value }))}
                      placeholder="https://api.openai.com/v1"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">API Key / Bearer Token</label>
                    <input
                      type="password"
                      value={newCustomProv.apiKey}
                      onChange={(e) => setNewCustomProv(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="Bearer token or secret key"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Initial Model Name</label>
                    <input
                      type="text"
                      value={newCustomProv.defaultModel}
                      onChange={(e) => setNewCustomProv(prev => ({ ...prev, defaultModel: e.target.value }))}
                      placeholder="e.g. gpt-4o, llama-3.3-70b, my-fine-tune"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => setShowAddCustomModal(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCustomProvider}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    Save Gateway
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UNIVERSAL SYSTEM PROMPT */}
      {activeTab === 'systemPrompt' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  Universal System Directive &amp; Agent Constitution
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Governs all model interactions, autonomous tool loops, and council roles in Omnintellx.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(settings.universalSystemPrompt || DEFAULT_UNIVERSAL_SYSTEM_PROMPT);
                    setCopiedPrompt(true);
                    setTimeout(() => setCopiedPrompt(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors flex items-center gap-1.5"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                  {copiedPrompt ? 'Copied' : 'Copy Prompt'}
                </button>
                <button
                  onClick={handleResetSystemPrompt}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" /> Reset to Default
                </button>
              </div>
            </div>

            <textarea
              value={settings.universalSystemPrompt || DEFAULT_UNIVERSAL_SYSTEM_PROMPT}
              onChange={(e) => onUpdateSettings({ ...settings, universalSystemPrompt: e.target.value })}
              rows={16}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
            />
          </div>
        </div>
      )}

      {/* TAB 3: APPEARANCE */}
      {activeTab === 'appearance' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Color Theme</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['dark', 'amoled', 'light', 'system'] as ThemeMode[]).map((t) => (
                <button
                  key={t}
                  onClick={() => onSetTheme(t)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    theme === t
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-white/10 bg-slate-950 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-xs capitalize">{t}</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {t === 'amoled' ? 'Pure #000000 Black' : t === 'dark' ? 'Deep Navy #0B0E13' : t === 'light' ? 'Bright Surface' : 'OS Automatic'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EDITOR */}
      {activeTab === 'editor' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Code Editor Ergonomics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Font Size ({editorPrefs.fontSize}px)</label>
                <input
                  type="range"
                  min={11}
                  max={20}
                  value={editorPrefs.fontSize}
                  onChange={(e) => onUpdateEditorPrefs({ ...editorPrefs, fontSize: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Tab Size ({editorPrefs.tabSize} spaces)</label>
                <select
                  value={editorPrefs.tabSize}
                  onChange={(e) => onUpdateEditorPrefs({ ...editorPrefs, tabSize: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value={2}>2 Spaces</option>
                  <option value={4}>4 Spaces</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: STORAGE */}
      {activeTab === 'storage' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Local Workspace Storage</h3>
                <p className="text-xs text-slate-400 mt-0.5">Estimated browser quota usage: {formatBytes(storageBytes)}</p>
              </div>
              <button
                onClick={onClearCache}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/20"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">JSON Archive Export &amp; Import</h3>
            <p className="text-xs text-slate-400">
              Export all workspace projects, custom system directives, and configuration into a single portable backup file.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => onExportBackup(includeKeysExport)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" /> Download JSON Backup
              </button>

              <label className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 flex items-center gap-2 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Import JSON Backup
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: DEVELOPER */}
      {activeTab === 'dev' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Developer Diagnostics</h3>
            <p className="text-xs text-slate-400">
              Omnintellx autonomous loop status and dangerous operations.
            </p>
            <button
              onClick={onFactoryReset}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 flex items-center gap-2"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Factory Reset Omnintellx
            </button>
          </div>
        </div>
      )}

      {/* TAB 8: ABOUT */}
      {activeTab === 'about' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Omnintellx Autonomous Software Studio
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Designed around the core principle: <em>"The AI should never generate a project. It should operate a project."</em>
            </p>
            <div className="text-xs text-slate-400 pt-2 border-t border-white/5 flex items-center justify-between">
              <span>Version: 5.0.0 Production Release</span>
              <span>All rights reserved.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
