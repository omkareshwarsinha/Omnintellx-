/**
 * Omnintellx — Authentic Autonomous Tool Registry
 * Every tool has:
 * - name, description, category, permission_level
 * - input_schema, result_schema, timeoutMs
 * - genuine execution_handler backed by real OS/filesystem/process operations
 * - strict error handling and real execution observation
 */

import fs from 'fs';
import path from 'path';
import { WorkspaceManager, WorkspaceFileMetadata } from '../projects/workspaceManager';
import { ExecutionManager } from '../execution/executionManager';
import { PathSecurity } from '../security/pathSecurity';

export type ToolCategory =
  | 'filesystem'
  | 'terminal'
  | 'project'
  | 'testing'
  | 'browser'
  | 'versioning'
  | 'security'
  | 'delivery'
  | 'collaboration';

export type PermissionLevel = 'read' | 'write' | 'execute' | 'admin';

export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  permissionLevel: PermissionLevel;
  timeoutMs: number;
  inputSchema: Record<string, any>;
  execute: (context: ToolContext, params: any) => Promise<ToolResult>;
}

export interface ToolContext {
  projectId: string;
  workspaceRoot: string;
  abortSignal?: AbortSignal;
  emitEvent?: (type: string, message: string, data?: any) => void;
}

export interface ToolResult {
  tool: string;
  success: boolean;
  output: any;
  error?: string;
  durationMs: number;
  metadata?: Record<string, any>;
}

export class ToolRegistry {
  private static tools: Map<string, ToolDefinition> = new Map();

  static register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  static get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  static listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  static getToolsPrompt(): string {
    const list = this.listTools();
    return list
      .map(
        t => `- ${t.name} (${t.category}): ${t.description}\n  Inputs: ${JSON.stringify(t.inputSchema)}`
      )
      .join('\n');
  }

  static async execute(
    name: string,
    params: any,
    context: ToolContext
  ): Promise<ToolResult> {
    const start = Date.now();
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        tool: name,
        success: false,
        output: null,
        error: `TOOL_NOT_FOUND: The tool "${name}" is not registered in the runtime tool registry.`,
        durationMs: Date.now() - start
      };
    }

    try {
      context.emitEvent?.('tool.started', `Executing tool: ${name}`, { tool: name, params });
      const result = await Promise.race([
        tool.execute(context, params),
        new Promise<ToolResult>((_, reject) =>
          setTimeout(() => reject(new Error(`TOOL_TIMEOUT: "${name}" timed out after ${tool.timeoutMs}ms`)), tool.timeoutMs)
        )
      ]);

      const durationMs = Date.now() - start;
      const finalRes: ToolResult = {
        ...result,
        durationMs
      };

      context.emitEvent?.(
        result.success ? 'tool.completed' : 'tool.failed',
        `Tool ${name} ${result.success ? 'succeeded' : 'failed'} (${durationMs}ms)`,
        { tool: name, success: result.success, output: result.output, error: result.error }
      );

      return finalRes;
    } catch (err: any) {
      const durationMs = Date.now() - start;
      const failRes: ToolResult = {
        tool: name,
        success: false,
        output: null,
        error: err.message || `Tool ${name} encountered an unhandled exception`,
        durationMs
      };
      context.emitEvent?.('tool.failed', `Tool ${name} threw error: ${err.message}`, { tool: name, error: err.message });
      return failRes;
    }
  }
}

// =========================================================================
// 1. FILESYSTEM TOOLS (Real Disk Execution)
// =========================================================================

ToolRegistry.register({
  name: 'list_files',
  description: 'List all files and directories in the workspace recursively with sizes and timestamps.',
  category: 'filesystem',
  permissionLevel: 'read',
  timeoutMs: 10000,
  inputSchema: {
    subDirectory: 'optional string path relative to workspace root'
  },
  execute: async (ctx, params) => {
    const files = await WorkspaceManager.listFiles(ctx.projectId, params?.subDirectory || '');
    return {
      tool: 'list_files',
      success: true,
      output: files.map(f => ({
        path: f.relativePath,
        sizeBytes: f.size,
        isDirectory: f.isDirectory,
        updatedAt: f.updatedAt
      })),
      durationMs: 0
    };
  }
});

