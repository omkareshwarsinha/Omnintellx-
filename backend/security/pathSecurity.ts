import path from 'path';

export class PathSecurity {
  /**
   * Safely resolves a relative path within a designated root workspace directory.
   * Throws an error if path tries to escape via ../ or absolute paths outside root.
   */
  static safeResolve(workspaceRoot: string, relativePath: string): string {
    const normalizedRoot = path.resolve(workspaceRoot);
    const resolvedPath = path.resolve(normalizedRoot, relativePath);

    // Ensure resolved path starts strictly within the normalized root boundary
    const rootWithSep = normalizedRoot.endsWith(path.sep) ? normalizedRoot : normalizedRoot + path.sep;
    if (resolvedPath !== normalizedRoot && !resolvedPath.startsWith(rootWithSep)) {
      throw new Error(`PATH_TRAVERSAL_BLOCKED: Attempted access outside workspace root (${relativePath})`);
    }

    // Check for suspicious system directories
    const lower = resolvedPath.toLowerCase();
    const bannedSystemPrefixes = ['/etc', '/sys', '/proc', '/dev', '/var/run', '/root', '/system'];
    for (const prefix of bannedSystemPrefixes) {
      if (lower === prefix || lower.startsWith(prefix + '/')) {
        throw new Error(`SYSTEM_PATH_ACCESS_DENIED: Access to ${prefix} is strictly forbidden`);
      }
    }

    return resolvedPath;
  }

  /**
   * Validates relative file name within a project
   */
  static sanitizeRelativePath(filePath: string): string {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('INVALID_PATH: Path must be a non-empty string');
    }
    const clean = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (clean.includes('..') || clean.startsWith('/') || clean.startsWith('\\')) {
      throw new Error(`PATH_TRAVERSAL_BLOCKED: Illegal path component in "${filePath}"`);
    }
    return clean;
  }
}
