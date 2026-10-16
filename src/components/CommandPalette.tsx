/**
 * Omnintellx — Command Palette Component (Ctrl+K / Ctrl+P)
 */

import React, { useState, useEffect } from 'react';
import { ScreenId, Project } from '../types';
import {
  Search,
  Bot,
  Code2,
  FolderCode,
  Cpu,
  Wrench,
  Settings,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  X
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  projects: Project[];
  onClose: () => void;
  onNavigate: (screen: ScreenId) => void;
  onOpenProject: (id: string) => void;
  onOpenFile: (projectId: string, fileId: string) => void;
  onNewProject: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  projects,
  onClose,
  onNavigate,
  onOpenProject,
  onOpenFile,
  onNewProject
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'p')) {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { label: 'Launch Multi-Agent Studio', icon: Bot, action: () => { onNavigate('orchestrator'); onClose(); } },
    { label: 'Create New Project', icon: Plus, action: () => { onNewProject(); onClose(); } },
    { label: 'Open Code Editor', icon: Code2, action: () => { onNavigate('editor'); onClose(); } },
    { label: 'Open Live Sandbox Preview', icon: Play, action: () => { onNavigate('tools'); onClose(); } },
    { label: 'Configure Model Providers', icon: Cpu, action: () => { onNavigate('models'); onClose(); } },
    { label: 'Open Workspace Settings', icon: Settings, action: () => { onNavigate('settings'); onClose(); } },
  ];

  const matchingProjects = projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  const allFiles = projects.flatMap(p => p.files.map(f => ({ ...f, projectId: p.id, projectName: p.name })));
  const matchingFiles = allFiles.filter(f => f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center pt-20 p-4">
      <div className="bg-[#12161F] border border-white/15 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3 border-b border-white/10 gap-2.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, project name, or file to jump to..."
            className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-slate-500 font-mono"
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-3 text-xs">
          {/* Quick Actions */}
          <div>
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-slate-500 font-semibold">Commands</div>
            <div className="space-y-0.5 mt-1">
              {commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase())).map((cmd, i) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={i}
                    onClick={cmd.action}
                    className="w-full px-2.5 py-2 rounded-lg hover:bg-white/5 text-slate-200 hover:text-white flex items-center gap-2.5 text-left transition-colors"
                  >
                    <Icon className="w-4 h-4 text-indigo-400" />
                    <span>{cmd.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Files */}
          {matchingFiles.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-slate-500 font-semibold">Files</div>
              <div className="space-y-0.5 mt-1">
                {matchingFiles.map((f) => (
                  <button
                    key={`${f.projectId}-${f.id}`}
                    onClick={() => {
                      onOpenFile(f.projectId, f.id);
                      onNavigate('editor');
                      onClose();
                    }}
                    className="w-full px-2.5 py-2 rounded-lg hover:bg-white/5 text-slate-200 hover:text-white flex items-center justify-between text-left transition-colors font-mono"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Code2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{f.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{f.projectName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {matchingProjects.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-slate-500 font-semibold">Projects</div>
              <div className="space-y-0.5 mt-1">
                {matchingProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onOpenProject(p.id);
                      onNavigate('projects');
                      onClose();
                    }}
                    className="w-full px-2.5 py-2 rounded-lg hover:bg-white/5 text-slate-200 hover:text-white flex items-center justify-between text-left transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FolderCode className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="truncate">{p.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{p.files.length} files</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