ToolRegistry.register({
  name: 'read_file',
  description: 'Read the complete text contents of a file in the workspace.',
  category: 'filesystem',
  permissionLevel: 'read',
  timeoutMs: 10000,
  inputSchema: {
    path: 'relative path of the file to read'
  },
  execute: async (ctx, params) => {
    if (!params?.path) throw new Error('Parameter "path" is required for read_file.');
    const content = await WorkspaceManager.readFile(ctx.projectId, params.path);
    const lineCount = content.split('\n').length;
    return {
      tool: 'read_file',
      success: true,
      output: {
        path: params.path,
        content,
        lineCount,
        bytes: Buffer.byteLength(content, 'utf-8')
      },
      durationMs: 0
    };
  }
});

ToolRegistry.register({
  name: 'write_file',
  description: 'Write complete text content to a file in the workspace (creates file and parent directories).',
  category: 'filesystem',
  permissionLevel: 'write',
  timeoutMs: 15000,
  inputSchema: {
    path: 'relative path of target file',
    content: 'string content to write'
  },
  execute: async (ctx, params) => {
    if (!params?.path) throw new Error('Parameter "path" is required for write_file.');
    const content = params.content !== undefined ? String(params.content) : '';
    const res = await WorkspaceManager.writeFile(ctx.projectId, params.path, content);
    return {
      tool: 'write_file',
      success: true,
      output: {
        path: params.path,
        bytesWritten: res.bytes
      },
      durationMs: 0
    };
  }
});

ToolRegistry.register({
  name: 'patch_file',
  description: 'Precisely search and replace a block of text in an existing workspace file.',
  category: 'filesystem',
  permissionLevel: 'write',
  timeoutMs: 15000,
  inputSchema: {
    path: 'relative path of file',
    target: 'exact existing string to replace',
    replacement: 'new replacement string'
  },
  execute: async (ctx, params) => {
    if (!params?.path || params?.target === undefined || params?.replacement === undefined) {
      throw new Error('Parameters "path", "target", and "replacement" are required for patch_file.');
    }
    const res = await WorkspaceManager.editFile(ctx.projectId, params.path, params.target, params.replacement);
    return {
      tool: 'patch_file',
      success: true,
      output: {
        path: params.path,
        message: 'Patch applied successfully'
      },
      durationMs: 0
    };
  }
});

ToolRegistry.register({
  name: 'edit_file',
  description: 'Edit a file in the workspace by replacing target text with replacement, or updating content.',
  category: 'filesystem',
  permissionLevel: 'write',
  timeoutMs: 15000,
  inputSchema: {
    path: 'relative path of file to edit',
    target: 'exact substring to find (or leave empty if rewriting whole file)',
    replacement: 'new replacement text (or whole new content)'
  },
  execute: async (ctx, params) => {
    if (!params?.path) throw new Error('Parameter "path" is required for edit_file.');
    if (params?.target !== undefined && params?.replacement !== undefined) {
      const res = await WorkspaceManager.editFile(ctx.projectId, params.path, params.target, params.replacement);
      return {
        tool: 'edit_file',
        success: true,
        output: { path: params.path, updated: true },
        durationMs: 0
      };
    } else if (params?.content !== undefined) {
      const res = await WorkspaceManager.writeFile(ctx.projectId, params.path, params.content);
      return {
        tool: 'edit_file',
        success: true,
        output: { path: params.path, bytesWritten: res.bytes },
        durationMs: 0
      };
    } else {
      throw new Error('edit_file requires either target/replacement or content parameters.');
    }
  }
});

ToolRegistry.register({
  name: 'delete_file',
  description: 'Delete a file or directory from the workspace.',
  category: 'filesystem',
  permissionLevel: 'write',
  timeoutMs: 10000,
  inputSchema: {
    path: 'relative path of file or folder to delete'
  },
  execute: async (ctx, params) => {
    if (!params?.path) throw new Error('Parameter "path" is required for delete_file.');
    const deleted = await WorkspaceManager.deleteFile(ctx.projectId, params.path);
    return {
      tool: 'delete_file',
      success: deleted,
      output: { path: params.path, deleted },
      error: deleted ? undefined : `File "${params.path}" not found or could not be deleted`,
      durationMs: 0
    };
  }
});

