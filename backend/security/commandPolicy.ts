export interface CommandValidationResult {
  allowed: boolean;
  reason?: string;
  sanitizedBinary: string;
  sanitizedArgs: string[];
}

export class CommandPolicy {
  // Allowed development and system binaries
  private static readonly ALLOWED_BINARIES = new Set<string>([
    'node',
    'npm',
    'npx',
    'yarn',
    'pnpm',
    'bun',
    'python',
    'python3',
    'pytest',
    'pip',
    'pip3',
    'git',
    'tsc',
    'vite',
    'cat',
    'ls',
    'mkdir',
    'echo',
    'touch',
    'cp',
    'mv',
    'find',
    'grep',
    'pwd',
    'which',
    'head',
    'tail',
    'diff',
    'wc',
    'curl'
  ]);

  // Forbidden substrings or dangerous shell sequences
  private static readonly FORBIDDEN_PATTERNS = [
    /rm\s+(-[a-zA-Z]*r[a-zA-Z]*\s+|\s+--recursive\s+)?(\/|\/\*|~\/)/i, // rm -rf / or rm -rf ~
    /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/, // Fork bomb
    /mkfs/i,
    /dd\s+if=/i,
    />\s*\/dev\/(sda|hda|nvme|null|zero)/i,
    /chmod\s+(-R\s+)?777\s+\//i,
    /\/etc\/(passwd|shadow|sudoers)/i,
    /curl.*\|\s*(ba)?sh/i,
    /wget.*\|\s*(ba)?sh/i
  ];

  /**
   * Evaluates whether a raw command string is permitted under the Omnintellx security policy.
   */
  static validate(rawCommand: string): CommandValidationResult {
    if (!rawCommand || typeof rawCommand !== 'string') {
      return { allowed: false, reason: 'Command must be a non-empty string', sanitizedBinary: '', sanitizedArgs: [] };
    }

    const trimmed = rawCommand.trim();
    if (trimmed.length === 0) {
      return { allowed: false, reason: 'Empty command', sanitizedBinary: '', sanitizedArgs: [] };
    }

    // Check for dangerous patterns
    for (const pattern of this.FORBIDDEN_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          allowed: false,
          reason: `COMMAND_SECURITY_VIOLATION: Command matched high-risk security pattern (${pattern})`,
          sanitizedBinary: '',
          sanitizedArgs: []
        };
      }
    }

    // Tokenize command line into binary and arguments
    const parts = trimmed.split(/\s+/);
    const binary = parts[0];
    const baseBinary = binary.split('/').pop() || binary;

    if (!this.ALLOWED_BINARIES.has(baseBinary)) {
      return {
        allowed: false,
        reason: `COMMAND_NOT_ALLOWED: Binary '${baseBinary}' is not in the Omnintellx safe development command allowlist. Allowed: ${Array.from(this.ALLOWED_BINARIES).join(', ')}`,
        sanitizedBinary: baseBinary,
        sanitizedArgs: parts.slice(1)
      };
    }

    return {
      allowed: true,
      sanitizedBinary: baseBinary,
      sanitizedArgs: parts.slice(1)
    };
  }
}
