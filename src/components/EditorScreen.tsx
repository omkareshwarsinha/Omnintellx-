/**
 * Omnintellx — Code Editor Screen
 */

import React, { useState, useEffect, useRef } from 'react';
import { Project, ProjectFile, EditorPrefs } from '../types';
import { autoFormatCode } from '../utils/codeFormatter';
import {
  Save,
  Search,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  WrapText,
  Play,
  GitCompare,
  Columns,
  X,
  FileCode,
  Check,
  AlertCircle,
  Sparkles,
  Wand2,
  Download
} from 'lucide-react';
import { compileProjectToSingleHtml } from '../utils/singleHtmlCompiler';

interface EditorScreenProps {
  projects: Project[];
  activeProjectId: string | null;
  activeFileId: string | null;
  openTabs: Array<{ projectId: string; fileId: string }>;
  prefs: EditorPrefs;
  onSaveFile: (projectId: string, fileId: string, content: string) => void;
  onCloseTab: (projectId: string, fileId: string) => void;
  onSelectTab: (projectId: string, fileId: string) => void;
  onOpenPreview: (file: ProjectFile) => void;
  onOpenDiff: (file: ProjectFile) => void;
}

export const EditorScreen: React.FC<EditorScreenProps> = ({
  projects,
  activeProjectId,
  activeFileId,
  openTabs,
  prefs,
  onSaveFile,
  onCloseTab,
  onSelectTab,
  onOpenPreview,
  onOpenDiff
}) => {
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [findCount, setFindCount] = useState(0);
  const [splitMode, setSplitMode] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [fontSize, setFontSize] = useState(prefs.fontSize || 13);
  const [wordWrap, setWordWrap] = useState(prefs.wordWrap || false);
  const [formatSuccess, setFormatSuccess] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const currentProject = projects.find(p => p.id === activeProjectId) || projects[0] || null;
  const currentFile = currentProject?.files.find(f => f.id === activeFileId) || null;

  useEffect(() => {
    if (currentFile) {
      setContent(currentFile.content);
      setIsDirty(false);
    }
  }, [currentFile?.id]);

  const handleFormat = () => {
    if (!currentFile) return;
    const formatted = autoFormatCode(content, currentFile.name);
    setContent(formatted);
    setIsDirty(formatted !== currentFile.content);
    setFormatSuccess(true);
    setTimeout(() => setFormatSuccess(false), 2500);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setIsDirty(val !== (currentFile?.content || ''));
  };

  const handleSave = () => {
    if (currentProject && currentFile) {
      onSaveFile(currentProject.id, currentFile.id, content);
      setIsDirty(false);
    }
  };

  const updateCursor = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const lines = content.substring(0, pos).split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    });
  };

  const linesCount = content.split('\n').length;
  const linesArray = Array.from({ length: linesCount }, (_, i) => i + 1);

  const handleFindNext = () => {
    if (!findQuery || !textareaRef.current) return;
    const text = content;
    const startPos = textareaRef.current.selectionEnd || 0;
    let idx = text.toLowerCase().indexOf(findQuery.toLowerCase(), startPos);
    if (idx === -1) {
      idx = text.toLowerCase().indexOf(findQuery.toLowerCase(), 0);
    }
    if (idx !== -1) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(idx, idx + findQuery.length);
      const matches = (text.match(new RegExp(findQuery, 'gi')) || []).length;
      setFindCount(matches);
    } else {
      setFindCount(0);
    }
  };

  const handleReplace = () => {
    if (!findQuery || !textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const sel = content.substring(start, end);
    if (sel.toLowerCase() === findQuery.toLowerCase()) {
      const newContent = content.substring(0, start) + replaceQuery + content.substring(end);
      setContent(newContent);
      setIsDirty(true);
    }
    handleFindNext();
  };

  const handleReplaceAll = () => {
    if (!findQuery) return;
    const regex = new RegExp(findQuery, 'gi');
    const newContent = content.replace(regex, replaceQuery);
    setContent(newContent);
    setIsDirty(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] rounded-2xl bg-[#0D1117] border border-white/10 overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161B22] border-b border-white/10 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={handleSave}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
              isDirty
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/50'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
            title="Save File (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>

          <button
            onClick={handleFormat}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
              formatSuccess
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/50'
                : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
            }`}
            title="Auto-Format Code (Prettify Indentation & Syntax)"
          >
            {formatSuccess ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{formatSuccess ? 'Formatted!' : 'Auto Format'}</span>
          </button>

          <button
            onClick={() => setShowFind(!showFind)}
            className={`p-1.5 rounded-md transition-colors ${showFind ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5'}`}
            title="Find & Replace"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setWordWrap(!wordWrap)}
            className={`p-1.5 rounded-md transition-colors ${wordWrap ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5'}`}
            title="Toggle Word Wrap"
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setFontSize(Math.min(24, fontSize + 1))}
            className="p-1.5 rounded-md hover:bg-white/5"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setFontSize(Math.max(10, fontSize - 1))}
            className="p-1.5 rounded-md hover:bg-white/5"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setSplitMode(!splitMode)}
            className={`p-1.5 rounded-md transition-colors ${splitMode ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5'}`}
            title="Toggle Split View"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>

          {currentProject && (
            <button
              onClick={() => {
                const singleHtml = compileProjectToSingleHtml(currentProject);
                const blob = new Blob([singleHtml], { type: 'text/html;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${currentProject.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_standalone.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 text-xs font-medium transition-colors"
              title="Download standalone single-file HTML (output/index.html)"
            >
              <Download className="w-3 h-3 text-indigo-400" /> Export HTML
            </button>
          )}

          {currentFile && (
            <>
              <button
                onClick={() => onOpenPreview(currentFile)}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                title="Live Sandbox Preview"
              >
                <Play className="w-3 h-3 fill-current" /> Preview
              </button>

              <button
                onClick={() => onOpenDiff(currentFile)}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300"
                title="Diff changes"
              >
                <GitCompare className="w-3 h-3" /> Diff
              </button>
            </>
          )}
        </div>

        <div className="text-[11px] font-mono text-slate-400 shrink-0">
          {currentProject?.name} / {currentFile?.name || 'No file selected'}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center bg-[#090D13] border-b border-white/5 overflow-x-auto px-1 select-none">
        {openTabs.map((tab) => {
          const p = projects.find(proj => proj.id === tab.projectId);
          const f = p?.files.find(file => file.id === tab.fileId);
          if (!f) return null;

          const isActive = tab.projectId === activeProjectId && tab.fileId === activeFileId;

          return (
            <div
              key={`${tab.projectId}-${tab.fileId}`}
              onClick={() => onSelectTab(tab.projectId, tab.fileId)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border-r border-white/5 cursor-pointer max-w-[160px] truncate shrink-0 transition-colors ${
                isActive
                  ? 'bg-[#0D1117] text-indigo-300 font-semibold border-t-2 border-t-indigo-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{f.name}</span>
              {isActive && isDirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.projectId, tab.fileId);
                }}
                className="p-0.5 hover:text-rose-400 rounded text-slate-500 shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Find / Replace Bar */}
      {showFind && (
        <div className="p-2 bg-[#161B22] border-b border-white/10 flex flex-wrap items-center gap-2 text-xs">
          <input
            type="text"
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            placeholder="Find..."
            className="px-2 py-1 rounded bg-black/40 border border-white/10 text-white font-mono text-xs w-36 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            placeholder="Replace..."
            className="px-2 py-1 rounded bg-black/40 border border-white/10 text-white font-mono text-xs w-36 focus:outline-none focus:border-indigo-500"
          />
          <button onClick={handleFindNext} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-200 font-medium">
            Next
          </button>
          <button onClick={handleReplace} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-200 font-medium">
            Replace
          </button>
          <button onClick={handleReplaceAll} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-200 font-medium">
            Replace All
          </button>
          <span className="text-[11px] font-mono text-slate-400 ml-2">
            {findCount > 0 ? `${findCount} matches` : 'No matches'}
          </span>
        </div>
      )}

      {/* Editor Body */}
      <div className={`flex-1 flex overflow-hidden ${splitMode ? 'divide-x divide-white/10' : ''}`}>
        {currentFile ? (
          <div className="flex-1 flex h-full overflow-hidden relative">
            {/* Gutter */}
            {prefs.lineNumbers && (
              <div
                ref={gutterRef}
                className="w-12 bg-[#090D13] text-slate-600 font-mono text-right pr-3 py-3 select-none overflow-hidden shrink-0 border-r border-white/5 leading-relaxed"
                style={{ fontSize: `${fontSize}px` }}
              >
                {linesArray.map(num => (
                  <div
                    key={num}
                    className={`${cursorPos.line === num ? 'text-indigo-400 font-bold' : ''}`}
                  >
                    {num}
                  </div>
                ))}
              </div>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextChange}
              onKeyUp={updateCursor}
              onClick={updateCursor}
              onScroll={() => {
                if (gutterRef.current && textareaRef.current) {
                  gutterRef.current.scrollTop = textareaRef.current.scrollTop;
                }
              }}
              spellCheck={false}
              className={`flex-1 p-3 bg-transparent text-slate-100 font-mono resize-none focus:outline-none leading-relaxed h-full overflow-auto ${
                wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
              }`}
              style={{
                fontSize: `${fontSize}px`,
                fontFamily: prefs.fontFamily || "'JetBrains Mono', monospace"
              }}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
            <FileCode className="w-8 h-8 mb-2 opacity-40" />
            No file opened in editor. Choose one from Projects.
          </div>
        )}

        {/* Split View Pane */}
        {splitMode && (
          <div className="flex-1 flex flex-col h-full bg-[#090D13] p-3 text-xs font-mono text-slate-400 overflow-auto">
            <div className="text-[11px] font-semibold text-indigo-400 mb-2">Secondary Reference Pane</div>
            <div className="whitespace-pre-wrap">{content}</div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#161B22] border-t border-white/10 text-[11px] font-mono text-slate-400 select-none">
        <div className="flex items-center gap-4">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>{linesCount} lines</span>
          <span>{content.length} chars</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            {isDirty ? (
              <span className="text-amber-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Unsaved changes</span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>
            )}
          </span>
          <span>UTF-8</span>
          <span className="text-indigo-400 font-semibold">{currentFile?.name.split('.').pop()?.toUpperCase() || 'TXT'}</span>
        </div>
      </div>
    </div>
  );
};
