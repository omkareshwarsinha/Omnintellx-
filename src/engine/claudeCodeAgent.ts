/**
 * Omnintellx — Autonomous Code & Codex Agent
 * Empowers AI with full workspace control: creating projects, restoring versions/checkpoints,
 * writing/deleting files, switching models, executing pipelines, and launching previews.
 */

import { Project, ProjectFile, Checkpoint, ProviderConfig, AppSettings } from '../types';
import { compileProjectToSingleHtml } from '../utils/singleHtmlCompiler';

export interface AgentActionLog {
  id: string;
  tool: string;
  params: Record<string, any>;
  status: 'executing' | 'success' | 'failed';
  output?: string;
  timestamp: number;
}

export interface ClaudeCodeAgentContext {
  projects: Project[];
  activeProjectId: string | null;
  activeProject: Project | null;
  checkpoints: Checkpoint[];
  providers: ProviderConfig[];
  activeProviderId: string;
  settings: AppSettings;
  // Execution Handlers
  onCreateProject: (name: string, description?: string, files?: ProjectFile[]) => Project;
  onSwitchProject: (projectId: string) => void;
  onWriteFile: (fileName: string, content: string) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onCreateCheckpoint: (name: string, reason: string) => Checkpoint;
  onRestoreCheckpoint: (checkpointId: string) => void;
  onSetProvider: (providerId: string) => void;
  onSetModel: (modelName: string) => void;
  onOpenPreview: () => void;
  onStartOrchestrator: (goal: string) => void;
}

export interface AgentExecutionResult {
  message: string;
  actions: AgentActionLog[];
  filesCreatedOrUpdated: string[];
  suggestedPreview: boolean;
}

