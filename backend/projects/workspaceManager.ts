import fs from 'fs';
import path from 'path';
import { PathSecurity } from '../security/pathSecurity';
import { ExecutionManager } from '../execution/executionManager';

export interface WorkspaceFileMetadata {
  name: string;
  relativePath: string;
  size: number;
  updatedAt: number;
  isDirectory: boolean;
}

export class WorkspaceManager {
  private static readonly BASE_WORKSPACES_DIR = path.resolve(process.cwd(), 'workspaces');

  static getWorkspacePath(projectId: string): string {
    const sanitizedId = projectId.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const wsPath = path.join(this.BASE_WORKSPACES_DIR, sanitizedId);
    if (!fs.existsSync(wsPath)) {
      fs.mkdirSync(wsPath, { recursive: true });
    }
    return wsPath;
  }

  static getCheckpointsPath(projectId: string): string {
    const wsPath = this.getWorkspacePath(projectId);
    const cpPath = path.join(wsPath, '.omni_checkpoints');
    if (!fs.existsSync(cpPath)) {
      fs.mkdirSync(cpPath, { recursive: true });
    }
    return cpPath;
  }

  static async writeFile(projectId: string, relativePath: string, content: string): Promise<{ success: boolean; bytes: number; path: string }> {
    const wsRoot = this.getWorkspacePath(projectId);
    const targetPath = PathSecurity.safeResolve(wsRoot, relativePath);
    const targetDir = path.dirname(targetPath);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    await fs.promises.writeFile(targetPath, content, 'utf-8');
    const stats = await fs.promises.stat(targetPath);

    return {
      success: true,
      bytes: stats.size,
      path: relativePath
    };
  }

  static async readFile(projectId: string, relativePath: string): Promise<string> {
    const wsRoot = this.getWorkspacePath(projectId);
    const targetPath = PathSecurity.safeResolve(wsRoot, relativePath);

    if (!fs.existsSync(targetPath)) {
      throw new Error(`FILE_NOT_FOUND: File "${relativePath}" does not exist in workspace.`);
    }

    return fs.promises.readFile(targetPath, 'utf-8');
  }

  static async deleteFile(projectId: string, relativePath: string): Promise<boolean> {
    const wsRoot = this.getWorkspacePath(projectId);
    const targetPath = PathSecurity.safeResolve(wsRoot, relativePath);

    if (!fs.existsSync(targetPath)) {
      return false;
    }

    const stat = await fs.promises.stat(targetPath);
    if (stat.isDirectory()) {
      await fs.promises.rm(targetPath, { recursive: true, force: true });
    } else {
      await fs.promises.unlink(targetPath);
    }
    return true;
  }

