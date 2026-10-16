/**
 * Omnintellx — Workspace & Code Studio Screen
 * File tree with search & CRUD, tabbed editor with syntax line numbers, agent attribution,
 * diff viewer with Accept/Reject, and live preview shortcut.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Project, ProjectFile, EditorPrefs } from '../types';
import { autoFormatCode } from '../utils/codeFormatter';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Plus,
  Trash2,
  Search,
  Save,
  Wand2,
  WrapText,
  ZoomIn,
  ZoomOut,
  GitCompare,
  Eye,
  Check,
  X,
  Bot,
  Layers,
  ArrowRight,
  Download
} from 'lucide-react';

interface WorkspaceScreenProps {
  project: Project | null;
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onSaveFile: (fileId: string, newContent: string) => void;
  onCreateFile: (fileName: string) => void;
  onDeleteFile: (fileId: string) => void;
  onOpenPreview: () => void;
}

export const WorkspaceScreen: React.FC<WorkspaceScreenProps> = ({
  project,
  activeFileId,
  onSelectFile,
  onSaveFile,
  onCreateFile,
  onDeleteFile,
  onOpenPreview
}) => {
  const [fileSearch, setFileSearch] = useState('');
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [diffMode, setDiffMode] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [newFileInputOpen, setNewFileInputOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [formatSuccess, setFormatSuccess] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeFile = useMemo(() => {
    if (!project) return null;
    return project.files.find(f => f.id === activeFileId) || project.files[0] || null;
  }, [project, activeFileId]);

  useEffect(() => {
    if (activeFile) {
      setContent(activeFile.content);
      setIsDirty(false);
    }
  }, [activeFile?.id]);

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, content]);

  const handleSave = () => {
    if (activeFile) {
      onSaveFile(activeFile.id, content);
      setIsDirty(false);
    }
  };

  const handleFormat = () => {
    if (!activeFile) return;
    const formatted = autoFormatCode(content, activeFile.name);
    setContent(formatted);
    setIsDirty(formatted !== activeFile.content);
    setFormatSuccess(true);
    setTimeout(() => setFormatSuccess(false), 2000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onCreateFile(newFileName.trim());
    setNewFileName('');
    setNewFileInputOpen(false);
  };

  // Group files into logical folders (root, output, etc.)
  const filteredFiles = useMemo(() => {
    if (!project) return [];
    return project.files.filter(f =>
      f.name.toLowerCase().includes(fileSearch.toLowerCase())
    );
  }, [project, fileSearch]);

  const rootFiles = filteredFiles.filter(f => !f.name.includes('/'));
  const outputFiles = filteredFiles.filter(f => f.name.startsWith('output/'));
  const otherFiles = filteredFiles.filter(f => f.name.includes('/') && !f.name.startsWith('output/'));

  const linesCount = content.split('\n').length;
  const linesArray = Array.from({ length: linesCount }, (_, i) => i + 1);

  // Simple diff lines between saved file content and current buffer
  const diffLines = useMemo(() => {
    if (!activeFile) return [];
    const origLines = activeFile.content.split('\n');
    const currLines = content.split('\n');
    const diffs: Array<{ type: 'same' | 'added' | 'removed'; text: string }> = [];

    const maxLen = Math.max(origLines.length, currLines.length);
    for (let i = 0; i < maxLen; i++) {
      const orig = origLines[i];
      const curr = currLines[i];
      if (orig === curr) {
        if (orig !== undefined) diffs.push({ type: 'same', text: orig });
      } else {
        if (orig !== undefined) diffs.push({ type: 'removed', text: orig });
        if (curr !== undefined) diffs.push({ type: 'added', text: curr });
      }
    }
    return diffs;
  }, [activeFile, content]);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-3">
      {/* Top Workspace Bar */}
      <div className="bg-[#0e131b] border border-white/10 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-lg shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white">Workspace Studio</h2>
          {project && (
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              ({project.name})
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activeFile?.lastEditedByAgent && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>Attribution: {activeFile.lastEditedByAgent}</span>
            </div>
          )}

          <button
            onClick={() => setDiffMode(d => !d)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              diffMode ? 'bg-indigo-600 text-white border-indigo-500' : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
            title="Inspect changes against saved version"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Diff</span>
          </button>

          <button
            onClick={handleFormat}
            className="px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1"
            title="Format Code"
          >
            {formatSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Wand2 className="w-3.5 h-3.5 text-indigo-400" />}
            <span className="hidden sm:inline">Format</span>
          </button>

          <button
            onClick={handleSave}
            disabled={!isDirty}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            title="Save file (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save {isDirty ? '●' : ''}</span>
          </button>

          <button
            onClick={onOpenPreview}
            className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* File Explorer Sidebar */}
        <div className="w-60 bg-[#0e131b] border border-white/10 rounded-2xl p-3 flex flex-col shrink-0">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Files ({filteredFiles.length})
            </span>
            <button
              onClick={() => setNewFileInputOpen(o => !o)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300"
              title="Add New File"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New file quick form */}
          {newFileInputOpen && (
            <form onSubmit={handleCreateSubmit} className="mt-2 flex items-center gap-1">
              <input
                type="text"
                autoFocus
                placeholder="filename.ext"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full bg-[#080b10] border border-indigo-500/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
              />
              <button type="submit" className="p-1 bg-indigo-600 rounded text-white text-xs">
                <Check className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Search files */}
          <div className="relative mt-2">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search..."
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
              className="w-full bg-[#080b10] border border-white/10 rounded-lg pl-6 pr-2 py-1 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* File Tree List */}
          <div className="flex-1 overflow-y-auto mt-2 space-y-3 pr-1 text-xs font-mono">
            {/* Root files */}
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <FolderOpen className="w-3 h-3 text-indigo-400" /> root
              </div>
              <div className="space-y-0.5">
                {rootFiles.map(file => {
                  const isSelected = activeFile?.id === file.id;
                  return (
                    <div
                      key={file.id}
                      onClick={() => onSelectFile(file.id)}
                      className={`group px-2 py-1.5 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileCode className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete file "${file.name}"?`)) onDeleteFile(file.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Output deliverables folder */}
            {outputFiles.length > 0 && (
              <div>
                <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Folder className="w-3 h-3" /> output/
                </div>
                <div className="space-y-0.5">
                  {outputFiles.map(file => {
                    const isSelected = activeFile?.id === file.id;
                    const cleanName = file.name.replace('output/', '');
                    return (
                      <div
                        key={file.id}
                        onClick={() => onSelectFile(file.id)}
                        className={`group px-2 py-1.5 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-indigo-600 text-white font-semibold' : 'text-emerald-300/80 hover:text-emerald-200 hover:bg-emerald-950/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{cleanName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Code Editor / Diff Area */}
        <div className="flex-1 bg-[#080b10] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-inner">
          {/* File Tab Bar */}
          <div className="h-10 bg-[#0e131b] border-b border-white/10 flex items-center justify-between px-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                {activeFile?.name || 'No file selected'}
              </span>
              {isDirty && <span className="w-2 h-2 rounded-full bg-indigo-400" />}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <button
                onClick={() => setWordWrap(w => !w)}
                className={`p-1 rounded ${wordWrap ? 'text-indigo-400' : 'text-slate-500'}`}
                title="Toggle Word Wrap"
              >
                <WrapText className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setFontSize(f => Math.max(10, f - 1))}
                className="p-1 rounded text-slate-500 hover:text-white"
                title="Decrease Font Size"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setFontSize(f => Math.min(20, f + 1))}
                className="p-1 rounded text-slate-500 hover:text-white"
                title="Increase Font Size"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] text-slate-500">
                Ln {cursorPos.line}, Col {cursorPos.col}
              </span>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 overflow-hidden relative flex">
            {diffMode ? (
              // Diff View
              <div className="w-full h-full overflow-auto p-4 font-mono text-xs space-y-0.5">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10 text-xs">
                  <span className="text-slate-400">
                    Comparing buffer against last saved version
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        handleSave();
                        setDiffMode(false);
                      }}
                      className="px-2.5 py-1 rounded bg-emerald-600 text-white font-medium text-xs flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Accept Changes</span>
                    </button>
                    <button
                      onClick={() => {
                        if (activeFile) setContent(activeFile.content);
                        setIsDirty(false);
                        setDiffMode(false);
                      }}
                      className="px-2.5 py-1 rounded bg-rose-600 text-white font-medium text-xs flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Reject & Revert</span>
                    </button>
                  </div>
                </div>
                {diffLines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`px-2 py-0.5 rounded font-mono ${
                      line.type === 'added' ? 'bg-emerald-950/40 text-emerald-300' :
                      line.type === 'removed' ? 'bg-rose-950/40 text-rose-300 line-through' :
                      'text-slate-400'
                    }`}
                  >
                    <span className="inline-block w-4 text-slate-600 select-none">
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </span>
                    {line.text}
                  </div>
                ))}
              </div>
            ) : (
              // Standard Code Editor with Line Numbers
              <>
                {/* Line numbers gutter */}
                <div className="w-12 py-3 bg-[#0a0d13] text-right pr-3 font-mono text-[11px] text-slate-600 select-none border-r border-white/5 overflow-hidden">
                  {linesArray.map(n => (
                    <div key={n} style={{ height: `${fontSize * 1.5}px`, lineHeight: `${fontSize * 1.5}px` }}>
                      {n}
                    </div>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setIsDirty(e.target.value !== (activeFile?.content || ''));
                  }}
                  onKeyUp={() => {
                    if (textareaRef.current) {
                      const pos = textareaRef.current.selectionStart;
                      const lines = content.substring(0, pos).split('\n');
                      setCursorPos({
                        line: lines.length,
                        col: lines[lines.length - 1].length + 1
                      });
                    }
                  }}
                  spellCheck={false}
                  wrap={wordWrap ? 'on' : 'off'}
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: `${fontSize * 1.5}px`
                  }}
                  className="flex-1 bg-transparent text-slate-200 font-mono p-3 focus:outline-none resize-none overflow-auto whitespace-pre selection:bg-indigo-600/40"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
