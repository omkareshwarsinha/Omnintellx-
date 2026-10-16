/**
 * Omnintellx — Types & Architecture Interfaces
 * Production-grade AI-Native Multi-Agent Software Development Environment
 */

export type ScreenId =
  | 'studio'
  | 'command'
  | 'liverun'
  | 'workspace'
  | 'preview'
  | 'verification'
  | 'history'
  | 'settings'
  | 'output'
  | 'home'
  | 'orchestrator'
  | 'editor'
  | 'projects'
  | 'ai'
  | 'aichat'
  | 'models'
  | 'tools'
  | 'admin'
  | 'android'
  | 'hosting';

export type ThemeMode = 'dark' | 'amoled' | 'light' | 'system';

export type RoutingMode = 'AUTO' | 'MANUAL' | 'MIXED';

export type ExecutionMode = 'AUTOMATIC' | 'MANUAL' | 'MIXED';

export type OrchestrationMode = 'autonomous' | 'collaborative' | 'guarded';
export type ApprovalPolicy = 'auto' | 'ask_risky' | 'ask_delivery';
export type BudgetTier = 'lightweight' | 'balanced' | 'maximum';

export interface OrchestrationSettings {
  mode: OrchestrationMode;
  concurrency: number; // 1 to 16
  maxRetries: 1 | 2 | 3 | 5;
  approvalPolicy: ApprovalPolicy;
  budget: BudgetTier;
  taskTimeoutSec: number;
  autoSelectAgents: boolean;
  enabledAgents: Record<string, boolean>;
}

export type ExecutionStatus = 'IDLE' | 'PLANNING' | 'RUNNING' | 'PAUSED' | 'WAITING_PERMISSION' | 'HUMAN_TAKEOVER' | 'COMPLETED' | 'FAILED';

// ----------------------------------------------------
// Providers & Models
// ----------------------------------------------------
export type ProviderType =
  | 'pollinations'
  | 'openrouter'
  | 'openai'
  | 'gemini'
  | 'groq'
  | 'cerebras'
  | 'ollama'
  | 'deepseek'
  | 'anthropic'
  | 'mistral'
  | 'together'
  | 'grok'
  | 'custom';

export type ProviderHealth = 'online' | 'offline' | 'untested' | 'authentication_failed' | 'rate_limited' | 'quota_exhausted' | 'model_unavailable' | 'timeout';

export type FallbackMode = 'NONE' | 'AUTO' | 'EXPLICIT_CHAIN';

export interface InferenceTarget {
  providerId: string;
  providerType: ProviderType;
  modelId: string;
}

export class ProviderExecutionError extends Error {
  providerId: string;
  providerType: string;
  modelId: string;
  statusCode?: number;
  causeError?: any;

  constructor(opts: {
    providerId: string;
    providerType: string;
    modelId: string;
    message: string;
    statusCode?: number;
    cause?: any;
  }) {
    super(opts.message);
    this.name = 'ProviderExecutionError';
    this.providerId = opts.providerId;
    this.providerType = opts.providerType;
    this.modelId = opts.modelId;
    this.statusCode = opts.statusCode;
    this.causeError = opts.cause;
  }
}

export interface InferenceTelemetry {
  taskId?: string;
  agentId?: string;
  providerId: string;
  providerType: ProviderType;
  providerName: string;
  modelId: string;
  routingMode: RoutingMode;
  fallbackUsed: boolean;
  fallbackProviderId?: string;
  fallbackModelId?: string;
  startedAt: number;
  durationMs: number;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}

export interface ModelCapabilities {
  contextLength?: number;
  vision?: boolean;
  toolCalling?: boolean;
  structuredOutput?: boolean;
  streaming?: boolean;
  reasoning?: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  capabilities: ModelCapabilities;
  isSpecialized?: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl?: string;
  apiKey?: string;
  models: string[];
  defaultModel: string;
  selectedModelId?: string;
  status: ProviderHealth;
  latency?: number | null;
  lastSync?: number | null;
  requestCount?: number;
  errorMessage?: string;
  isLocalOnly?: boolean;
}

export interface ProviderStatePersistence {
  version: number;
  providers: ProviderConfig[];
  activeInferenceTarget: InferenceTarget;
  routingMode: RoutingMode;
  fallbackMode: FallbackMode;
}

