import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { WorkspaceManager } from './projects/workspaceManager';
import { ExecutionManager } from './execution/executionManager';
import { OmnintellxDatabase } from './persistence/db';
import { ModelService } from './models/modelService';
import { RealAgentLoop } from './orchestrator/realAgentLoop';
import { generateGenericOutputSuite } from './utils/outputGenerator';
import { ToolRegistry } from './tools/toolRegistry';
import { MissionStateManager } from './orchestrator/missionState';
import JSZip from 'jszip';

export const apiRouter = Router();

// ----------------------------------------------------
// Projects APIs
// ----------------------------------------------------
apiRouter.get('/projects', async (req: Request, res: Response) => {
  try {
    const projects = OmnintellxDatabase.getProjects();
    res.json({ success: true, projects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/projects', async (req: Request, res: Response) => {
  try {
    const { id, name, description, config } = req.body;
    const projId = id || `proj_${Date.now()}`;
    const projName = name || 'New Omnintellx Project';
    const projDesc = description || '';

    const wsPath = WorkspaceManager.getWorkspacePath(projId);

    const newProject = {
      id: projId,
      name: projName,
      description: projDesc,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      workspacePath: wsPath,
      config: config || {}
    };

    OmnintellxDatabase.saveProject(newProject);
    res.json({ success: true, project: newProject });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/projects/:id', async (req: Request, res: Response) => {
  try {
    const p = OmnintellxDatabase.getProjectById(req.params.id);
    if (!p) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    const files = await WorkspaceManager.listFiles(req.params.id);
    res.json({ success: true, project: p, files });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/projects/:id', async (req: Request, res: Response) => {
  try {
    OmnintellxDatabase.deleteProject(req.params.id);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/projects/:id/inspect', async (req: Request, res: Response) => {
  try {
    const inspection = await WorkspaceManager.inspectProject(req.params.id);
    res.json({ success: true, inspection });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Real Pipeline Run, Pause, Stop APIs
// ----------------------------------------------------
apiRouter.post('/projects/:id/run', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const { goal, provider, model, apiKey, baseUrl, maxFixLoops } = req.body;

    if (!goal) {
      return res.status(400).json({ success: false, error: 'Goal is required' });
    }

    // Ensure project exists
    let proj = OmnintellxDatabase.getProjectById(projectId);
    if (!proj) {
      proj = {
        id: projectId,
        name: goal.slice(0, 32),
        description: goal,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        workspacePath: WorkspaceManager.getWorkspacePath(projectId),
        config: {}
      };
      OmnintellxDatabase.saveProject(proj);
    }

    // Execute real pipeline asynchronously
    const runPromise = RealAgentLoop.run({
      projectId,
      goal,
      provider,
      model,
      apiKey,
      baseUrl,
      maxFixLoops: maxFixLoops ?? 5
    });

    // Await run and return result
    const result = await runPromise;
    res.json({ success: result.success, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/projects/:id/stop', async (req: Request, res: Response) => {
  try {
    RealAgentLoop.stop(req.params.id);
    res.json({ success: true, message: 'Pipeline stopped and active processes terminated' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/projects/:id/pause', async (req: Request, res: Response) => {
  try {
    RealAgentLoop.pause(req.params.id);
    res.json({ success: true, message: 'Pipeline paused' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/projects/:id/resume', async (req: Request, res: Response) => {
  try {
    RealAgentLoop.resume(req.params.id);
    res.json({ success: true, message: 'Pipeline resumed' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/projects/:id/status', async (req: Request, res: Response) => {
  try {
    const status = RealAgentLoop.getPipelineStatus(req.params.id);
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Events API
// ----------------------------------------------------
apiRouter.get('/projects/:id/events', async (req: Request, res: Response) => {
  try {
    const events = OmnintellxDatabase.getEvents(req.params.id);
    res.json({ success: true, events });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Tool Registry & Direct Execution API
// ----------------------------------------------------
apiRouter.get('/tools', (req: Request, res: Response) => {
  try {
    const tools = ToolRegistry.listTools().map(t => ({
      name: t.name,
      description: t.description,
      category: t.category,
      permissionLevel: t.permissionLevel,
      inputSchema: t.inputSchema,
      timeoutMs: t.timeoutMs
    }));
    res.json({ success: true, count: tools.length, tools });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/projects/:id/tools/execute', async (req: Request, res: Response) => {
  try {
    const { tool, params } = req.body;
    if (!tool) {
      return res.status(400).json({ success: false, error: 'Parameter "tool" is required' });
    }
    const wsRoot = WorkspaceManager.getWorkspacePath(req.params.id);
    const result = await ToolRegistry.execute(tool, params || {}, {
      projectId: req.params.id,
      workspaceRoot: wsRoot
    });
    res.json({ success: result.success, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/projects/:id/mission', (req: Request, res: Response) => {
  try {
    const state = MissionStateManager.get(req.params.id);
    if (!state) {
      return res.status(404).json({ success: false, error: 'No active mission state found for project' });
    }
    res.json({ success: true, missionState: state });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Real File System Operations
// ----------------------------------------------------
apiRouter.get('/projects/:id/files', async (req: Request, res: Response) => {
  try {
    const files = await WorkspaceManager.listFiles(req.params.id);
    res.json({ success: true, files });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/projects/:id/files/read', async (req: Request, res: Response) => {
  try {
    const { path: filePath } = req.body;
    if (!filePath) return res.status(400).json({ success: false, error: 'Path is required' });
    const content = await WorkspaceManager.readFile(req.params.id, filePath);
    res.json({ success: true, path: filePath, content });
  } catch (err: any) {
    res.status(err.message.includes('NOT_FOUND') ? 404 : 400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/projects/:id/files/write', async (req: Request, res: Response) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath) return res.status(400).json({ success: false, error: 'Path is required' });
    const result = await WorkspaceManager.writeFile(req.params.id, filePath, content ?? '');
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/projects/:id/files/delete', async (req: Request, res: Response) => {
  try {
    const { path: filePath } = req.body;
    if (!filePath) return res.status(400).json({ success: false, error: 'Path is required' });
    const deleted = await WorkspaceManager.deleteFile(req.params.id, filePath);
    res.json({ success: true, deleted });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/projects/:id/files/edit', async (req: Request, res: Response) => {
  try {
    const { path: filePath, target, replacement } = req.body;
    if (!filePath || target === undefined || replacement === undefined) {
      return res.status(400).json({ success: false, error: 'path, target, and replacement are required' });
    }
    const result = await WorkspaceManager.editFile(req.params.id, filePath, target, replacement);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/projects/:id/output/compile', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const filesMeta = await WorkspaceManager.listFiles(projectId);
    
    // Read all actual file contents from the workspace
    const workspaceFiles: Array<{ path: string; content: string; size: number }> = [];
    for (const fm of filesMeta) {
      if (fm.isDirectory) continue;
      try {
        const content = await WorkspaceManager.readFile(projectId, fm.relativePath);
        workspaceFiles.push({
          path: fm.relativePath,
          content,
          size: fm.size
        });
      } catch {}
    }

    const generatedFiles = generateGenericOutputSuite(projectId, workspaceFiles);

    const written: string[] = [];
    for (const [relPath, content] of Object.entries(generatedFiles)) {
      await WorkspaceManager.writeFile(projectId, relPath, content);
      written.push(relPath);
    }

    res.json({ success: true, filesWritten: written, timestamp: Date.now() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Checkpoints & Rollback
// ----------------------------------------------------
apiRouter.post('/projects/:id/checkpoints', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const ckptId = `ckpt_${Date.now()}`;
    const cpDir = await WorkspaceManager.createCheckpoint(req.params.id, ckptId, name || 'Manual Checkpoint');
    const meta = { id: ckptId, projectId: req.params.id, name: name || 'Manual Checkpoint', timestamp: Date.now(), path: cpDir };
    OmnintellxDatabase.saveCheckpointMeta(meta);
    res.json({ success: true, checkpoint: meta });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/projects/:id/checkpoints/:checkpointId/restore', async (req: Request, res: Response) => {
  try {
    await WorkspaceManager.restoreCheckpoint(req.params.id, req.params.checkpointId);
    OmnintellxDatabase.addEvent({
      id: `EVT-${Date.now()}`,
      projectId: req.params.id,
      timestamp: Date.now(),
      type: 'rollback',
      message: `Project restored to checkpoint ${req.params.checkpointId}`,
      severity: 'info'
    });
    res.json({ success: true, message: `Restored to checkpoint ${req.params.checkpointId}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Command Execution & Terminal API
// ----------------------------------------------------
apiRouter.post('/execute', async (req: Request, res: Response) => {
  try {
    const { command, projectId, timeoutMs } = req.body;
    if (!command) {
      return res.status(400).json({ success: false, error: 'Command is required' });
    }

    const workingDir = projectId
      ? WorkspaceManager.getWorkspacePath(projectId)
      : process.cwd();

    const exec = ExecutionManager.getInstance();
    const result = await exec.executeCommand({
      command,
      cwd: workingDir,
      projectId,
      timeoutMs: timeoutMs || 25000
    });

    res.json({ success: result.success, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Git Integration API
// ----------------------------------------------------
apiRouter.post('/git', async (req: Request, res: Response) => {
  try {
    const { projectId, action, message } = req.body;
    if (!projectId) return res.status(400).json({ success: false, error: 'projectId is required' });

    let gitArgs: string[] = [];
    if (action === 'status') gitArgs = ['status'];
    else if (action === 'diff') gitArgs = ['diff'];
    else if (action === 'log') gitArgs = ['log', '-n', '5', '--oneline'];
    else if (action === 'init') gitArgs = ['init'];
    else if (action === 'commit') gitArgs = ['add', '.', '&&', 'git', 'commit', '-m', `"${message || 'Omnintellx update'}"`];
    else return res.status(400).json({ success: false, error: `Unsupported git action: ${action}` });

    const result = await WorkspaceManager.runGitCommand(projectId, gitArgs);
    res.json({ success: result.success, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// System Prompts API
// ----------------------------------------------------
apiRouter.get('/prompts', async (req: Request, res: Response) => {
  try {
    const { SystemPromptsManager } = await import('./models/systemPrompts');
    const prompts = SystemPromptsManager.getPrompts();
    res.json({ success: true, prompts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/prompts', async (req: Request, res: Response) => {
  try {
    const { SystemPromptsManager } = await import('./models/systemPrompts');
    const updated = SystemPromptsManager.savePrompts(req.body);
    res.json({ success: true, prompts: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Model Provider & Chat APIs
// ----------------------------------------------------
apiRouter.post('/models/test', async (req: Request, res: Response) => {
  try {
    const { provider, apiKey, baseUrl, model } = req.body;
    const testResult = await ModelService.testConnection(provider || 'gemini', { apiKey, baseUrl, model });
    res.json(testResult);
  } catch (err: any) {
    res.status(500).json({ ok: false, status: 'FAILED', statusCode: 500, errorType: 'NETWORK', latencyMs: 0, message: err.message, error: err.message });
  }
});

apiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { provider, model, apiKey, messages, temperature } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: 'Messages array is required' });
    }
    const responseText = await ModelService.chat({
      provider: provider || 'gemini',
      model: model || 'gemini-2.5-flash',
      apiKey,
      messages,
      temperature
    });
    res.json({ success: true, text: responseText });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Standalone HTML Download & Fresh Generation Endpoint
// ----------------------------------------------------
apiRouter.get('/download/omnintellx.html', (req: Request, res: Response) => {
  const candidatePaths = [
    path.join(process.cwd(), 'output', 'omni', 'index.html'),
    path.join(process.cwd(), 'output', 'omni', 'standalone.html'),
    path.join(process.cwd(), 'final_codes', 'omnintellx.html'),
    path.join(process.cwd(), 'final_codes', 'index.html'),
    path.join(process.cwd(), 'final_codes', 'standalone.html'),
    path.join(process.cwd(), 'dist', 'index.html')
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="omnintellx.html"');
      return res.sendFile(p);
    }
  }

  // Fallback inline HTML generator if no static file on disk
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="omnintellx.html"');
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Omnintellx Standalone</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#0B0E14] text-white p-8"><h1 class="text-2xl font-bold text-emerald-400">Omnintellx Standalone Bundle</h1><p class="text-xs text-slate-400 mt-2">Active standalone workspace deliverable.</p></body></html>`);
});

apiRouter.get('/download/docs.zip', (req: Request, res: Response) => {
  const candidateZipPaths = [
    path.join(process.cwd(), 'final_codes', 'docs.zip'),
    path.join(process.cwd(), 'output', 'omni', 'docs.zip'),
    path.join(process.cwd(), 'final_codes', 'omnintellx-final.zip')
  ];

  for (const zipPath of candidateZipPaths) {
    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="docs.zip"');
      return res.sendFile(zipPath);
    }
  }
  res.status(404).send('Documentation archive not found.');
});

// ----------------------------------------------------
// Project Direct HTTP Download APIs (Mobile & Browser Safe)
// ----------------------------------------------------
apiRouter.get('/projects/:id/download/standalone', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const project = OmnintellxDatabase.getProjectById(projectId);
    const candidateFiles = [
      'omni/index.html',
      'output/omni/index.html',
      'final_codes/index.html',
      'omni/standalone.html',
      'output/omni/standalone.html',
      'final_codes/standalone.html',
      'index.html'
    ];

    let content = '';
    for (const rel of candidateFiles) {
      try {
        content = await WorkspaceManager.readFile(projectId, rel);
        if (content && content.length > 0) break;
      } catch {}
    }

    if (!content) {
      const filesMeta = await WorkspaceManager.listFiles(projectId);
      const wsFiles: any[] = [];
      for (const fm of filesMeta) {
        if (!fm.isDirectory) {
          try {
            wsFiles.push({ path: fm.relativePath, content: await WorkspaceManager.readFile(projectId, fm.relativePath), size: fm.size });
          } catch {}
        }
      }
      const suite = generateGenericOutputSuite(project?.name || projectId, wsFiles);
      content = suite['output/omni/index.html'] || suite['final_codes/index.html'] || '<!DOCTYPE html><html><body><h1>Omnintellx Standalone</h1></body></html>';
    }

    const filename = `${(project?.name || 'omnintellx').replace(/[^a-zA-Z0-9_-]/g, '_')}-standalone.html`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/projects/:id/download/zip', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const project = OmnintellxDatabase.getProjectById(projectId);
    const filesMeta = await WorkspaceManager.listFiles(projectId);

    const zip = new JSZip();

    for (const fm of filesMeta) {
      if (!fm.isDirectory) {
        try {
          const content = await WorkspaceManager.readFile(projectId, fm.relativePath);
          zip.file(fm.relativePath, content);
        } catch {}
      }
    }

    // Ensure output/omni/ and final_codes/ exist in the zip
    const generated = generateGenericOutputSuite(project?.name || projectId, []);
    for (const [p, c] of Object.entries(generated)) {
      if (!zip.file(p)) {
        zip.file(p, c);
      }
    }

    zip.file('README.md', `# ${project?.name || 'Omnintellx Project'}\nExported complete production application.\nDual deliverable directories:\n- output/omni/\n- final_codes/\n`);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const filename = `${(project?.name || 'omnintellx').replace(/[^a-zA-Z0-9_-]/g, '_')}-release.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', zipBuffer.length.toString());
    res.send(zipBuffer);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/projects/:id/download/file', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'path query parameter is required' });
    }

    const content = await WorkspaceManager.readFile(projectId, filePath);
    const basename = path.basename(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${basename}"`);
    res.setHeader('Content-Type', filePath.endsWith('.html') ? 'text/html' : filePath.endsWith('.json') ? 'application/json' : 'text/plain');
    res.send(content);
  } catch (err: any) {
    res.status(404).json({ success: false, error: `File not found: ${err.message}` });
  }
});

apiRouter.get('/projects/:id/download/apk', async (req: Request, res: Response) => {
  try {
    const candidatePaths = [
      path.join(process.cwd(), 'android', 'app-debug.apk'),
      path.join(process.cwd(), 'omni', 'app-debug.apk'),
      path.join(process.cwd(), 'final_codes', 'app-debug.apk'),
      path.join(process.cwd(), 'public', 'app-debug.apk')
    ];

    let foundPath = candidatePaths.find(p => fs.existsSync(p));
    if (!foundPath) {
      try {
        const { execSync } = require('child_process');
        execSync('python3 scripts/generate_apk_package.py');
        foundPath = candidatePaths.find(p => fs.existsSync(p));
      } catch {}
    }

    if (foundPath && fs.existsSync(foundPath)) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="app-debug.apk"');
      return res.sendFile(foundPath);
    }

    res.status(404).json({ success: false, error: 'APK package not ready' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

