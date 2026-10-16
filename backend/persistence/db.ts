import fs from 'fs';
import path from 'path';

export interface PersistedProject {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  workspacePath: string;
  config: Record<string, any>;
}

export interface PersistedRun {
  id: string;
  projectId: string;
  goal: string;
  status: string;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  metrics: {
    commandsExecuted: number;
    filesCreated: number;
    testsAttempted: number;
    fixIterations: number;
    tokensUsed: number;
  };
}

export interface PersistedEvent {
  id: string;
  projectId: string;
  timestamp: number;
  type: string;
  agentId?: string;
  taskId?: string;
  message: string;
  severity: string;
  metadata?: Record<string, any>;
}

export interface OmnintellxDatabaseSchema {
  projects: PersistedProject[];
  runs: PersistedRun[];
  events: PersistedEvent[];
  checkpoints: any[];
  artifacts: any[];
  permissions: any[];
  modelConfigs: any[];
}

export class OmnintellxDatabase {
  private static readonly DB_PATH = path.resolve(process.cwd(), 'workspaces', '.omnintellx_db.json');
  private static data: OmnintellxDatabaseSchema = {
    projects: [],
    runs: [],
    events: [],
    checkpoints: [],
    artifacts: [],
    permissions: [],
    modelConfigs: []
  };
  private static initialized = false;

  static init() {
    if (this.initialized) return;
    try {
      const dir = path.dirname(this.DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(this.DB_PATH)) {
        const raw = fs.readFileSync(this.DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.flush();
      }
      this.initialized = true;
    } catch {
      this.initialized = true;
    }
  }

  private static flush() {
    try {
      fs.writeFileSync(this.DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch {
      // ignore
    }
  }

  static getProjects(): PersistedProject[] {
    this.init();
    return this.data.projects;
  }

  static getProjectById(id: string): PersistedProject | undefined {
    this.init();
    return this.data.projects.find(p => p.id === id);
  }

  static saveProject(project: PersistedProject) {
    this.init();
    const idx = this.data.projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      this.data.projects[idx] = project;
    } else {
      this.data.projects.push(project);
    }
    this.flush();
  }

  static deleteProject(id: string) {
    this.init();
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    this.data.events = this.data.events.filter(e => e.projectId !== id);
    this.data.runs = this.data.runs.filter(r => r.projectId !== id);
    this.flush();
  }

  static addEvent(event: PersistedEvent) {
    this.init();
    this.data.events.unshift(event);
    if (this.data.events.length > 500) {
      this.data.events.pop();
    }
    this.flush();
  }

  static getEvents(projectId?: string): PersistedEvent[] {
    this.init();
    if (projectId) {
      return this.data.events.filter(e => e.projectId === projectId);
    }
    return this.data.events;
  }

  static saveRun(run: PersistedRun) {
    this.init();
    const idx = this.data.runs.findIndex(r => r.id === run.id);
    if (idx >= 0) {
      this.data.runs[idx] = run;
    } else {
      this.data.runs.unshift(run);
    }
    this.flush();
  }

  static getRuns(projectId?: string): PersistedRun[] {
    this.init();
    if (projectId) {
      return this.data.runs.filter(r => r.projectId === projectId);
    }
    return this.data.runs;
  }

  static saveCheckpointMeta(ckpt: any) {
    this.init();
    this.data.checkpoints.unshift(ckpt);
    this.flush();
  }

  static getCheckpoints(projectId?: string): any[] {
    this.init();
    if (projectId) {
      return this.data.checkpoints.filter(c => c.projectId === projectId);
    }
    return this.data.checkpoints;
  }
}