export interface ProviderAdapter {
  testConnection(config: ProviderConfig): Promise<{ ok: boolean; latency: number; error?: string; models?: string[] }>;
  listModels(config: ProviderConfig): Promise<ModelInfo[]>;
  chat(config: ProviderConfig, model: string, messages: ChatMessagePayload[], options?: { temperature?: number; jsonMode?: boolean }): Promise<string>;
}

export interface ChatMessagePayload {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ----------------------------------------------------
// Agent Runtime
// ----------------------------------------------------
export type AgentRoleType =
  | 'PROJECT_PLANNER'
  | 'TECHNICAL_ARCHITECT'
  | 'DESIGN_SPECIALIST'
  | 'IMPLEMENTATION_SPECIALIST'
  | 'DEBUGGING_SPECIALIST'
  | 'SECURITY_SPECIALIST'
  | 'QUALITY_REVIEWER'
  | 'ARCHITECT'
  | 'PLANNER'
  | 'FRONTEND_ENGINEER'
  | 'BACKEND_ENGINEER'
  | 'DATABASE_ENGINEER'
  | 'RESEARCHER'
  | 'QA_ENGINEER'
  | 'DEBUGGER'
  | 'SECURITY_REVIEWER'
  | 'UX_REVIEWER'
  | 'DOCUMENTATION'
  | 'RELEASE_ENGINEER'
  | 'PRODUCT_MANAGER'
  | 'REQUIREMENTS_ANALYST'
  | 'UX_UI_DESIGNER'
  | 'API_BACKEND_ARCHITECT'
  | 'IMPLEMENTATION_AGENT'
  | 'TEST_ENGINEER'
  | 'SECURITY_ENGINEER'
  | 'CODE_REVIEWER'
  | 'RELEASE_DELIVERY_AGENT'
  | 'CUSTOM';

export type AgentStatus =
  | 'WAITING'
  | 'PLANNING'
  | 'WORKING'
  | 'TESTING'
  | 'BLOCKED'
  | 'FAILED'
  | 'RETRYING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'QUEUED'
  | 'EXECUTING'
  | 'WAITING_FOR_INPUT'
  | 'WAITING_FOR_PERMISSION'
  | 'VERIFYING';

export interface AgentDefinition {
  id: string;
  name: string;
  role: AgentRoleType;
  title: string;
  avatarColor: string;
  systemPrompt: string;
  allowedTools: ToolType[];
  forbiddenTools: ToolType[];
  preferredModelTrait: 'reasoning' | 'coding' | 'security' | 'vision' | 'fast';
  inputs: string[];
  outputs: ArtifactType[];
}

export interface AgentState {
  id: string;
  definitionId: string;
  name: string;
  role: AgentRoleType;
  assignedModel: string;
  currentTaskId?: string;
  status: AgentStatus;
  progressPercent: number;
  currentAction: string;
  tokensUsed: number;
  lastActive: number;
  findings: string[];
}

// ----------------------------------------------------
// Task Graph & Management
// ----------------------------------------------------
export type TaskStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'WAITING'
  | 'BLOCKED'
  | 'FAILED'
  | 'RETRYING'
  | 'COMPLETED'
  | 'CANCELLED';

export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

export interface TaskItem {
  id: string;
  parentId?: string;
  type?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  agentId: string;
  modelId?: string;
  dependencies: string[];
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  producedArtifacts: string[];
  attempt: number;
  maxAttempts: number;
  createdAt: number;
  updatedAt: number;
  failureReason?: string;
  retryPolicy?: {
    backoffMs: number;
    fallbackProvider?: string;
  };
}

// ----------------------------------------------------
// Artifacts & Canonical Contracts
// ----------------------------------------------------
export type ArtifactType =
  | 'PRD'
  | 'REQUIREMENTS'
  | 'ARCHITECTURE'
  | 'DESIGN_SYSTEM'
  | 'API_CONTRACT'
  | 'DATABASE_SCHEMA'
  | 'IMPLEMENTATION_PLAN'
  | 'CODE'
  | 'TEST_PLAN'
  | 'TEST_REPORT'
  | 'SECURITY_REPORT'
  | 'CODE_REVIEW'
  | 'RELEASE_REPORT';

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  version: number;
  authorAgentId: string;
  taskId: string;
  dependencies: string[];
  schema?: string;
  content: string;
  structuredData?: Record<string, any>;
  status: 'draft' | 'validated' | 'deprecated' | 'rejected';
  createdAt: number;
  updatedAt: number;
}

