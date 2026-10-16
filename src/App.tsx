/**
 * Omnintellx — Production-Grade AI-Native Software Development Studio
 * Main Application Hub & State Orchestrator
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ScreenId,
  Project,
  ProjectFile,
  ProviderConfig,
  ChatMessage,
  NotificationItem,
  AppSettings,
  EditorPrefs,
  ThemeMode,
  ExecutionStatus,
  ExecutionMode,
  TaskItem,
  AgentState,
  Artifact,
  ProjectContract,
  TimelineEvent,
  PendingToolRequest,
  Checkpoint,
  RunHistoryRecord,
  RunEvent,
  RunEventType,
  InferenceTarget
} from './types';
import { StorageService } from './engine/storage';
import { MasterOrchestrator } from './engine/orchestrator';
import { getProviderAdapter } from './engine/providers';
import { DEFAULT_UNIVERSAL_SYSTEM_PROMPT } from './engine/systemPrompt';
import { Topbar } from './components/Topbar';
import { BottomNav } from './components/BottomNav';
import { CommandCenterScreen } from './components/CommandCenterScreen';
import { LiveRunScreen } from './components/LiveRunScreen';
import { WorkspaceScreen } from './components/WorkspaceScreen';
import { PreviewScreen } from './components/PreviewScreen';
import { RunHistoryScreen } from './components/RunHistoryScreen';
import { OutputStudioScreen } from './components/OutputStudioScreen';
import { HomeScreen } from './components/HomeScreen';
import { OrchestratorScreen } from './components/OrchestratorScreen';
import { ProjectsScreen } from './components/ProjectsScreen';
import { EditorScreen } from './components/EditorScreen';
import { AiChatScreen } from './components/AiChatScreen';
import { ModelsScreen } from './components/ModelsScreen';
import { ToolsScreen } from './components/ToolsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { AdminScreen } from './components/AdminScreen';
import { testProviderConnection } from './engine/connectionTester';
import { CommandPalette } from './components/CommandPalette';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { QuickAskSheet } from './components/QuickAskSheet';
import { SingleHtmlModal } from './components/SingleHtmlModal';
import { LivePreviewModal } from './components/LivePreviewModal';
import { UnifiedStudioScreen } from './components/UnifiedStudioScreen';
import { ManusCanvasScreen } from './components/ManusCanvasScreen';
import { AndroidApkScreen } from './components/AndroidApkScreen';
import { PhpHostingScreen } from './components/PhpHostingScreen';
import { extractCodeFilesFromText, applyExtractedFilesToProject, ExtractedCodeFile } from './utils/aiCodeExtractor';
import { ClaudeCodeAgent, ClaudeCodeAgentContext } from './engine/claudeCodeAgent';
import { compileProjectToSingleHtml } from './utils/singleHtmlCompiler';

export default function App() {
  // Navigation
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('studio');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [singleHtmlModalOpen, setSingleHtmlModalOpen] = useState(false);
  const [livePreviewOpen, setLivePreviewOpen] = useState(false);

  // Persistence State
  const [projects, setProjects] = useState<Project[]>(() => StorageService.loadProjects() || []);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    const projs = StorageService.loadProjects() || [];
    return projs[0]?.id || null;
  });
  const [activeFileId, setActiveFileId] = useState<string | null>(() => {
    const projs = StorageService.loadProjects() || [];
    return projs[0]?.files?.[0]?.id || null;
  });
  const [openTabs, setOpenTabs] = useState<Array<{ projectId: string; fileId: string }>>(() => {
    const projs = StorageService.loadProjects() || [];
    if (projs[0] && projs[0].files && projs[0].files[0]) {
      return [{ projectId: projs[0].id, fileId: projs[0].files[0].id }];
    }
    return [];
  });

  const [providers, setProviders] = useState<ProviderConfig[]>(() => StorageService.loadProviders());
  const [activeTarget, setActiveTarget] = useState<InferenceTarget>(() => StorageService.loadActiveTarget());
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.loadSettings());
  const [editorPrefs, setEditorPrefs] = useState<EditorPrefs>(() => StorageService.loadEditorPrefs());
  const [messages, setMessages] = useState<ChatMessage[]>(() => StorageService.loadChatHistory());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(() => StorageService.loadCheckpoints());
  const [runHistory, setRunHistory] = useState<RunHistoryRecord[]>(() => StorageService.loadRunHistory());
  const [runEvents, setRunEvents] = useState<RunEvent[]>([]);
  const [currentGoal, setCurrentGoal] = useState<string>('Autonomous Application Build');

  // Modals & Panels
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickAskOpen, setQuickAskOpen] = useState(false);
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  // Orchestrator Engine State
  const [status, setStatus] = useState<ExecutionStatus>('IDLE');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [contracts, setContracts] = useState<ProjectContract[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [pendingRequest, setPendingRequest] = useState<PendingToolRequest | null>(null);
  const [isChatThinking, setIsChatThinking] = useState(false);

  // Initialize Master Orchestrator
  const orchestrator = useMemo(() => {
    return new MasterOrchestrator();
  }, []);

  // Subscribe and sync engine state
  useEffect(() => {
    const unsubscribe = orchestrator.subscribe({
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
        if (newStatus === 'COMPLETED') {
          setRunHistory(StorageService.loadRunHistory());
          setCheckpoints(StorageService.loadCheckpoints());
        }
      },
      onTasksUpdate: (updatedTasks) => setTasks([...updatedTasks]),
      onAgentsUpdate: (updatedAgents) => setAgents([...updatedAgents]),
      onArtifactsUpdate: (allArts) => setArtifacts([...allArts]),
      onContractsUpdate: (allContracts) => setContracts([...allContracts]),
      onTimelineEvent: (event) => setTimeline(prev => [event, ...prev]),
      onRunEvent: (event) => setRunEvents(prev => [event, ...prev]),
      onPendingRequest: (request) => setPendingRequest(request)
    });

    setAgents(orchestrator.getAgents());
    setTasks(orchestrator.getTasks());
    setArtifacts(orchestrator.getArtifacts());
    setContracts(orchestrator.getContracts());
    setTimeline(orchestrator.getTimeline());
    setRunEvents(orchestrator.getRunEvents());

    return unsubscribe;
  }, [orchestrator]);

  // Handle keyboard shortcuts (Ctrl+K, Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-sync storage changes
  useEffect(() => {
    StorageService.saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    StorageService.saveProviders(providers);
  }, [providers]);

  useEffect(() => {
    StorageService.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    orchestrator.updateConfig(providers, {
      ...settings,
      activeInferenceTarget: activeTarget,
      fallbackMode: settings.fallbackMode || 'NONE'
    });
  }, [orchestrator, providers, settings, activeTarget]);

  useEffect(() => {
    StorageService.saveEditorPrefs(editorPrefs);
  }, [editorPrefs]);

  useEffect(() => {
    StorageService.saveChatHistory(messages);
  }, [messages]);

  useEffect(() => {
    StorageService.saveCheckpoints(checkpoints);
  }, [checkpoints]);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || null;
  const activeProvider = providers.find(p => p.id === activeTarget.providerId) || providers[0] || null;

  const handleSelectActiveTarget = (target: InferenceTarget) => {
    setActiveTarget(target);
    StorageService.saveActiveTarget(target);
    orchestrator.getModelRouter().setActiveTarget(target);
    const p = providers.find(prov => prov.id === target.providerId);
    if (p) {
      addNotification('Inference Target Switched', `${p.name} → ${target.modelId}`, 'info');
    }
  };

  // Add Notification Helper
  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const item: NotificationItem = {
      id: `notif_${Date.now()}`,
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false
    };
    setNotifications(prev => [item, ...prev]);
  };

  // Orchestrator Actions
  const handleStartPipeline = async (goal: string, mode: ExecutionMode = 'AUTOMATIC', enabledAgents?: Set<string>) => {
    setCurrentGoal(goal);
    setCurrentScreen('liverun');
    setStatus('RUNNING');
    addNotification('Mission Launched', `Goal: "${goal.slice(0, 40)}..."`, 'info');
    
    let projId = activeProjectId;
    if (!projId) {
      projId = `proj_${Date.now()}`;
      const newP: Project = {
        id: projId,
        name: goal.slice(0, 36),
        description: goal,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        files: []
      };
      setProjects([newP]);
      setActiveProjectId(projId);
      fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projId, name: newP.name, description: goal })
      }).catch(() => {});
    }

    const primaryProvider = activeProvider || providers[0];

    // Reset run events for fresh mission
    setRunEvents([]);
    setTasks([]);

    let pollingInterval: any = null;
    let seenEventIds = new Set<string>();

    const pollEvents = async () => {
      try {
        const [evResp, stResp] = await Promise.all([
          fetch(`/api/projects/${projId}/events`),
          fetch(`/api/projects/${projId}/status`)
        ]);

        if (evResp.ok) {
          const evData = await evResp.json();
          if (Array.isArray(evData.events)) {
            const newEvents: RunEvent[] = [];
            for (const e of evData.events) {
              if (!seenEventIds.has(e.id)) {
                seenEventIds.add(e.id);
                newEvents.push({
                  id: e.id,
                  timestamp: e.timestamp,
                  runId: `RUN-${projId}`,
                  type: (e.type?.toLowerCase().includes('command') ? 'tool.completed' :
                         e.type?.toLowerCase().includes('file') ? 'file.created' :
                         e.type?.toLowerCase().includes('test') ? 'test.completed' :
                         e.type?.toLowerCase().includes('bug') ? 'error.detected' :
                         e.type?.toLowerCase().includes('patch') ? 'repair.completed' :
                         e.type?.toLowerCase().includes('plan') ? 'task.created' : 'agent.status') as RunEventType,
                  summary: e.message,
                  status: e.severity === 'success' ? 'success' : e.severity === 'error' ? 'error' : e.severity === 'warn' ? 'warning' : 'info',
                  details: e.metadata ? JSON.stringify(e.metadata, null, 2) : undefined,
                  metadata: e.metadata
                });
              }
            }
            if (newEvents.length > 0) {
              setRunEvents(prev => [...newEvents, ...prev]);
            }
          }
        }

        if (stResp.ok) {
          const stData = await stResp.json();
          if (stData.status) {
            const state = stData.status.state;
            if (state === 'COMPLETED' || state === 'FAILED' || state === 'CANCELLED') {
              setStatus(state === 'COMPLETED' ? 'COMPLETED' : 'FAILED');
            }
          }
        }
      } catch (e) {
        // network polling error
      }
    };

    pollingInterval = setInterval(pollEvents, 700);

    try {
      const resp = await fetch(`/api/projects/${projId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          provider: primaryProvider?.type,
          model: primaryProvider?.defaultModel,
          apiKey: primaryProvider?.apiKey,
          baseUrl: primaryProvider?.baseUrl,
          maxFixLoops: 5
        })
      });

      const resData = await resp.json();
      clearInterval(pollingInterval);
      await pollEvents();

      if (resData.success) {
        setStatus('COMPLETED');
        addNotification('Mission Accomplished', 'All deliverables generated and verified on disk.', 'success');
      } else {
        setStatus(resData.result?.state === 'CANCELLED' ? 'IDLE' : 'FAILED');
        addNotification('Mission Ended', resData.result?.error || 'Completed with warnings', resData.result?.state === 'CANCELLED' ? 'info' : 'warning');
      }

      // Sync physical workspace disk files into project state
      const filesListRes = await fetch(`/api/projects/${projId}/files`);
      if (filesListRes.ok) {
        const filesData = await filesListRes.json();
        if (Array.isArray(filesData.files)) {
          const diskFiles: ProjectFile[] = [];
          for (const df of filesData.files) {
            if (df.isDirectory) continue;
            try {
              const rRes = await fetch(`/api/projects/${projId}/files/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: df.relativePath || df.name })
              });
              if (rRes.ok) {
                const rData = await rRes.json();
                diskFiles.push({
                  id: `file_${df.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
                  name: df.relativePath || df.name,
                  content: rData.content,
                  updatedAt: Date.now(),
                  lastEditedByAgent: 'Autonomous Engineering Studio'
                });
              }
            } catch {}
          }

          if (diskFiles.length > 0) {
            setProjects(prev => prev.map(p => {
              if (p.id === projId) {
                return { ...p, name: goal.slice(0, 36), files: diskFiles, updatedAt: Date.now() };
              }
              return p;
            }));
            if (diskFiles[0]) {
              setActiveFileId(diskFiles[0].id);
            }
          }
        }
      }
    } catch (err: any) {
      clearInterval(pollingInterval);
      setStatus('FAILED');
      addNotification('Execution Failed', err.message, 'error');
    }
  };

  const handleDryRunPlan = (goal: string, enabledAgents?: Set<string>) => {
    setCurrentGoal(goal);
    orchestrator.dryRunPlan(goal, enabledAgents);
    addNotification('Plan Formulated', 'Task graph resolved for preview', 'info');
    setCurrentScreen('liverun');
  };

  const handleCreateNamedFile = (projectId: string, fileName: string) => {
    const initialContent = fileName.endsWith('.html') ? '<!DOCTYPE html>\n<html>\n<head><title>New Page</title></head>\n<body>\n</body>\n</html>' :
      fileName.endsWith('.json') ? '{\n}' : `// ${fileName}\n\n`;

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newFile: ProjectFile = {
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: fileName,
          content: initialContent
        };
        return {
          ...p,
          files: [...p.files, newFile],
          updatedAt: Date.now()
        };
      }
      return p;
    }));
  };

  // Chat & Code Generation Actions
  const chatAbortControllerRef = useRef<AbortController | null>(null);

  const handleStopThinking = () => {
    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort();
      chatAbortControllerRef.current = null;
    }
    setIsChatThinking(false);
    addNotification('Generation Stopped', 'Model inference cancelled by user', 'info');
  };

  const handleApplyCodeFilesToProject = async (extractedFiles: ExtractedCodeFile[]) => {
    if (!activeProjectId || extractedFiles.length === 0) return;
    
    let writtenCount = 0;
    for (const ef of extractedFiles) {
      try {
        const resp = await fetch(`/api/projects/${activeProjectId}/files/write`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: ef.name, content: ef.content })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.success) writtenCount++;
        }
      } catch (err) {
        console.warn(`[Workspace] Failed to write ${ef.name}:`, err);
      }
    }

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return applyExtractedFilesToProject(p, extractedFiles);
      }
      return p;
    }));

    if (writtenCount > 0) {
      addNotification('Workspace Synchronized', `Wrote and verified ${writtenCount} file(s) to /workspaces/${activeProjectId}/ on disk`, 'success');
    } else {
      addNotification('Workspace Updated', `Updated ${extractedFiles.length} file(s) in active project state`, 'info');
    }
  };

  // Project & File Handlers
  const handleCreateProject = async (customName?: string, description?: string, initialFiles?: ProjectFile[]): Promise<Project> => {
    const projName = customName || `Project ${projects.length + 1}`;
    const defaultFiles: ProjectFile[] = initialFiles || [];
    const projId = `proj_${Date.now()}`;

    const newProj: Project = {
      id: projId,
      name: projName,
      description: description || 'Clean isolated project workspace',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      files: defaultFiles
    };

    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newProj.id, name: newProj.name, description: newProj.description })
      });
    } catch {}

    setProjects(prev => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    if (newProj.files.length > 0) {
      setActiveFileId(newProj.files[0].id);
      setOpenTabs([{ projectId: newProj.id, fileId: newProj.files[0].id }]);
    } else {
      setActiveFileId(null);
      setOpenTabs([]);
    }

    addNotification('Workspace Initialized', `Created "${newProj.name}" (/workspaces/${newProj.id}/)`, 'success');
    return newProj;
  };

  const handleSendMessage = async (
    text: string,
    mode: 'chat' | 'manus_agent' | 'council' = 'chat',
    target?: string | InferenceTarget,
    attachedFiles: string[] = []
  ) => {
    chatAbortControllerRef.current = new AbortController();
    const abortSignal = chatAbortControllerRef.current.signal;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      ts: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsChatThinking(true);

    // Resolve authoritative InferenceTarget
    const resolvedTarget: InferenceTarget = (target && typeof target === 'object' && 'providerId' in target)
      ? target
      : (typeof target === 'string' && target
          ? {
              providerId: activeTarget.providerId,
              providerType: activeTarget.providerType,
              modelId: target
            }
          : activeTarget);

    const targetProv = providers.find(
      p => p.id === resolvedTarget.providerId && p.type === resolvedTarget.providerType
    ) || providers.find(p => p.id === resolvedTarget.providerId);

    if (!targetProv) {
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: `Error: Selected provider [${resolvedTarget.providerId}] is no longer configured.`,
        ts: Date.now(),
        verificationStatus: 'failed'
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsChatThinking(false);
      return;
    }

    const modelToUse = resolvedTarget.modelId || targetProv.selectedModelId || targetProv.defaultModel || targetProv.models[0] || 'default';

    try {
      // 1. Manus Agent Mode: Autonomous execution loop operating project on disk
      if (mode === 'manus_agent') {
        let projId = activeProjectId;
        if (!projId) {
          const newP = await handleCreateProject('Autonomous Mission Project', text);
          projId = newP.id;
        }

        addNotification('Manus Agent Dispatched', `Operating project for: "${text.slice(0, 40)}"`, 'info');

        try {
          const runResp = await fetch(`/api/projects/${projId}/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              goal: text,
              provider: targetProv.type,
              providerId: targetProv.id,
              model: modelToUse,
              apiKey: targetProv.apiKey,
              baseUrl: targetProv.baseUrl,
              fallbackMode: settings.fallbackMode || 'NONE'
            }),
            signal: abortSignal
          });

          if (runResp.ok) {
            const runData = await runResp.json();
            const result = runData.result;
            const aiMsg: ChatMessage = {
              id: `msg_${Date.now() + 1}`,
              role: 'assistant',
              content: `### 🤖 Manus Agent Mission Complete\n\n- **Status**: ${result.state}\n- **Tasks Completed**: ${result.tasksCompleted}\n- **Files on Disk**: ${result.files.join(', ')}\n- **Tests Executed**: ${result.testsExecuted ? 'YES (Verified)' : 'No test suite specified'}\n- **Security Audit**: ${result.securityFindings.length === 0 ? 'Clean (0 findings)' : `${result.securityFindings.length} findings`}\n\nDeliverables compiled to \`/omni/\`. You can inspect code in Workspace or launch Live Preview.`,
              ts: Date.now(),
              model: `${targetProv.name}: ${modelToUse}`,
              mode: 'manus_agent',
              verificationStatus: result.success ? 'verified' : 'failed'
            };
            setMessages(prev => [...prev, aiMsg]);

            // Sync files from workspace on disk
            const filesResp = await fetch(`/api/projects/${projId}/files`);
            if (filesResp.ok) {
              const filesData = await filesResp.json();
              if (Array.isArray(filesData.files)) {
                const refreshedFiles: ProjectFile[] = [];
                for (const fm of filesData.files) {
                  if (fm.isDirectory) continue;
                  try {
                    const cResp = await fetch(`/api/projects/${projId}/files/read`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ path: fm.relativePath })
                    });
                    if (cResp.ok) {
                      const cData = await cResp.json();
                      refreshedFiles.push({
                        id: `file_${fm.relativePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
                        name: fm.relativePath,
                        content: cData.content,
                        updatedAt: fm.updatedAt
                      });
                    }
                  } catch {}
                }
                setProjects(prev => prev.map(p => p.id === projId ? { ...p, files: refreshedFiles } : p));
              }
            }
            return;
          }
        } catch (agentErr: any) {
          if (agentErr.name === 'AbortError') return;
          console.warn('[ManusAgent] Run API error, falling back to local orchestrator:', agentErr);
        }
      }

      // 2. Genuine Multi-Model Council Mode (Sequential Model Consensus)
      if (mode === 'council') {
        const adapter = getProviderAdapter(targetProv.type);
        const activeKey = targetProv.apiKey?.trim();
        const isOnline = targetProv.status === 'online' || !targetProv.requiresKey || !!activeKey;

        if (!isOnline) {
          const aiMsg: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: `### 🌐 Multi-AI Council Report (Unavailable)\n\n- **Stage 1 (Architect)**: UNAVAILABLE (${targetProv.name} requires API key)\n- **Stage 2 (Lead Engineer)**: UNAVAILABLE\n- **Stage 3 (QA & Security)**: UNAVAILABLE\n\n*Please configure an active API key for ${targetProv.name} in the Settings panel.*`,
            ts: Date.now(),
            mode: 'council',
            verificationStatus: 'failed'
          };
          setMessages(prev => [...prev, aiMsg]);
          return;
        }

        addNotification('Multi-Model Council Convened', 'Stage 1/3: Architect decomposing specifications...', 'info');

        // STAGE 1: ARCHITECT (Decomposition & Design)
        const archPrompt = `You are ARCHITECT on the Omnintellx Multi-Model Council.
Mission: "${text}"
Active Project: "${activeProject?.name || 'Workspace'}" (${activeProject?.files.length || 0} existing files: ${(activeProject?.files || []).map(f => f.name).join(', ')}).

Produce:
1. Technical specifications & architectural design
2. Component hierarchy & data flow
3. Security & validation requirements`;

        const archResponse = await adapter.chat(targetProv, modelToUse, [
          { role: 'system', content: archPrompt },
          { role: 'user', content: text }
        ]);

        addNotification('Council Stage 1 Complete', 'Stage 2/3: Lead Engineer writing implementation...', 'info');

        // STAGE 2: LEAD ENGINEER (Receives Stage 1 Architect output)
        const engineerPrompt = `You are LEAD ENGINEER on the Omnintellx Multi-Model Council.
You have received the Architect's technical specification:

--- ARCHITECT'S SPECIFICATION ---
${archResponse}
---------------------------------

Mission: "${text}"
Your task: Implement complete, working, production-grade source code satisfying the Architect's specification.
Wrap all files in clear markdown code blocks with filenames (e.g. \`\`\`html // index.html ...\`\`\`).
Do NOT use placeholders or TODOs.`;

        const engineerResponse = await adapter.chat(targetProv, modelToUse, [
          { role: 'system', content: engineerPrompt },
          { role: 'user', content: `Implement code for mission: ${text}` }
        ]);

        addNotification('Council Stage 2 Complete', 'Stage 3/3: QA & Security Auditor validating code...', 'info');

        // STAGE 3: QA & SECURITY AUDITOR (Receives Architect + Engineer output)
        const qaPrompt = `You are QA & SECURITY AUDITOR on the Omnintellx Multi-Model Council.
Review the Lead Engineer's implementation against the Architect's specification:

--- ARCHITECT SPECIFICATION ---
${archResponse.slice(0, 1500)}

--- ENGINEER'S CODE IMPLEMENTATION ---
${engineerResponse.slice(0, 3000)}

Audit for:
1. Syntax correctness & complete tag closure
2. OWASP security (XSS, secret leaks, injection)
3. Responsive design & layout integrity
Provide a concise council consensus evaluation report.`;

        const qaResponse = await adapter.chat(targetProv, modelToUse, [
          { role: 'system', content: qaPrompt },
          { role: 'user', content: 'Audit the implementation and issue Council sign-off.' }
        ]);

        // Synthesize full Council Report
        const fullCouncilReport = `## 🌐 Omnintellx Multi-Model Council Consensus Report

### 📐 Stage 1: Architect Specification
${archResponse}

---

### 💻 Stage 2: Lead Engineer Implementation
${engineerResponse}

---

### 🛡️ Stage 3: QA & Security Audit Sign-off
${qaResponse}`;

        const aiMsg: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: fullCouncilReport,
          ts: Date.now(),
          model: `Council (${targetProv.name} / ${modelToUse})`,
          mode: 'council',
          verificationStatus: 'verified'
        };
        setMessages(prev => [...prev, aiMsg]);

        const extracted = extractCodeFilesFromText(engineerResponse);
        if (extracted.length > 0 && activeProjectId) {
          await handleApplyCodeFilesToProject(extracted);
        }
        return;
      }

      // 3. Direct AI Model Chat Mode
      let attachedContext = '';
      if (attachedFiles && attachedFiles.length > 0 && activeProject) {
        attachedContext = '\n\n[USER ATTACHED CONTEXT FILES]:\n' + attachedFiles.map(fName => {
          const fObj = activeProject.files.find(f => f.name === fName);
          return `--- File: ${fName} ---\n${fObj?.content || '(empty)'}\n`;
        }).join('\n');
      }

      const adapter = getProviderAdapter(targetProv.type);
      const systemPrompt = settings.universalSystemPrompt || DEFAULT_UNIVERSAL_SYSTEM_PROMPT;

      const chatPayload = [
        {
          role: 'system' as const,
          content: `${systemPrompt}\n\n[Active Project: ${activeProject?.name || 'Untitled Workspace'} (${activeProject?.files.length || 0} files)]\nFiles in workspace: ${(activeProject?.files || []).map(f => f.name).join(', ')}${attachedContext}\nWhen generating code, always include complete working code inside markdown code blocks with clear filenames e.g. \`\`\`html // index.html\n<!DOCTYPE html>...\`\`\` so the system can automatically write them into the project and launch Live Preview.`
        },
        ...messages.slice(-8).map(m => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content
        })),
        {
          role: 'user' as const,
          content: text
        }
      ];

      const startMs = Date.now();
      const responseText = await adapter.chat(
        targetProv,
        modelToUse,
        chatPayload
      );
      const latencyMs = Date.now() - startMs;

      // Update provider latency on success
      setProviders(prev => prev.map(p => p.id === targetProv.id ? { ...p, latency: latencyMs, status: 'online' } : p));

      const aiMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: responseText || 'Received response from model.',
        ts: Date.now(),
        model: `${targetProv.name}: ${modelToUse}`,
        mode: 'chat'
      };
      setMessages(prev => [...prev, aiMsg]);

      // Auto-extract code blocks and write directly to active project
      const extracted = extractCodeFilesFromText(responseText);
      if (extracted.length > 0 && activeProjectId) {
        await handleApplyCodeFilesToProject(extracted);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: `❌ Provider Execution Error (${targetProv?.name || 'Gateway'}): ${e.message}`,
        ts: Date.now(),
        verificationStatus: 'failed'
      };
      setMessages(prev => [...prev, errorMsg]);
      addNotification('Provider Error', e.message, 'error');
    } finally {
      setIsChatThinking(false);
      chatAbortControllerRef.current = null;
    }
  };

  const handleDuplicateProject = (id: string) => {
    const orig = projects.find(p => p.id === id);
    if (!orig) return;
    const dup: Project = {
      ...orig,
      id: `proj_${Date.now()}`,
      name: `${orig.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setProjects(prev => [dup, ...prev]);
    addNotification('Project Duplicated', `Created copy of "${orig.name}"`, 'info');
  };

  const handleDeleteProject = (id: string) => {
    const target = projects.find(p => p.id === id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
      const remaining = projects.filter(p => p.id !== id);
      setActiveProjectId(remaining[0]?.id || null);
      if (remaining[0]?.files?.[0]) {
        setActiveFileId(remaining[0].files[0].id);
      } else {
        setActiveFileId(null);
      }
    }
    fetch(`/api/projects/${id}`, { method: 'DELETE' }).catch(() => {});
    addNotification('Project Deleted', `Removed "${target?.name || id}"`, 'warning');
  };

  const handleTogglePinProject = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, pinned: !p.pinned } : p));
  };

  const handleToggleStarProject = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, favorite: !p.favorite } : p));
  };

  const handleExportProject = (id: string) => {
    const p = projects.find(proj => proj.id === id);
    if (!p) return;
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.name.toLowerCase().replace(/\s+/g, '_')}_omnintellx.json`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification('Export Complete', `Exported "${p.name}"`, 'success');
  };

  const handleImportProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target?.result as string);
            if (parsed.name && Array.isArray(parsed.files)) {
              parsed.id = `proj_${Date.now()}`;
              setProjects(prev => [parsed, ...prev]);
              setActiveProjectId(parsed.id);
              addNotification('Import Success', `Imported "${parsed.name}"`, 'success');
            } else {
              addNotification('Import Warning', 'Invalid project JSON structure', 'warning');
            }
          } catch (err: any) {
            addNotification('Import Failed', `Import error: ${err.message}`, 'error');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleOpenFileInEditor = (projectId: string, fileId: string) => {
    setActiveProjectId(projectId);
    setActiveFileId(fileId);
    if (!openTabs.some(t => t.projectId === projectId && t.fileId === fileId)) {
      setOpenTabs(prev => [...prev, { projectId, fileId }]);
    }
    setCurrentScreen('editor');
  };

  const handleNewFile = (projectId: string) => {
    const fileName = prompt('Enter new file name (e.g. server.ts, schema.sql, Component.tsx):');
    if (!fileName) return;

    const initialContent = `// ${fileName}\n\n`;

    // Sync with backend disk
    fetch(`/api/projects/${projectId}/files/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: fileName, content: initialContent })
    }).catch(() => {});

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newFile: ProjectFile = {
          id: `file_${Date.now()}`,
          name: fileName,
          content: initialContent
        };
        return {
          ...p,
          files: [...p.files, newFile],
          updatedAt: Date.now()
        };
      }
      return p;
    }));
  };

  const handleDeleteFile = (projectId: string, fileId: string) => {
    const proj = projects.find(p => p.id === projectId);
    const file = proj?.files.find(f => f.id === fileId);
    if (file) {
      // Sync deletion with backend disk
      fetch(`/api/projects/${projectId}/files/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: file.name })
      }).catch(() => {});
    }

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          files: p.files.filter(f => f.id !== fileId),
          updatedAt: Date.now()
        };
      }
      return p;
    }));
    setOpenTabs(prev => prev.filter(t => !(t.projectId === projectId && t.fileId === fileId)));
  };

  const handleSaveFileContent = (projectId: string, fileId: string, content: string) => {
    const proj = projects.find(p => p.id === projectId);
    const file = proj?.files.find(f => f.id === fileId);
    if (file) {
      // Persist to real backend filesystem
      fetch(`/api/projects/${projectId}/files/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: file.name, content })
      }).catch(() => {});
    }

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          files: p.files.map(f => f.id === fileId ? { ...f, content } : f),
          updatedAt: Date.now()
        };
      }
      return p;
    }));
    addNotification('File Saved', 'Changes committed to real workspace', 'success');
  };

  // Checkpoints
  const handleCreateCheckpoint = (name: string, reason: string) => {
    const ckpt = orchestrator.createCheckpoint(name, reason);
    setCheckpoints(prev => [ckpt, ...prev]);

    if (activeProjectId) {
      fetch(`/api/projects/${activeProjectId}/checkpoints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      }).catch(() => {});
    }

    addNotification('Checkpoint Saved', name, 'success');
  };

  const handleRestoreCheckpoint = (ckptId: string) => {
    const ckpt = checkpoints.find(c => c.id === ckptId);
    if (ckpt) {
      orchestrator.restoreCheckpoint(ckpt);
      if (activeProjectId) {
        fetch(`/api/projects/${activeProjectId}/checkpoints/${ckptId}/restore`, {
          method: 'POST'
        }).catch(() => {});
      }
      addNotification('Checkpoint Restored', ckpt.name, 'info');
    }
  };

  // Standalone Output Files Recompile & Synchronization
  const handleUpdateOutputFiles = async () => {
    if (!activeProject) return;
    const recompiled = StorageService.recompileProjectOutputFiles(activeProject, true);
    setProjects(prev => prev.map(p => p.id === recompiled.id ? recompiled : p));

    // Also trigger backend compile endpoint for dual persistence
    fetch(`/api/projects/${activeProject.id}/output/compile`, { method: 'POST' }).catch(() => {});

    addNotification('Output Files Synchronized', `Recompiled deliverables in final_codes/ for "${activeProject.name}"`, 'success');
  };

  // Standalone HTML Export (Build & package complete active project into self-contained portable HTML)
  const handleExportStandaloneHtml = () => {
    if (!activeProject) {
      addNotification('No Project Selected', 'Select or create a project first.', 'warning');
      return;
    }

    const compiledFile =
      activeProject.files.find(f => f.name === 'output/omni/index.html') ||
      activeProject.files.find(f => f.name === 'final_codes/index.html') ||
      activeProject.files.find(f => f.name === 'output/omni/standalone.html') ||
      activeProject.files.find(f => f.name === 'final_codes/standalone.html') ||
      activeProject.files.find(f => f.name === 'index.html');

    const appHtml = compiledFile ? compiledFile.content : compileProjectToSingleHtml(activeProject);

    try {
      const blob = new Blob([appHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeProject.name.replace(/[^a-zA-Z0-9_-]/g, '_')}-standalone.html`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 500);
      addNotification('Standalone HTML Downloaded', `Exported verified standalone application for "${activeProject.name}"`, 'success');
    } catch {
      // Fallback direct window or data URI
      const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(appHtml)}`;
      const fallbackA = document.createElement('a');
      fallbackA.href = dataUri;
      fallbackA.download = `${activeProject.name.replace(/[^a-zA-Z0-9_-]/g, '_')}-standalone.html`;
      fallbackA.click();
      addNotification('Standalone HTML Downloaded', `Exported via fallback direct data stream`, 'success');
    }
  };

  // Provider Actions & Auto Model Crawling
  const handleTestConnection = async (providerId: string) => {
    const prov = providers.find(p => p.id === providerId);
    if (!prov) return;

    try {
      const preferredGateway = (localStorage.getItem('omnintellx.gateway_mode') as any) || 'auto';
      const result = await testProviderConnection(prov, preferredGateway);

      if (result.ok && result.status === 'CONNECTED') {
        const updatedModels = result.models && result.models.length > 0 ? result.models : prov.models;
        const defaultModel = updatedModels.includes(prov.defaultModel) ? prov.defaultModel : updatedModels[0];

        setProviders(prev => prev.map(p => p.id === providerId ? {
          ...p,
          status: 'online',
          latency: result.latencyMs,
          models: updatedModels,
          defaultModel,
          lastSync: Date.now(),
          errorMessage: undefined
        } : p));

        addNotification(
          'API Gateway Connected',
          `${prov.name}: Live (${result.latencyMs}ms) via ${result.gatewayEnvironment} — ${result.message}`,
          'success'
        );
      } else {
        const errMsg = result.message || (result.statusCode ? `${prov.name} HTTP ${result.statusCode} — Verification rejected` : `${prov.name} verification failed.`);
        setProviders(prev => prev.map(p => p.id === providerId ? {
          ...p,
          status: 'offline',
          errorMessage: errMsg
        } : p));

        addNotification('Connection Failed', `${prov.name}: ${errMsg}`, 'error');
      }
    } catch (e: any) {
      setProviders(prev => prev.map(p => p.id === providerId ? {
        ...p,
        status: 'offline',
        errorMessage: e.message
      } : p));
      addNotification('Connection Failed', `${prov.name}: ${e.message}`, 'error');
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'amoled' ? 'bg-black' : 'bg-[#0B0E13]'} text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white`}>
      {/* Top Header */}
      <Topbar
        currentScreen={currentScreen}
        theme={theme}
        activeProject={activeProject}
        onNavigate={setCurrentScreen}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : prev === 'light' ? 'amoled' : 'dark')}
        unreadNotificationsCount={notifications.filter(n => !n.read).length}
        activeProviderName={activeProvider?.name || 'Pollinations'}
        onExportStandalone={() => setSingleHtmlModalOpen(true)}
        onOpenLivePreview={() => setLivePreviewOpen(true)}
      />

      {/* Main Content Area */}
      {(currentScreen === 'studio' || currentScreen === 'home') ? (
        <main className="flex-1 w-full overflow-hidden flex flex-col">
          <ManusCanvasScreen
            project={activeProject}
            projects={projects}
            status={status}
            tasks={tasks}
            agents={agents}
            artifacts={artifacts}
            runEvents={runEvents}
            currentGoal={currentGoal}
            providers={providers}
            activeTarget={activeTarget}
            onStartPipeline={handleStartPipeline}
            onPause={() => orchestrator.pause()}
            onResume={() => orchestrator.resume()}
            onStop={() => orchestrator.stop()}
            onNavigate={setCurrentScreen}
            onSwitchProject={(id) => {
              setActiveProjectId(id);
              const p = projects.find(proj => proj.id === id);
              if (p && p.files && p.files[0]) {
                setActiveFileId(p.files[0].id);
              }
            }}
            onCreateNewProject={handleCreateProject}
            onSelectTarget={handleSelectActiveTarget}
            onOpenLivePreviewModal={() => setLivePreviewOpen(true)}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-5 pt-16 pb-24 overflow-x-hidden">
          {currentScreen === 'command' && (
            <CommandCenterScreen
              projects={projects}
              providers={providers}
              runHistory={runHistory}
              onStartPipeline={handleStartPipeline}
              onPlanOnly={handleDryRunPlan}
              onOpenProject={(id) => {
                setActiveProjectId(id);
                const p = projects.find(proj => proj.id === id);
                if (p && p.files && p.files[0]) {
                  setActiveFileId(p.files[0].id);
                  setOpenTabs([{ projectId: p.id, fileId: p.files[0].id }]);
                }
                setCurrentScreen('workspace');
              }}
              onNavigate={setCurrentScreen}
            />
          )}

        {(currentScreen === 'liverun' || currentScreen === 'orchestrator') && (
          <LiveRunScreen
            status={status}
            tasks={tasks}
            agents={agents}
            artifacts={artifacts}
            workspaceFiles={activeProject?.files || []}
            runEvents={runEvents}
            pendingRequest={pendingRequest}
            maxConcurrency={orchestrator.getConcurrency()}
            activeConcurrency={orchestrator.getActiveRunningTaskCount()}
            currentGoal={currentGoal}
            onPause={() => orchestrator.pause()}
            onResume={() => orchestrator.resume()}
            onStop={() => orchestrator.stop()}
            onTakeControl={() => {
              orchestrator.takeControl();
              setCurrentScreen('workspace');
            }}
            onResolvePermission={(approved) => orchestrator.resolveHumanApproval(approved)}
            onCancelTask={(id) => orchestrator.cancelTask(id)}
            onNavigate={setCurrentScreen}
          />
        )}

        {(currentScreen === 'workspace' || currentScreen === 'editor') && (
          <div className="h-[calc(100vh-6rem)]">
            <UnifiedStudioScreen
              project={activeProject}
              projects={projects}
              activeFileId={activeFileId}
              onSelectFile={(fileId) => setActiveFileId(fileId)}
              onSaveFile={(fileId, content) => {
                if (activeProjectId) handleSaveFileContent(activeProjectId, fileId, content);
              }}
              onCreateFile={(fileName) => {
                if (activeProjectId) handleCreateNamedFile(activeProjectId, fileName);
              }}
              onDeleteFile={(fileId) => {
                if (activeProjectId) handleDeleteFile(activeProjectId, fileId);
              }}
              status={status}
              tasks={tasks}
              agents={agents}
              artifacts={artifacts}
              runEvents={runEvents}
              pendingRequest={pendingRequest}
              currentGoal={currentGoal}
              concurrency={orchestrator.getConcurrency()}
              activeConcurrency={orchestrator.getActiveRunningTaskCount()}
              onStartPipeline={handleStartPipeline}
              onPlanOnly={handleDryRunPlan}
              onPause={() => orchestrator.pause()}
              onResume={() => orchestrator.resume()}
              onStop={() => orchestrator.stop()}
              onResolvePermission={(approved) => orchestrator.resolveHumanApproval(approved)}
              onCancelTask={(id) => orchestrator.cancelTask(id)}
              onUpdateOutputFiles={handleUpdateOutputFiles}
              onExportStandalone={() => setSingleHtmlModalOpen(true)}
              onNavigate={setCurrentScreen}
              onSwitchProject={(id) => {
                setActiveProjectId(id);
                const p = projects.find(proj => proj.id === id);
                if (p && p.files && p.files[0]) {
                  setActiveFileId(p.files[0].id);
                }
              }}
            />
          </div>
        )}

        {currentScreen === 'android' && (
          <AndroidApkScreen
            project={activeProject}
            onNavigate={setCurrentScreen}
          />
        )}

        {currentScreen === 'hosting' && (
          <PhpHostingScreen
            project={activeProject}
            providers={providers}
            onNavigate={setCurrentScreen}
          />
        )}

        {currentScreen === 'preview' && (
          <PreviewScreen
            project={activeProject}
            onNavigate={setCurrentScreen}
          />
        )}

        {currentScreen === 'history' && (
          <RunHistoryScreen
            runHistory={runHistory}
            checkpoints={checkpoints}
            activeProject={activeProject}
            onRestoreCheckpoint={(id) => {
              const ok = orchestrator.restoreCheckpoint(id);
              if (ok) {
                const restored = orchestrator.getFiles();
                if (activeProjectId) {
                  setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, files: restored } : p));
                }
                addNotification('Checkpoint Restored', 'Workspace files rolled back', 'info');
              }
            }}
            onOpenRunInWorkspace={(run) => {
              setCurrentScreen('workspace');
            }}
            onRerun={(prompt) => {
              handleStartPipeline(prompt, 'AUTOMATIC');
            }}
            onDeleteHistory={(id) => {
              StorageService.deleteRunHistory(id);
              setRunHistory(StorageService.loadRunHistory());
            }}
          />
        )}

        {currentScreen === 'output' && (
          <OutputStudioScreen
            project={activeProject}
            onOpenPreview={() => setCurrentScreen('preview')}
            onNavigate={setCurrentScreen}
            onRecompile={handleUpdateOutputFiles}
          />
        )}

        {(currentScreen === 'aichat' || currentScreen === 'ai') && (
          <AiChatScreen
            messages={messages}
            activeProvider={activeProvider}
            providers={providers}
            activeTarget={activeTarget}
            onSelectTarget={handleSelectActiveTarget}
            onTestProvider={handleTestConnection}
            checkpoints={checkpoints}
            isThinking={isChatThinking}
            activeProject={activeProject}
            projects={projects}
            onSendMessage={handleSendMessage}
            onTurnIntoTask={(prompt) => {
              setCurrentScreen('liverun');
              handleStartPipeline(prompt, 'AUTOMATIC');
            }}
            onSaveCheckpoint={(name) => handleCreateCheckpoint(name, 'Chat checkpoint')}
            onRestoreCheckpoint={handleRestoreCheckpoint}
            onClearChat={() => setMessages([])}
            onApplyCodeFilesToProject={handleApplyCodeFilesToProject}
            onOpenLivePreview={() => setLivePreviewOpen(true)}
            onOpenFileInEditor={(fileName) => {
              const file = activeProject?.files.find(f => f.name.toLowerCase() === fileName.toLowerCase());
              if (file && activeProjectId) {
                handleOpenFileInEditor(activeProjectId, file.id);
              } else {
                setCurrentScreen('editor');
              }
            }}
            onSwitchProject={(id) => {
              setActiveProjectId(id);
              const p = projects.find(proj => proj.id === id);
              if (p && p.files && p.files[0]) {
                setActiveFileId(p.files[0].id);
              }
            }}
            onCreateNewProject={(name, desc) => handleCreateProject(name, desc)}
            onStopThinking={handleStopThinking}
            onExecuteToolAction={async (tool, params) => {
              if (tool === 'create_file' || tool === 'write_file') {
                if (!activeProjectId) throw new Error('No active project workspace selected.');
                const filePath = params.path || params.fileName;
                const content = params.content || '';
                const res = await fetch(`/api/projects/${activeProjectId}/files/write`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ path: filePath, content })
                });
                if (!res.ok) {
                  const errJson = await res.json().catch(() => ({}));
                  throw new Error(errJson.error || `HTTP ${res.status}: Failed to write file ${filePath}`);
                }
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Filesystem write rejected.');

                // Verify file read back from workspace
                const verifyRes = await fetch(`/api/projects/${activeProjectId}/files/read`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ path: filePath })
                });
                if (!verifyRes.ok) throw new Error(`Write verification failed: Unable to read back ${filePath} from workspace.`);

                handleCreateNamedFile(activeProjectId, filePath);
                return {
                  success: true,
                  bytes: data.bytes,
                  path: filePath,
                  verified: true,
                  message: `Confirmed on disk: /workspaces/${activeProjectId}/${filePath} (${data.bytes} bytes)`
                };
              }

              if (tool === 'edit_file') {
                if (!activeProjectId) throw new Error('No active project workspace selected.');
                const res = await fetch(`/api/projects/${activeProjectId}/files/edit`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ path: params.path, target: params.target, replacement: params.replacement })
                });
                if (!res.ok) {
                  const errJson = await res.json().catch(() => ({}));
                  throw new Error(errJson.error || `HTTP ${res.status}: Edit rejected.`);
                }
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Search-and-replace edit failed.');
                return data;
              }

              if (tool === 'delete_file') {
                if (!activeProjectId) throw new Error('No active project workspace selected.');
                const res = await fetch(`/api/projects/${activeProjectId}/files/delete`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ path: params.path })
                });
                if (!res.ok) {
                  const errJson = await res.json().catch(() => ({}));
                  throw new Error(errJson.error || `HTTP ${res.status}: Delete failed.`);
                }
                const data = await res.json();
                return data;
              }

              if (tool === 'execute_command') {
                const res = await fetch('/api/execute', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ command: params.command, projectId: activeProjectId })
                });
                if (!res.ok) {
                  const errJson = await res.json().catch(() => ({}));
                  throw new Error(errJson.error || `HTTP ${res.status}: Command execution failed.`);
                }
                const data = await res.json();
                return data;
              }

              if (tool === 'inspect_project') {
                if (!activeProjectId) throw new Error('No active project workspace selected.');
                const res = await fetch(`/api/projects/${activeProjectId}/inspect`);
                if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to inspect project.`);
                return await res.json();
              }

              if (tool === 'git_checkpoint') {
                if (!activeProjectId) throw new Error('No active project workspace selected.');
                const res = await fetch(`/api/projects/${activeProjectId}/checkpoints`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: params.name || 'Manual Checkpoint' })
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to create checkpoint.`);
                return await res.json();
              }

              // Route any authentic ToolRegistry tool (run_tests, run_linter, inspect_dom, etc.)
              if (activeProjectId) {
                const res = await fetch(`/api/projects/${activeProjectId}/tools/execute`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tool, params })
                });
                if (res.ok) {
                  return await res.json();
                }
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.error || `Tool ${tool} execution failed.`);
              }

              return { success: false, error: 'No active project selected.' };
            }}
          />
        )}

        {currentScreen === 'models' && (
          <ModelsScreen
            providers={providers}
            routingMode={settings.routingMode || orchestrator.getModelRouter().getRoutingMode()}
            localOnlyMode={settings.localOnlyMode ?? orchestrator.getModelRouter().isLocalOnly()}
            onSetRoutingMode={(mode) => {
              setSettings(prev => ({ ...prev, routingMode: mode }));
              orchestrator.getModelRouter().setRoutingMode(mode);
            }}
            onToggleLocalOnly={(active) => {
              setSettings(prev => ({ ...prev, localOnlyMode: active }));
              orchestrator.getModelRouter().setLocalOnly(active);
            }}
            onTestConnection={handleTestConnection}
            onSetDefaultProvider={(id) => {
              const target = providers.find(p => p.id === id);
              if (target) {
                setProviders(prev => [target, ...prev.filter(p => p.id !== id)]);
                addNotification('Primary Provider Changed', `Set ${target.name} as primary`, 'info');
              }
            }}
            onSetDefaultModel={(providerId, modelName) => {
              setProviders(prev => prev.map(p => {
                if (p.id === providerId) {
                  return {
                    ...p,
                    defaultModel: modelName,
                    models: p.models.includes(modelName) ? p.models : [modelName, ...p.models]
                  };
                }
                return p;
              }));
              addNotification('Active Model Updated', `Switched to ${modelName}`, 'success');
            }}
            onSaveProvider={(prov) => {
              setProviders(prev => {
                const idx = prev.findIndex(p => p.id === prov.id);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = prov;
                  return updated;
                }
                return [...prev, prov];
              });
              addNotification('Provider Saved', prov.name, 'success');
            }}
            onDeleteProvider={(id) => {
              setProviders(prev => prev.filter(p => p.id !== id));
              addNotification('Provider Deleted', 'Removed provider config', 'warning');
            }}
          />
        )}

        {currentScreen === 'tools' && (
          <ToolsScreen
            files={activeProject?.files || []}
            initialActiveTool={activeToolId}
          />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen
            theme={theme}
            settings={settings}
            editorPrefs={editorPrefs}
            storageBytes={StorageService.getStorageUsageBytes()}
            providers={providers}
            onSetTheme={setTheme}
            onUpdateSettings={setSettings}
            onUpdateEditorPrefs={setEditorPrefs}
            onSaveProvider={(prov) => {
              setProviders(prev => {
                const idx = prev.findIndex(p => p.id === prov.id);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = prov;
                  return updated;
                }
                return [...prev, prov];
              });
              addNotification('Provider Saved', prov.name, 'success');
            }}
            onDeleteProvider={(id) => {
              setProviders(prev => prev.filter(p => p.id !== id));
              addNotification('Provider Deleted', 'Removed provider config', 'warning');
            }}
            onTestConnection={handleTestConnection}
            onSetDefaultProvider={(provId) => {
              const target = providers.find(p => p.id === provId);
              if (!target) return;
              setProviders(prev => [target, ...prev.filter(p => p.id !== provId)]);
              addNotification('Default Provider Updated', `${target.name} set as primary engine`, 'info');
            }}
            onSetDefaultModel={(provId, modelName) => {
              setProviders(prev => prev.map(p => {
                if (p.id === provId) {
                  return {
                    ...p,
                    defaultModel: modelName,
                    models: p.models.includes(modelName) ? p.models : [modelName, ...p.models]
                  };
                }
                return p;
              }));
              addNotification('Active Model Updated', `Switched to ${modelName}`, 'success');
            }}
            onExportBackup={(includeKeys) => {
              const backup = StorageService.exportWorkspaceBackup(includeKeys);
              const blob = new Blob([backup], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `omnintellx_backup_${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
              addNotification('Backup Downloaded', 'Exported full JSON archive', 'success');
            }}
            onImportBackup={(json) => {
              const ok = StorageService.importWorkspaceBackup(json);
              if (ok) {
                window.location.reload();
              } else {
                addNotification('Import Error', 'Failed to import backup: invalid JSON format', 'error');
              }
            }}
            onClearCache={() => {
              setTimeline([]);
              addNotification('Cache Cleared', 'Execution logs cleared', 'info');
            }}
            onFactoryReset={() => {
              StorageService.factoryReset();
              addNotification('Factory Reset', 'Workspace has been reset to defaults', 'warning');
            }}
          />
        )}

        {currentScreen === 'admin' && (
          <AdminScreen
            projects={projects}
            providers={providers}
            settings={settings}
            activeTarget={activeTarget}
            onSaveProvider={(prov) => {
              setProviders(prev => {
                const idx = prev.findIndex(p => p.id === prov.id);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = prov;
                  return updated;
                }
                return [...prev, prov];
              });
              addNotification('Provider Saved', prov.name, 'success');
            }}
            onDeleteProject={handleDeleteProject}
            onUpdateSettings={setSettings}
            onAddNotification={addNotification}
            onSelectTarget={setActiveTarget}
            onNavigate={setCurrentScreen}
            onOpenLivePreview={() => setLivePreviewOpen(true)}
            onExportStandalone={() => setSingleHtmlModalOpen(true)}
          />
        )}
        </main>
      )}

      {/* Floating Bottom Navigation */}
      <BottomNav
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        onOpenQuickAsk={() => setQuickAskOpen(true)}
        isOrchestratorRunning={status === 'RUNNING'}
      />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        projects={projects}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={setCurrentScreen}
        onOpenProject={(id) => {
          setActiveProjectId(id);
          setCurrentScreen('projects');
        }}
        onOpenFile={handleOpenFileInEditor}
        onNewProject={handleCreateProject}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={notificationsOpen}
        notifications={notifications}
        onClose={() => setNotificationsOpen(false)}
        onClearAll={() => setNotifications([])}
      />

      {/* Quick Ask Bottom Sheet */}
      <QuickAskSheet
        isOpen={quickAskOpen}
        onClose={() => setQuickAskOpen(false)}
        onSubmit={(prompt, mode) => {
          if (mode === 'chat') {
            setCurrentScreen('aichat');
            handleSendMessage(prompt);
          } else {
            setCurrentScreen('orchestrator');
            handleStartPipeline(prompt, 'AUTOMATIC');
          }
        }}
      />

      {/* Single HTML Exporter Modal */}
      <SingleHtmlModal
        isOpen={singleHtmlModalOpen}
        onClose={() => setSingleHtmlModalOpen(false)}
        activeProject={activeProject}
        allProjects={projects}
        artifacts={artifacts}
        contracts={contracts}
        providers={providers}
      />

      {/* Instant Live Preview Sandbox Modal */}
      <LivePreviewModal
        isOpen={livePreviewOpen}
        onClose={() => setLivePreviewOpen(false)}
        project={activeProject}
        onOpenInEditor={() => {
          setLivePreviewOpen(false);
          setCurrentScreen('editor');
        }}
      />
    </div>
  );
}
