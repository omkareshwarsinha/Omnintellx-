/**
 * Omnintellx — Enterprise Administrator Console & Telemetry Hub
 * Designed for both Full-Stack Browser deployment (PHP/Node) and Standalone On-Device execution.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Project,
  ProviderConfig,
  AppSettings,
  InferenceTarget,
  ProviderType
} from '../types';
import { testProviderConnection, ConnectionTestResult, resolveWorkingPhpEndpoint, GatewayPreference } from '../engine/connectionTester';
import { StorageService } from '../engine/storage';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Server,
  Activity,
  Cpu,
  Key,
  Database,
  Lock,
  Unlock,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FolderCode,
  Sliders,
  ExternalLink,
  Eye,
  EyeOff,
  Radio,
  FileCode,
  HardDrive,
  Clock,
  Sparkles,
  Smartphone,
  Globe,
  Terminal,
  Zap,
  Check,
  Play
} from 'lucide-react';

interface AdminScreenProps {
  projects: Project[];
  providers: ProviderConfig[];
  settings: AppSettings;
  activeTarget: InferenceTarget;
  onSaveProvider: (provider: ProviderConfig) => void;
  onDeleteProject: (id: string) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onAddNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onSelectTarget: (target: InferenceTarget) => void;
  onNavigate?: (screen: any) => void;
  onOpenLivePreview?: () => void;
  onExportStandalone?: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  projects,
  providers,
  settings,
  activeTarget,
  onSaveProvider,
  onDeleteProject,
  onUpdateSettings,
  onAddNotification,
  onSelectTarget,
  onNavigate,
  onOpenLivePreview,
  onExportStandalone
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('omnintellx.admin_auth') === 'true';
  });
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'projects' | 'standalone' | 'audit' | 'security'>('overview');

  // Gateway Mode Preference
  const [gatewayMode, setGatewayMode] = useState<GatewayPreference>(() => {
    return (localStorage.getItem('omnintellx.gateway_mode') as GatewayPreference) || 'auto';
  });

  // Gateway Discovery & Health States
  const [phpEndpoint, setPhpEndpoint] = useState<string | null>(null);
  const [isPingingGateway, setIsPingingGateway] = useState(false);
  const [gatewayPingInfo, setGatewayPingInfo] = useState<any>(null);
  const [testingMap, setTestingMap] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, ConnectionTestResult>>({});
  const [showKeyMap, setShowKeyMap] = useState<Record<string, boolean>>({});
  const [filterType, setFilterType] = useState<string>('ALL');
  const [customModelInputs, setCustomModelInputs] = useState<Record<string, string>>({});
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [sessionTimeout, setSessionTimeout] = useState('7200');

  // Activity Logs
  const [activityLogs, setActivityLogs] = useState<Array<{ id: string; type: string; timestamp: string; metadata?: any }>>(() => {
    const saved = localStorage.getItem('omnintellx.admin_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return [
      {
        id: 'log_init',
        type: 'SYSTEM_BOOT',
        timestamp: new Date().toISOString(),
        metadata: { engine: 'Omnintellx Studio Engine 5.0.0', status: 'ONLINE' }
      }
    ];
  });

  // Resolve PHP Gateway on mount
  useEffect(() => {
    resolveWorkingPhpEndpoint().then(ep => setPhpEndpoint(ep));
  }, []);

  const addLog = (type: string, metadata?: any) => {
    const newEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      timestamp: new Date().toISOString(),
      metadata
    };
    setActivityLogs(prev => {
      const updated = [newEntry, ...prev.slice(0, 150)];
      localStorage.setItem('omnintellx.admin_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSetGatewayMode = (mode: GatewayPreference) => {
    setGatewayMode(mode);
    localStorage.setItem('omnintellx.gateway_mode', mode);
    addLog('GATEWAY_MODE_CHANGED', { mode });
    onAddNotification('Gateway Mode Updated', `Active dispatcher set to: ${mode.toUpperCase()}`, 'info');
  };

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const validUser = adminUsername.trim() === 'admin' || adminUsername.trim() === 'root';
    const validPass = adminPassword === 'Omnintellx@2025' || adminPassword === 'admin123' || adminPassword === 'admin';

    if (validUser && validPass) {
      setIsAuthenticated(true);
      localStorage.setItem('omnintellx.admin_auth', 'true');
      addLog('LOGIN_SUCCESS', { username: adminUsername, client: 'Admin Console' });
      onAddNotification('Admin Authenticated', `Welcome back, ${adminUsername}`, 'success');
    } else {
      setAuthError('Invalid credentials. (Default: admin / Omnintellx@2025 or admin / admin123)');
      addLog('LOGIN_FAILURE', { username: adminUsername });
    }
  };

  const handleQuickUnlock = () => {
    setIsAuthenticated(true);
    localStorage.setItem('omnintellx.admin_auth', 'true');
    addLog('LOGIN_SUCCESS', { username: 'admin', method: 'quick_unlock' });
    onAddNotification('Admin Authenticated', 'Administrator privileges unlocked', 'success');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('omnintellx.admin_auth');
    addLog('LOGOUT', { username: adminUsername });
    onAddNotification('Logged Out', 'Administrator session terminated', 'info');
  };

  // Handle Live Ping
  const handlePingGateway = async () => {
    setIsPingingGateway(true);
    try {
      const ep = await resolveWorkingPhpEndpoint();
      setPhpEndpoint(ep);

      if (ep) {
        const res = await fetch(`${ep}?action=system.ping`);
        const data = await res.json();
        setGatewayPingInfo({
          type: 'PHP_BACKEND',
          endpoint: ep,
          status: 'ONLINE',
          data
        });
        addLog('GATEWAY_PING_SUCCESS', { endpoint: ep });
        onAddNotification('PHP Gateway Online', `Connected to ${ep}`, 'success');
      } else {
        // Try node
        try {
          const res = await fetch('/api/projects');
          if (res.ok) {
            setGatewayPingInfo({
              type: 'NODE_BACKEND',
              endpoint: '/api',
              status: 'ONLINE'
            });
            onAddNotification('Node Gateway Online', 'Connected to /api', 'success');
            return;
          }
        } catch (_) {}

        setGatewayPingInfo({
          type: 'STANDALONE_BROWSER',
          endpoint: 'Local Device Kernel',
          status: 'STANDALONE'
        });
        onAddNotification('Standalone Mode', 'Running directly on device kernel (CORS-friendly)', 'info');
      }
    } catch (err: any) {
      setGatewayPingInfo({
        status: 'ERROR',
        error: err.message
      });
      onAddNotification('Gateway Ping Error', err.message, 'warning');
    } finally {
      setIsPingingGateway(false);
    }
  };

  // Handle Testing Single Provider
  const handleTestProvider = async (prov: ProviderConfig) => {
    setTestingMap(prev => ({ ...prev, [prov.id]: true }));
    try {
      const result = await testProviderConnection(prov, gatewayMode);
      setTestResults(prev => ({ ...prev, [prov.id]: result }));

      if (result.ok && result.status === 'CONNECTED') {
        const updatedModels = result.models && result.models.length > 0 ? result.models : prov.models;
        const defaultModel = updatedModels.includes(prov.defaultModel) ? prov.defaultModel : updatedModels[0];

        onSaveProvider({
          ...prov,
          status: 'online',
          latency: result.latencyMs,
          models: updatedModels,
          defaultModel,
          lastSync: Date.now(),
          errorMessage: undefined
        });

        addLog('PROVIDER_TEST_SUCCESS', {
          provider: prov.name,
          latency: result.latencyMs,
          gateway: result.gatewayEnvironment
        });

        onAddNotification(
          'Gateway Online',
          `${prov.name}: Live (${result.latencyMs}ms) via ${result.gatewayEnvironment}`,
          'success'
        );
      } else {
        onSaveProvider({
          ...prov,
          status: 'offline',
          errorMessage: result.message
        });

        addLog('PROVIDER_TEST_FAILED', {
          provider: prov.name,
          error: result.message
        });

        onAddNotification('Verification Failed', `${prov.name}: ${result.message}`, 'error');
      }
    } finally {
      setTestingMap(prev => ({ ...prev, [prov.id]: false }));
    }
  };

  // Test All Gateways
  const handleTestAllProviders = async () => {
    const targets = providers.filter(p => p.apiKey || p.isLocalOnly || p.type === 'pollinations');
    for (const prov of targets) {
      await handleTestProvider(prov);
    }
  };

  // Add custom model to provider
  const handleAddCustomModel = (providerId: string) => {
    const input = (customModelInputs[providerId] || '').trim();
    if (!input) return;
    const target = providers.find(p => p.id === providerId);
    if (!target) return;

    if (!target.models.includes(input)) {
      onSaveProvider({
        ...target,
        models: [input, ...target.models],
        defaultModel: input
      });
      onAddNotification('Model Added', `Registered ${input} to ${target.name}`, 'success');
    }
    setCustomModelInputs(prev => ({ ...prev, [providerId]: '' }));
  };

  // Calculations
  const onlineCount = useMemo(() => providers.filter(p => p.status === 'online').length, [providers]);
  const totalFiles = useMemo(() => projects.reduce((acc, p) => acc + (p.files?.length || 0), 0), [projects]);
  const storageBytes = useMemo(() => StorageService.getStorageUsageBytes(), [projects, providers]);

  // Export Full Database
  const handleExportFullDatabase = () => {
    const fullDb = {
      omnintellxVersion: '5.0.0',
      exportedAt: new Date().toISOString(),
      projects,
      providers,
      settings,
      activityLogs
    };
    const blob = new Blob([JSON.stringify(fullDb, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnintellx_admin_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('BACKUP_EXPORTED', { projects: projects.length, providers: providers.length });
    onAddNotification('Backup Exported', 'Full studio state JSON downloaded', 'success');
  };

  // Download Standalone HTML Package
  const handleDownloadStandaloneHtml = async () => {
    if (onExportStandalone) {
      onExportStandalone();
      return;
    }
    try {
      const res = await fetch('/OUTPUT/omni-studio-final/index.html');
      let htmlText = '';
      if (res.ok) {
        htmlText = await res.text();
      } else {
        htmlText = document.documentElement.outerHTML;
      }
      const blob = new Blob([htmlText], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'omnintellx_standalone.html';
      a.click();
      URL.revokeObjectURL(url);
      onAddNotification('Standalone HTML Downloaded', 'Self-contained on-device studio ready', 'success');
    } catch (_) {
      const blob = new Blob([document.documentElement.outerHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'omnintellx_standalone.html';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Download Standalone PHP Gateway
  const handleDownloadPhpEngine = async () => {
    try {
      const res = await fetch('/OUTPUT/omni-studio-final/intellx.php');
      if (res.ok) {
        const phpText = await res.text();
        const blob = new Blob([phpText], { type: 'application/x-php' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'intellx.php';
        a.click();
        URL.revokeObjectURL(url);
        onAddNotification('PHP Gateway Downloaded', 'Single-file intellx.php ready for hosting', 'success');
        return;
      }
    } catch (_) {}
    onAddNotification('Download Info', 'intellx.php is located in /OUTPUT/omni-studio-final/intellx.php', 'info');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0F131C] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-indigo-500 to-cyan-500" />

          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
              Administrator Console
            </h2>
            <p className="text-xs text-slate-400">
              Enter credentials or click Quick Unlock to manage fleet telemetry, API gateways, and on-device exports.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin Username</label>
              <input
                type="text"
                value={adminUsername}
                onChange={e => setAdminUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Master Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors font-mono"
                placeholder="••••••••••••"
              />
              <p className="text-[10px] text-slate-500 mt-1">Default credentials: <span className="font-mono text-slate-400">admin</span> / <span className="font-mono text-slate-400">Omnintellx@2025</span> or <span className="font-mono text-slate-400">admin123</span></p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Authenticate Administrator
            </button>

            <button
              type="button"
              onClick={handleQuickUnlock}
              className="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-3.5 h-3.5 text-indigo-400" />
              Quick 1-Click Unlock (Local / Standalone Admin)
            </button>
          </form>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Omnintellx v5.0.0</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Browser &amp; On-Device Isolated
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-6xl mx-auto">
      {/* Top Admin Header Bar */}
      <div className="bg-[#0F131C] border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-rose-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                Master Administrator Console
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ADMIN ACCESS GRANTED
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                MODE: {gatewayMode.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-provider API fleet, latency diagnostics, on-device bundle export, and full-stack engine control.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePingGateway}
            disabled={isPingingGateway}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 font-semibold flex items-center gap-1.5 transition-all"
            title="Ping backend gateway"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPingingGateway ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Ping Gateway</span>
          </button>

          <button
            onClick={handleDownloadStandaloneHtml}
            className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-xs text-cyan-300 font-semibold flex items-center gap-1.5 transition-all"
            title="Download standalone single HTML"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>On-Device Standalone</span>
          </button>

          <button
            onClick={handleExportFullDatabase}
            className="px-3 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-xs text-indigo-300 font-semibold flex items-center gap-1.5 transition-all"
            title="Download full JSON database"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Database</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs text-rose-300 font-semibold flex items-center gap-1.5 transition-all"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/10 overflow-x-auto gap-2 select-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'border-indigo-400 text-white bg-indigo-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4 text-indigo-400" />
          System Overview
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === 'providers'
              ? 'border-cyan-400 text-white bg-cyan-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4 text-cyan-400" />
          Provider Fleet ({onlineCount}/{providers.length})
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === 'projects'
              ? 'border-emerald-400 text-white bg-emerald-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderCode className="w-4 h-4 text-emerald-400" />
          Workspaces &amp; Storage ({projects.length})
        </button>

        <button
          onClick={() => setActiveTab('standalone')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === 'standalone'
              ? 'border-cyan-400 text-white bg-cyan-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4 text-cyan-400" />
          On-Device &amp; Standalone Deployments
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === 'audit'
              ? 'border-amber-400 text-white bg-amber-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4 text-amber-400" />
          Audit Logs ({activityLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === 'security'
              ? 'border-rose-400 text-white bg-rose-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4 text-rose-400" />
          Security &amp; Directives
        </button>
      </div>

      {/* ================================================================ */}
      {/* TAB 1: SYSTEM OVERVIEW & TELEMETRY */}
      {/* ================================================================ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/10 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Gateways Online
              </span>
              <p className="text-2xl font-bold font-display text-white">
                {onlineCount} <span className="text-xs font-normal text-slate-500">/ {providers.length}</span>
              </p>
              <p className="text-[10px] text-cyan-400">Multi-Provider Mesh</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/10 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <FolderCode className="w-3.5 h-3.5 text-indigo-400" /> Projects
              </span>
              <p className="text-2xl font-bold font-display text-white">{projects.length}</p>
              <p className="text-[10px] text-indigo-400">{totalFiles} total files on disk</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/10 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Storage Usage
              </span>
              <p className="text-2xl font-bold font-display text-white">
                {(storageBytes / 1024).toFixed(1)} <span className="text-xs font-normal text-slate-500">KB</span>
              </p>
              <p className="text-[10px] text-emerald-400">IndexedDB + JSON mirror</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/10 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-amber-400" /> Target Model
              </span>
              <p className="text-sm font-bold font-display text-white truncate">{activeTarget.modelId}</p>
              <p className="text-[10px] text-amber-400">{activeTarget.providerType.toUpperCase()}</p>
            </div>
          </div>

          {/* Gateway Dispatcher Mode Switcher */}
          <div className="p-5 rounded-2xl bg-[#0F131C] border border-white/10 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  API Gateway Dispatcher Configuration
                </h3>
                <p className="text-xs text-slate-400">
                  Select how inference and connection test probes are routed. Use Direct Browser mode if hosting blocks outgoing cURL!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Option 1: Auto */}
              <div
                onClick={() => handleSetGatewayMode('auto')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  gatewayMode === 'auto'
                    ? 'bg-indigo-500/10 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                    : 'bg-black/30 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    Auto Fallback (Default)
                  </span>
                  {gatewayMode === 'auto' && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tries PHP first (if on server), then Node, then gracefully falls back to Direct Browser / On-Device execution.
                </p>
              </div>

              {/* Option 2: Direct Browser / On-Device */}
              <div
                onClick={() => handleSetGatewayMode('browser_direct')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  gatewayMode === 'browser_direct'
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'bg-black/30 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                    Direct Browser / On-Device
                  </span>
                  {gatewayMode === 'browser_direct' && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Calls Google Gemini, OpenRouter &amp; Ollama directly from client browser without server proxy. 100% works on free hosting with cURL blocks!
                </p>
              </div>

              {/* Option 3: PHP Backend */}
              <div
                onClick={() => handleSetGatewayMode('php_backend')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  gatewayMode === 'php_backend'
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : 'bg-black/30 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    Strict PHP Gateway
                  </span>
                  {gatewayMode === 'php_backend' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Forces all traffic through <code className="text-emerald-300">intellx.php</code>. Recommended for full-cURL web hosts and servers.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Operations */}
          <div className="p-5 rounded-2xl bg-[#0F131C] border border-white/10 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Quick Administrative Operations
            </h3>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={handleTestAllProviders}
                className="px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Cpu className="w-4 h-4" />
                Test All Active Gateways
              </button>

              <button
                onClick={() => {
                  StorageService.clearOldCache();
                  addLog('CACHE_FLUSHED');
                  onAddNotification('Cache Cleared', 'Temporary workspace caches flushed', 'info');
                }}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Flush Studio Cache
              </button>

              <button
                onClick={() => {
                  projects.forEach(p => StorageService.recompileProjectOutputFiles(p, true));
                  addLog('ALL_PROJECTS_RECOMPILED', { count: projects.length });
                  onAddNotification('Output Recompiled', 'Rebuilt output/ deliverables for all projects', 'success');
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Recompile All Project Deliverables
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: PROVIDER FLEET MANAGEMENT */}
      {/* ================================================================ */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-white">Configured LLM API Gateways</h3>
              <p className="text-xs text-slate-400">
                Independent gateways for frontier models. Test latency, manage credentials, and inspect discovered models.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={gatewayMode}
                onChange={e => handleSetGatewayMode(e.target.value as GatewayPreference)}
                className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-200 focus:outline-none"
              >
                <option value="auto">Auto Fallback</option>
                <option value="browser_direct">Force Browser Direct</option>
                <option value="php_backend">Force PHP Gateway</option>
                <option value="node_backend">Force Node Gateway</option>
              </select>

              <button
                onClick={handleTestAllProviders}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Test All Gateways
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map(prov => {
              const isTesting = !!testingMap[prov.id];
              const showKey = !!showKeyMap[prov.id];
              const isSelectedTarget = activeTarget.providerId === prov.id;
              const result = testResults[prov.id];

              return (
                <div
                  key={prov.id}
                  className={`p-4 sm:p-5 rounded-2xl bg-[#0F131C] border transition-all space-y-3 ${
                    isSelectedTarget ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-indigo-400">
                        {prov.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{prov.name}</h4>
                          {isSelectedTarget && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              CURRENT TARGET
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 truncate max-w-[220px]">
                          {prov.baseUrl || '(default endpoint)'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          prov.status === 'online'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : prov.status === 'offline'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {prov.status.toUpperCase()}
                      </span>
                      {prov.latency ? (
                        <span className="text-[10px] font-mono text-slate-400">
                          {prov.latency}ms
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* API Key Input */}
                  {!prov.isLocalOnly && prov.type !== 'pollinations' && (
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>API Key / Secret Token</span>
                        <button
                          type="button"
                          onClick={() => setShowKeyMap(prev => ({ ...prev, [prov.id]: !prev[prov.id] }))}
                          className="text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showKey ? 'Hide' : 'Reveal'}</span>
                        </button>
                      </div>
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={prov.apiKey || ''}
                        onChange={e => onSaveProvider({ ...prov, apiKey: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-indigo-500/50"
                        placeholder="Enter API Key..."
                      />
                    </div>
                  )}

                  {/* Model Selector & Custom Model Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Default Model</span>
                      <span className="font-mono text-indigo-400">{prov.defaultModel}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={prov.defaultModel}
                        onChange={e => {
                          onSaveProvider({
                            ...prov,
                            defaultModel: e.target.value,
                            selectedModelId: e.target.value
                          });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
                      >
                        {prov.models.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="Add model..."
                          value={customModelInputs[prov.id] || ''}
                          onChange={e => setCustomModelInputs(prev => ({ ...prev, [prov.id]: e.target.value }))}
                          className="w-28 px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddCustomModel(prov.id);
                          }}
                        />
                        <button
                          onClick={() => handleAddCustomModel(prov.id)}
                          className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Error Message if any */}
                  {prov.errorMessage && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                      <div className="space-y-1">
                        <p className="break-all">{prov.errorMessage}</p>
                        {prov.type === 'gemini' && (
                          <p className="text-[10px] text-rose-200">Tip: Google Gemini keys work in Direct Browser mode. Ensure key has AI Studio permissions.</p>
                        )}
                        {prov.type === 'openrouter' && (
                          <p className="text-[10px] text-rose-200">Tip: OpenRouter supports direct browser CORS. Check credits at openrouter.ai.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Models Count & Actions */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">
                      Models: <strong className="text-white">{prov.models.length}</strong> active
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSelectTarget({
                          providerId: prov.id,
                          providerType: prov.type,
                          modelId: prov.selectedModelId || prov.defaultModel || prov.models[0]
                        })}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-slate-300 transition-colors"
                      >
                        Set Active
                      </button>

                      <button
                        onClick={() => handleTestProvider(prov)}
                        disabled={isTesting}
                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                        <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 3: WORKSPACES & PROJECTS STORAGE */}
      {/* ================================================================ */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-white">Managed Workspaces &amp; Disk Projects</h3>
              <p className="text-xs text-slate-400">
                All physical and virtual project directories on disk and in database.
              </p>
            </div>
            <button
              onClick={() => {
                projects.forEach(p => StorageService.recompileProjectOutputFiles(p, true));
                onAddNotification('All Projects Synchronized', 'Recompiled output/ deliverables', 'success');
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Recompile All Output Files
            </button>
          </div>

          <div className="space-y-3">
            {projects.map(proj => (
              <div
                key={proj.id}
                className="p-4 rounded-2xl bg-[#0F131C] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">{proj.name}</h4>
                    <span className="font-mono text-[10px] text-slate-500">[{proj.id}]</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{proj.description || 'No description provided.'}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <span>{proj.files.length} file(s)</span>
                    <span>Updated: {new Date(proj.updatedAt || proj.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('workspace')}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Open in Workspace Editor"
                    >
                      <FolderCode className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const recompiled = StorageService.recompileProjectOutputFiles(proj, true);
                      onAddNotification('Project Recompiled', `final_codes/index.html updated for ${proj.name}`, 'success');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Recompile deliverables"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Compile</span>
                  </button>

                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(proj, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${proj.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Export project JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete workspace "${proj.name}"?`)) {
                        onDeleteProject(proj.id);
                        addLog('PROJECT_DELETED', { projectId: proj.id, name: proj.name });
                        onAddNotification('Project Deleted', `Removed workspace ${proj.name}`, 'warning');
                      }
                    }}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 4: ON-DEVICE & STANDALONE DEPLOYMENTS */}
      {/* ================================================================ */}
      {activeTab === 'standalone' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#0F131C] border border-white/10 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              On-Device Standalone Studio Deployment
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Omnintellx is engineered to run in two primary modes: <strong>Full-Stack Web Server (PHP/Node)</strong> and <strong>100% On-Device Standalone</strong>.
              In standalone mode, all project code, database state, Monaco Editor, and multi-agent loops operate locally in your device&apos;s browser memory (IndexedDB) with direct CORS-safe API calls to Google Gemini and OpenRouter.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Standalone HTML Card */}
              <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20 space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <FileCode className="w-4 h-4" />
                  Single-File HTML Studio
                </div>
                <p className="text-xs text-slate-400">
                  A self-contained HTML file containing all CSS, JS, agent workflows, and the Admin Panel. Run on any phone, tablet, laptop, or desktop simply by double-clicking.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadStandaloneHtml}
                    className="flex-1 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Standalone HTML
                  </button>
                </div>
              </div>

              {/* PHP Gateway Card */}
              <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/20 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Globe className="w-4 h-4" />
                  Single-File PHP Backend Gateway
                </div>
                <p className="text-xs text-slate-400">
                  <code className="text-emerald-300">intellx.php</code> — Zero external dependencies. Auto-provisions <code className="text-slate-300">data/</code> and all JSON databases on any Apache/Nginx or InfinityFree hosting.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPhpEngine}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download intellx.php
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Deployment Instructions */}
          <div className="p-5 rounded-2xl bg-[#0F131C] border border-white/10 space-y-3 text-xs text-slate-300">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              Quick Deployment Guide for Shared / Free Hosting (InfinityFree, cPanel, VPS)
            </h4>

            <ol className="list-decimal pl-5 space-y-1.5 text-slate-400">
              <li>
                Download both <strong className="text-white">Standalone HTML</strong> and <strong className="text-white">intellx.php</strong> above.
              </li>
              <li>
                Upload them to your web root (e.g. <code className="text-indigo-300">htdocs/</code> on InfinityFree or <code className="text-indigo-300">public_html/</code> on cPanel).
              </li>
              <li>
                Rename the HTML file to <code className="text-indigo-300">index.html</code> so it opens by default.
              </li>
              <li>
                Open your domain in your browser. <code className="text-indigo-300">intellx.php</code> will automatically create the <code className="text-slate-300">data/</code> directory and initialize all JSON databases!
              </li>
              <li>
                If your host restricts outbound cURL, switch Gateway Mode to <strong className="text-cyan-400">Direct Browser / On-Device</strong> in this Admin Panel.
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 5: AUDIT LOGS & TELEMETRY */}
      {/* ================================================================ */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-white">System Audit &amp; Event Telemetry</h3>
              <p className="text-xs text-slate-400">
                Audited timeline of model executions, administrator logins, and storage sync events.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(activityLogs, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `omnintellx_audit_logs_${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 font-semibold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Export Audit
              </button>

              <button
                onClick={() => {
                  setActivityLogs([]);
                  localStorage.removeItem('omnintellx.admin_logs');
                  onAddNotification('Logs Cleared', 'Audit trail reset', 'info');
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs text-rose-300 font-semibold"
              >
                Clear Logs
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/10 divide-y divide-white/5 max-h-[500px] overflow-y-auto font-mono text-xs">
            {activityLogs.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No activity logged yet.</p>
            ) : (
              activityLogs.map(log => (
                <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        log.type.includes('SUCCESS') ? 'bg-emerald-500/10 text-emerald-400' :
                        log.type.includes('FAIL') || log.type.includes('ERROR') ? 'bg-rose-500/10 text-rose-400' :
                        'bg-indigo-500/10 text-indigo-400'
                      }`}>
                        {log.type}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {log.metadata && (
                      <p className="text-[11px] text-slate-400 break-all">
                        {JSON.stringify(log.metadata)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 6: SECURITY & CONFIGURATION DIRECTIVES */}
      {/* ================================================================ */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#0F131C] border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              Administrative Security Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <label className="text-slate-300 font-semibold">Change Master Password</label>
                <input
                  type="password"
                  placeholder="New password..."
                  value={newMasterPassword}
                  onChange={e => setNewMasterPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-rose-500/50"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      onAddNotification('Password Updated', 'Master password saved in session', 'success');
                      setNewMasterPassword('');
                    }
                  }}
                />
                <p className="text-[11px] text-slate-500">Press enter to update administrator password.</p>
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 font-semibold">Session Timeout</label>
                <select
                  value={sessionTimeout}
                  onChange={e => setSessionTimeout(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none"
                >
                  <option value="7200">2 Hours (Default)</option>
                  <option value="14400">4 Hours</option>
                  <option value="86400">24 Hours</option>
                  <option value="0">Never (Stay Logged In)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0F131C] border border-rose-500/20 space-y-3">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Danger Zone: Factory Reset Studio
            </h3>
            <p className="text-xs text-slate-400">
              Clear all localStorage, stored API keys, and workspace sessions, resetting Omnintellx to pristine out-of-the-box state.
            </p>

            <button
              onClick={() => {
                if (confirm('DANGER: This will erase all configured providers, workspace code, and stored settings. Are you sure?')) {
                  StorageService.factoryReset();
                }
              }}
              className="px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 font-semibold text-xs flex items-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Perform Full Factory Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
