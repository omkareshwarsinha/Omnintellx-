/**
 * Omnintellx — Task Graph Engine
 * Topological dependency management, parallel branch dispatching, and dynamic repair loops.
 */

import { TaskItem, TaskStatus, TaskPriority } from '../types';

export class TaskGraphManager {
  private tasks: Map<string, TaskItem> = new Map();

  generateSoftwareProductionGraph(goal: string, enabledAgentIds?: Set<string>): TaskItem[] {
    this.tasks.clear();
    const now = Date.now();

    const isEnabled = (agentId: string) => {
      if (!enabledAgentIds) return true;
      return enabledAgentIds.has(agentId);
    };

    const allDefs: Array<{
      id: string;
      title: string;
      description: string;
      agentId: string;
      dependencies: string[];
      priority: TaskPriority;
    }> = [
      {
        id: 'TASK-PLAN',
        title: 'Project Requirements & Acceptance Criteria',
        description: `Interpret user request, define acceptance criteria, separate essentials: ${goal}`,
        agentId: 'agent_planner',
        dependencies: [],
        priority: 'high'
      },
      {
        id: 'TASK-ARCH',
        title: 'Simplest Suitable Architecture & File Contracts',
        description: 'Select simplest viable architecture, runtime assumptions, dependencies, and state contracts',
        agentId: 'agent_architect',
        dependencies: ['TASK-PLAN'],
        priority: 'critical'
      },
      {
        id: 'TASK-DESIGN',
        title: 'Consistent Visual System, Layout & Responsive Controls',
        description: 'Establish typographic hierarchy, touch-friendly layouts, color tokens, and 3D/animations',
        agentId: 'agent_designer',
        dependencies: ['TASK-ARCH'],
        priority: 'high'
      },
      {
        id: 'TASK-IMPL',
        title: 'Production Implementation & Working Code',
        description: 'Implement approved spec with clean, maintainable code; zero fake stubs; full functionality',
        agentId: 'agent_implementer',
        dependencies: ['TASK-DESIGN'],
        priority: 'critical'
      },
      {
        id: 'TASK-SEC',
        title: 'Security Audit & Credential Vulnerability Review',
        description: 'Inspect auth, secrets, dependencies, injection vectors, and ensure zero credential leaks',
        agentId: 'agent_security',
        dependencies: ['TASK-IMPL'],
        priority: 'high'
      },
      {
        id: 'TASK-QA',
        title: 'Independent Quality Review & Acceptance Verification',
        description: 'Validate against original criteria, check responsiveness, run real compiler & DOM tests',
        agentId: 'agent_reviewer',
        dependencies: ['TASK-SEC'],
        priority: 'critical'
      },
      {
        id: 'TASK-DELIVER',
        title: 'Verified Deliverable Packaging & Release Manifest',
        description: 'Compile verified production files to final_codes/, produce summary, and test report',
        agentId: 'agent_reviewer',
        dependencies: ['TASK-QA'],
        priority: 'critical'
      }
    ];

    // Filter by enabled agents and re-link dependencies
    const activeTasks: TaskItem[] = [];
    const activeTaskIds = new Set<string>();

    allDefs.forEach(def => {
      if (isEnabled(def.agentId)) {
        activeTaskIds.add(def.id);
      }
    });

    allDefs.forEach(def => {
      if (!isEnabled(def.agentId)) return;

      // Filter dependencies to only include active task IDs
      const validDeps = def.dependencies.filter(depId => activeTaskIds.has(depId));

      const taskItem: TaskItem = {
        id: def.id,
        title: def.title,
        description: def.description,
        status: 'QUEUED',
        priority: def.priority,
        agentId: def.agentId,
        dependencies: validDeps,
        inputs: {},
        producedArtifacts: [],
        attempt: 0,
        maxAttempts: 3,
        createdAt: now,
        updatedAt: now
      };

      activeTasks.push(taskItem);
      this.tasks.set(taskItem.id, taskItem);
    });

    return activeTasks;
  }

  getTask(id: string): TaskItem | undefined {
    return this.tasks.get(id);
  }

  getAllTasks(): TaskItem[] {
    return Array.from(this.tasks.values());
  }

  updateTaskStatus(id: string, status: TaskStatus, failureReason?: string): void {
    const t = this.tasks.get(id);
    if (t) {
      t.status = status;
      t.updatedAt = Date.now();
      if (failureReason) t.failureReason = failureReason;
    }
  }

  cancelTask(id: string): boolean {
    const t = this.tasks.get(id);
    if (t && (t.status === 'QUEUED' || t.status === 'WAITING')) {
      t.status = 'CANCELLED';
      t.updatedAt = Date.now();
      return true;
    }
    return false;
  }

  getExecutableTasks(): TaskItem[] {
    const all = this.getAllTasks();
    const completedIds = new Set(all.filter(t => t.status === 'COMPLETED').map(t => t.id));
    const cancelledIds = new Set(all.filter(t => t.status === 'CANCELLED').map(t => t.id));

    return all.filter(t => {
      if (t.status !== 'QUEUED' && t.status !== 'RETRYING') return false;
      // All dependencies must be either COMPLETED or CANCELLED
      return t.dependencies.every(depId => completedIds.has(depId) || cancelledIds.has(depId));
    });
  }

  createDynamicFixTask(originalTaskId: string, agentId: string, issuesSummary: string): TaskItem {
    const fixId = `TASK-FIX-${Date.now().toString(36).toUpperCase().slice(-4)}`;
    const fixTask: TaskItem = {
      id: fixId,
      parentId: originalTaskId,
      type: 'DEBUG_REPAIR',
      title: `Resolve Test & Validation Failures in ${originalTaskId}`,
      description: `Apply targeted patch for identified issues: ${issuesSummary}`,
      status: 'QUEUED',
      priority: 'critical',
      agentId: agentId || 'agent_debugger',
      dependencies: [],
      inputs: { issuesSummary },
      producedArtifacts: [],
      attempt: 1,
      maxAttempts: 3,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.tasks.set(fixId, fixTask);
    return fixTask;
  }

  isGraphComplete(): boolean {
    const all = this.getAllTasks();
    return all.length > 0 && all.every(t => t.status === 'COMPLETED' || t.status === 'CANCELLED');
  }

  hasFailedTasks(): boolean {
    return this.getAllTasks().some(t => t.status === 'FAILED');
  }
}