export interface ProjectContract {
  id: string;
  type: 'API_CONTRACT' | 'DATABASE_CONTRACT' | 'UI_CONTRACT' | 'PROJECT_CONVENTIONS' | 'NAMING_CONVENTIONS';
  title: string;
  version: number;
  content: string;
  rules: string[];
  canonicalKeys: Record<string, string>;
  updatedAt: number;
}

// ----------------------------------------------------
// Tool Gateway & Permissions
// ----------------------------------------------------
export type ToolType =
  | 'read_file'
  | 'search_code'
  | 'write_file'
  | 'patch_file'
  | 'create_file'
  | 'delete_file'
  | 'execute_command'
  | 'run_test'
  | 'run_linter'
  | 'run_security_scan'
  | 'git_status'
  | 'git_diff'
  | 'git_checkpoint'
  | 'http_request'
  | 'ask_user'
  | 'request_permission';

export type PermissionDecision = 'ALLOW' | 'ASK' | 'DENY';

export interface PendingToolRequest {
  id: string;
  agentId: string;
  agentName: string;
  taskId: string;
  tool: ToolType;
  params: Record<string, any>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  timestamp: number;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
}

export interface ToolExecutionResult {
  ok: boolean;
  output: any;
  error?: string;
  executionMode: 'REAL' | 'SIMULATED' | 'UNAVAILABLE';
}

// ----------------------------------------------------
// Omnintellx 10 Orchestration Rules
// ----------------------------------------------------
export interface OrchestrationRule {
  id: number;
  name: string;
  rule: string;
  description: string;
  enforced: boolean;
  category: 'ROUTING' | 'CONTEXT' | 'STATE' | 'CONCURRENCY' | 'SECURITY' | 'VERIFICATION' | 'DELIVERY';
}

export const OMNINTELLX_ORCHESTRATION_RULES: OrchestrationRule[] = [
  {
    id: 1,
    name: 'Need-Based Specialist Routing',
    rule: 'Route tasks to only the specialists needed.',
    description: 'Dynamic task dispatching activates only required specialist agents per mission stage.',
    enforced: true,
    category: 'ROUTING'
  },
  {
    id: 2,
    name: 'Context & Acceptance Passing',
    rule: 'Pass relevant project context and acceptance criteria between stages.',
    description: 'Structured memory guarantees downstream specialists receive requirements, specs, and criteria.',
    enforced: true,
    category: 'CONTEXT'
  },
  {
    id: 3,
    name: 'Authoritative Project State',
    rule: 'Keep one authoritative project state.',
    description: 'Workspace files and dynamic DAG maintain a single coherent source of truth without split-brain.',
    enforced: true,
    category: 'STATE'
  },
  {
    id: 4,
    name: 'Concurrency Overwrite Prevention',
    rule: 'Prevent conflicting agents from independently overwriting the same files.',
    description: 'File-level mutex and dependency sequencing block simultaneous clashing modifications.',
    enforced: true,
    category: 'CONCURRENCY'
  },
  {
    id: 5,
    name: 'Destructive Action Approval Gate',
    rule: 'Require approval before destructive changes or major architecture changes.',
    description: 'File deletions, resets, and contract overhauls trigger human-in-the-loop permission requests.',
    enforced: true,
    category: 'SECURITY'
  },
  {
    id: 6,
    name: 'Real Tool Verification (No Inventions)',
    rule: 'Use available tools to execute tests; never invent test results.',
    description: 'Compiler checks, syntax linting, and DOM sandboxes run real execution tools with genuine outputs.',
    enforced: true,
    category: 'VERIFICATION'
  },
  {
    id: 7,
    name: 'Bounded Debugging Loop',
    rule: 'Stop repeated debugging loops after a configurable limit and report the remaining issue.',
    description: 'Strict fix loop limit prevents runaway retries; surfaces honest diagnostics when unresolved.',
    enforced: true,
    category: 'VERIFICATION'
  },
  {
    id: 8,
    name: 'Complete Deliverable Manifest',
    rule: 'Deliver source files, test results, known limitations, and a concise change summary.',
    description: 'Every run produces verified deliverables in final_codes/ with manifest and validation reports.',
    enforced: true,
    category: 'DELIVERY'
  },
  {
    id: 9,
    name: 'Isolated Provider Routing',
    rule: 'Keep API-provider routing isolated according to the user\'s selected provider configuration.',
    description: 'Honors selected model and provider strictly without unexpected cross-vendor leakages.',
    enforced: true,
    category: 'ROUTING'
  },
  {
    id: 10,
    name: 'Zero Secret Exposure',
    rule: 'Never expose secrets in logs, generated frontend code, or project exports.',
    description: 'Static security scanners sanitize API keys, environment tokens, and private credentials.',
    enforced: true,
    category: 'SECURITY'
  }
];

