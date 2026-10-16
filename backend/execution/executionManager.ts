import { IExecutionProvider, CommandExecutionRequest, CommandExecutionResult } from './types';
import { LocalExecutionProvider } from './localExecutionProvider';

export class SandboxExecutionProvider implements IExecutionProvider {
  name = 'SandboxExecutionProvider (Docker/MicroVM)';

  async isAvailable(): Promise<boolean> {
    // Sandbox container daemon can be detected or configured here
    return process.env.SANDBOX_ENABLED === 'true';
  }

  async execute(request: CommandExecutionRequest): Promise<CommandExecutionResult> {
    return {
      exitCode: 1,
      stdout: '',
      stderr: 'SANDBOX_UNAVAILABLE: MicroVM/Container sandbox adapter is not provisioned. Falling back to LocalExecutionProvider.',
      durationMs: 0,
      timedOut: false,
      command: request.command,
      workingDirectory: request.cwd || '',
      success: false,
      error: 'SANDBOX_UNAVAILABLE'
    };
  }

  async terminateActiveProcesses(): Promise<void> {
    // no-op for mock sandbox
  }
}

export class ExecutionManager {
  private static instance: ExecutionManager;
  private providers: Map<string, IExecutionProvider> = new Map();
  private defaultProvider: IExecutionProvider;

  private constructor() {
    const local = new LocalExecutionProvider();
    const sandbox = new SandboxExecutionProvider();
    this.providers.set('local', local);
    this.providers.set('sandbox', sandbox);
    this.defaultProvider = local;
  }

  static getInstance(): ExecutionManager {
    if (!ExecutionManager.instance) {
      ExecutionManager.instance = new ExecutionManager();
    }
    return ExecutionManager.instance;
  }

  async executeCommand(request: CommandExecutionRequest, preferredProvider = 'local'): Promise<CommandExecutionResult> {
    const provider = this.providers.get(preferredProvider) || this.defaultProvider;
    const available = await provider.isAvailable();
    if (!available && provider !== this.defaultProvider) {
      return this.defaultProvider.execute(request);
    }
    return provider.execute(request);
  }

  async terminate(projectId?: string): Promise<void> {
    for (const p of this.providers.values()) {
      await p.terminateActiveProcesses(projectId);
    }
  }
}
