export interface CommandExecutionRequest {
  command: string;
  args?: string[];
  cwd?: string;
  timeoutMs?: number;
  env?: Record<string, string>;
  projectId?: string;
}

export interface CommandExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  command: string;
  workingDirectory: string;
  success: boolean;
  error?: string;
}

export interface IExecutionProvider {
  name: string;
  execute(request: CommandExecutionRequest): Promise<CommandExecutionResult>;
  isAvailable(): Promise<boolean>;
  terminateActiveProcesses(projectId?: string): Promise<void>;
}