// ----------------------------------------------------
// Workspace Projects & Files
// ----------------------------------------------------
export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  updatedAt?: number;
  pinned?: boolean;
  lastEditedByAgent?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  favorite?: boolean;
  files: ProjectFile[];
  activeContractId?: string;
}

export interface Checkpoint {
  id: string;
  name: string;
  ts: number;
  timestamp?: number;
  projectId?: string;
  snapshotFiles: ProjectFile[];
  files?: ProjectFile[];
  artifacts: Artifact[];
  taskGraphSummary?: string;
  authorAgentId?: string;
  reason: string;
  tasks?: any[];
  contracts?: any[];
  timelineEvents?: any[];
}

// ----------------------------------------------------
// Observability & Activity
// ----------------------------------------------------
export type EventSeverity = 'info' | 'success' | 'warn' | 'error' | 'security';

export interface TimelineEvent {
  id: string;
  timestamp: number;
  taskId?: string;
  agentId?: string;
  agentName?: string;
  type: string;
  message: string;
  severity: EventSeverity;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  ts: number;
  pinned?: boolean;
  taskId?: string;
  agentId?: string;
  model?: string;
  mode?: 'chat' | 'manus_agent' | 'council';
  toolCalls?: Array<{
    id: string;
    tool: string;
    params: any;
    status: 'running' | 'success' | 'failed';
    output?: string;
    durationMs?: number;
  }>;
  verificationStatus?: 'verified' | 'unverified' | 'failed';
  error?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  projectId?: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface NotificationItem {
  id: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'security';
  kind?: 'ok' | 'info' | 'warn' | 'err' | 'security';
  title: string;
  message?: string;
  detail?: string;
  timestamp?: number;
  ts?: number;
  read: boolean;
}

export interface EditorPrefs {
  fontFamily: string;
  fontSize: number;
  tabSize: number;
  indentStyle: 'spaces' | 'tabs';
  cursorStyle: 'line' | 'block';
  autoSave: boolean;
  wordWrap: boolean;
  lineNumbers: boolean;
}

export interface AppSettings {
  animations: boolean;
  reducedEffects: boolean;
  reducedMotion: boolean;
  toasts: boolean;
  activityLog: boolean;
  localOnlyMode: boolean;
  routingMode: RoutingMode;
  fallbackMode?: FallbackMode;
  activeInferenceTarget?: InferenceTarget;
  autoCheckpoint: boolean;
  maxFixLoops: number;
  universalSystemPrompt?: string;
  orchestration?: OrchestrationSettings;
}

// ----------------------------------------------------
// Live Run Events & Run History
// ----------------------------------------------------
export type RunEventType =
  | 'run.created'
  | 'run.started'
  | 'agent.started'
  | 'agent.status'
  | 'agent.completed'
  | 'agent.failed'
  | 'agent.retrying'
  | 'task.created'
  | 'task.started'
  | 'task.completed'
  | 'tool.started'
  | 'tool.completed'
  | 'file.created'
  | 'file.updated'
  | 'file.deleted'
  | 'test.started'
  | 'test.completed'
  | 'error.detected'
  | 'repair.started'
  | 'repair.completed'
  | 'review.started'
  | 'review.completed'
  | 'run.paused'
  | 'run.resumed'
  | 'run.stopped'
  | 'run.completed';

export interface RunEvent {
  id: string;
  timestamp: number;
  runId: string;
  taskId?: string;
  agentId?: string;
  agentName?: string;
  type: RunEventType;
  summary: string;
  status: 'info' | 'success' | 'warning' | 'error' | 'security';
  details?: string;
  metadata?: Record<string, any>;
}

export interface RunHistoryRecord {
  id: string;
  runId: string;
  projectId: string;
  projectName: string;
  prompt: string;
  timestamp: number;
  durationMs: number;
  provider: string;
  model: string;
  agentsUsed: string[];
  taskCount: number;
  filesChanged: number;
  testsExecuted: number;
  testsPassed: number;
  testsFailed: number;
  errors: string[];
  finalStatus: 'COMPLETED' | 'FAILED' | 'STOPPED';
  checkpointsCreated: number;
}

export interface FileDiffRecord {
  fileName: string;
  beforeContent: string;
  afterContent: string;
  agentName: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected';
}

