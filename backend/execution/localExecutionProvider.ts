import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { IExecutionProvider, CommandExecutionRequest, CommandExecutionResult } from './types';
import { CommandPolicy } from '../security/commandPolicy';

export class LocalExecutionProvider implements IExecutionProvider {
  name = 'LocalExecutionProvider';
  private activeProcesses: Map<string, Set<ChildProcess>> = new Map();
  private readonly MAX_OUTPUT_BYTES = 512 * 1024; // 512 KB

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async execute(request: CommandExecutionRequest): Promise<CommandExecutionResult> {
    const startTime = Date.now();
    const timeoutMs = request.timeoutMs || 30000;
    const workingDir = request.cwd ? path.resolve(request.cwd) : process.cwd();
    const projectId = request.projectId || 'global';

    // 1. Command Security Validation
    const validation = CommandPolicy.validate(request.command);
    if (!validation.allowed) {
      return {
        exitCode: 126,
        stdout: '',
        stderr: validation.reason || 'Command execution denied by security policy',
        durationMs: Date.now() - startTime,
        timedOut: false,
        command: request.command,
        workingDirectory: workingDir,
        success: false,
        error: validation.reason
      };
    }

    // 2. Prepare environment (exclude sensitive host environment variables)
    const safeEnv = { ...process.env, ...request.env };
    // Strip critical host tokens from child processes if they don't need them
    delete safeEnv.AWS_SECRET_ACCESS_KEY;
    delete safeEnv.GITHUB_TOKEN;

    return new Promise<CommandExecutionResult>((resolve) => {
      let stdoutAcc = '';
      let stderrAcc = '';
      let timedOut = false;
      let finished = false;

      // Spawn using shell if complex command or directly
      const child = spawn(request.command, {
        cwd: workingDir,
        env: safeEnv,
        shell: true,
        timeout: timeoutMs
      });

      // Track active process
      if (!this.activeProcesses.has(projectId)) {
        this.activeProcesses.set(projectId, new Set());
      }
      this.activeProcesses.get(projectId)!.add(child);

      const timer = setTimeout(() => {
        if (!finished) {
          timedOut = true;
          try {
            child.kill('SIGKILL');
          } catch {
            // ignore
          }
        }
      }, timeoutMs);

      child.stdout?.on('data', (chunk: Buffer) => {
        if (stdoutAcc.length < this.MAX_OUTPUT_BYTES) {
          stdoutAcc += chunk.toString('utf-8');
          if (stdoutAcc.length >= this.MAX_OUTPUT_BYTES) {
            stdoutAcc += '\n[OUTPUT TRUNCATED: Reached 512KB buffer limit]';
          }
        }
      });

      child.stderr?.on('data', (chunk: Buffer) => {
        if (stderrAcc.length < this.MAX_OUTPUT_BYTES) {
          stderrAcc += chunk.toString('utf-8');
          if (stderrAcc.length >= this.MAX_OUTPUT_BYTES) {
            stderrAcc += '\n[STDERR TRUNCATED: Reached 512KB buffer limit]';
          }
        }
      });

      child.on('error', (err: Error) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        this.cleanupProcess(projectId, child);

        resolve({
          exitCode: 1,
          stdout: stdoutAcc,
          stderr: stderrAcc ? `${stderrAcc}\n${err.message}` : err.message,
          durationMs: Date.now() - startTime,
          timedOut: false,
          command: request.command,
          workingDirectory: workingDir,
          success: false,
          error: err.message
        });
      });

      child.on('close', (code: number | null) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        this.cleanupProcess(projectId, child);

        const exitCode = timedOut ? 124 : (code ?? 0);
        resolve({
          exitCode,
          stdout: stdoutAcc,
          stderr: timedOut ? `${stderrAcc}\nCOMMAND_TIMEOUT: Process exceeded execution limit of ${timeoutMs}ms` : stderrAcc,
          durationMs: Date.now() - startTime,
          timedOut,
          command: request.command,
          workingDirectory: workingDir,
          success: exitCode === 0,
          error: timedOut ? 'COMMAND_TIMEOUT' : (exitCode !== 0 ? `Process exited with code ${exitCode}` : undefined)
        });
      });
    });
  }

  async terminateActiveProcesses(projectId?: string): Promise<void> {
    if (projectId && this.activeProcesses.has(projectId)) {
      const set = this.activeProcesses.get(projectId)!;
      for (const proc of set) {
        try {
          proc.kill('SIGTERM');
          setTimeout(() => {
            try { proc.kill('SIGKILL'); } catch { /* ignore */ }
          }, 1000);
        } catch {
          // ignore
        }
      }
      set.clear();
      this.activeProcesses.delete(projectId);
    } else if (!projectId) {
      for (const [, set] of this.activeProcesses) {
        for (const proc of set) {
          try {
            proc.kill('SIGKILL');
          } catch {
            // ignore
          }
        }
        set.clear();
      }
      this.activeProcesses.clear();
    }
  }

  private cleanupProcess(projectId: string, child: ChildProcess) {
    const set = this.activeProcesses.get(projectId);
    if (set) {
      set.delete(child);
      if (set.size === 0) {
        this.activeProcesses.delete(projectId);
      }
    }
  }
}