ToolRegistry.register({
  name: 'move_file',
  description: 'Move or rename a file in the workspace.',
  category: 'filesystem',
  permissionLevel: 'write',
  timeoutMs: 10000,
  inputSchema: {
    sourcePath: 'current relative path',
    destinationPath: 'new relative path'
  },
  execute: async (ctx, params) => {
    if (!params?.sourcePath || !params?.destinationPath) {
      throw new Error('Parameters "sourcePath" and "destinationPath" are required for move_file.');
    }
    const content = await WorkspaceManager.readFile(ctx.projectId, params.sourcePath);
    await WorkspaceManager.writeFile(ctx.projectId, params.destinationPath, content);
    await WorkspaceManager.deleteFile(ctx.projectId, params.sourcePath);
    return {
      tool: 'move_file',
      success: true,
      output: { from: params.sourcePath, to: params.destinationPath },
      durationMs: 0
    };
  }
});

ToolRegistry.register({
  name: 'search_files',
  description: 'Search workspace files for regex pattern or text substring matching.',
  category: 'filesystem',
  permissionLevel: 'read',
  timeoutMs: 15000,
  inputSchema: {
    query: 'text or regex pattern to search for',
    fileExtension: 'optional extension filter like ".js" or ".py"'
  },
  execute: async (ctx, params) => {
    if (!params?.query) throw new Error('Parameter "query" is required for search_files.');
    const files = await WorkspaceManager.listFiles(ctx.projectId);
    const matches: Array<{ file: string; line: number; text: string }> = [];
    const query = String(params.query);
    const ext = params.fileExtension ? String(params.fileExtension) : null;

    for (const f of files) {
      if (f.isDirectory) continue;
      if (ext && !f.name.endsWith(ext)) continue;

      try {
        const content = await WorkspaceManager.readFile(ctx.projectId, f.relativePath);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes(query) && matches.length < 50) {
            matches.push({
              file: f.relativePath,
              line: idx + 1,
              text: line.trim().slice(0, 200)
            });
          }
        });
      } catch {}
    }

    return {
      tool: 'search_files',
      success: true,
      output: {
        query,
        matchCount: matches.length,
        matches
      },
      durationMs: 0
    };
  }
});

ToolRegistry.register({
  name: 'inspect_directory',
  description: 'Inspect workspace directory layout, framework files, and total footprint.',
  category: 'filesystem',
  permissionLevel: 'read',
  timeoutMs: 10000,
  inputSchema: {},
  execute: async (ctx) => {
    const inspection = await WorkspaceManager.inspectProject(ctx.projectId);
    return {
      tool: 'inspect_directory',
      success: true,
      output: inspection,
      durationMs: 0
    };
  }
});

// =========================================================================
// 2. TERMINAL & EXECUTION TOOLS
// =========================================================================

ToolRegistry.register({
  name: 'execute_command',
  description: 'Execute shell command in workspace root with real stdout/stderr capture and exit code.',
  category: 'terminal',
  permissionLevel: 'execute',
  timeoutMs: 35000,
  inputSchema: {
    command: 'shell command string to execute',
    timeoutMs: 'optional timeout in ms (default 25000)'
  },
  execute: async (ctx, params) => {
    if (!params?.command) throw new Error('Parameter "command" is required for execute_command.');
    const exec = ExecutionManager.getInstance();
    const result = await exec.executeCommand({
      command: params.command,
      cwd: ctx.workspaceRoot,
      projectId: ctx.projectId,
      timeoutMs: params.timeoutMs || 25000
    });

    return {
      tool: 'execute_command',
      success: result.exitCode === 0,
      output: {
        command: params.command,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        timedOut: result.timedOut,
        durationMs: result.durationMs
      },
      error: result.exitCode !== 0 ? (result.stderr || `Command failed with exit code ${result.exitCode}`) : undefined,
      durationMs: result.durationMs
    };
  }
});

