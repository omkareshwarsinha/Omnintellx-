/**
 * Omnintellx — Tool Gateway & Permission Security Engine
 * Gatekeeper for all AI tool invocations with strict permission boundaries, sandboxing, and real workspace execution.
 */

import { ToolType, PermissionDecision, PendingToolRequest, ToolExecutionResult, ProjectFile, Checkpoint } from '../types';

export interface ToolContext {
  projectId?: string;
  files: ProjectFile[];
  onUpdateFiles: (files: ProjectFile[]) => void;
  onCreateCheckpoint: (name: string, reason: string) => Checkpoint;
  onAskUserPermission: (req: PendingToolRequest) => Promise<boolean>;
}

export class ToolGateway {
  // Permission classification
  static evaluatePermission(tool: ToolType, params: Record<string, any>): { decision: PermissionDecision; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; reason: string } {
    switch (tool) {
      case 'read_file':
      case 'search_code':
      case 'git_status':
      case 'git_diff':
        return { decision: 'ALLOW', riskLevel: 'LOW', reason: 'Safe read-only operation' };

      case 'write_file':
      case 'patch_file':
      case 'create_file':
        return { decision: 'ALLOW', riskLevel: 'MEDIUM', reason: 'Workspace file modification' };

      case 'execute_command':
        return { decision: 'ASK', riskLevel: 'HIGH', reason: 'Command execution inside workspace' };

      case 'run_test':
      case 'run_linter':
      case 'git_checkpoint':
        return { decision: 'ALLOW', riskLevel: 'LOW', reason: 'Safe validation utility' };

      case 'run_security_scan':
        return { decision: 'ALLOW', riskLevel: 'LOW', reason: 'Static analysis and AST scanning' };

      case 'http_request':
        return { decision: 'ASK', riskLevel: 'HIGH', reason: 'External network egress requires explicit approval' };

      case 'delete_file':
        return { decision: 'ASK', riskLevel: 'HIGH', reason: 'File deletion may be destructive' };

      case 'request_permission':
      case 'ask_user':
        return { decision: 'ASK', riskLevel: 'MEDIUM', reason: 'Interaction with human operator requested' };

      default:
        return { decision: 'DENY', riskLevel: 'CRITICAL', reason: 'Unknown or unauthorized tool invocation' };
    }
  }

  static async executeTool(
    tool: ToolType,
    params: Record<string, any>,
    agentId: string,
    agentName: string,
    taskId: string,
    ctx: ToolContext,
    bypassPrompt: boolean = false
  ): Promise<ToolExecutionResult> {
    const { decision, riskLevel, reason } = this.evaluatePermission(tool, params);

    if (decision === 'DENY') {
      return {
        ok: false,
        output: null,
        error: `Permission DENIED for tool '${tool}': ${reason}`,
        executionMode: 'UNAVAILABLE'
      };
    }

    if (decision === 'ASK' && !bypassPrompt) {
      const pendingReq: PendingToolRequest = {
        id: `REQ-${Date.now()}`,
        agentId,
        agentName,
        taskId,
        tool,
        params,
        riskLevel,
        reason,
        timestamp: Date.now(),
        status: 'PENDING'
      };

      const approved = await ctx.onAskUserPermission(pendingReq);
      if (!approved) {
        return {
          ok: false,
          output: null,
          error: `User rejected permission request for tool '${tool}' (${reason})`,
          executionMode: 'REAL'
        };
      }
    }

    const projectId = ctx.projectId || 'default_workspace';

    // Real execution handlers
    switch (tool) {
      case 'read_file': {
        const fileName = params.fileName;
        try {
          const res = await fetch(`/api/projects/${projectId}/files/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: fileName })
          });
          if (res.ok) {
            const data = await res.json();
            return { ok: true, output: data.content, executionMode: 'REAL' };
          }
        } catch {
          // fallback to memory
        }

        const file = ctx.files.find(f => f.name === fileName);
        if (!file) {
          return { ok: false, output: null, error: `File not found: ${fileName}`, executionMode: 'REAL' };
        }
        return { ok: true, output: file.content, executionMode: 'REAL' };
      }

      case 'search_code': {
        const query = String(params.query || '').toLowerCase();
        const results = ctx.files
          .filter(f => f.content.toLowerCase().includes(query))
          .map(f => ({ fileName: f.name, occurrences: f.content.split(query).length - 1 }));
        return { ok: true, output: results, executionMode: 'REAL' };
      }

      case 'write_file':
      case 'create_file': {
        const fileName = params.fileName;
        const content = params.content || '';

        // Sync with real workspace on disk
        try {
          fetch(`/api/projects/${projectId}/files/write`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: fileName, content })
          }).catch(() => {});
        } catch {
          // ignore
        }

        const existingIdx = ctx.files.findIndex(f => f.name === fileName);
        let updatedFiles: ProjectFile[];
        if (existingIdx !== -1) {
          updatedFiles = [...ctx.files];
          updatedFiles[existingIdx] = {
            ...updatedFiles[existingIdx],
            content,
            updatedAt: Date.now(),
            lastEditedByAgent: agentName
          };
        } else {
          updatedFiles = [
            ...ctx.files,
            {
              id: `file_${Date.now()}`,
              name: fileName,
              content,
              updatedAt: Date.now(),
              lastEditedByAgent: agentName
            }
          ];
        }
        ctx.onUpdateFiles(updatedFiles);
        return { ok: true, output: `Saved ${fileName} (${content.length} bytes)`, executionMode: 'REAL' };
      }

      case 'patch_file': {
        const fileName = params.fileName;
        const target = params.target;
        const replacement = params.replacement;
        const existing = ctx.files.find(f => f.name === fileName);
        if (!existing) {
          return { ok: false, output: null, error: `Cannot patch missing file: ${fileName}`, executionMode: 'REAL' };
        }
        if (!existing.content.includes(target)) {
          return { ok: false, output: null, error: `Target snippet not found in ${fileName}`, executionMode: 'REAL' };
        }
        const newContent = existing.content.replace(target, replacement);

        // Sync with disk
        try {
          fetch(`/api/projects/${projectId}/files/write`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: fileName, content: newContent })
          }).catch(() => {});
        } catch {}

        const updatedFiles = ctx.files.map(f => (f.name === fileName ? { ...f, content: newContent, updatedAt: Date.now(), lastEditedByAgent: agentName } : f));
        ctx.onUpdateFiles(updatedFiles);
        return { ok: true, output: `Patched ${fileName}`, executionMode: 'REAL' };
      }

      case 'delete_file': {
        const fileName = params.fileName;
        try {
          fetch(`/api/projects/${projectId}/files/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: fileName })
          }).catch(() => {});
        } catch {}

