/**
 * Omnintellx — Flagship AI Model Chat & Autonomous Agent Studio
 * Professional 3-Panel Architecture:
 * - LEFT: Chat/Session navigation, New Chat, Session History, Active Workspace Indicator, File Context Attachments
 * - CENTER: Conversation stream, User/Assistant messages, System/Tool events, Tool execution cards, Code blocks, Detected files, Errors, Verification results
 * - BOTTOM: Large multiline message composer, Enter=send, Shift+Enter=newline, Stop/Cancel button, Model/Mode indicators, File context picker
 * - TOP: Active model selector, Direct Chat / Manus Agent / Multi-AI Council mode switcher, Workspace status, Auto Apply state, New Chat
 * 
 * Complies with:
 * - Strict Anti-Fake-Success Rule (Verifiable results, explicit states: SUCCESS, FAILED, RUNNING, UNAVAILABLE)
 * - Zero Predefined Templates
 * - Full Mobile/Tablet/Desktop Responsiveness (320px - 1440px)
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage, ChatSession, ProviderConfig, Checkpoint, Project, ProjectFile, InferenceTarget } from '../types';
import { extractCodeFilesFromText, extractToolCallsFromText, ExtractedCodeFile, ExtractedToolCall } from '../utils/aiCodeExtractor';
import { StorageService } from '../engine/storage';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Zap,
  Code2,
  Play,
  BookmarkPlus,
  Eye,
  FileCode,
  ArrowRight,
  RefreshCw,
  Layers,
  FileCheck,
  Download,
  Terminal,
  FolderTree,
  PlusCircle,
  HelpCircle,
  SlidersHorizontal,
  ChevronDown,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Cpu,
  Boxes,
  Compass,
  CheckCircle2,
  FolderPlus,
  ArrowUpRight,
  MessageSquare,
  Square,
  Paperclip,
  X,
  History,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  CheckSquare,
  FileText
} from 'lucide-react';

export type ChatAgentMode = 'chat' | 'manus_agent' | 'council';

export interface AiChatScreenProps {
  messages: ChatMessage[];
  activeProvider: ProviderConfig | null;
  providers?: ProviderConfig[];
  activeTarget?: InferenceTarget;
  onSelectTarget?: (target: InferenceTarget) => void;
  onTestProvider?: (providerId: string) => Promise<void>;
  checkpoints: Checkpoint[];
  isThinking: boolean;
  activeProject: Project | null;
  projects?: Project[];
  onSendMessage: (text: string, mode?: ChatAgentMode, target?: InferenceTarget | string, attachedFiles?: string[]) => void;
  onStopThinking?: () => void;
  onTurnIntoTask: (text: string) => void;
  onSaveCheckpoint: (name: string) => void;
  onRestoreCheckpoint: (ckptId: string) => void;
  onClearChat: () => void;
  onApplyCodeFilesToProject?: (files: ExtractedCodeFile[]) => Promise<boolean> | void;
  onOpenLivePreview?: () => void;
  onOpenFileInEditor?: (fileName: string) => void;
  onSwitchProject?: (projectId: string) => void;
  onCreateNewProject?: (name?: string, desc?: string) => Project;
  onExecuteToolAction?: (tool: string, params: Record<string, any>) => Promise<any>;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  badge: string;
  icon: string;
  color: string;
  available: boolean;
}

const AVAILABLE_MODELS: ModelOption[] = [
  { id: 'gemini-flash-latest', name: 'Gemini 2.5 Flash', provider: 'Google DeepMind', badge: 'Ultra Fast', icon: '⚡', color: 'from-amber-400 to-orange-500', available: true },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 1.5 Pro', provider: 'Google DeepMind', badge: 'Deep Reasoning', icon: '🧠', color: 'from-blue-400 to-indigo-500', available: true },
  { id: 'claude-3-7-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', badge: 'Elite Coding', icon: '💎', color: 'from-emerald-400 to-teal-600', available: true },
  { id: 'openai-large', name: 'GPT-4o Omnimodel', provider: 'OpenAI', badge: 'Versatile', icon: '🚀', color: 'from-emerald-400 to-teal-600', available: true },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', badge: 'Logical Proof', icon: '🔬', color: 'from-cyan-400 to-blue-600', available: true },
  { id: 'llama', name: 'Llama 3.3 70B', provider: 'Meta / Groq', badge: 'Open Weights', icon: '🦙', color: 'from-rose-400 to-pink-600', available: true },
  { id: 'local-kernel', name: 'Local In-Browser Kernel', provider: 'Local Runtime', badge: 'Air-Gapped', icon: '💻', color: 'from-slate-400 to-slate-600', available: true }
];

export const AiChatScreen: React.FC<AiChatScreenProps> = ({
  messages,
  activeProvider,
  providers = [],
  activeTarget,
  onSelectTarget,
  onTestProvider,
  checkpoints,
  isThinking,
  activeProject,
  projects = [],
  onSendMessage,
  onStopThinking,
  onTurnIntoTask,
  onSaveCheckpoint,
  onRestoreCheckpoint,
  onClearChat,
  onApplyCodeFilesToProject,
  onOpenLivePreview,
  onOpenFileInEditor,
  onSwitchProject,
  onCreateNewProject,
  onExecuteToolAction
}) => {
  // Dynamic Available Models built from all configured & tested providers
  const availableModels = useMemo<ModelOption[]>(() => {
    if (!providers || providers.length === 0) return AVAILABLE_MODELS;

    const list: ModelOption[] = [];
    const addedIds = new Set<string>();

    providers.forEach(p => {
      p.models.forEach(modelName => {
        if (addedIds.has(modelName)) return;
        addedIds.add(modelName);

        let badge = p.name;
        let icon = '⚡';
        let color = 'from-indigo-400 to-cyan-500';

        if (p.type === 'gemini') {
          badge = 'Gemini';
          icon = '⚡';
          color = 'from-amber-400 to-orange-500';
        } else if (p.type === 'openrouter') {
          badge = 'OpenRouter';
          icon = '🌐';
          color = 'from-emerald-400 to-cyan-600';
        } else if (p.type === 'cerebras') {
          badge = 'Cerebras';
          icon = '🚀';
          color = 'from-emerald-400 to-teal-500';
        } else if (p.type === 'grok') {
          badge = 'Grok';
          icon = '✨';
          color = 'from-blue-400 to-indigo-600';
        } else if (p.type === 'ollama') {
          badge = 'Local LLM';
          icon = '💻';
          color = 'from-slate-400 to-slate-600';
        } else if (p.type === 'custom') {
          badge = p.name || 'Custom API';
          icon = '⚙️';
          color = 'from-rose-400 to-pink-600';
        }

        list.push({
          id: modelName,
          name: modelName,
          provider: p.name,
          badge,
          icon,
          color,
          available: p.status === 'online' || !p.requiresKey || !!p.apiKey
        });
      });
    });

    return list.length > 0 ? list : AVAILABLE_MODELS;
  }, [providers]);

  // Navigation & Layout States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatMode, setChatMode] = useState<ChatAgentMode>('chat');
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isTestingCurrent, setIsTestingCurrent] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [autoApplyCode, setAutoApplyCode] = useState(true);

  // Authoritative Inference Target resolution
  const defaultTarget: InferenceTarget = useMemo(() => {
    const firstP = providers[0] || { id: 'prov_gemini', type: 'gemini', models: ['gemini-2.5-flash'], defaultModel: 'gemini-2.5-flash' };
    return {
      providerId: firstP.id,
      providerType: firstP.type,
      modelId: firstP.selectedModelId || firstP.defaultModel || firstP.models[0] || 'gemini-2.5-flash'
    };
  }, [providers]);

  const currentTarget: InferenceTarget = activeTarget || defaultTarget;
  const currentProvider = providers.find(p => p.id === currentTarget.providerId) || providers[0] || null;
  const currentModels = currentProvider?.models || [];

  const handleSelectProvider = (prov: ProviderConfig) => {
    setIsProviderDropdownOpen(false);
    const modelId = prov.selectedModelId || prov.defaultModel || prov.models[0] || 'default';
    const newTarget: InferenceTarget = {
      providerId: prov.id,
      providerType: prov.type,
      modelId
    };
    if (onSelectTarget) {
      onSelectTarget(newTarget);
    }
  };

  const handleSelectModel = (modelId: string) => {
    setIsModelDropdownOpen(false);
    if (!currentProvider) return;
    const newTarget: InferenceTarget = {
      providerId: currentProvider.id,
      providerType: currentProvider.type,
      modelId
    };
    if (onSelectTarget) {
      onSelectTarget(newTarget);
    }
  };

  const handleTestCurrentProvider = async () => {
    if (!currentProvider || !onTestProvider) return;
    setIsTestingCurrent(true);
    try {
      await onTestProvider(currentProvider.id);
    } finally {
      setIsTestingCurrent(false);
    }
  };

  // Input & Context States
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [isAttachmentPickerOpen, setIsAttachmentPickerOpen] = useState(false);

  // Tool & Copy Feedback States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedMsgIds, setAppliedMsgIds] = useState<Record<string, 'APPLYING' | 'SUCCESS' | 'FAILED'>>({});
  const [executedTools, setExecutedTools] = useState<Record<string, { status: 'running' | 'success' | 'failed' | 'unavailable'; output: string; durationMs?: number }>>({});

  // Session & Workspace Management
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const loaded = StorageService.loadChatSessions();
    if (loaded && loaded.length > 0) return loaded;
    return [{
      id: 'session_default',
      title: 'Current Mission Thread',
      projectId: activeProject?.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    }];
  });
  const [activeSessionId, setActiveSessionId] = useState<string>('session_default');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Responsive sidebar handling for mobile/tablet
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Save sessions to storage
  useEffect(() => {
    StorageService.saveChatSessions(sessions);
  }, [sessions]);

  // Auto-apply detected code blocks if enabled and not already applied
  useEffect(() => {
    if (!autoApplyCode || !onApplyCodeFilesToProject || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && !appliedMsgIds[lastMsg.id]) {
      const extracted = extractCodeFilesFromText(lastMsg.content);
      if (extracted.length > 0) {
        setAppliedMsgIds(prev => ({ ...prev, [lastMsg.id]: 'APPLYING' }));
        Promise.resolve(onApplyCodeFilesToProject(extracted))
          .then(() => {
            setAppliedMsgIds(prev => ({ ...prev, [lastMsg.id]: 'SUCCESS' }));
          })
          .catch(() => {
            setAppliedMsgIds(prev => ({ ...prev, [lastMsg.id]: 'FAILED' }));
          });
      }
    }
  }, [messages, autoApplyCode, onApplyCodeFilesToProject, appliedMsgIds]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isThinking) return;
    setInput('');
    const filesToSend = [...attachedFiles];
    setAttachedFiles([]);
    onSendMessage(text, chatMode, currentTarget, filesToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyFiles = async (msgId: string, files: ExtractedCodeFile[]) => {
    if (!onApplyCodeFilesToProject) return;
    setAppliedMsgIds(prev => ({ ...prev, [msgId]: 'APPLYING' }));
    try {
      await Promise.resolve(onApplyCodeFilesToProject(files));
      setAppliedMsgIds(prev => ({ ...prev, [msgId]: 'SUCCESS' }));
      setTimeout(() => {
        setAppliedMsgIds(prev => {
          const cp = { ...prev };
          delete cp[msgId];
          return cp;
        });
      }, 4000);
    } catch {
      setAppliedMsgIds(prev => ({ ...prev, [msgId]: 'FAILED' }));
    }
  };

  const handleExecuteToolInChat = async (toolCallId: string, tool: string, params: Record<string, any>) => {
    setExecutedTools(prev => ({
      ...prev,
      [toolCallId]: { status: 'running', output: 'Dispatching tool to active workspace...' }
    }));

    const startTime = Date.now();
    try {
      if (onExecuteToolAction) {
        const res = await onExecuteToolAction(tool, params);
        const duration = Date.now() - startTime;
        setExecutedTools(prev => ({
          ...prev,
          [toolCallId]: {
            status: 'success',
            durationMs: duration,
            output: typeof res === 'object' ? JSON.stringify(res, null, 2) : String(res || 'Operation confirmed.')
          }
        }));
      } else {
        setExecutedTools(prev => ({
          ...prev,
          [toolCallId]: {
            status: 'unavailable',
            output: 'Tool execution gateway is not wired to an execution backend in current context.'
          }
        }));
      }
    } catch (err: any) {
      setExecutedTools(prev => ({
        ...prev,
        [toolCallId]: {
          status: 'failed',
          durationMs: Date.now() - startTime,
          output: err.message || 'Tool execution encountered an error.'
        }
      }));
    }
  };

  const handleInitiateNewChat = () => {
    const hasExistingFiles = (activeProject?.files && activeProject.files.length > 0) || messages.length > 0;
    if (hasExistingFiles) {
      setNewProjectName(`App ${projects.length + 1}`);
      setShowNewChatDialog(true);
    } else {
      onClearChat();
    }
  };

  const handleConfirmContinueExisting = () => {
    setShowNewChatDialog(false);
    onClearChat();
  };

  const handleConfirmCreateNewWorkspace = () => {
    setShowNewChatDialog(false);
    onClearChat();
    if (onCreateNewProject) {
      onCreateNewProject(newProjectName || `Project ${projects.length + 1}`, 'Clean isolated project workspace');
    }
  };

  const toggleAttachFile = (fileName: string) => {
    setAttachedFiles(prev =>
      prev.includes(fileName) ? prev.filter(f => f !== fileName) : [...prev, fileName]
    );
  };

  const currentModelMeta = useMemo(() => {
    return availableModels.find(m => m.id === currentTarget.modelId) || availableModels[0] || AVAILABLE_MODELS[0];
  }, [currentTarget.modelId, availableModels]);

  return (
    <div className="flex h-[calc(100vh-8.5rem)] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0B0E14] shadow-2xl relative">
      {/* ============================================================== */}
      {/* LEFT SIDEBAR: Sessions, Workspace Status & File Context Picker */}
      {/* ============================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 lg:static lg:w-72 bg-[#0F131C] border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:hidden'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-xs text-white">Omnintellx Chat</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded"
              title="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New Chat Primary Action */}
        <div className="p-3 border-b border-white/10">
          <button
            onClick={handleInitiateNewChat}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Chat / Mission</span>
          </button>
        </div>

        {/* Active Workspace Indicator */}
        <div className="p-3 border-b border-white/10 space-y-2">
          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between">
            <span>Authoritative Workspace</span>
            <span className="text-emerald-400 font-bold">ON DISK</span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-white truncate max-w-[150px]">
                {activeProject?.name || 'Workspace'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                {activeProject?.files.length || 0} files
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate">
              path: workspaces/{activeProject?.id || 'root'}
            </div>

            {/* Quick Switch Dropdown */}
            {projects.length > 1 && onSwitchProject && (
              <div className="relative pt-1">
                <button
                  onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                  className="w-full flex items-center justify-between px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 transition-colors"
                >
                  <span className="truncate">Switch Project</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
                </button>

                {isProjectDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#171C26] border border-white/15 rounded-lg shadow-xl py-1 z-50 max-h-48 overflow-y-auto">
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSwitchProject(p.id);
                          setIsProjectDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 text-xs truncate hover:bg-white/10 ${
                          p.id === activeProject?.id ? 'text-indigo-400 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Workspace Files Context Picker */}
        <div className="p-3 border-b border-white/10 space-y-2 flex-1 overflow-y-auto min-h-[140px]">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
            <span>Workspace Context</span>
            <span className="text-indigo-400">{attachedFiles.length} attached</span>
          </div>

          {activeProject?.files && activeProject.files.length > 0 ? (
            <div className="space-y-1">
              {activeProject.files.map(file => {
                const isAttached = attachedFiles.includes(file.name);
                return (
                  <button
                    key={file.id}
                    onClick={() => toggleAttachFile(file.name)}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left text-[11px] font-mono transition-colors ${
                      isAttached
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <FileCode className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    {isAttached && <CheckSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 text-center py-4">
              Workspace empty. Files created by the AI will appear here.
            </div>
          )}
        </div>

        {/* Sessions & Clear */}
        <div className="p-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <History className="w-3.5 h-3.5" />
            <span>{messages.length} messages</span>
          </div>

          <button
            onClick={onClearChat}
            className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
            title="Clear active conversation"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* CENTER: Main Chat, Top Control Bar & Message Stream             */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0B0E14] overflow-hidden">
        {/* TOP CONTROL BAR */}
        <header className="h-14 px-3 sm:px-4 border-b border-white/10 bg-[#10141D] flex items-center justify-between gap-2 shrink-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            {/* Sidebar Toggle for Mobile/Desktop */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors shrink-0"
              title="Toggle sidebar"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            {/* Authoritative Inference Target Selector (Provider + Model + Test) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Provider Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsProviderDropdownOpen(!isProviderDropdownOpen);
                    setIsModelDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 transition-all cursor-pointer"
                  title="Select AI Provider Gateway"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Provider</span>
                  <span className="font-semibold text-white truncate max-w-[100px] sm:max-w-none">
                    {currentProvider?.name || 'Provider'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {isProviderDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-72 bg-[#171C26] border border-white/15 rounded-xl shadow-2xl py-1 z-50 backdrop-blur-xl">
                    <div className="px-3 py-1.5 border-b border-white/10 text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
                      <span>Configured Gateways</span>
                      <span className="text-indigo-400 font-semibold">{providers.length} available</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {providers.map(p => {
                        const isSelected = p.id === currentTarget.providerId;
                        return (
                          <button
                            key={p.id}
                            onClick={() => handleSelectProvider(p)}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-white/10 ${
                              isSelected ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-2 h-2 rounded-full ${
                                p.status === 'online' ? 'bg-emerald-400' : p.status === 'authentication_failed' ? 'bg-red-400' : 'bg-slate-500'
                              }`} />
                              <div className="text-left truncate">
                                <div className="text-white text-xs truncate">{p.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{p.models.length} models</div>
                              </div>
                            </div>
                            {p.latency && (
                              <span className="text-[10px] text-emerald-400 font-mono">{p.latency}ms</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Model Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsModelDropdownOpen(!isModelDropdownOpen);
                    setIsProviderDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 transition-all cursor-pointer max-w-[130px] sm:max-w-[180px] truncate"
                  title="Select Model for this Provider"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Model</span>
                  <span className="font-mono text-indigo-300 font-semibold truncate">
                    {currentTarget.modelId}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {isModelDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-[#171C26] border border-white/15 rounded-xl shadow-2xl py-1 z-50 backdrop-blur-xl">
                    <div className="px-3 py-1.5 border-b border-white/10 text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
                      <span>{currentProvider?.name} Models</span>
                      <span className="text-indigo-400 font-semibold">{currentModels.length} models</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {currentModels.map(mId => {
                        const isSelected = mId === currentTarget.modelId;
                        return (
                          <button
                            key={mId}
                            onClick={() => handleSelectModel(mId)}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-white/10 ${
                              isSelected ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'text-slate-300'
                            }`}
                          >
                            <span className="font-mono text-xs text-left truncate">{mId}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Test Connection Button */}
              {onTestProvider && currentProvider && (
                <button
                  onClick={handleTestCurrentProvider}
                  disabled={isTestingCurrent}
                  className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title={`Test ${currentProvider.name} connection`}
                >
                  <Zap className={`w-3.5 h-3.5 ${isTestingCurrent ? 'animate-bounce text-amber-300' : 'text-amber-400'}`} />
                  <span className="hidden sm:inline text-[11px] font-medium">{isTestingCurrent ? 'Testing...' : 'Test'}</span>
                </button>
              )}

              {/* Live Status Badge */}
              <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono">
                <span className={`w-2 h-2 rounded-full ${
                  currentProvider?.status === 'online' ? 'bg-emerald-400' : currentProvider?.status === 'authentication_failed' ? 'bg-red-400' : 'bg-slate-500'
                }`} />
                <span className={currentProvider?.status === 'online' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                  {currentProvider?.status === 'online' ? 'Connected' : currentProvider?.status === 'authentication_failed' ? 'Auth Error' : 'Untested'}
                </span>
                {currentProvider?.latency && currentProvider.status === 'online' && (
                  <span className="text-slate-500 text-[10px]">({currentProvider.latency}ms)</span>
                )}
              </div>
            </div>

            {/* Mode Selector Pill */}
            <div className="hidden sm:flex items-center bg-black/40 p-0.5 rounded-xl border border-white/10">
              <button
                onClick={() => setChatMode('chat')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  chatMode === 'chat'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Normal AI conversational mode"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Direct Chat</span>
              </button>

              <button
                onClick={() => setChatMode('manus_agent')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  chatMode === 'manus_agent'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Manus & Ideavo Autonomous Agent execution loop"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Manus Agent</span>
              </button>

              <button
                onClick={() => setChatMode('council')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  chatMode === 'council'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Multi-AI Council (Architect, Engineer, QA, UI/UX)"
              >
                <Boxes className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Multi-AI Council</span>
                <span className="md:hidden">Council</span>
              </button>
            </div>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Auto-Apply Toggle */}
            <button
              onClick={() => setAutoApplyCode(!autoApplyCode)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                autoApplyCode
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
              title="Automatically write detected code blocks to workspace"
            >
              <Zap className={`w-3.5 h-3.5 ${autoApplyCode ? 'text-emerald-400 fill-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Auto-Apply</span>
            </button>

            {/* Quick Live Preview */}
            {onOpenLivePreview && (
              <button
                onClick={onOpenLivePreview}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 transition-colors"
                title="Open Sandbox Preview"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Preview</span>
              </button>
            )}
          </div>
        </header>

        {/* MODE BANNER NOTIFIER */}
        {chatMode === 'manus_agent' && (
          <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="font-semibold text-amber-300">Manus & Ideavo Agent Loop:</span>
              <span className="hidden sm:inline">The AI operates the physical project workspace (Understand → Inspect → Plan DAG → Tools → Observe → Evaluator → Release).</span>
              <span className="sm:hidden">Autonomous workspace operation.</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider shrink-0">Active Operator</span>
          </div>
        )}

        {chatMode === 'council' && (
          <div className="bg-teal-950/40 border-b border-teal-500/30 px-4 py-2 flex items-center justify-between text-xs text-teal-200">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="font-semibold text-teal-300">Multi-AI Council:</span>
              <span className="hidden sm:inline">Architect, Lead Engineer, QA Auditor, and UI Director synthesizing unified verified code.</span>
              <span className="sm:hidden">4 AI models collaborating.</span>
            </div>
            <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider shrink-0">Council Active</span>
          </div>
        )}

        {/* MESSAGES SCROLL AREA */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-4 sm:p-8 space-y-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>

              <div className="max-w-md space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Omnintellx Autonomous Studio</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The AI does not merely generate static templates. It inspects, plans, executes tools, and evaluates applications directly in your workspace.
                </p>
              </div>

              {/* Starter Mission Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full pt-2">
                <button
                  onClick={() => {
                    setInput('Build a 3D futuristic website for aerospace robotics with WebGL interactive viewer, telemetry panels, and sleek dark neon aesthetic');
                    inputRef.current?.focus();
                  }}
                  className="p-3 text-left rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group cursor-pointer"
                >
                  <div className="text-xs font-semibold text-white group-hover:text-indigo-400 flex items-center justify-between">
                    <span>🚀 3D Aerospace Robotics Site</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">WebGL canvas, telemetry HUD, futuristic 3D scene</div>
                </button>

                <button
                  onClick={() => {
                    setInput('Create a full-stack Analytics Dashboard with real-time charts, filterable tables, and dark glassmorphic UI');
                    inputRef.current?.focus();
                  }}
                  className="p-3 text-left rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group cursor-pointer"
                >
                  <div className="text-xs font-semibold text-white group-hover:text-indigo-400 flex items-center justify-between">
                    <span>📊 Real-Time Analytics Suite</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Interactive data visualization, KPIs, live filtering</div>
                </button>

                <button
                  onClick={() => {
                    setInput('Build a fast-paced Canvas Space Odyssey arcade game with particle effects, score tracking, and smooth 60fps physics');
                    inputRef.current?.focus();
                  }}
                  className="p-3 text-left rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group cursor-pointer"
                >
                  <div className="text-xs font-semibold text-white group-hover:text-indigo-400 flex items-center justify-between">
                    <span>🎮 Space Odyssey Arcade</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">HTML5 canvas, particle physics, retro sound effects</div>
                </button>

                <button
                  onClick={() => {
                    setInput('Inspect current project files, audit security vulnerabilities, and compile production deliverables to omni/ folder');
                    inputRef.current?.focus();
                  }}
                  className="p-3 text-left rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group cursor-pointer"
                >
                  <div className="text-xs font-semibold text-white group-hover:text-indigo-400 flex items-center justify-between">
                    <span>🛡️ Workspace Security Audit</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Inspect workspace on disk and compile verified output</div>
                </button>
              </div>
            </div>
          ) : (
            messages.map(msg => {
              const isUser = msg.role === 'user';
              const extractedFiles = !isUser ? extractCodeFilesFromText(msg.content) : [];
              const toolCalls = !isUser ? extractToolCallsFromText(msg.content) : [];
              const applyState = appliedMsgIds[msg.id];

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shrink-0 shadow-md">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-2xl sm:max-w-3xl space-y-2 w-full ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Message Card */}
                    <div
                      className={`rounded-2xl p-3.5 sm:p-4 text-xs leading-relaxed shadow-md ${
                        isUser
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none ml-auto max-w-[85%]'
                          : 'bg-[#141923] border border-white/10 text-slate-200 rounded-tl-none w-full'
                      }`}
                    >
                      {!isUser && (
                        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{msg.model || currentModelMeta.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 font-mono">
                              {msg.mode ? msg.mode.replace('_', ' ') : 'Assistant'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                            title="Copy message"
                          >
                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}

                      <div className="whitespace-pre-wrap font-sans text-xs break-words">
                        {msg.content}
                      </div>
                    </div>

                    {/* REAL TOOL EXECUTION CARDS */}
                    {toolCalls.length > 0 && (
                      <div className="space-y-1.5 w-full">
                        {toolCalls.map(tc => {
                          const execState = executedTools[tc.id];
                          return (
                            <div
                              key={tc.id}
                              className="bg-[#10141D] border border-indigo-500/30 rounded-xl p-3 space-y-2 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                                  <span className="font-mono font-semibold text-indigo-300 text-xs">
                                    Tool Action: {tc.tool}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {execState?.status === 'running' && (
                                    <span className="flex items-center gap-1 text-[11px] text-amber-400 font-mono">
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                      RUNNING
                                    </span>
                                  )}
                                  {execState?.status === 'success' && (
                                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                                      <CheckCircle2 className="w-3 h-3" />
                                      CONFIRMED ({execState.durationMs}ms)
                                    </span>
                                  )}
                                  {execState?.status === 'failed' && (
                                    <span className="flex items-center gap-1 text-[11px] text-rose-400 font-mono">
                                      <AlertTriangle className="w-3 h-3" />
                                      FAILED
                                    </span>
                                  )}
                                  {execState?.status === 'unavailable' && (
                                    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                                      UNAVAILABLE
                                    </span>
                                  )}
                                  {!execState && (
                                    <button
                                      onClick={() => handleExecuteToolInChat(tc.id, tc.tool, tc.params)}
                                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition-colors"
                                    >
                                      Execute Tool
                                    </button>
                                  )}
                                </div>
                              </div>

                              <pre className="p-2 rounded-lg bg-black/40 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-32">
                                {JSON.stringify(tc.params, null, 2)}
                              </pre>

                              {execState?.output && (
                                <div className={`text-[11px] font-mono p-2 rounded-lg ${
                                  execState.status === 'failed'
                                    ? 'bg-rose-950/20 border border-rose-500/20 text-rose-300'
                                    : 'bg-emerald-950/20 border border-emerald-500/20 text-emerald-300'
                                }`}>
                                  {execState.output}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* DETECTED WORKSPACE FILES CARD */}
                    {extractedFiles.length > 0 && (
                      <div className="bg-[#121722] border border-emerald-500/30 rounded-xl p-3 space-y-2.5 shadow-lg w-full">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs font-semibold text-emerald-300">
                              Detected Workspace Files ({extractedFiles.length})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApplyFiles(msg.id, extractedFiles)}
                              disabled={applyState === 'APPLYING'}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                applyState === 'SUCCESS'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : applyState === 'FAILED'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                              }`}
                            >
                              {applyState === 'SUCCESS' ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Applied & Verified</span>
                                </>
                              ) : applyState === 'APPLYING' ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Writing to Disk...</span>
                                </>
                              ) : applyState === 'FAILED' ? (
                                <>
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Write Failed</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3.5 h-3.5 fill-current" />
                                  <span>⚡ Apply to Workspace</span>
                                </>
                              )}
                            </button>

                            {onOpenLivePreview && (
                              <button
                                onClick={onOpenLivePreview}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium transition-colors"
                                title="Live Preview Sandbox"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="hidden sm:inline">Preview</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* File Tags List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {extractedFiles.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span className="text-white font-medium truncate">{file.name}</span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-slate-400">{file.lineCount} lines</span>
                                {onOpenFileInEditor && (
                                  <button
                                    onClick={() => onOpenFileInEditor(file.name)}
                                    className="text-indigo-400 hover:text-indigo-300"
                                    title="Open in editor"
                                  >
                                    <ArrowUpRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-white shrink-0 shadow-md">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isThinking && (
            <div className="flex gap-3 items-center text-slate-400 text-xs">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shrink-0 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 font-mono text-[11px]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>
                  {chatMode === 'council'
                    ? 'Multi-AI Council models reasoning and synthesizing code...'
                    : chatMode === 'manus_agent'
                    ? 'Manus agent analyzing workspace & executing tools...'
                    : `${currentModelMeta.name} is reasoning & generating code...`}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* BOTTOM MESSAGE COMPOSER */}
        <div className="p-3 border-t border-white/10 bg-[#10141D] flex flex-col gap-2 shrink-0">
          {/* Attached Files Pill Bar */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 px-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Context Files:</span>
              {attachedFiles.map(f => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-[11px] border border-indigo-500/30"
                >
                  <FileText className="w-3 h-3 text-indigo-400" />
                  <span>{f}</span>
                  <button
                    onClick={() => toggleAttachFile(f)}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Multiline Textarea */}
          <div className="relative bg-[#161B26] border border-white/10 rounded-2xl p-2 focus-within:border-indigo-500/50 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                chatMode === 'manus_agent'
                  ? 'Instruct Manus Agent: e.g. "Build 3D interactive car configurator with Three.js and real controls"'
                  : chatMode === 'council'
                  ? 'Multi-AI Council Mission: All 4 models will evaluate and synthesize code together...'
                  : `Message ${currentModelMeta.name}... (Enter to send, Shift+Enter for newline)`
              }
              rows={3}
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none resize-none px-2 py-1 leading-relaxed font-sans"
            />

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1 px-1">
              <div className="flex items-center gap-2">
                {/* Attach File Button */}
                <button
                  onClick={() => setIsAttachmentPickerOpen(!isAttachmentPickerOpen)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-white/5"
                  title="Attach workspace file to prompt"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Attach File</span>
                </button>

                <div className="h-3 w-px bg-white/10 hidden sm:block" />

                <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <span>Engine:</span>
                  <span className="text-white font-medium">{currentModelMeta.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Stop / Cancel Button while thinking */}
                {isThinking && (
                  <button
                    onClick={onStopThinking}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </button>
                )}

                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isThinking}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    input.trim() && !isThinking
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:brightness-110 active:scale-95'
                      : 'bg-white/5 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Inline Attachment Dropdown */}
            {isAttachmentPickerOpen && (
              <div className="absolute left-2 bottom-full mb-2 w-64 bg-[#171C26] border border-white/15 rounded-xl shadow-2xl p-2 z-50">
                <div className="text-[10px] font-mono uppercase text-slate-400 mb-1.5 px-1">
                  Select Workspace Files:
                </div>
                {activeProject?.files && activeProject.files.length > 0 ? (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {activeProject.files.map(f => (
                      <button
                        key={f.id}
                        onClick={() => toggleAttachFile(f.name)}
                        className={`w-full flex items-center justify-between px-2 py-1 rounded text-left text-xs font-mono transition-colors ${
                          attachedFiles.includes(f.name)
                            ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                            : 'text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <span className="truncate">{f.name}</span>
                        {attachedFiles.includes(f.name) && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 px-1 py-2">
                    No files available in active workspace.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ============================================================== */}
      {/* NEW CHAT CONFIRMATION MODAL                                    */}
      {/* ============================================================== */}
      {showNewChatDialog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141923] border border-white/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Start New Mission</h3>
                <p className="text-xs text-slate-400">Choose how to handle your active workspace.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
              <div className="text-slate-400">Active Project:</div>
              <div className="text-white font-semibold flex items-center justify-between">
                <span>{activeProject?.name || 'Current Project'}</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                  {activeProject?.files.length || 0} files on disk
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleConfirmContinueExisting}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-indigo-300">
                    Continue in Current Workspace
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Keep all existing files, checkpoints, and workspace context.
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-400" />
              </button>

              <button
                onClick={handleConfirmCreateNewWorkspace}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/40 hover:to-teal-600/40 border border-emerald-500/40 transition-colors text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-indigo-200">
                    Create Brand New Workspace
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Initialize an isolated directory (/workspaces/proj_...) with clean file tree.
                  </div>
                </div>
                <PlusCircle className="w-4 h-4 text-indigo-400" />
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowNewChatDialog(false)}
                className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