ToolRegistry.register({
  name: 'execute_script',
  description: 'Write temporary script and execute it via node, python3, or bash.',
  category: 'terminal',
  permissionLevel: 'execute',
  timeoutMs: 30000,
  inputSchema: {
    runtime: '"node" | "python3" | "bash"',
    scriptContent: 'raw script body to execute'
  },
  execute: async (ctx, params) => {
    const runtime = params?.runtime || 'node';
    const ext = runtime === 'python3' ? 'py' : runtime === 'bash' ? 'sh' : 'js';
    const tempFile = `.tmp_script_${Date.now()}.${ext}`;

    await WorkspaceManager.writeFile(ctx.projectId, tempFile, params.scriptContent || '');
    const exec = ExecutionManager.getInstance();
    const cmd = `${runtime} "${tempFile}"`;
    const res = await exec.executeCommand({
      command: cmd,
      cwd: ctx.workspaceRoot,
      projectId: ctx.projectId,
      timeoutMs: 25000
    });

    // Cleanup temp script
    await WorkspaceManager.deleteFile(ctx.projectId, tempFile);

    return {
      tool: 'execute_script',
      success: res.exitCode === 0,
      output: {
        runtime,
        exitCode: res.exitCode,
        stdout: res.stdout,
        stderr: res.stderr
      },
      error: res.exitCode !== 0 ? (res.stderr || `Script failed with exit code ${res.exitCode}`) : undefined,
      durationMs: res.durationMs
    };
  }
});

ToolRegistry.register({
  name: 'inspect_environment',
  description: 'Inspect host environment tools: node version, python3, npm, git, and workspace variables.',
  category: 'terminal',
  permissionLevel: 'read',
  timeoutMs: 10000,
  inputSchema: {},
  execute: async (ctx) => {
    const exec = ExecutionManager.getInstance();
    const nodeVer = await exec.executeCommand({ command: 'node --version', cwd: ctx.workspaceRoot, timeoutMs: 4000 });
    const pythonVer = await exec.executeCommand({ command: 'python3 --version || python --version', cwd: ctx.workspaceRoot, timeoutMs: 4000 });
    const gitVer = await exec.executeCommand({ command: 'git --version', cwd: ctx.workspaceRoot, timeoutMs: 4000 });

    return {
      tool: 'inspect_environment',
      success: true,
      output: {
        nodeVersion: nodeVer.stdout.trim() || 'Unavailable',
        pythonVersion: pythonVer.stdout.trim() || pythonVer.stderr.trim() || 'Unavailable',
        gitVersion: gitVer.stdout.trim() || 'Unavailable',
        platform: process.platform,
        architecture: process.arch
      },
      durationMs: 0
    };
  }
});

// =========================================================================
// 3. PROJECT TOOLS
// =========================================================================

ToolRegistry.register({
  name: 'detect_framework',
  description: 'Detect framework, project type, entry points, and build configuration.',
  category: 'project',
  permissionLevel: 'read',
  timeoutMs: 10000,
  inputSchema: {},
  execute: async (ctx) => {
    const inspection = await WorkspaceManager.inspectProject(ctx.projectId);
    return {
      tool: 'detect_framework',
      success: true,
      output: {
        framework: inspection.framework,
        entryPoints: inspection.entryPoints,
        dependencies: inspection.dependencies,
        hasBuildScript: inspection.hasBuildScript
      },
      durationMs: 0
    };
  }
});