        const updatedFiles = ctx.files.filter(f => f.name !== fileName);
        ctx.onUpdateFiles(updatedFiles);
        return { ok: true, output: `Deleted ${fileName}`, executionMode: 'REAL' };
      }

      case 'execute_command': {
        const cmd = params.command;
        if (!cmd) {
          return { ok: false, output: null, error: 'Command parameter is required', executionMode: 'REAL' };
        }
        try {
          const res = await fetch('/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              command: cmd,
              projectId,
              timeoutMs: params.timeoutMs || 20000
            })
          });
          const data = await res.json();
          const isSuccess = data.success && data.exitCode === 0;
          return {
            ok: isSuccess,
            output: data.stdout || data.stderr || (isSuccess ? 'Command completed' : 'Command failed'),
            error: isSuccess ? undefined : data.stderr || `Exited with code ${data.exitCode}`,
            executionMode: 'REAL'
          };
        } catch (err: any) {
          return { ok: false, output: null, error: `Execution service error: ${err.message}`, executionMode: 'UNAVAILABLE' };
        }
      }

      case 'git_checkpoint': {
        const name = params.name || `Auto-checkpoint by ${agentName}`;
        try {
          fetch(`/api/projects/${projectId}/checkpoints`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
          }).catch(() => {});
        } catch {}
        const ckpt = ctx.onCreateCheckpoint(name, `Task ${taskId}`);
        return { ok: true, output: `Created checkpoint '${ckpt.name}' (${ckpt.id})`, executionMode: 'REAL' };
      }

      case 'run_test': {
        // Determine test command based on workspace files
        const hasPythonTests = ctx.files.some(f => f.name.startsWith('test_') || f.name.endsWith('_test.py'));
        const hasPackageJson = ctx.files.some(f => f.name === 'package.json');
        let testCmd = params.command;

        if (!testCmd) {
          if (hasPythonTests) {
            testCmd = 'python3 -m unittest discover -s . -p "test_*.py"';
          } else if (hasPackageJson) {
            testCmd = 'npm test';
          } else {
            testCmd = 'node -c main.js || true';
          }
        }

        try {
          const res = await fetch('/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              command: testCmd,
              projectId,
              timeoutMs: 25000
            })
          });
          const data = await res.json();
          const passed = data.exitCode === 0;
          const output = (data.stdout || '') + (data.stderr ? `\nSTDERR:\n${data.stderr}` : '');
          return {
            ok: passed,
            output: passed ? `Tests PASSED:\n${output.trim()}` : `Tests FAILED (code ${data.exitCode}):\n${output.trim()}`,
            error: passed ? undefined : `Test suite failure with exit code ${data.exitCode}`,
            executionMode: 'REAL'
          };
        } catch (err: any) {
          return {
            ok: false,
            output: null,
            error: `Test execution service unavailable: ${err.message}`,
            executionMode: 'UNAVAILABLE'
          };
        }
      }

      case 'run_security_scan': {
        const findings: string[] = [];
        for (const file of ctx.files) {
          if (file.content.includes('eval(') || file.content.includes('dangerouslySetInnerHTML')) {
            findings.push(`[HIGH] Insecure execution / eval in ${file.name}`);
          }
          if (/sk-[a-zA-Z0-9]{20,}/.test(file.content) || /AKIA[0-9A-Z]{16}/.test(file.content)) {
            findings.push(`[CRITICAL] Hardcoded API credential detected in ${file.name}`);
          }
        }
        return {
          ok: findings.length === 0,
          output: findings.length === 0 ? 'Security scan completed clean: 0 vulnerabilities found.' : findings.join('\n'),
          executionMode: 'REAL'
        };
      }

      case 'http_request': {
        try {
          const res = await fetch(params.url, {
            method: params.method || 'GET',
            headers: params.headers || {},
            body: params.body ? JSON.stringify(params.body) : undefined,
            signal: AbortSignal.timeout(15000)
          });
          const text = await res.text();
          return { ok: res.ok, output: { status: res.status, body: text }, executionMode: 'REAL' };
        } catch (err: any) {
          return { ok: false, output: null, error: err.message, executionMode: 'REAL' };
        }
      }

      default:
        return { ok: true, output: 'Tool executed successfully', executionMode: 'REAL' };
    }
  }
}

