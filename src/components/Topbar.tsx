/**
 * Omnintellx — Sleek, Responsive Topbar Component
 * Mobile-first layout with zero overflow, touch targets, and instant Live Preview access.
 */

import React from 'react';
import { ScreenId, ThemeMode, Project } from '../types';
import {
  Sparkles,
  Search,
  Bell,
  ChevronLeft,
  Sun,
  Moon,
  ShieldAlert,
  Shield,
  Download,
  Eye,
  Play,
  Activity,
  MessageSquare,
  FolderCode,
  Cpu,
  Wrench,
  Package
} from 'lucide-react';

interface TopbarProps {
  currentScreen: ScreenId;
  title?: string;
  subtitle?: string;
  unreadNotifications?: boolean;
  unreadNotificationsCount?: number;
  theme?: ThemeMode;
  isLocalOnly?: boolean;
  activeProject?: Project | null;
  activeProviderName?: string;
  onNavigate: (screen: ScreenId) => void;
  onBack?: () => void;
  onOpenSearch?: () => void;
  onOpenCommandPalette?: () => void;
  onToggleNotifications?: () => void;
  onOpenNotifications?: () => void;
  onToggleTheme?: () => void;
  onExportStandalone?: () => void;
  onOpenLivePreview?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentScreen,
  title,
  subtitle,
  unreadNotifications = false,
  unreadNotificationsCount = 0,
  theme = 'dark',
  isLocalOnly = false,
  activeProject = null,
  activeProviderName,
  onNavigate,
  onBack,
  onOpenSearch,
  onOpenCommandPalette,
  onToggleNotifications,
  onOpenNotifications,
  onToggleTheme,
  onExportStandalone,
  onOpenLivePreview
}) => {
  const isRootScreen = ['home', 'orchestrator', 'projects', 'editor', 'ai', 'aichat', 'models', 'tools'].includes(currentScreen);

  const screenNames: Record<ScreenId, string> = {
    command: 'Command Center',
    liverun: 'Live Run',
    workspace: 'Workspace',
    preview: 'Live Preview',
    history: 'Run History',
    settings: 'Settings',
    output: 'Output Studio',
    home: 'Command Center',
    orchestrator: 'Live Run',
    projects: 'Projects',
    editor: 'Workspace',
    ai: 'AI Assistant',
    aichat: 'AI Chat',
    models: 'Model Gateways',
    tools: 'Toolbox',
    admin: 'Admin Console',
    studio: 'Agent Studio',
    verification: 'Verification Gate',
    android: 'Android 9 APK',
    hosting: 'PHP Hosting'
  };

  const displayTitle = title || screenNames[currentScreen] || currentScreen.toUpperCase();
  const displaySubtitle = subtitle || (activeProject ? activeProject.name : 'AI Engineering Studio');
  const hasUnread = unreadNotifications || unreadNotificationsCount > 0;

  const handleSearchClick = () => {
    if (onOpenCommandPalette) onOpenCommandPalette();
    else if (onOpenSearch) onOpenSearch();
  };

  const handleNotificationsClick = () => {
    if (onOpenNotifications) onOpenNotifications();
    else if (onToggleNotifications) onToggleNotifications();
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-2.5 sm:px-4 bg-[#0B0E13]/95 backdrop-blur-2xl border-b border-white/10 select-none overflow-hidden">
      {/* Brand & Title */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 pr-1">
        {!isRootScreen && onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Go back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div
          className="flex items-center gap-2 cursor-pointer min-w-0"
          onClick={() => onNavigate('studio')}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20 shrink-0">
            <Sparkles className="w-4 h-4 fill-slate-950" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="font-display font-bold text-xs sm:text-sm tracking-tight bg-gradient-to-r from-white via-emerald-200 to-cyan-400 bg-clip-text text-transparent truncate max-w-[140px] sm:max-w-[220px]">
                {displayTitle}
              </h1>
              {isLocalOnly && (
                <span className="hidden sm:flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 items-center gap-1 shrink-0">
                  <ShieldAlert className="w-2.5 h-2.5" /> Local
                </span>
              )}
            </div>
            {displaySubtitle && (
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate -mt-0.5 font-normal max-w-[130px] sm:max-w-[200px]">
                {displaySubtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Center Desktop Navigation Tabs */}
      <nav className="hidden lg:flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/10 shrink-0 mx-2">
        <button
          onClick={() => onNavigate('studio')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            ['studio', 'home', 'command', 'liverun', 'orchestrator'].includes(currentScreen)
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Studio IDE</span>
        </button>
        <button
          onClick={() => onNavigate('aichat')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            ['aichat', 'ai'].includes(currentScreen)
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>AI Chat</span>
        </button>
        <button
          onClick={() => onNavigate('workspace')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            ['workspace', 'editor', 'projects'].includes(currentScreen)
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <FolderCode className="w-3.5 h-3.5" />
          <span>Workspace</span>
        </button>
        <button
          onClick={() => onNavigate('preview')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            currentScreen === 'preview'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview</span>
        </button>
        <button
          onClick={() => onNavigate('models')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            currentScreen === 'models'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Connectors</span>
        </button>
        <button
          onClick={() => onNavigate('tools')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            currentScreen === 'tools'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Tools</span>
        </button>
        <button
          onClick={() => onNavigate('output')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            currentScreen === 'output'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Output</span>
        </button>
      </nav>

      {/* Header Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {onOpenLivePreview && activeProject && (
          <button
            onClick={onOpenLivePreview}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 min-h-[38px] rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-sm transition-all active:scale-95"
            title="Instant Live App Preview"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">Preview</span>
          </button>
        )}

        {onExportStandalone && (
          <button
            onClick={onExportStandalone}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 min-h-[38px] rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-semibold shadow-sm transition-all active:scale-95"
            title="Download Standalone Single HTML (final_codes/omnintellx.html)"
          >
            <Download className="w-3.5 h-3.5 text-cyan-300" />
            <span className="text-[11px] font-bold hidden xs:inline sm:inline">Download</span>
            <span className="text-[11px] font-bold">HTML</span>
          </button>
        )}

        <button
          onClick={() => onNavigate('admin')}
          className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 min-h-[38px] rounded-xl border text-xs font-semibold shadow-sm transition-all active:scale-95 ${
            currentScreen === 'admin'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 hover:text-white'
          }`}
          title="Master Admin Console"
        >
          <Shield className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-[11px] font-bold hidden xs:inline sm:inline">Admin</span>
        </button>

        <button
          onClick={handleSearchClick}
          className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors active:scale-90"
          title="Search & Commands (Ctrl+K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors active:scale-90 hidden sm:flex"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        <button
          onClick={handleNotificationsClick}
          className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors relative active:scale-90"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
          )}
        </button>
      </div>
    </header>
  );
};