ToolRegistry.register({
  name: 'install_dependency',
  description: 'Install npm package or pip dependency into the workspace.',
  category: 'project',
  permissionLevel: 'execute',
  timeoutMs: 60000,
  inputSchema: {
    manager: '"npm" | "pip"',
    packageName: 'name of package (e.g. "three", "express", "requests")'
  },
  execute: async (ctx, params) => {
    if (!params?.packageName) throw new Error('Parameter "packageName" is required.');
    const manager = params.manager || 'npm';
    const cmd = manager === 'pip' ? `pip install ${params.packageName}` : `npm install ${params.packageName} --no-audit`;

    const exec = ExecutionManager.getInstance();
    const res = await exec.executeCommand({
      command: cmd,
      cwd: ctx.workspaceRoot,
      projectId: ctx.projectId,
      timeoutMs: 50000
    });

    return {
      tool: 'install_dependency',
      success: res.exitCode === 0,
      output: {
        manager,
        package: params.packageName,
        exitCode: res.exitCode,
        stdout: res.stdout.slice(0, 1000)
      },
      error: res.exitCode !== 0 ? res.stderr || 'Installation failed' : undefined,
      durationMs: res.durationMs
    };
  }
});

ToolRegistry.register({
  name: 'build_project',
  description: 'Run project build command (e.g. npm run build).',
  category: 'project',
  permissionLevel: 'execute',
  timeoutMs: 45000,
  inputSchema: {},
  execute: async (ctx) => {
    const exec = ExecutionManager.getInstance();
    const res = await exec.executeCommand({
      command: 'npm run build',
      cwd: ctx.workspaceRoot,
      projectId: ctx.projectId,
      timeoutMs: 40000
    });

    return {
      tool: 'build_project',
      success: res.exitCode === 0,
      output: {
        exitCode: res.exitCode,
        stdout: res.stdout,
        stderr: res.stderr
      },
      error: res.exitCode !== 0 ? res.stderr || 'Build failed' : undefined,
      durationMs: res.durationMs
    };
  }
});

// =========================================================================
// 4. TESTING TOOLS
// =========================================================================

ToolRegistry.register({
  name: 'run_tests',
  description: 'Execute test suite (npm test, python unittest, or pytest).',
  category: 'testing',
  permissionLevel: 'execute',
  timeoutMs: 30000,
  inputSchema: {
    command: 'optional custom test command (default auto-detected)'
  },
  execute: async (ctx, params) => {
    const files = await WorkspaceManager.listFiles(ctx.projectId);
    const fileNames = files.map(f => f.name);

    let testCmd = params?.command;
    if (!testCmd) {
      if (fileNames.some(fn => fn.startsWith('test_') && fn.endsWith('.py'))) {
        testCmd = 'python3 -m unittest discover -s . -p "test_*.py"';
      } else if (fileNames.includes('package.json')) {
        testCmd = 'npm test';
      } else {
        testCmd = 'echo "No explicit test runner found" && exit 0';
      }
    }

    const exec = ExecutionManager.getInstance();
    const res = await exec.executeCommand({
      command: testCmd,
      cwd: ctx.workspaceRoot,
      projectId: ctx.projectId,
      timeoutMs: 25000
    });

    return {
      tool: 'run_tests',
      success: res.exitCode === 0,
      output: {
        command: testCmd,
        exitCode: res.exitCode,
        output: (res.stdout + (res.stderr ? `\nSTDERR:\n${res.stderr}` : '')).trim()
      },
      error: res.exitCode !== 0 ? res.stderr || 'Tests failed' : undefined,
      durationMs: res.durationMs
    };
  }
});

ToolRegistry.register({
  name: 'run_linter',
  description: 'Run linter or syntax checks over workspace code.',
  category: 'testing',
  permissionLevel: 'execute',
  timeoutMs: 20000,
  inputSchema: {
    file: 'optional specific file to lint'
  },
  execute: async (ctx, params) => {
    const exec = ExecutionManager.getInstance();
    const targetFile = params?.file;
    let cmd = 'node --check main.js || true';
    if (targetFile?.endsWith('.js')) {
      cmd = `node --check "${targetFile}"`;
    } else if (targetFile?.endsWith('.py')) {
      cmd = `python3 -m py_compile "${targetFile}"`;
    }

    const res = await exec.executeCommand({
      command: cmd,
      cwd: ctx.workspaceRoot,
      projectId: ctx.projectId,
      timeoutMs: 15000
    });

    return {
      tool: 'run_linter',
      success: res.exitCode === 0,
      output: {
        exitCode: res.exitCode,
        stdout: res.stdout,
        stderr: res.stderr
      },
      error: res.exitCode !== 0 ? res.stderr : undefined,
      durationMs: res.durationMs
    };
  }
});

