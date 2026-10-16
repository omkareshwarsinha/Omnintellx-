/**
 * Omnintellx — Primary Progressive Disclosure Navigation Bar
 * 6 focused developer-grade workspaces: Command Center, Live Run, Workspace, Preview, Run History, Settings.
 */

import React from 'react';
import { ScreenId } from '../types';
import {
  MessageSquare,
  Activity,
  FolderCode,
  Eye,
  Package,
  Settings
} from 'lucide-react';

interface BottomNavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onOpenQuickAsk: () => void;
  isOrchestratorRunning: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  isOrchestratorRunning
}) => {
  const navItems: Array<{
    id: ScreenId;
    activeKeys: ScreenId[];
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'studio', activeKeys: ['studio', 'home', 'command', 'liverun', 'orchestrator'], label: 'Studio IDE', icon: Activity },
    { id: 'aichat', activeKeys: ['aichat', 'ai'], label: 'AI Chat', icon: MessageSquare },
    { id: 'workspace', activeKeys: ['workspace', 'editor', 'projects'], label: 'Workspace', icon: FolderCode },
    { id: 'preview', activeKeys: ['preview'], label: 'Preview', icon: Eye },
    { id: 'output', activeKeys: ['output'], label: 'Output', icon: Package },
    { id: 'settings', activeKeys: ['settings', 'models', 'tools', 'history', 'admin'], label: 'Settings', icon: Settings }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[60px] z-40 bg-[#0B0E13]/95 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-2 pb-[max(env(safe-area-inset-bottom,0px),2px)] select-none touch-manipulation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.activeKeys.includes(currentScreen);
        const isMission = item.id === 'studio';

        return (
          <button
            key={item.id}
            id={`nav-btn-${item.id}`}
            onClick={() => {
              onNavigate(item.id);
            }}
            className={`flex-1 min-h-[44px] flex flex-col items-center justify-center py-1 relative transition-all active:scale-95 ${
              isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            )}
            <div className="relative">
              <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform ${isActive ? 'scale-110 text-emerald-400' : ''}`} />
              {isMission && isOrchestratorRunning && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              )}
            </div>
            <span className={`text-[10px] sm:text-[11px] font-medium tracking-tight mt-1 truncate ${isActive ? 'font-semibold text-white' : ''}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
