/**
 * Omnintellx — PHP Hosting & Multi-User Admin Screen
 * Manages token quotas, per-user API rate limits, and provider API keys
 * for self-hosted PHP 7.4/8.x deployments.
 */

import React, { useState } from 'react';
import { Project, ProviderConfig } from '../types';
import { downloadZipSafely, downloadTextFileSafely } from '../utils/downloadHelper';
import {
  Server,
  Download,
  Users,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Copy,
  Plus,
  Trash2,
  Play,
  Activity,
  FileCode
} from 'lucide-react';

interface ManagedUser {
  id: string;
  username: string;
  apiToken: string;
  dailyTokenQuota: number;
  hourlyRequestLimit: number;
  tokensUsedToday: number;
  requestsMadeToday: number;
  active: boolean;
}

interface PhpHostingScreenProps {
  project: Project | null;
  providers: ProviderConfig[];
  onNavigate: (screen: any) => void;
}

export const PhpHostingScreen: React.FC<PhpHostingScreenProps> = ({ project, providers, onNavigate }) => {
  const [downloading, setDownloading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'panel' | 'users' | 'keys' | 'code'>('panel');

  // Interactive user ledger simulation
  const [users, setUsers] = useState<ManagedUser[]>([
    {
      id: 'usr_1',
      username: 'developer_client',
      apiToken: 'omni_live_99f2b8a7c1e4',
      dailyTokenQuota: 50000,
      hourlyRequestLimit: 60,
      tokensUsedToday: 8400,
      requestsMadeToday: 12,
      active: true
    },
    {
      id: 'usr_2',
      username: 'enterprise_tier',
      apiToken: 'omni_live_14b7f832e9a0',
      dailyTokenQuota: 500000,
      hourlyRequestLimit: 500,
      tokensUsedToday: 42100,
      requestsMadeToday: 48,
      active: true
    },
    {
      id: 'usr_3',
      username: 'trial_account',
      apiToken: 'omni_live_83a1c5d9e7f2',
      dailyTokenQuota: 10000,
      hourlyRequestLimit: 20,
      tokensUsedToday: 10000,
      requestsMadeToday: 21,
      active: true
    }
  ]);

  const [newUsername, setNewUsername] = useState('');
  const [newQuota, setNewQuota] = useState('50000');
  const [newLimit, setNewLimit] = useState('60');

  // Simulated Provider Keys
  const [providerKeys, setProviderKeys] = useState<Record<string, string>>({
    gemini: providers.find(p => p.type === 'gemini')?.apiKey || '',
    openrouter: providers.find(p => p.type === 'openrouter')?.apiKey || '',
    groq: providers.find(p => p.type === 'groq')?.apiKey || '',
    openai: providers.find(p => p.type === 'openai')?.apiKey || ''
  });

  // Simulated test request state
  const [simulatingUser, setSimulatingUser] = useState<string>('usr_1');
  const [simulationResult, setSimulationResult] = useState<{ allowed: boolean; message: string; remaining: number } | null>(null);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    const newUser: ManagedUser = {
      id: `usr_${Date.now()}`,
      username: newUsername.trim(),
      apiToken: `omni_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 6)}`,
      dailyTokenQuota: parseInt(newQuota) || 50000,
      hourlyRequestLimit: parseInt(newLimit) || 60,
      tokensUsedToday: 0,
      requestsMadeToday: 0,
      active: true
    };

    setUsers(prev => [newUser, ...prev]);
    setNewUsername('');
    setFeedback(`User ${newUser.username} created with quota ${newUser.dailyTokenQuota} tokens/day`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleToggleUser = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  };

  const handleDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleSimulateRequest = () => {
    const targetUser = users.find(u => u.id === simulatingUser);
    if (!targetUser) return;

    if (!targetUser.active) {
      setSimulationResult({
        allowed: false,
        message: 'HTTP 403 Forbidden: User account is suspended by hosting admin.',
        remaining: targetUser.dailyTokenQuota - targetUser.tokensUsedToday
      });
      return;
    }

    if (targetUser.tokensUsedToday >= targetUser.dailyTokenQuota) {
      setSimulationResult({
        allowed: false,
        message: `HTTP 429 Rate Limit Exceeded: Daily token quota of ${targetUser.dailyTokenQuota.toLocaleString()} exhausted.`,
        remaining: 0
      });
      return;
    }

    const estimatedTokens = 450;
    const newUsed = Math.min(targetUser.dailyTokenQuota, targetUser.tokensUsedToday + estimatedTokens);
    setUsers(prev => prev.map(u => u.id === targetUser.id ? {
      ...u,
      tokensUsedToday: newUsed,
      requestsMadeToday: u.requestsMadeToday + 1
    } : u));

    setSimulationResult({
      allowed: true,
      message: `HTTP 200 OK: Request authorized. Used ${estimatedTokens} tokens.`,
      remaining: targetUser.dailyTokenQuota - newUsed
    });
  };

  // Download complete PHP hosting package
  const handleDownloadHostingBundle = async () => {
    setDownloading(true);
    setFeedback('Compiling PHP Hosting Distribution...');

    const standaloneHtml = project?.files.find(f => f.name === 'omni/index.html' || f.name === 'output/omni/index.html' || f.name === 'final_codes/index.html')?.content || '<!DOCTYPE html><html><body><h1>Omnintellx Standalone</h1></body></html>';
    const adminPhp = project?.files.find(f => f.name === 'hosting/admin.php')?.content || '<?php /* Omnintellx Admin Panel */ ?>';
    const apiProxyPhp = project?.files.find(f => f.name === 'hosting/api_proxy.php')?.content || '<?php /* Omnintellx Proxy */ ?>';

    const hostingFiles = [
      { name: 'index.html', content: standaloneHtml },
      { name: 'admin.php', content: adminPhp },
      { name: 'api_proxy.php', content: apiProxyPhp },
      {
        name: 'config.json',
        content: JSON.stringify({
          admin_password_hash: "$2y$10$e0MYzXyjpJS7Pd0RVvHwHeV.o23G0D6l1bI0qf0B8b/qjE4u1eUhe",
          providers: {
            gemini: { apiKey: providerKeys.gemini, enabled: true },
            openrouter: { apiKey: providerKeys.openrouter, enabled: true },
            groq: { apiKey: providerKeys.groq, enabled: true },
            openai: { apiKey: providerKeys.openai, enabled: true }
          },
          users: users.map(u => ({
            id: u.id,
            username: u.username,
            api_token: u.apiToken,
            daily_token_quota: u.dailyTokenQuota,
            hourly_request_limit: u.hourlyRequestLimit,
            tokens_used_today: u.tokensUsedToday,
            requests_made_today: u.requestsMadeToday,
            active: u.active
          }))
        }, null, 2)
      },
      {
        name: 'README.md',
        content: `# Omnintellx PHP Hosting Bundle\nDeploy all files in this directory to your web hosting root (Apache, Nginx, InfinityFree, cPanel).\n\n- \`index.html\`: Web client application\n- \`admin.php\`: Control panel for token quotas & limits (Default password: \`omnintellx2026!\`)\n- \`api_proxy.php\`: Token quota enforcement reverse proxy\n`
      }
    ];

    try {
      const zipName = `${(project?.name || 'omnintellx').toLowerCase().replace(/\s+/g, '_')}_php_hosting.zip`;
      const res = await downloadZipSafely(zipName, hostingFiles);
      setFeedback(res.message);
      setTimeout(() => setFeedback(null), 4000);
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('studio')}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              PHP 7.4 / 8.x Engine
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Per-User Quotas &amp; Limits
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-2 flex items-center gap-2">
            <Server className="w-6 h-6 text-emerald-400" />
            <span>PHP Hosting &amp; Rate-Limit Admin</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Protect your AI provider keys on shared hosting (Apache, cPanel, InfinityFree) while enforcing strict daily token quotas and request throttling.
          </p>
        </div>

        {/* Download Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadHostingBundle}
            disabled={downloading}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Packing PHP ZIP...' : 'Download PHP Hosting Package'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono text-center animate-pulse">
          {feedback}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-xs">
        {[
          { id: 'panel', label: 'Admin Dashboard Simulator' },
          { id: 'users', label: 'User Token Quotas' },
          { id: 'keys', label: 'AI Provider Key Ledger' },
          { id: 'code', label: 'PHP Script Inspect' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === t.id
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Live Simulator */}
      {activeTab === 'panel' && (
        <div className="space-y-6">
          {/* Rate Limit Enforcement Test Console */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Live API Rate-Limit &amp; Quota Test Simulator</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">api_proxy.php rule test</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Simulate As User</label>
                <select
                  value={simulatingUser}
                  onChange={(e) => {
                    setSimulatingUser(e.target.value);
                    setSimulationResult(null);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.tokensUsedToday.toLocaleString()} / {u.dailyTokenQuota.toLocaleString()} tokens used)
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:self-end">
                <button
                  onClick={handleSimulateRequest}
                  className="w-full sm:w-auto px-4 py-2 min-h-[42px] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Send Test Inbound Request</span>
                </button>
              </div>
            </div>

            {simulationResult && (
              <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between gap-2 ${
                simulationResult.allowed
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-2">
                  {simulationResult.allowed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{simulationResult.message}</span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  Remaining: {simulationResult.remaining.toLocaleString()} tokens
                </span>
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10">
              <span className="text-xs text-slate-400 font-mono">Total Users Managed</span>
              <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10">
              <span className="text-xs text-slate-400 font-mono">Active Users</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{users.filter(u => u.active).length}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10">
              <span className="text-xs text-slate-400 font-mono">Today's Token Burn</span>
              <p className="text-2xl font-bold text-cyan-400 mt-1">
                {users.reduce((acc, u) => acc + u.tokensUsedToday, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User Quota Management */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Add User Form */}
          <form onSubmit={handleAddUser} className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Create New User &amp; Assign Quota</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                placeholder="Username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                placeholder="Daily Tokens (e.g. 50000)"
                value={newQuota}
                onChange={(e) => setNewQuota(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                placeholder="Max Req/Hr (e.g. 60)"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add User</span>
              </button>
            </div>
          </form>

          {/* User List */}
          <div className="space-y-3">
            {users.map(u => {
              const pct = Math.min(100, Math.round((u.tokensUsedToday / (u.dailyTokenQuota || 1)) * 100));
              return (
                <div key={u.id} className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{u.username}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        u.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {u.active ? 'Active' : 'Suspended'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleUser(u.id)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-mono text-slate-300"
                      >
                        {u.active ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                    <span>Bearer Token: <code className="text-emerald-400">{u.apiToken}</code></span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(u.apiToken);
                        setFeedback(`Token for ${u.username} copied!`);
                        setTimeout(() => setFeedback(null), 2500);
                      }}
                      className="text-slate-500 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Quota Progress */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>Daily: {u.tokensUsedToday.toLocaleString()} / {u.dailyTokenQuota.toLocaleString()} tokens</span>
                      <span className={pct >= 90 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all ${pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Rate limit: {u.hourlyRequestLimit} req/hr • Executed today: {u.requestsMadeToday} reqs
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Key Ledger */}
      {activeTab === 'keys' && (
        <div className="p-5 rounded-xl bg-slate-900/80 border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>AI Provider Master Keys (Stored on Web Host)</span>
          </h3>
          <p className="text-xs text-slate-400">
            These keys are saved in <code className="text-emerald-400 font-mono">config.json</code> on your web host and used by <code className="text-cyan-400 font-mono">api_proxy.php</code> to perform upstream calls.
          </p>

          <div className="space-y-3">
            {[
              { id: 'gemini', label: 'Google Gemini Studio Key', placeholder: 'AIzaSy...' },
              { id: 'openrouter', label: 'OpenRouter Unified API Key', placeholder: 'sk-or-v1-...' },
              { id: 'groq', label: 'Groq Cloud API Key', placeholder: 'gsk_...' },
              { id: 'openai', label: 'OpenAI Platform Key', placeholder: 'sk-proj-...' }
            ].map(p => (
              <div key={p.id}>
                <label className="block text-xs font-mono text-slate-300 mb-1">{p.label}</label>
                <input
                  type="password"
                  value={providerKeys[p.id] || ''}
                  onChange={(e) => setProviderKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
                  placeholder={p.placeholder}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setFeedback('Master keys synchronized for hosting package export.');
              setTimeout(() => setFeedback(null), 3000);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs"
          >
            Save Key Ledger
          </button>
        </div>
      )}

      {/* Tab 4: PHP Script Inspection */}
      {activeTab === 'code' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400">hosting/admin.php</span>
              <button
                onClick={() => {
                  const code = project?.files.find(f => f.name === 'hosting/admin.php')?.content || '';
                  navigator.clipboard.writeText(code);
                  setFeedback('admin.php copied!');
                  setTimeout(() => setFeedback(null), 2500);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-mono flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">Single-file standalone admin control panel with session auth and JSON ledger.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400">hosting/api_proxy.php</span>
              <button
                onClick={() => {
                  const code = project?.files.find(f => f.name === 'hosting/api_proxy.php')?.content || '';
                  navigator.clipboard.writeText(code);
                  setFeedback('api_proxy.php copied!');
                  setTimeout(() => setFeedback(null), 2500);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-mono flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">Reverse proxy checking user quotas, deducting tokens, and preventing key leaks.</p>
          </div>
        </div>
      )}
    </div>
  );
};
