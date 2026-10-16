/**
 * Omnintellx — Authentic Browser Virtual Workspace Engine
 * Implements real, un-faked browser filesystem operations for Version A & B.
 * Every tool returns structured results { ok, tool, ... } with zero fabricated metrics.
 */

import { Project, ProjectFile, Checkpoint } from '../types';
import { RealProjectValidator, ValidationReport } from './realValidator';

export interface WorkspaceToolResult {
  ok: boolean;
  tool: string;
  path?: string;
  action?: string;
  bytes?: number;
  data?: any;
  error?: string;
  timestamp?: number;
}

export class VirtualWorkspace {
  private project: Project;
  private checkpoints: Checkpoint[] = [];
  private onProjectUpdated?: (p: Project) => void;

  constructor(project: Project, onProjectUpdated?: (p: Project) => void) {
    this.project = project;
    this.onProjectUpdated = onProjectUpdated;
  }

  setProject(p: Project) {
    this.project = p;
  }

  getProject(): Project {
    return this.project;
  }

  private notify() {
    this.project.updatedAt = Date.now();
    this.onProjectUpdated?.(this.project);
  }

  // 1. create_project
  create_project(name: string, description = ''): WorkspaceToolResult {
    if (!name || name.trim().length === 0) {
      return { ok: false, tool: 'create_project', error: 'Project name cannot be empty' };
    }
    const id = `proj_${Date.now()}`;
    const newProject: Project = {
      id,
      name: name.trim(),
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      files: []
    };
    this.project = newProject;
    this.notify();
    return {
      ok: true,
      tool: 'create_project',
      action: 'created',
      data: { id, name: newProject.name }
    };
  }

  // 2. list_files
  list_files(subDir = ''): WorkspaceToolResult {
    const cleanSub = subDir.replace(/^\/+|\/+$/g, '');
    let files = this.project.files;

    if (cleanSub) {
      files = files.filter(f => f.name.startsWith(cleanSub + '/'));
    }

    return {
      ok: true,
      tool: 'list_files',
      data: files.map(f => ({
        path: f.name,
        sizeBytes: Buffer.byteLength(f.content || '', 'utf-8'),
        updatedAt: f.updatedAt || this.project.updatedAt
      }))
    };
  }

  // 3. read_file
  read_file(filePath: string): WorkspaceToolResult {
    if (!filePath) return { ok: false, tool: 'read_file', error: 'File path required' };
    const norm = filePath.replace(/^\/+/, '');
    const file = this.project.files.find(f => f.name === norm);
    if (!file) {
      return { ok: false, tool: 'read_file', path: norm, error: `File not found: "${norm}"` };
    }
    return {
      ok: true,
      tool: 'read_file',
      path: norm,
      bytes: Buffer.byteLength(file.content, 'utf-8'),
      data: { content: file.content }
    };
  }

