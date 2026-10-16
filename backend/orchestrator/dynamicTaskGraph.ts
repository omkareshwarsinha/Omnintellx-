/**
 * Omnintellx — Dynamic Task DAG Engine
 * Non-linear, evidence-driven task dependency graph.
 * Tasks are generated from the mission and current workspace evidence,
 * can be dynamically expanded, merged, or reprioritized during execution.
 */

import { DynamicObjective } from './missionState';
import { ModelService } from '../models/modelService';

export class DynamicTaskGraph {
  /**
   * Synthesize initial task DAG based on mission and workspace inspection
   */
  static async planMissionDAG(options: {
    mission: string;
    workspaceFiles: string[];
    framework: string;
    entryPoints: string[];
    provider: string;
    model: string;
    apiKey?: string;
    baseUrl?: string;
  }): Promise<DynamicObjective[]> {
    const { mission, workspaceFiles, framework, entryPoints, provider, model, apiKey, baseUrl } = options;

    const systemPrompt = `You are the Lead Systems Architect in Omnintellx Autonomous Software Studio.
Analyze the software mission and the current workspace evidence.
Construct a Dynamic Task DAG (Directed Acyclic Graph) of objectives to fulfill the mission.
CRITICAL RULES:
- DO NOT use hardcoded boilerplate templates.
- Tailor the tasks specifically to the user's software mission (e.g. 3D WebGL, CLI utility, REST API, bug fix, refactor, data processing).
- If existing files exist, formulate inspection and surgical repair/extension tasks rather than blind recreation.
- Each task must have a clear objective, target files, dependencies, and verification criteria.

Respond with ONLY a JSON array of objectives:
[
  {
    "id": "task-1",
    "title": "Title of objective",
    "description": "Concrete technical work required",
    "targetFiles": ["path/to/file1.ext"],
    "dependencies": [],
    "verificationCriteria": "Command or observable condition to verify completion"
  }
]`;

    const userPrompt = `MISSION: "${mission}"
WORKSPACE EVIDENCE:
- Existing Files: ${workspaceFiles.join(', ') || 'None (Empty directory)'}
- Detected Framework: ${framework}
- Entry points: ${entryPoints.join(', ') || 'None'}

Synthesize the dynamic task graph now:`;

    try {
      const response = await ModelService.chatStructured<DynamicObjective[]>({
        provider,
        model,
        apiKey,
        baseUrl,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });

      if (Array.isArray(response) && response.length > 0) {
        return response.map((item, idx) => ({
          id: item.id || `task-${idx + 1}`,
          title: item.title || `Task ${idx + 1}`,
          description: item.description || item.title || '',
          targetFiles: Array.isArray(item.targetFiles) ? item.targetFiles : [],
          dependencies: Array.isArray(item.dependencies) ? item.dependencies : [],
          verificationCriteria: item.verificationCriteria || 'file exists and syntax valid',
          status: 'PENDING',
          attempts: 0
        }));
      }
    } catch (err: any) {
      console.warn('[TaskDAG] Dynamic plan synthesis failed:', err.message);
    }

    // Dynamic heuristic synthesis based on goal tokens (never static demo templates)
    const isPython = mission.toLowerCase().includes('python') || mission.toLowerCase().includes('.py');
    const isNode = mission.toLowerCase().includes('node') || mission.toLowerCase().includes('express');
    const is3D = mission.toLowerCase().includes('3d') || mission.toLowerCase().includes('three') || mission.toLowerCase().includes('webgl');

    if (isPython) {
      return [
        {
          id: 'task-1',
          title: 'Implement Core Python Module',
          description: 'Construct primary logic and functions',
          targetFiles: ['main.py'],
          dependencies: [],
          verificationCriteria: 'python3 main.py --help || test -f main.py',
          status: 'PENDING',
          attempts: 0
        },
        {
          id: 'task-2',
          title: 'Write Unit Tests',
          description: 'Construct unittest or pytest suite',
          targetFiles: ['test_main.py'],
          dependencies: ['task-1'],
          verificationCriteria: 'python3 -m unittest discover -s .',
          status: 'PENDING',
          attempts: 0
        },
        {
          id: 'task-3',
          title: 'Project Documentation & Contract',
          description: 'Create usage documentation and technical specification',
          targetFiles: ['README.md'],
          dependencies: ['task-2'],
          verificationCriteria: 'test -f README.md',
          status: 'PENDING',
          attempts: 0
        }
      ];
    }

    return [
      {
        id: 'task-1',
        title: is3D ? 'Implement 3D Scene Architecture & Renderer' : 'Construct Core Application Entrypoint',
        description: is3D ? 'Setup Three.js/WebGL canvas, camera, lighting, and animation loop' : 'Create semantic HTML5 layout and container structure',
        targetFiles: ['index.html'],
        dependencies: [],
        verificationCriteria: 'test -f index.html',
        status: 'PENDING',
        attempts: 0
      },
      {
        id: 'task-2',
        title: is3D ? 'Implement 3D Meshes, Shaders & Controls' : 'Implement Core Logic & State Machine',
        description: is3D ? 'Add interactive 3D assets, orbit controls, and interaction handlers' : 'Implement interactive logic, events, and dynamic DOM updates',
        targetFiles: ['main.js'],
        dependencies: ['task-1'],
        verificationCriteria: 'test -f main.js',
        status: 'PENDING',
        attempts: 0
      },
      {
        id: 'task-3',
        title: 'Styling, Aesthetics & Responsive Viewport',
        description: 'Implement dark modern styling, typography, and mobile responsive layout',
        targetFiles: ['styles.css'],
        dependencies: ['task-2'],
        verificationCriteria: 'test -f styles.css',
        status: 'PENDING',
        attempts: 0
      },
      {
        id: 'task-4',
        title: 'Project Documentation & Verification',
        description: 'Document architecture, controls, and verify complete production readiness',
        targetFiles: ['README.md'],
        dependencies: ['task-3'],
        verificationCriteria: 'test -f README.md',
        status: 'PENDING',
        attempts: 0
      }
    ];
  }

  /**
   * Find next actionable objective whose dependencies are all satisfied
   */
  static getNextExecutableObjective(
    objectives: DynamicObjective[],
    completedIds: string[]
  ): DynamicObjective | undefined {
    return objectives.find(
      obj =>
        obj.status !== 'COMPLETED' &&
        obj.status !== 'SKIPPED' &&
        obj.dependencies.every(depId => completedIds.includes(depId))
    );
  }

  /**
   * Inject a dynamic repair/subtask when an unexpected failure occurs
   */
  static injectSubtask(
    objectives: DynamicObjective[],
    subtask: { title: string; description: string; targetFiles: string[]; verification: string }
  ): DynamicObjective {
    const newId = `subtask-${Date.now()}`;
    const newObj: DynamicObjective = {
      id: newId,
      title: subtask.title,
      description: subtask.description,
      targetFiles: subtask.targetFiles,
      dependencies: [],
      verificationCriteria: subtask.verification,
      status: 'PENDING',
      attempts: 0
    };
    objectives.unshift(newObj);
    return newObj;
  }
}
