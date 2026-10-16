/**
 * Omnintellx — Persistent Structured Mission State
 * Governs the dynamic state machine across understanding, inspection, planning, action selection,
 * real tool execution, observation, evaluation, failure diagnosis, replanning, verification, and delivery.
 */

export type MissionPhase =
  | 'IDLE'
  | 'UNDERSTANDING'
  | 'INSPECTING'
  | 'PLANNING'
  | 'EXECUTING'
  | 'OBSERVING'
  | 'DEBUGGING'
  | 'REPLANNING'
  | 'VERIFYING'
  | 'DELIVERING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PAUSED'
  | 'CANCELLED';

export interface DynamicObjective {
  id: string;
  title: string;
  description: string;
  targetFiles: string[];
  dependencies: string[];
  verificationCriteria: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  attempts: number;
}

export interface FailedActionRecord {
  tool: string;
  params: any;
  error: string;
  timestamp: number;
  step: number;
}

export interface ObservationRecord {
  step: number;
  tool: string;
  input: any;
  success: boolean;
  output: any;
  error?: string;
  durationMs: number;
  timestamp: number;
}

export interface RecoveryAttempt {
  timestamp: number;
  failureContext: string;
  diagnosis: string;
  strategy: string;
  patchedFiles: string[];
  success: boolean;
}

export interface StructuredMissionState {
  missionId: string;
  projectId: string;
  goal: string;
  requirements: string[];
  constraints: string[];
  phase: MissionPhase;
  currentStep: number;
  maxSteps: number;
  workspace: {
    path: string;
    fileCount: number;
    totalBytes: number;
    framework: string;
    entryPoints: string[];
  };
  objectives: DynamicObjective[];
  currentObjectiveId?: string;
  completedObjectiveIds: string[];
  failedActions: FailedActionRecord[];
  observations: ObservationRecord[];
  testResults: {
    executed: boolean;
    passed: boolean;
    command?: string;
    output: string;
    timestamp?: number;
  };
  buildResults: {
    executed: boolean;
    passed: boolean;
    output: string;
    timestamp?: number;
  };
  browserResults: {
    checked: boolean;
    passed: boolean;
    domValid: boolean;
    consoleErrors: string[];
  };
  securityResults: {
    checked: boolean;
    vulnerabilitiesCount: number;
    findings: any[];
  };
  checkpoints: string[];
  recoveryHistory: RecoveryAttempt[];
  verificationGates: {
    buildPassed: boolean;
    testsPassed: boolean;
    linterPassed: boolean;
    runtimeValid: boolean;
    securityPassed: boolean;
  };
}

export class MissionStateManager {
  private static states: Map<string, StructuredMissionState> = new Map();

  static initialize(projectId: string, goal: string, maxSteps = 30): StructuredMissionState {
    const state: StructuredMissionState = {
      missionId: `mission_${Date.now()}`,
      projectId,
      goal,
      requirements: [],
      constraints: ['Production quality', 'Zero fake execution', 'Real runnable source'],
      phase: 'UNDERSTANDING',
      currentStep: 0,
      maxSteps,
      workspace: {
        path: '',
        fileCount: 0,
        totalBytes: 0,
        framework: 'unknown',
        entryPoints: []
      },
      objectives: [],
      completedObjectiveIds: [],
      failedActions: [],
      observations: [],
      testResults: { executed: false, passed: false, output: '' },
      buildResults: { executed: false, passed: false, output: '' },
      browserResults: { checked: false, passed: false, domValid: false, consoleErrors: [] },
      securityResults: { checked: false, vulnerabilitiesCount: 0, findings: [] },
      checkpoints: [],
      recoveryHistory: [],
      verificationGates: {
        buildPassed: false,
        testsPassed: false,
        linterPassed: false,
        runtimeValid: false,
        securityPassed: false
      }
    };

    this.states.set(projectId, state);
    return state;
  }

  static get(projectId: string): StructuredMissionState | undefined {
    return this.states.get(projectId);
  }

  static update(projectId: string, updates: Partial<StructuredMissionState>): StructuredMissionState {
    const existing = this.states.get(projectId) || this.initialize(projectId, '');
    const merged = { ...existing, ...updates };
    this.states.set(projectId, merged);
    return merged;
  }

  static addObservation(projectId: string, obs: ObservationRecord) {
    const state = this.states.get(projectId);
    if (state) {
      state.observations.push(obs);
      if (!obs.success) {
        state.failedActions.push({
          tool: obs.tool,
          params: obs.input,
          error: obs.error || 'Execution failed',
          timestamp: obs.timestamp,
          step: obs.step
        });
      }
    }
  }

  static markObjectiveComplete(projectId: string, objectiveId: string) {
    const state = this.states.get(projectId);
    if (state) {
      if (!state.completedObjectiveIds.includes(objectiveId)) {
        state.completedObjectiveIds.push(objectiveId);
      }
      const obj = state.objectives.find(o => o.id === objectiveId);
      if (obj) {
        obj.status = 'COMPLETED';
      }
    }
  }
}