  // 4. write_file
  write_file(filePath: string, content: string): WorkspaceToolResult {
    if (!filePath || filePath.trim().length === 0) {
      return { ok: false, tool: 'write_file', error: 'Invalid path' };
    }
    const norm = filePath.replace(/^\/+/, '').trim();
    const existingIdx = this.project.files.findIndex(f => f.name === norm);
    const bytes = Buffer.byteLength(content || '', 'utf-8');

    if (existingIdx >= 0) {
      this.project.files[existingIdx].content = content;
      this.project.files[existingIdx].updatedAt = Date.now();
      this.notify();
      return {
        ok: true,
        tool: 'write_file',
        path: norm,
        action: 'updated',
        bytes
      };
    } else {
      const newFile: ProjectFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: norm,
        content: content || '',
        updatedAt: Date.now()
      };
      this.project.files.push(newFile);
      this.notify();
      return {
        ok: true,
        tool: 'write_file',
        path: norm,
        action: 'created',
        bytes
      };
    }
  }

  // 5. edit_file / patch_file
  patch_file(filePath: string, target: string, replacement: string): WorkspaceToolResult {
    if (!filePath || target === undefined || replacement === undefined) {
      return { ok: false, tool: 'patch_file', error: 'Missing path, target, or replacement' };
    }
    const norm = filePath.replace(/^\/+/, '').trim();
    const file = this.project.files.find(f => f.name === norm);
    if (!file) {
      return { ok: false, tool: 'patch_file', path: norm, error: `File not found: "${norm}"` };
    }
    if (!file.content.includes(target)) {
      return {
        ok: false,
        tool: 'patch_file',
        path: norm,
        error: `Target string was not found in "${norm}". Unable to apply patch.`
      };
    }

    file.content = file.content.replace(target, replacement);
    file.updatedAt = Date.now();
    this.notify();

    return {
      ok: true,
      tool: 'patch_file',
      path: norm,
      action: 'patched',
      bytes: Buffer.byteLength(file.content, 'utf-8')
    };
  }

  // 6. delete_file
  delete_file(filePath: string): WorkspaceToolResult {
    if (!filePath) return { ok: false, tool: 'delete_file', error: 'File path required' };
    const norm = filePath.replace(/^\/+/, '').trim();
    const lenBefore = this.project.files.length;
    this.project.files = this.project.files.filter(f => f.name !== norm);

    if (this.project.files.length === lenBefore) {
      return { ok: false, tool: 'delete_file', path: norm, error: `File not found: "${norm}"` };
    }

    this.notify();
    return {
      ok: true,
      tool: 'delete_file',
      path: norm,
      action: 'deleted'
    };
  }

  // 7. rename_file
  rename_file(oldPath: string, newPath: string): WorkspaceToolResult {
    if (!oldPath || !newPath) {
      return { ok: false, tool: 'rename_file', error: 'Both oldPath and newPath are required' };
    }
    const normOld = oldPath.replace(/^\/+/, '').trim();
    const normNew = newPath.replace(/^\/+/, '').trim();
    const file = this.project.files.find(f => f.name === normOld);
    if (!file) {
      return { ok: false, tool: 'rename_file', error: `File not found: "${normOld}"` };
    }
    file.name = normNew;
    file.updatedAt = Date.now();
    this.notify();
    return {
      ok: true,
      tool: 'rename_file',
      action: 'renamed',
      data: { from: normOld, to: normNew }
    };
  }

  // 8. search_files
  search_files(query: string): WorkspaceToolResult {
    if (!query) return { ok: false, tool: 'search_files', error: 'Search query required' };
    const matches: Array<{ file: string; line: number; text: string }> = [];

    this.project.files.forEach(f => {
      const lines = f.content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes(query) && matches.length < 50) {
          matches.push({
            file: f.name,
            line: idx + 1,
            text: line.trim().slice(0, 160)
          });
        }
      });
    });

    return {
      ok: true,
      tool: 'search_files',
      data: { query, totalMatches: matches.length, matches }
    };
  }

  // 9. diff_files
  diff_files(filePath: string, newContent: string): WorkspaceToolResult {
    const norm = filePath.replace(/^\/+/, '').trim();
    const file = this.project.files.find(f => f.name === norm);
    const oldContent = file?.content || '';
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    return {
      ok: true,
      tool: 'diff_files',
      path: norm,
      data: {
        linesBefore: oldLines.length,
        linesAfter: newLines.length,
        hasChanged: oldContent !== newContent
      }
    };
  }

  // 10. inspect_project
  inspect_project(): WorkspaceToolResult {
    const htmlFile = this.project.files.find(f => f.name === 'index.html' || f.name.endsWith('.html'));
    const cssFiles = this.project.files.filter(f => f.name.endsWith('.css'));
    const jsFiles = this.project.files.filter(f => f.name.endsWith('.js') || f.name.endsWith('.ts'));
    const totalBytes = this.project.files.reduce((acc, f) => acc + Buffer.byteLength(f.content, 'utf-8'), 0);
    const is3D = this.project.files.some(f => /three(\.min)?\.js|webgl|PerspectiveCamera/i.test(f.content));

    return {
      ok: true,
      tool: 'inspect_project',
      data: {
        projectId: this.project.id,
        projectName: this.project.name,
        fileCount: this.project.files.length,
        totalBytes,
        entryPoint: htmlFile?.name || 'none',
        hasHtml: !!htmlFile,
        cssCount: cssFiles.length,
        jsCount: jsFiles.length,
        is3DProject: is3D
      }
    };
  }

  // 11. validate_project
  validate_project(): WorkspaceToolResult {
    const report: ValidationReport = RealProjectValidator.validateProject(this.project.files);
    return {
      ok: report.failed === 0,
      tool: 'validate_project',
      data: {
        allPassed: report.failed === 0,
        passed: report.passed,
        warnings: report.warnings,
        failed: report.failed,
        checks: report.checks
      }
    };
  }

  // 12. preview_project
  preview_project(): WorkspaceToolResult {
    const htmlFile = this.project.files.find(f => f.name === 'index.html' || f.name.endsWith('.html'));
    if (!htmlFile) {
      return {
        ok: false,
        tool: 'preview_project',
        error: 'Cannot preview project: missing index.html entry point'
      };
    }

    // Inline CSS and JS into single standalone blob
    let fullHtml = htmlFile.content;
    this.project.files.filter(f => f.name.endsWith('.css')).forEach(css => {
      fullHtml = fullHtml.replace(
        new RegExp(`<link[^>]*href=["']${css.name}["'][^>]*>`, 'gi'),
        `<style>\n/* ${css.name} */\n${css.content}\n</style>`
      );
    });

    this.project.files.filter(f => f.name.endsWith('.js')).forEach(js => {
      fullHtml = fullHtml.replace(
        new RegExp(`<script[^>]*src=["']${js.name}["'][^>]*>\\s*</script>`, 'gi'),
        `<script>\n// ${js.name}\n${js.content}\n</script>`
      );
    });

    return {
      ok: true,
      tool: 'preview_project',
      data: {
        entryPoint: htmlFile.name,
        bundledHtmlLength: fullHtml.length,
        status: 'READY'
      }
    };
  }

  // 13. checkpoint & restore
  checkpoint(name: string, reason = ''): WorkspaceToolResult {
    const id = `ckpt_${Date.now()}`;
    const snap: Checkpoint = {
      id,
      ts: Date.now(),
      timestamp: Date.now(),
      name: name || 'Snapshot',
      reason,
      snapshotFiles: JSON.parse(JSON.stringify(this.project.files)),
      files: JSON.parse(JSON.stringify(this.project.files)),
      tasks: [],
      artifacts: [],
      contracts: [],
      timelineEvents: []
    };
    this.checkpoints.push(snap);
    return {
      ok: true,
      tool: 'checkpoint',
      action: 'created',
      data: { checkpointId: id, name: snap.name, timestamp: snap.timestamp }
    };
  }

  restore_checkpoint(checkpointId: string): WorkspaceToolResult {
    const found = this.checkpoints.find(c => c.id === checkpointId);
    if (!found) {
      return { ok: false, tool: 'restore_checkpoint', error: `Checkpoint "${checkpointId}" not found` };
    }
    this.project.files = JSON.parse(JSON.stringify(found.files));
    this.notify();
    return {
      ok: true,
      tool: 'restore_checkpoint',
      action: 'restored',
      data: { checkpointId, restoredFiles: this.project.files.length }
    };
  }

  // 14. export_project
  export_project(): WorkspaceToolResult {
    const manifest = {
      name: this.project.name,
      id: this.project.id,
      exportedAt: new Date().toISOString(),
      filesCount: this.project.files.length,
      files: this.project.files.map(f => f.name)
    };

    return {
      ok: true,
      tool: 'export_project',
      data: {
        project: this.project.name,
        manifest,
        jsonPayload: JSON.stringify(this.project, null, 2)
      }
    };
  }
}
