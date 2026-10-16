/**
 * Omnintellx — Specialist Agent Orchestration
 * Inspired by msitarzewski/agency-agents
 * 
 * Mission:
 * Generate functional, responsive, maintainable software through controlled specialist roles.
 * Prioritize correctness, usability, security, and verified results over impressive but broken demonstrations.
 * 
 * 7 Specialist Roles:
 * 1. Project Planner
 * 2. Technical Architect
 * 3. Design Specialist
 * 4. Implementation Specialist
 * 5. Debugging Specialist
 * 6. Security Specialist
 * 7. Independent Quality Reviewer
 */

import { AgentDefinition } from '../types';

export const INITIAL_AGENT_TEAM: AgentDefinition[] = [
  {
    id: 'agent_planner',
    name: 'Project Planner',
    role: 'PROJECT_PLANNER',
    title: 'Requirements, Constraints & Scope Synthesizer',
    avatarColor: '#3B82F6',
    preferredModelTrait: 'reasoning',
    allowedTools: ['read_file', 'search_code', 'ask_user'],
    forbiddenTools: ['write_file', 'delete_file', 'execute_command'],
    inputs: ['user_mission', 'workspace_context'],
    outputs: ['PRD', 'REQUIREMENTS', 'IMPLEMENTATION_PLAN'],
    systemPrompt: `You are the Project Planner in Omnintellx Specialist Agent Orchestration.
Mission & Rules:
- Interpret the user's request with precision.
- Identify requirements, constraints, expected behavior, and acceptance criteria.
- Ask questions only when essential information is missing.
- Separate essential requirements from optional enhancements.
- Produce structured requirements and acceptance criteria before implementation begins.`
  },
  {
    id: 'agent_architect',
    name: 'Technical Architect',
    role: 'TECHNICAL_ARCHITECT',
    title: 'System Blueprint, Runtime & Contract Strategist',
    avatarColor: '#6366F1',
    preferredModelTrait: 'reasoning',
    allowedTools: ['read_file', 'search_code', 'git_status', 'git_diff'],
    forbiddenTools: ['delete_file', 'execute_command'],
    inputs: ['REQUIREMENTS', 'IMPLEMENTATION_PLAN', 'workspace_state'],
    outputs: ['ARCHITECTURE', 'API_CONTRACT', 'DATABASE_SCHEMA'],
    systemPrompt: `You are the Technical Architect in Omnintellx Specialist Agent Orchestration.
Mission & Rules:
- Select the simplest suitable architecture.
- Identify required files, dependencies, APIs, and runtime assumptions.
- Preserve compatibility with the user's existing project.
- Never replace a working architecture without explaining why.
- Enforce strict single-source-of-truth project state.`
  },
  {
    id: 'agent_designer',
    name: 'Design Specialist',
    role: 'DESIGN_SPECIALIST',
    title: 'Visual Systems, Responsive Layouts & 3D Spatial Director',
    avatarColor: '#EC4899',
    preferredModelTrait: 'vision',
    allowedTools: ['read_file', 'search_code', 'write_file', 'patch_file'],
    forbiddenTools: ['delete_file'],
    inputs: ['ARCHITECTURE', 'REQUIREMENTS'],
    outputs: ['DESIGN_SYSTEM'],
    systemPrompt: `You are the Design Specialist in Omnintellx Specialist Agent Orchestration.
Mission & Rules:
- Produce a consistent visual system.
- Prioritize responsive layouts, readable typography, accessibility, and usable controls.
- Support modern animation and genuine interactive 3D where appropriate.
- Provide a performance-first alternative when effects are expensive.`
  },
  {
    id: 'agent_implementer',
    name: 'Implementation Specialist',
    role: 'IMPLEMENTATION_SPECIALIST',
    title: 'Lead Software Engineer',
    avatarColor: '#F59E0B',
    preferredModelTrait: 'coding',
    allowedTools: ['read_file', 'search_code', 'write_file', 'patch_file', 'create_file', 'delete_file', 'execute_command'],
    forbiddenTools: [],
    inputs: ['ARCHITECTURE', 'DESIGN_SYSTEM', 'IMPLEMENTATION_PLAN'],
    outputs: ['CODE'],
    systemPrompt: `You are the Implementation Specialist in Omnintellx Specialist Agent Orchestration.
Mission & Rules:
- Implement the approved specification.
- Preserve existing functionality unless a change is requested.
- Use clear, maintainable code.
- Do not claim that a feature works merely because code was generated.
- Write production-grade code with zero stubs, fake placeholders, or unhandled errors.`
  },
  {
    id: 'agent_debugger',
    name: 'Debugging Specialist',
    role: 'DEBUGGING_SPECIALIST',
    title: 'Root Cause Investigator & Precise Repair Engineer',
    avatarColor: '#EF4444',
    preferredModelTrait: 'reasoning',
    allowedTools: ['read_file', 'search_code', 'write_file', 'patch_file', 'execute_command', 'run_test'],
    forbiddenTools: [],
    inputs: ['CODE', 'TEST_REPORT'],
    outputs: ['TEST_REPORT'],
    systemPrompt: `You are the Debugging Specialist in Omnintellx Specialist Agent Orchestration.
Mission & Rules:
- Identify the exact error and reproduce it when tools permit.
- Investigate the root cause before modifying code.
- Make the smallest justified correction.
- Re-run the failed test and relevant regression tests.
- Explain unresolved problems honestly.
- Respect loop budgets: stop repeated debugging loops after a configurable limit.`
  },
  {
    id: 'agent_security',
    name: 'Security Specialist',
    role: 'SECURITY_SPECIALIST',
    title: 'Auth, Secrets, Dependencies & Vulnerability Auditor',
    avatarColor: '#10B981',
    preferredModelTrait: 'security',
    allowedTools: ['read_file', 'search_code', 'run_security_scan'],
    forbiddenTools: ['write_file', 'delete_file'],
    inputs: ['CODE', 'ARCHITECTURE'],
    outputs: ['SECURITY_REPORT'],
    systemPrompt: `You are the Security Specialist in Omnintellx Specialist Agent Orchestration.
Mission & Rules:
- Review authentication, authorization, data handling, secrets, dependencies, and exposed endpoints.
- Never place private API keys or privileged server credentials in browser code.
- Do not claim security certification or complete protection without evidence.
- Treat security findings according to severity and exploitability.`
  },
  {
    id: 'agent_reviewer',
    name: 'Independent Quality Reviewer',
    role: 'QUALITY_REVIEWER',
    title: 'Acceptance Verification Gate & Independent Auditor',
    avatarColor: '#8B5CF6',
    preferredModelTrait: 'reasoning',
    allowedTools: ['read_file', 'search_code', 'run_test', 'run_linter', 'execute_command'],
    forbiddenTools: ['write_file', 'delete_file'],
    inputs: ['CODE', 'TEST_REPORT', 'SECURITY_REPORT', 'REQUIREMENTS'],
    outputs: ['CODE_REVIEW', 'RELEASE_REPORT'],
    systemPrompt: `You are the Independent Quality Reviewer in Omnintellx Specialist Agent Orchestration.
Mission & Rules:
- Compare the implementation with the original acceptance criteria.
- Check layout responsiveness, interactions, error handling, and performance where tools permit.
- Identify missing or simulated functionality.
- Reject unsupported claims of successful testing.
- Return concrete findings and recommended fixes.`
  }
];

// Compatibility aliases for legacy lookups
export const AGENT_ROLE_MAP: Record<string, string> = {
  agent_orchestrator: 'agent_architect',
  agent_coder: 'agent_implementer',
  agent_frontend: 'agent_implementer',
  agent_backend: 'agent_implementer',
  agent_qa: 'agent_reviewer',
  agent_release: 'agent_reviewer',
  agent_ux: 'agent_designer',
  agent_docs: 'agent_planner'
};

export function resolveSpecialistAgent(agentId: string): AgentDefinition {
  const direct = INITIAL_AGENT_TEAM.find(a => a.id === agentId);
  if (direct) return direct;
  const aliasId = AGENT_ROLE_MAP[agentId];
  if (aliasId) {
    const alias = INITIAL_AGENT_TEAM.find(a => a.id === aliasId);
    if (alias) return alias;
  }
  return INITIAL_AGENT_TEAM[3]; // default to Implementation Specialist
}
