/**
 * Omnintellx — Quick Ask Bottom Sheet
 * Fast mobile modal for prompt execution, direct project code generation, or 12-agent studio pipeline.
 */

import React, { useState } from 'react';
import { Send, Sparkles, X, Bot, Zap, Code2 } from 'lucide-react';

interface QuickAskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string, mode?: 'chat' | 'team') => void;
}

export const QuickAskSheet: React.FC<QuickAskSheetProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [prompt, setPrompt] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (mode: 'chat' | 'team' = 'chat') => {
    if (!prompt.trim()) return;
    onSubmit(prompt, mode);
    setPrompt('');
    onClose();
  };

  const quickIdeas = [
    'Create an interactive Calculator with memory & dark mode',
    'Build a Stopwatch & Lap Timer with local storage',
    'Generate a modern Portfolio Landing page with Tailwind',
    'Build a Kanban Task Board with drag-and-drop'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#12161F] border border-white/15 rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-4 sm:p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Omnintellx AI Quick Action</h3>
              <p className="text-[10px] text-slate-400">Write code, update project files, or run multi-agent team</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <textarea
            autoFocus
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe what you want to build or generate (e.g. 'Create a fullstack Todo App with audio alerts and dark theme')..."
            className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          {/* Quick Ideas Chips */}
          <div className="flex flex-wrap gap-1">
            {quickIdeas.map((idea, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(idea)}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] truncate max-w-full text-left active:scale-95"
              >
                💡 {idea}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold text-center"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => handleSubmit('chat')}
                disabled={!prompt.trim()}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
                title="Send directly to AI Chat to generate code & preview"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>AI Code &amp; Preview</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmit('team')}
                disabled={!prompt.trim()}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
                title="Run full 7-specialist autonomous pipeline"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Specialist Team</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
