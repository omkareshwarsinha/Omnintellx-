/**
 * Omnintellx — Context Manager
 * Multi-layer memory architecture: Project Memory, Task Memory, Agent Memory.
 * Assembles selective, high-density context per task type without repository bloat.
 */

import { AgentDefinition, Artifact, ProjectFile } from '../types';

export interface AssembledContext {
  systemPrompt: string;
  projectMemory: string;
  taskMemory: string;
  agentMemory: string;
  relevantArtifacts: { type: string; title: string; excerpt: string }[];
  relevantFiles: { name: string; content: string }[];
  estimatedTokens: number;
}

export class ContextManager {
  static assembleContext(
    agent: AgentDefinition,
    userGoal: string,
    allArtifacts: Artifact[],
    workspaceFiles: ProjectFile[],
    taskHistorySummary: string = ''
  ): AssembledContext {
    // 1. Filter relevant artifacts based on agent inputs
    const relevantArtifacts: { type: string; title: string; excerpt: string }[] = [];
    for (const art of allArtifacts) {
      if (agent.inputs.includes(art.type) || agent.inputs.includes('*')) {
        relevantArtifacts.push({
          type: art.type,
          title: art.title,
          excerpt: art.content.length > 2500 ? art.content.slice(0, 2500) + '\n... [truncated]' : art.content
        });
      }
    }

    // 2. Selectively pick relevant files according to role
    const relevantFiles: { name: string; content: string }[] = [];
    for (const file of workspaceFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (agent.role === 'FRONTEND_ENGINEER' || agent.role === 'UX_UI_DESIGNER') {
        if (['html', 'css', 'tsx', 'jsx', 'ts', 'js'].includes(ext)) {
          relevantFiles.push({ name: file.name, content: file.content });
        }
      } else if (agent.role === 'DATABASE_ENGINEER') {
        if (['sql', 'prisma', 'json', 'ts', 'kt'].includes(ext)) {
          relevantFiles.push({ name: file.name, content: file.content });
        }
      } else if (agent.role === 'SECURITY_ENGINEER' || agent.role === 'TEST_ENGINEER' || agent.role === 'CODE_REVIEWER') {
        relevantFiles.push({ name: file.name, content: file.content.length > 3000 ? file.content.slice(0, 3000) + '\n... [truncated]' : file.content });
      } else if (agent.role === 'IMPLEMENTATION_AGENT') {
        relevantFiles.push({ name: file.name, content: file.content });
      }
    }

    // 3. Project Memory summary
    const projectMemory = `=== PROJECT GOAL ===\n${userGoal}\n=== AVAILABLE ARTIFACTS COUNT: ${allArtifacts.length} ===`;

    // 4. Task Memory
    const taskMemory = taskHistorySummary || 'No previous execution errors logged.';

    // 5. Agent Memory
    const agentMemory = `Agent Role: ${agent.name} (${agent.title})\nAllowed Tools: ${agent.allowedTools.join(', ') || 'None'}\nForbidden Tools: ${agent.forbiddenTools.join(', ') || 'None'}`;

    const totalChars =
      agent.systemPrompt.length +
      projectMemory.length +
      taskMemory.length +
      agentMemory.length +
      relevantArtifacts.reduce((acc, a) => acc + a.excerpt.length, 0) +
      relevantFiles.reduce((acc, f) => acc + f.content.length, 0);

    const estimatedTokens = Math.ceil(totalChars / 4);

    return {
      systemPrompt: agent.systemPrompt,
      projectMemory,
      taskMemory,
      agentMemory,
      relevantArtifacts,
      relevantFiles,
      estimatedTokens
    };
  }
}
