/**
 * Omnintellx — Authentic Capability Registry
 * Enforces strict environment boundaries:
 * The agent MUST know what the current environment can actually do.
 * Never claim capabilities that do not exist.
 */

export interface EnvironmentCapabilities {
  browser_workspace: boolean;
  indexeddb: boolean;
  preview: boolean;
  webgl: boolean;
  static_validation: boolean;
  browser_console_capture: boolean;
  shell: boolean;
  node_runtime: boolean;
  native_filesystem: boolean;
  php_backend: boolean;
  arbitrary_os_commands: boolean;
}

export class CapabilityRegistry {
  private static detectWebGL(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  }

  private static detectIndexedDB(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return !!window.indexedDB;
    } catch {
      return false;
    }
  }

  static getCapabilities(isPhpBackendAvailable = false): EnvironmentCapabilities {
    const isBrowser = typeof window !== 'undefined';
    const hasIndexedDB = this.detectIndexedDB();
    const hasWebGL = this.detectWebGL();

    return {
      browser_workspace: isBrowser,
      indexeddb: hasIndexedDB,
      preview: isBrowser,
      webgl: hasWebGL,
      static_validation: isBrowser,
      browser_console_capture: isBrowser,
      shell: false, // Explicitly false in browser-first runtime
      node_runtime: false, // Explicitly false
      native_filesystem: false, // Browser runs virtual workspace
      php_backend: isPhpBackendAvailable,
      arbitrary_os_commands: false // Strictly prohibited
    };
  }

  static assertCapability(
    capability: keyof EnvironmentCapabilities,
    isPhpBackendAvailable = false
  ): { ok: boolean; status: 'READY' | 'UNAVAILABLE'; message?: string } {
    const caps = this.getCapabilities(isPhpBackendAvailable);
    if (caps[capability]) {
      return { ok: true, status: 'READY' };
    }
    return {
      ok: false,
      status: 'UNAVAILABLE',
      message: `CAPABILITY_UNAVAILABLE: "${capability}" is not supported in the current environment.`
    };
  }
}