  static async listFiles(projectId: string, subDir = ''): Promise<WorkspaceFileMetadata[]> {
    const wsRoot = this.getWorkspacePath(projectId);
    const targetDir = subDir ? PathSecurity.safeResolve(wsRoot, subDir) : wsRoot;

    if (!fs.existsSync(targetDir)) {
      return [];
    }

    const results: WorkspaceFileMetadata[] = [];
    const scan = async (dir: string, relBase: string) => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === '.git' || entry.name === '.omni_checkpoints' || entry.name === 'node_modules') {
          continue;
        }
        const full = path.join(dir, entry.name);
        const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          results.push({
            name: entry.name,
            relativePath: rel,
            size: 0,
            updatedAt: Date.now(),
            isDirectory: true
          });
          await scan(full, rel);
        } else {
          const st = await fs.promises.stat(full);
          results.push({
            name: entry.name,
            relativePath: rel,
            size: st.size,
            updatedAt: st.mtimeMs,
            isDirectory: false
          });
        }
      }
    };

    await scan(targetDir, '');
    return results;
  }

  static async editFile(projectId: string, relativePath: string, target: string, replacement: string): Promise<{ success: boolean; bytes: number; path: string }> {
    const wsRoot = this.getWorkspacePath(projectId);
    const targetPath = PathSecurity.safeResolve(wsRoot, relativePath);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`FILE_NOT_FOUND: File "${relativePath}" does not exist in workspace.`);
    }

    const currentContent = await fs.promises.readFile(targetPath, 'utf-8');
    if (!currentContent.includes(target)) {
      throw new Error(`TARGET_NOT_FOUND: Specified target string not found in "${relativePath}".`);
    }

    const newContent = currentContent.replace(target, replacement);
    await fs.promises.writeFile(targetPath, newContent, 'utf-8');
    const stats = await fs.promises.stat(targetPath);

    return {
      success: true,
      bytes: stats.size,
      path: relativePath
    };
  }

  static async createDirectory(projectId: string, relativePath: string): Promise<boolean> {
    const wsRoot = this.getWorkspacePath(projectId);
    const targetPath = PathSecurity.safeResolve(wsRoot, relativePath);
    if (!fs.existsSync(targetPath)) {
      await fs.promises.mkdir(targetPath, { recursive: true });
    }
    return true;
  }

  static async searchFiles(projectId: string, query: string): Promise<Array<{ path: string; line: number; match: string }>> {
    const files = await this.listFiles(projectId);
    const results: Array<{ path: string; line: number; match: string }> = [];
    const lowerQuery = query.toLowerCase();

    for (const f of files) {
      if (f.isDirectory) continue;
      try {
        const content = await this.readFile(projectId, f.relativePath);
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(lowerQuery)) {
            results.push({
              path: f.relativePath,
              line: i + 1,
              match: lines[i].trim()
            });
            if (results.length >= 100) break;
          }
        }
      } catch {
        // ignore unreadable
      }
    }
    return results;
  }

  static async inspectProject(projectId: string): Promise<{
    framework: string;
    entryPoints: string[];
    fileCount: number;
    totalBytes: number;
    hasTests: boolean;
    hasBuildScript: boolean;
    dependencies: string[];
  }> {
    const files = await this.listFiles(projectId);
    let totalBytes = 0;
    const filePaths = files.map(f => {
      totalBytes += f.size;
      return f.relativePath;
    });

    let framework = 'vanilla';
    let dependencies: string[] = [];
    let hasBuildScript = false;
    let hasTests = filePaths.some(p => p.includes('test') || p.includes('spec'));

    if (filePaths.includes('package.json')) {
      try {
        const pkgStr = await this.readFile(projectId, 'package.json');
        const pkg = JSON.parse(pkgStr);
        if (pkg.dependencies?.react || pkg.devDependencies?.react) framework = 'react';
        else if (pkg.dependencies?.vue || pkg.devDependencies?.vue) framework = 'vue';
        else if (pkg.dependencies?.express) framework = 'node-express';
        else framework = 'node';

        if (pkg.scripts?.build) hasBuildScript = true;
        if (pkg.scripts?.test) hasTests = true;
        dependencies = Object.keys(pkg.dependencies || {});
      } catch {}
    } else if (filePaths.includes('requirements.txt') || filePaths.some(p => p.endsWith('.py'))) {
      framework = 'python';
    }

    const entryPoints: string[] = [];
    ['index.html', 'src/main.tsx', 'src/main.js', 'src/index.js', 'app.py', 'main.py', 'server.ts', 'server.js'].forEach(ep => {
      if (filePaths.includes(ep)) entryPoints.push(ep);
    });

    return {
      framework,
      entryPoints,
      fileCount: files.filter(f => !f.isDirectory).length,
      totalBytes,
      hasTests,
      hasBuildScript,
      dependencies
    };
  }

  static async getFileMetadata(projectId: string, relativePath: string): Promise<WorkspaceFileMetadata> {
    const wsRoot = this.getWorkspacePath(projectId);
    const targetPath = PathSecurity.safeResolve(wsRoot, relativePath);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`FILE_NOT_FOUND: File "${relativePath}" not found`);
    }
    const st = await fs.promises.stat(targetPath);
    return {
      name: path.basename(targetPath),
      relativePath,
      size: st.size,
      updatedAt: st.mtimeMs,
      isDirectory: st.isDirectory()
    };
  }

  static async getDiff(projectId: string, relativePath: string, newContent: string): Promise<{ before: string; after: string; hasChanges: boolean }> {
    let before = '';
    try {
      before = await this.readFile(projectId, relativePath);
    } catch {
      before = '';
    }
    return {
      before,
      after: newContent,
      hasChanges: before !== newContent
    };
  }

  static async moveFile(projectId: string, sourcePath: string, destPath: string): Promise<boolean> {
    const wsRoot = this.getWorkspacePath(projectId);
    const src = PathSecurity.safeResolve(wsRoot, sourcePath);
    const dst = PathSecurity.safeResolve(wsRoot, destPath);

    const dstDir = path.dirname(dst);
    if (!fs.existsSync(dstDir)) {
      fs.mkdirSync(dstDir, { recursive: true });
    }

    await fs.promises.rename(src, dst);
    return true;
  }

  static async copyFile(projectId: string, sourcePath: string, destPath: string): Promise<boolean> {
    const wsRoot = this.getWorkspacePath(projectId);
    const src = PathSecurity.safeResolve(wsRoot, sourcePath);
    const dst = PathSecurity.safeResolve(wsRoot, destPath);

    const dstDir = path.dirname(dst);
    if (!fs.existsSync(dstDir)) {
      fs.mkdirSync(dstDir, { recursive: true });
    }

    await fs.promises.copyFile(src, dst);
    return true;
  }

  static async createCheckpoint(projectId: string, checkpointId: string, name: string): Promise<string> {
    const wsRoot = this.getWorkspacePath(projectId);
    const cpBase = this.getCheckpointsPath(projectId);
    const cpDir = path.join(cpBase, checkpointId);

    if (fs.existsSync(cpDir)) {
      fs.rmSync(cpDir, { recursive: true, force: true });
    }
    fs.mkdirSync(cpDir, { recursive: true });

    // Copy all current project files except .omni_checkpoints and node_modules
    const files = await this.listFiles(projectId);
    for (const f of files) {
      if (!f.isDirectory) {
        const src = path.join(wsRoot, f.relativePath);
        const dst = path.join(cpDir, f.relativePath);
        const dstDir = path.dirname(dst);
        if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
        await fs.promises.copyFile(src, dst);
      }
    }

    // Save checkpoint meta
    await fs.promises.writeFile(
      path.join(cpDir, '_meta.json'),
      JSON.stringify({ id: checkpointId, name, timestamp: Date.now(), filesCount: files.length }, null, 2)
    );

    return cpDir;
  }

  static async restoreCheckpoint(projectId: string, checkpointId: string): Promise<boolean> {
    const wsRoot = this.getWorkspacePath(projectId);
    const cpBase = this.getCheckpointsPath(projectId);
    const cpDir = path.join(cpBase, checkpointId);

    if (!fs.existsSync(cpDir)) {
      throw new Error(`CHECKPOINT_NOT_FOUND: Checkpoint ${checkpointId} does not exist.`);
    }

    // Clear current workspace files (except .omni_checkpoints)
    const currentFiles = await this.listFiles(projectId);
    for (const f of currentFiles) {
      const full = path.join(wsRoot, f.relativePath);
      if (fs.existsSync(full)) {
        try {
          if (f.isDirectory) {
            fs.rmSync(full, { recursive: true, force: true });
          } else {
            fs.unlinkSync(full);
          }
        } catch {
          // ignore
        }
      }
    }

    // Copy checkpoint files back to workspace root
    const scanAndCopy = async (dir: string, relBase: string) => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === '_meta.json') continue;
        const full = path.join(dir, entry.name);
        const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          const targetDir = path.join(wsRoot, rel);
          if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
          await scanAndCopy(full, rel);
        } else {
          const targetFile = path.join(wsRoot, rel);
          const targetDir = path.dirname(targetFile);
          if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
          await fs.promises.copyFile(full, targetFile);
        }
      }
    };

    await scanAndCopy(cpDir, '');
    return true;
  }

  // Real Git operations
  static async runGitCommand(projectId: string, gitArgs: string[]): Promise<any> {
    const wsRoot = this.getWorkspacePath(projectId);
    const execManager = ExecutionManager.getInstance();
    return execManager.executeCommand({
      command: `git ${gitArgs.join(' ')}`,
      cwd: wsRoot,
      projectId
    });
  }
}