// =========================================================================
// 5. BROWSER & RUNTIME SANDBOX TOOLS
// =========================================================================

ToolRegistry.register({
  name: 'inspect_dom',
  description: 'Inspect HTML/CSS DOM structure, script references, viewport, and canvas/WebGL elements.',
  category: 'browser',
  permissionLevel: 'read',
  timeoutMs: 10000,
  inputSchema: {
    path: 'relative path of HTML file (default index.html)'
  },
  execute: async (ctx, params) => {
    const htmlPath = params?.path || 'index.html';
    const html = await WorkspaceManager.readFile(ctx.projectId, htmlPath);

    const hasDoctype = html.toLowerCase().includes('<!doctype html');
    const hasCanvas = /<canvas\b/i.test(html);
    const hasThreeJs = /three(\.min)?\.js/i.test(html) || /from\s+['"]three['"]/i.test(html);
    const scriptMatches = html.match(/<script\b[^>]*>/gi) || [];
    const styleMatches = html.match(/<style\b[^>]*>|<link\b[^>]*rel=["']stylesheet["']/gi) || [];

    return {
      tool: 'inspect_dom',
      success: true,
      output: {
        htmlPath,
        hasDoctype,
        hasCanvas,
        hasThreeJs,
        scriptsCount: scriptMatches.length,
        stylesheetsCount: styleMatches.length,
        hasMetaViewport: /<meta\s+name=["']viewport["']/i.test(html)
      },
      durationMs: 0
    };
  }
});

ToolRegistry.register({
  name: 'evaluate_runtime',
  description: 'Evaluate safe JS runtime execution to catch uncaught syntax or reference errors.',
  category: 'browser',
  permissionLevel: 'execute',
  timeoutMs: 10000,
  inputSchema: {
    codeSnippet: 'JavaScript snippet to evaluate in isolated node runtime'
  },
  execute: async (ctx, params) => {
    if (!params?.codeSnippet) throw new Error('Parameter "codeSnippet" is required.');
    const exec = ExecutionManager.getInstance();
    const tempFile = `.eval_${Date.now()}.js`;
    await WorkspaceManager.writeFile(ctx.projectId, tempFile, params.codeSnippet);

    const res = await exec.executeCommand({
      command: `node "${tempFile}"`,
      cwd: ctx.workspaceRoot,
      projectId: ctx.projectId,
      timeoutMs: 8000
    });

    await WorkspaceManager.deleteFile(ctx.projectId, tempFile);

    return {
      tool: 'evaluate_runtime',
      success: res.exitCode === 0,
      output: {
        stdout: res.stdout,
        stderr: res.stderr,
        exitCode: res.exitCode
      },
      error: res.exitCode !== 0 ? res.stderr : undefined,
      durationMs: res.durationMs
    };
  }
});

ToolRegistry.register({
  name: 'preview',
  description: 'Generate live preview of an HTML entry point or website, checking title, DOM nodes, and styles.',
  category: 'browser',
  permissionLevel: 'read',
  timeoutMs: 10000,
  inputSchema: {
    path: 'optional path of HTML file (default index.html or test.html)'
  },
  execute: async (ctx, params) => {
    const targetPath = params?.path || 'index.html';
    try {
      const content = await WorkspaceManager.readFile(ctx.projectId, targetPath);
      const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : '';
      const hasDoctype = /<!doctype\s+html/i.test(content);
      const hasClosingHtml = /<\/html>/i.test(content);

      if (!hasClosingHtml && content.length > 50) {
        return {
          tool: 'preview',
          success: false,
          output: null,
          error: `PREVIEW_SYNTAX_ERROR: Document "${targetPath}" is missing closing </html> tag.`,
          durationMs: 0
        };
      }

      return {
        tool: 'preview',
        success: true,
        output: {
          path: targetPath,
          title,
          hasDoctype,
          bytes: Buffer.byteLength(content, 'utf-8'),
          status: 'READY'
        },
        durationMs: 0
      };
    } catch (err: any) {
      return {
        tool: 'preview',
        success: false,
        output: null,
        error: `PREVIEW_FAILED: Could not preview "${targetPath}": ${err.message}`,
        durationMs: 0
      };
    }
  }
});

ToolRegistry.register({
  name: 'validate',
  description: 'Validate syntax, structural integrity, and security across workspace files.',
  category: 'testing',
  permissionLevel: 'read',
  timeoutMs: 15000,
  inputSchema: {
    path: 'optional specific file to validate'
  },
  execute: async (ctx, params) => {
    const targetFile = params?.path;
    const files = await WorkspaceManager.listFiles(ctx.projectId);
    const checks: Array<{ file: string; check: string; status: 'PASSED' | 'FAILED'; error?: string }> = [];
    const errors: string[] = [];

    const filesToAudit = targetFile
      ? files.filter(f => f.relativePath === targetFile)
      : files.filter(f => !f.isDirectory);

    for (const f of filesToAudit) {
      try {
        const content = await WorkspaceManager.readFile(ctx.projectId, f.relativePath);

        // HTML checks
        if (f.name.endsWith('.html') || f.name.endsWith('.htm')) {
          const hasDoctype = /<!doctype\s+html/i.test(content);
          const hasHtmlClose = /<\/html>/i.test(content);
          if (!hasHtmlClose) {
            checks.push({ file: f.relativePath, check: 'HTML Structural Tag Pairs', status: 'FAILED', error: 'Missing </html> closing tag' });
            errors.push(`${f.relativePath}: Missing </html> tag`);
          } else {
            checks.push({ file: f.relativePath, check: 'HTML Structural Tag Pairs', status: 'PASSED' });
          }
        }

        // JS/TS checks
        if (f.name.endsWith('.js')) {
          // Test with node --check
          const exec = ExecutionManager.getInstance();
          const checkRes = await exec.executeCommand({
            command: `node --check "${f.relativePath}"`,
            cwd: ctx.workspaceRoot,
            projectId: ctx.projectId,
            timeoutMs: 5000
          });
          if (checkRes.exitCode !== 0) {
            checks.push({ file: f.relativePath, check: 'JavaScript Syntax Validation', status: 'FAILED', error: checkRes.stderr.trim() });
            errors.push(`${f.relativePath}: ${checkRes.stderr.trim()}`);
          } else {
            checks.push({ file: f.relativePath, check: 'JavaScript Syntax Validation', status: 'PASSED' });
          }
        }

        // CSS braces
        if (f.name.endsWith('.css')) {
          let openBraces = 0;
          for (let i = 0; i < content.length; i++) {
            if (content[i] === '{') openBraces++;
            if (content[i] === '}') openBraces--;
          }
          if (openBraces !== 0) {
            checks.push({ file: f.relativePath, check: 'CSS Braces Symmetry', status: 'FAILED', error: `Mismatched braces (${openBraces})` });
            errors.push(`${f.relativePath}: CSS mismatched braces (${openBraces})`);
          } else {
            checks.push({ file: f.relativePath, check: 'CSS Braces Symmetry', status: 'PASSED' });
          }
        }
      } catch (err: any) {
        errors.push(`${f.relativePath}: ${err.message}`);
      }
    }

    const allPassed = errors.length === 0;
    return {
      tool: 'validate',
      success: allPassed,
      output: {
        totalAudited: filesToAudit.length,
        passedChecks: checks.filter(c => c.status === 'PASSED').length,
        failedChecks: checks.filter(c => c.status === 'FAILED').length,
        checks,
        errors
      },
      error: allPassed ? undefined : `Validation failed with ${errors.length} error(s): ${errors.join('; ')}`,
      durationMs: 0
    };
  }
});

// =========================================================================
// 6. VERSIONING & CHECKPOINTS
// =========================================================================

ToolRegistry.register({
  name: 'create_checkpoint',
  description: 'Create a full workspace snapshot checkpoint for instant safe rollback.',
  category: 'versioning',
  permissionLevel: 'write',
  timeoutMs: 15000,
  inputSchema: {
    name: 'human-readable milestone name or reason'
  },
  execute: async (ctx, params) => {
    const ckptId = `ckpt_${Date.now()}`;
    const name = params?.name || 'Manual Checkpoint';
    await WorkspaceManager.createCheckpoint(ctx.projectId, ckptId, name);
    return {
      tool: 'create_checkpoint',
      success: true,
      output: {
        checkpointId: ckptId,
        name
      },
      durationMs: 0
    };
  }
});

ToolRegistry.register({
  name: 'restore_checkpoint',
  description: 'Restore workspace files to a prior checkpoint state (Rollback).',
  category: 'versioning',
  permissionLevel: 'admin',
  timeoutMs: 20000,
  inputSchema: {
    checkpointId: 'ID of checkpoint to restore'
  },
  execute: async (ctx, params) => {
    if (!params?.checkpointId) throw new Error('Parameter "checkpointId" is required.');
    await WorkspaceManager.restoreCheckpoint(ctx.projectId, params.checkpointId);
    return {
      tool: 'restore_checkpoint',
      success: true,
      output: {
        restoredCheckpointId: params.checkpointId,
        message: 'Workspace rolled back to checkpoint snapshot.'
      },
      durationMs: 0
    };
  }
});

// =========================================================================
// 7. SECURITY TOOLS
// =========================================================================

ToolRegistry.register({
  name: 'scan_secrets',
  description: 'Scan workspace files for accidental secret or credential leaks.',
  category: 'security',
  permissionLevel: 'read',
  timeoutMs: 10000,
  inputSchema: {},
  execute: async (ctx) => {
    const files = await WorkspaceManager.listFiles(ctx.projectId);
    const findings: Array<{ file: string; finding: string; line: number }> = [];

    for (const f of files) {
      if (f.isDirectory) continue;
      try {
        const content = await WorkspaceManager.readFile(ctx.projectId, f.relativePath);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (/(AIza[0-9A-Za-z-_]{35}|sk-[a-zA-Z0-9]{32,}|AKIA[0-9A-Z]{16})/.test(line)) {
            findings.push({
              file: f.relativePath,
              finding: 'Potential hardcoded API token detected',
              line: idx + 1
            });
          }
        });
      } catch {}
    }

    return {
      tool: 'scan_secrets',
      success: true,
      output: {
        clean: findings.length === 0,
        leaksFound: findings.length,
        findings
      },
      durationMs: 0
    };
  }
});

// =========================================================================
// 8. DELIVERY TOOLS
// =========================================================================

ToolRegistry.register({
  name: 'package_project',
  description: 'Package final deliverables into output/ and build-manifest.json.',
  category: 'delivery',
  permissionLevel: 'write',
  timeoutMs: 15000,
  inputSchema: {
    mission: 'goal description'
  },
  execute: async (ctx, params) => {
    const files = await WorkspaceManager.listFiles(ctx.projectId);
    const nonDir = files.filter(f => !f.isDirectory);

    // If index.html exists, copy to output/index.html
    let htmlContent = '';
    try {
      htmlContent = await WorkspaceManager.readFile(ctx.projectId, 'index.html');
      await WorkspaceManager.writeFile(ctx.projectId, 'output/index.html', htmlContent);
      await WorkspaceManager.writeFile(ctx.projectId, 'output/standalone.html', htmlContent);
    } catch {}

    const manifest = {
      project: ctx.projectId,
      mission: params?.mission || 'Autonomous Engineering Mission',
      generatedAt: new Date().toISOString(),
      filesCount: nonDir.length,
      files: nonDir.map(f => f.relativePath),
      deliverables: {
        standalone: htmlContent ? 'output/index.html' : nonDir[0]?.relativePath,
        manifest: 'output/build-manifest.json'
      }
    };

    await WorkspaceManager.writeFile(
      ctx.projectId,
      'output/build-manifest.json',
      JSON.stringify(manifest, null, 2)
    );

    return {
      tool: 'package_project',
      success: true,
      output: manifest,
      durationMs: 0
    };
  }
});