export class ClaudeCodeAgent {
  /**
   * Main Autonomous Execution Entrypoint
   * Analyzes prompt intent, executes system actions, and generates dynamic code
   */
  public static async executeAutonomousPrompt(
    prompt: string,
    context: ClaudeCodeAgentContext
  ): Promise<AgentExecutionResult> {
    const p = prompt.trim();
    const lower = p.toLowerCase();
    const actions: AgentActionLog[] = [];
    const filesCreatedOrUpdated: string[] = [];
    let suggestedPreview = false;

    // ----------------------------------------------------------------
    // 1. SYSTEM CONTROL: Project Creation / Management
    // ----------------------------------------------------------------
    if (lower.startsWith('create project') || lower.startsWith('new project') || lower.includes('create a new project')) {
      const match = p.match(/(?:create|new)\s+(?:a\s+)?project\s+(?:called|named)?\s*["']?([^"'\n\.,]+)["']?/i);
      const projectName = match ? match[1].trim() : 'New Autonomous Project';

      const newProj = context.onCreateProject(projectName, `Created autonomously for: "${prompt}"`);
      actions.push({
        id: `ACT-${Date.now()}-1`,
        tool: 'create_project',
        params: { name: projectName },
        status: 'success',
        output: `Created new project "${newProj.name}" (ID: ${newProj.id}) and activated workspace.`,
        timestamp: Date.now()
      });

      return {
        message: `### ⚡ Project Initialized\n\n- **Project Created**: \`${projectName}\`\n- **Workspace ID**: \`${newProj.id}\`\n- **Status**: Workspace ready for your engineering goals.`,
        actions,
        filesCreatedOrUpdated,
        suggestedPreview: false
      };
    }

    // ----------------------------------------------------------------
    // 2. SYSTEM CONTROL: Checkpoints & Version Restoration
    // ----------------------------------------------------------------
    if (lower.includes('restore version') || lower.includes('restore checkpoint') || lower.includes('revert to checkpoint') || lower.includes('rollback')) {
      if (context.checkpoints.length === 0) {
        return {
          message: `No saved checkpoints found in project history to restore. You can create a checkpoint at any time by asking "create checkpoint <name>".`,
          actions,
          filesCreatedOrUpdated,
          suggestedPreview: false
        };
      }

      const targetCheckpoint = context.checkpoints[0];
      context.onRestoreCheckpoint(targetCheckpoint.id);

      actions.push({
        id: `ACT-${Date.now()}-chk`,
        tool: 'restore_checkpoint',
        params: { checkpointId: targetCheckpoint.id, name: targetCheckpoint.name },
        status: 'success',
        output: `Restored workspace files from snapshot "${targetCheckpoint.name}".`,
        timestamp: Date.now()
      });

      return {
        message: `### ⏪ Version Restored Successfully\n\n- **Snapshot**: \`${targetCheckpoint.name}\`\n- **Timestamp**: ${new Date(targetCheckpoint.ts).toLocaleString()}\n- **Files Restored**: ${targetCheckpoint.snapshotFiles.length} files restored to workspace.`,
        actions,
        filesCreatedOrUpdated: targetCheckpoint.snapshotFiles.map(f => f.name),
        suggestedPreview: true
      };
    }

    if (lower.includes('create checkpoint') || lower.includes('save checkpoint') || lower.includes('make checkpoint') || lower.includes('save version')) {
      const match = p.match(/(?:checkpoint|version)\s*(?:named|called)?\s*["']?([^"'\n]+)["']?/i);
      const chkName = match ? match[1].trim() : `Manual Checkpoint (${new Date().toLocaleTimeString()})`;

      const chk = context.onCreateCheckpoint(chkName, `Created via autonomous prompt: "${prompt}"`);
      actions.push({
        id: `ACT-${Date.now()}-chk`,
        tool: 'create_checkpoint',
        params: { name: chkName },
        status: 'success',
        output: `Created checkpoint snapshot "${chk.name}" with ${chk.snapshotFiles.length} files.`,
        timestamp: Date.now()
      });

      return {
        message: `Created checkpoint snapshot **${chk.name}** with ${chk.snapshotFiles.length} files securely saved in version history.`,
        actions,
        filesCreatedOrUpdated,
        suggestedPreview: false
      };
    }

    // ----------------------------------------------------------------
    // 3. SYSTEM CONTROL: Model & Provider Switching
    // ----------------------------------------------------------------
    if (lower.includes('switch to') || lower.includes('use model') || lower.includes('set model') || lower.includes('change model')) {
      if (lower.includes('deepseek') || lower.includes('r1')) {
        context.onSetModel('deepseek-r1');
        actions.push({ id: `ACT-${Date.now()}-m`, tool: 'set_model', params: { model: 'deepseek-r1' }, status: 'success', output: 'Active model set to DeepSeek R1', timestamp: Date.now() });
        return { message: `Switched active reasoning model to **DeepSeek R1**.`, actions, filesCreatedOrUpdated, suggestedPreview: false };
      } else if (lower.includes('claude') || lower.includes('sonnet')) {
        context.onSetModel('claude-3-7-sonnet');
        actions.push({ id: `ACT-${Date.now()}-m`, tool: 'set_model', params: { model: 'claude-3-7-sonnet' }, status: 'success', output: 'Active model set to Claude 3.7 Sonnet', timestamp: Date.now() });
        return { message: `Switched active reasoning model to **Claude 3.7 Sonnet**.`, actions, filesCreatedOrUpdated, suggestedPreview: false };
      } else if (lower.includes('gemini')) {
        context.onSetModel('gemini-flash-latest');
        actions.push({ id: `ACT-${Date.now()}-m`, tool: 'set_model', params: { model: 'gemini-flash-latest' }, status: 'success', output: 'Active model set to Gemini Flash Latest', timestamp: Date.now() });
        return { message: `Switched active model to **Google Gemini Flash Latest**.`, actions, filesCreatedOrUpdated, suggestedPreview: false };
      }
    }

    // ----------------------------------------------------------------
    // 4. SYSTEM CONTROL: Launch Full Autonomous Pipeline / Orchestrator
    // ----------------------------------------------------------------
    if (lower.startsWith('run pipeline') || lower.startsWith('start pipeline') || lower.startsWith('build ') || lower.startsWith('create ') || lower.startsWith('make ')) {
      context.onStartOrchestrator(p);
      actions.push({
        id: `ACT-${Date.now()}-orch`,
        tool: 'start_pipeline',
        params: { goal: p },
        status: 'success',
        output: `Launched autonomous engineering pipeline for: "${p}".`,
        timestamp: Date.now()
      });

      return {
        message: `### 🚀 Autonomous Mission Launched\n\n- **Mission**: "${p}"\n- **Control System**: Manus/OpenHands stateful agent loop active\n- **Roles**: Orchestrator, Planner, Coder, Debugger, Reviewer, Release\n- **Execution**: Physical workspace operations on disk with real verification.`,
        actions,
        filesCreatedOrUpdated,
        suggestedPreview: true
      };
    }

    // ----------------------------------------------------------------
    // 5. OUTPUT RECOMPILATION
    // ----------------------------------------------------------------
    if (lower.includes('compile output') || lower.includes('update output') || lower.includes('generate output') || lower.includes('recompile')) {
      const activeProj = context.activeProject;
      if (!activeProj || activeProj.files.length === 0) {
        return {
          message: `Workspace contains no source files yet to compile into deliverables. Create your application files first!`,
          actions,
          filesCreatedOrUpdated,
          suggestedPreview: false
        };
      }

      const hasHtml = activeProj.files.some(f => f.name.endsWith('.html'));
      if (hasHtml) {
        const flagshipHtml = compileProjectToSingleHtml(activeProj);
        context.onWriteFile('output/index.html', flagshipHtml);
        context.onWriteFile('output/standalone.html', flagshipHtml);
        filesCreatedOrUpdated.push('output/index.html', 'output/standalone.html');
      }

      const manifestContent = JSON.stringify({
        buildTarget: 'omnintellx_production_deliverable',
        project: activeProj.name,
        timestamp: new Date().toISOString(),
        files: activeProj.files.map(f => f.name)
      }, null, 2);

      context.onWriteFile('output/build-manifest.json', manifestContent);
      filesCreatedOrUpdated.push('output/build-manifest.json');

      if (activeProj.id) {
        fetch(`/api/projects/${activeProj.id}/output/compile`, { method: 'POST' }).catch(() => {});
      }

      return {
        message: `### ⚡ Output Deliverables Recompiled\n\n- Generated standalone bundle in \`output/\` based on actual project files.\n- Manifest synchronized.`,
        actions,
        filesCreatedOrUpdated,
        suggestedPreview: true
      };
    }

    // ----------------------------------------------------------------
    // 6. DEFAULT: Delegate to Master Orchestrator for Real Autonomous Coding
    // ----------------------------------------------------------------
    context.onStartOrchestrator(p);
    return {
      message: `Initiating autonomous software engineering pipeline for: "${p}". Inspecting workspace and planning implementation...`,
      actions,
      filesCreatedOrUpdated,
      suggestedPreview: true
    };
  }
}
