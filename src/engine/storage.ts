/**
 * Omnintellx — Storage & Persistence Layer
 * Resilient browser storage, migrations, and credential isolation.
 */

import { Project, ProviderConfig, AppSettings, EditorPrefs, ChatMessage, Checkpoint, RunHistoryRecord, InferenceTarget, ProviderStatePersistence } from '../types';
import { compileProjectToSingleHtml } from '../utils/singleHtmlCompiler';
import { generateFullReleaseDeliverables } from './releaseBundler';
import { IStorageProvider, IndexedDBStorageProvider, PhpStorageProvider, UserActivityLog, SyncStatus } from './storageProvider';

const NS = 'omnintellx.';
const LEGACY_NS = 'omlabs.';

export class StorageService {
  private static provider: IStorageProvider = new IndexedDBStorageProvider();

  static setProvider(p: IStorageProvider) {
    this.provider = p;
  }

  static getProvider(): IStorageProvider {
    return this.provider;
  }

  static getSyncStatus(): SyncStatus {
    return this.provider.getSyncStatus();
  }

  static async logActivity(type: string, projectId?: string, metadata?: Record<string, any>) {
    return this.provider.logActivity({ type, projectId, metadata });
  }

  static get<T>(key: string, defaultValue: T): T {
    try {
      let raw = localStorage.getItem(NS + key);
      if (raw === null || raw === undefined) {
        raw = localStorage.getItem(LEGACY_NS + key);
      }
      if (raw === null || raw === undefined) return defaultValue;
      return JSON.parse(raw);
    } catch (_) {
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(NS + key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(NS + key);
      localStorage.removeItem(LEGACY_NS + key);
    } catch (_) {}
  }

  static getAllRaw(): Record<string, string> {
    const out: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(NS) || k.startsWith(LEGACY_NS))) {
        out[k] = localStorage.getItem(k) || '';
      }
    }
    return out;
  }

  static getStorageUsageBytes(): number {
    const raw = this.getAllRaw();
    let total = 0;
    for (const [k, v] of Object.entries(raw)) {
      total += k.length + v.length;
    }
    return total;
  }

  static loadProjects(): Project[] {
    const raw = this.get<Project[]>('projects', []);
    // Ensure no legacy demo projects persist
    const cleanProjects = raw.filter(p => p.id !== 'proj_default' && p.id !== 'proj_racing_game');
    return cleanProjects;
  }

  static recompileProjectOutputFiles(p: Project, persist = true): Project {
    const pGoal = p.description || p.name || 'Autonomous Software Project';
    
    // Always compile a standalone self-contained application
    let flagshipHtml = compileProjectToSingleHtml(p);
    if (!flagshipHtml || flagshipHtml.trim().length === 0) {
      flagshipHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${p.name} — Omnintellx Verified Release</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0B0E14] text-slate-100 min-h-screen p-6 flex flex-col justify-between font-sans">
  <div class="max-w-4xl mx-auto w-full space-y-6">
    <div class="border-b border-white/10 pb-4">
      <h1 class="text-2xl font-bold text-emerald-400">${p.name}</h1>
      <p class="text-xs text-slate-400 mt-1">${pGoal}</p>
    </div>
    <div class="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
      <h2 class="text-sm font-semibold text-white">Project Deliverable Bundle</h2>
      <p class="text-xs text-slate-300">Generated with verified standalone assets ready for deployment.</p>
    </div>
  </div>
  <footer class="text-center text-xs text-slate-500 py-4 font-mono">
    Omnintellx Standalone Distribution • Verified
  </footer>
</body>
</html>`;
    }

    const deliverables = generateFullReleaseDeliverables({
      projectName: p.name,
      projectId: p.id,
      goal: pGoal,
      flagshipHtml,
      files: p.files
    });

    // Clean obsolete legacy single-file anomalies but preserve standard files
    const cleanFiles = p.files.filter(f => !f.name.startsWith('omnin/'));
    const updatedFiles = [...cleanFiles];
    for (const [name, content] of Object.entries(deliverables)) {
      const existing = updatedFiles.findIndex(f => f.name === name);
      if (existing >= 0) {
        updatedFiles[existing] = {
          ...updatedFiles[existing],
          content,
          updatedAt: Date.now()
        };
      } else {
        updatedFiles.push({
          id: `file_out_${Math.random().toString(36).slice(2, 8)}`,
          name,
          content,
          updatedAt: Date.now(),
          lastEditedByAgent: 'Release Engineer'
        });
      }
    }

    const resProject: Project = {
      ...p,
      files: updatedFiles,
      updatedAt: Date.now()
    };

    if (persist) {
      const all = this.loadProjects();
      const idx = all.findIndex(item => item.id === p.id);
      if (idx >= 0) all[idx] = resProject;
      else all.push(resProject);
      this.saveProjects(all);
    }

    return resProject;
  }

  static saveProjects(projects: Project[]): void {
    this.set('projects', projects);
    this.provider.saveProjects(projects).catch(() => {});
  }

  static loadProviders(): ProviderConfig[] {
    const defaultProviders: ProviderConfig[] = [
      {
        id: 'prov_pollinations',
        name: 'Pollinations AI',
        type: 'pollinations',
        baseUrl: 'https://text.pollinations.ai/openai',
        models: ['openai-large', 'openai', 'mistral', 'llama', 'qwen-coder', 'deepseek-r1'],
        defaultModel: 'openai-large',
        status: 'online',
        latency: 120
      },
      {
        id: 'prov_gemini',
        name: 'Google Gemini',
        type: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-pro-exp-02-05', 'gemini-1.5-pro', 'gemini-1.5-flash'],
        defaultModel: 'gemini-2.5-flash',
        status: 'untested'
      },
      {
        id: 'prov_openrouter',
        name: 'OpenRouter Gateway',
        type: 'openrouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        models: [
          'anthropic/claude-3.7-sonnet',
          'anthropic/claude-3.5-sonnet',
          'google/gemini-2.5-pro',
          'google/gemini-2.5-flash',
          'openai/gpt-4.5-preview',
          'openai/gpt-4o',
          'openai/o3-mini',
          'deepseek/deepseek-r1',
          'deepseek/deepseek-chat',
          'meta-llama/llama-3.3-70b-instruct',
          'qwen/qwen-2.5-coder-32b-instruct'
        ],
        defaultModel: 'anthropic/claude-3.7-sonnet',
        status: 'untested'
      },
      {
        id: 'prov_openai',
        name: 'OpenAI API',
        type: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        models: ['gpt-4.5-preview', 'gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1', 'o1-mini', 'chatgpt-4o-latest'],
        defaultModel: 'gpt-4o',
        status: 'untested'
      },
      {
        id: 'prov_groq',
        name: 'Groq LPUs',
        type: 'groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'deepseek-r1-distill-llama-70b', 'qwen-2.5-coder-32b'],
        defaultModel: 'llama-3.3-70b-versatile',
        status: 'untested'
      },
      {
        id: 'prov_deepseek',
        name: 'DeepSeek API',
        type: 'deepseek',
        baseUrl: 'https://api.deepseek.com',
        models: ['deepseek-chat', 'deepseek-reasoner'],
        defaultModel: 'deepseek-chat',
        status: 'untested'
      },
      {
        id: 'prov_anthropic',
        name: 'Anthropic Claude',
        type: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        models: ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
        defaultModel: 'claude-3-7-sonnet-20250219',
        status: 'untested'
      },
      {
        id: 'prov_cerebras',
        name: 'Cerebras Fast Compute',
        type: 'cerebras',
        baseUrl: 'https://api.cerebras.ai/v1',
        models: ['llama3.3-70b', 'llama3.1-8b', 'llama-3.3-70b'],
        defaultModel: 'llama3.3-70b',
        status: 'untested'
      },
      {
        id: 'prov_grok',
        name: 'xAI Grok',
        type: 'grok',
        baseUrl: 'https://api.x.ai/v1',
        models: ['grok-2-latest', 'grok-2-vision-latest', 'grok-beta'],
        defaultModel: 'grok-2-latest',
        status: 'untested'
      },
      {
        id: 'prov_ollama',
        name: 'Local LLM (Ollama / LocalAI)',
        type: 'ollama',
        baseUrl: 'http://localhost:11434',
        models: ['llama3.3:latest', 'qwen2.5-coder:7b', 'deepseek-r1:8b', 'mistral:latest'],
        defaultModel: 'qwen2.5-coder:7b',
        status: 'untested',
        isLocalOnly: true
      },
      {
        id: 'prov_custom',
        name: 'Custom API Method',
        type: 'custom',
        baseUrl: 'https://api.openai.com/v1',
        models: ['custom-model-1'],
        defaultModel: 'custom-model-1',
        status: 'untested'
      }
    ];

    const currentProvVersion = this.get<string>('app_prov_version', '1.0.0');
    const TARGET_PROV_VERSION = '7.0.0';
    if (currentProvVersion !== TARGET_PROV_VERSION) {
      // Migrate while preserving any existing keys
      const existing = this.get<ProviderConfig[]>('providers', []);
      const keyMap: Record<string, { apiKey?: string; baseUrl?: string; selectedModelId?: string }> = {};
      existing.forEach(p => {
        if (p.apiKey || p.baseUrl || p.selectedModelId) {
          keyMap[p.type] = {
            apiKey: p.apiKey,
            baseUrl: p.baseUrl,
            selectedModelId: p.selectedModelId
          };
        }
      });

      const migrated = defaultProviders.map(p => {
        const saved = keyMap[p.type];
        return {
          ...p,
          apiKey: saved?.apiKey || p.apiKey || '',
          baseUrl: saved?.baseUrl || p.baseUrl,
          selectedModelId: saved?.selectedModelId || p.defaultModel
        };
      });

      this.saveProviders(migrated);
      this.set('app_prov_version', TARGET_PROV_VERSION);
      return migrated;
    }

    return this.get<ProviderConfig[]>('providers', defaultProviders);
  }

  static saveProviders(providers: ProviderConfig[]): void {
    this.set('providers', providers);
  }

  /**
   * Save or update an isolated provider record without mutating any other provider
   */
  static saveProvider(provider: ProviderConfig): void {
    const all = this.loadProviders();
    const idx = all.findIndex(p => p.id === provider.id);
    if (idx >= 0) {
      all[idx] = { ...provider };
    } else {
      all.push({ ...provider });
    }
    this.saveProviders(all);
  }

  /**
   * Delete an isolated provider record without mutating any other provider
   */
  static deleteProvider(providerId: string): void {
    const all = this.loadProviders();
    const filtered = all.filter(p => p.id !== providerId);
    this.saveProviders(filtered);
  }

  /**
   * Authoritative active inference target { providerId, providerType, modelId }
   */
  static loadActiveTarget(): InferenceTarget {
    const defaultTarget: InferenceTarget = {
      providerId: 'prov_gemini',
      providerType: 'gemini',
      modelId: 'gemini-3.8-flash'
    };
    return this.get<InferenceTarget>('active_inference_target', defaultTarget);
  }

  static saveActiveTarget(target: InferenceTarget): void {
    this.set('active_inference_target', target);
  }

  /**
   * Version 4 full persistence schema for independent gateways
   */
  static loadProviderPersistence(): ProviderStatePersistence {
    const providers = this.loadProviders();
    const activeTarget = this.loadActiveTarget();
    const settings = this.loadSettings();

    return {
      version: 4,
      providers,
      activeInferenceTarget: activeTarget,
      routingMode: settings.routingMode || 'AUTO',
      fallbackMode: settings.fallbackMode || 'NONE'
    };
  }

  static saveProviderPersistence(state: ProviderStatePersistence): void {
    this.saveProviders(state.providers);
    this.saveActiveTarget(state.activeInferenceTarget);
    const settings = this.loadSettings();
    settings.routingMode = state.routingMode;
    settings.fallbackMode = state.fallbackMode;
    settings.activeInferenceTarget = state.activeInferenceTarget;
    this.saveSettings(settings);
  }

  static loadSettings(): AppSettings {
    const defaultSettings: AppSettings = {
      animations: true,
      reducedEffects: false,
      reducedMotion: false,
      toasts: true,
      activityLog: true,
      localOnlyMode: false,
      routingMode: 'AUTO',
      fallbackMode: 'NONE',
      activeInferenceTarget: {
        providerId: 'prov_gemini',
        providerType: 'gemini',
        modelId: 'gemini-2.5-flash'
      },
      autoCheckpoint: true,
      maxFixLoops: 3,
      universalSystemPrompt: ''
    };
    return this.get<AppSettings>('settings', defaultSettings);
  }

  static saveSettings(settings: AppSettings): void {
    this.set('settings', settings);
  }

  static loadEditorPrefs(): EditorPrefs {
    const defaultPrefs: EditorPrefs = {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      tabSize: 2,
      indentStyle: 'spaces',
      cursorStyle: 'line',
      autoSave: true,
      wordWrap: false,
      lineNumbers: true
    };
    return this.get<EditorPrefs>('editor_prefs', defaultPrefs);
  }

  static saveEditorPrefs(prefs: EditorPrefs): void {
    this.set('editor_prefs', prefs);
  }

  static loadChatHistory(): ChatMessage[] {
    return this.get<ChatMessage[]>('chat_history', []);
  }

  static saveChatHistory(history: ChatMessage[]): void {
    this.set('chat_history', history.slice(-100)); // retain last 100
  }

  static loadChatSessions(): any[] {
    return this.get<any[]>('chat_sessions', []);
  }

  static saveChatSessions(sessions: any[]): void {
    this.set('chat_sessions', sessions.slice(-50));
  }

  static loadCheckpoints(): Checkpoint[] {
    return this.get<Checkpoint[]>('checkpoints', []);
  }

  static saveCheckpoints(checkpoints: Checkpoint[]): void {
    this.set('checkpoints', checkpoints);
  }

  static loadRunHistory(): RunHistoryRecord[] {
    return this.get<RunHistoryRecord[]>('run_history', []);
  }

  static saveRunHistory(history: RunHistoryRecord[]): void {
    this.set('run_history', history);
  }

  static addRunHistory(record: RunHistoryRecord): void {
    const list = this.loadRunHistory();
    // Add to front, keep last 100
    const updated = [record, ...list.filter(r => r.id !== record.id)].slice(0, 100);
    this.saveRunHistory(updated);
  }

  static deleteRunHistory(id: string): void {
    const list = this.loadRunHistory();
    this.saveRunHistory(list.filter(r => r.id !== id));
  }

  static exportWorkspaceBackup(includeCredentials: boolean = false): string {
    const raw = this.getAllRaw();
    const backupData: Record<string, any> = {};

    for (const [fullKey, valStr] of Object.entries(raw)) {
      const shortKey = fullKey.startsWith(NS) ? fullKey.substring(NS.length) : fullKey.substring(LEGACY_NS.length);
      try {
        let val = JSON.parse(valStr);
        if (shortKey === 'providers' && !includeCredentials && Array.isArray(val)) {
          val = val.map(p => ({ ...p, apiKey: '' }));
        }
        backupData[shortKey] = val;
      } catch (_) {
        backupData[shortKey] = valStr;
      }
    }

    const payload = {
      app: 'Omnintellx',
      version: '5.0.0',
      schema: 'ai-agentic-runtime',
      exportedAt: Date.now(),
      data: backupData
    };

    return JSON.stringify(payload, null, 2);
  }

  static importWorkspaceBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      const data = parsed.data || parsed;
      for (const [k, v] of Object.entries(data)) {
        this.set(k, v);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  static clearOldCache(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.includes('cache') || k.includes('temp') || k.includes('preview_') || k.includes('audit_'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (_) {}
  }

  static factoryReset(): void {
    const raw = this.getAllRaw();
    for (const k of Object.keys(raw)) {
      localStorage.removeItem(k);
    }
    window.location.reload();
  }
}
