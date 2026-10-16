/**
 * Omnintellx — Universal Multi-Environment Connection Tester & API Gateway
 * Works across:
 * 1. Web Hosting / PHP (InfinityFree intellx.php)
 * 2. Node.js Full-Stack Backend (/api/models/test)
 * 3. Browser Standalone / On-Device (Direct CORS-safe fetch)
 */

import { ProviderConfig } from '../types';
import { getProviderAdapter } from './providers';

let cachedPhpEndpoint: string | null = null;
let cachedPhpTested = false;

/**
 * Automatically discovers the real working path to intellx.php
 * Handles root (/intellx.php), subfolders (/tools/intellx/intellx.php), and relative (./intellx.php)
 */
export async function resolveWorkingPhpEndpoint(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (cachedPhpEndpoint) return cachedPhpEndpoint;

  const currentPath = window.location.pathname;
  const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));

  const candidates: string[] = [
    './intellx.php',
    currentDir ? `${currentDir}/intellx.php` : '/intellx.php',
    '/tools/intellx/intellx.php',
    '/intellx.php'
  ];

  // Unique candidates
  const uniqueCandidates = Array.from(new Set(candidates));

  for (const url of uniqueCandidates) {
    try {
      const res = await fetch(`${url}?action=system.ping`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && (data.status === 'ONLINE' || data.engine?.includes('Omnintellx'))) {
          cachedPhpEndpoint = url;
          cachedPhpTested = true;
          return url;
        }
      }
    } catch (_) {}
  }

  cachedPhpTested = true;
  return null;
}

export interface ConnectionTestResult {
  ok: boolean;
  providerId?: string;
  providerType?: string;
  modelId?: string;
  status: 'CONNECTED' | 'FAILED';
  latencyMs: number;
  message: string;
  models?: string[];
  gatewayEnvironment: 'PHP_BACKEND' | 'NODE_BACKEND' | 'BROWSER_DIRECT';
  statusCode?: number;
  errorType?: 'AUTHENTICATION' | 'INSUFFICIENT_CREDITS' | 'INVALID_MODEL' | 'RATE_LIMIT' | 'NETWORK' | 'CONFIGURATION';
}

export type GatewayPreference = 'auto' | 'browser_direct' | 'php_backend' | 'node_backend';

/**
 * Universal Connection Tester for any configured Provider
 * Resilient multi-tier strategy: Node -> PHP -> Direct Browser / On-Device
 */
export async function testProviderConnection(
  prov: ProviderConfig,
  preferredGateway: GatewayPreference = 'auto'
): Promise<ConnectionTestResult> {
  const startTime = Date.now();
  const apiKey = prov.apiKey?.trim();
  const targetModel = prov.selectedModelId || prov.defaultModel || (prov.models && prov.models[0]) || '';

  // Validate API key requirement
  if (!prov.isLocalOnly && prov.type !== 'pollinations' && prov.type !== 'custom' && !apiKey) {
    return {
      ok: false,
      status: 'FAILED',
      providerId: prov.id,
      providerType: prov.type,
      modelId: targetModel,
      latencyMs: 0,
      statusCode: 401,
      errorType: 'AUTHENTICATION',
      message: `API Key is required for ${prov.name}. Please enter your key and click Test.`,
      gatewayEnvironment: 'BROWSER_DIRECT'
    };
  }

  // Helper for Direct Browser execution
  const runDirectBrowserTest = async (): Promise<ConnectionTestResult> => {
    try {
      const adapter = getProviderAdapter(prov.type);
      const directRes = await adapter.testConnection(prov);

      if (directRes.ok) {
        return {
          ok: true,
          status: 'CONNECTED',
          providerId: prov.id,
          providerType: prov.type,
          modelId: targetModel,
          latencyMs: directRes.latency || (Date.now() - startTime),
          message: `Verified directly on-device in browser (${directRes.latency}ms)`,
          models: directRes.models && directRes.models.length > 0 ? directRes.models : prov.models,
          gatewayEnvironment: 'BROWSER_DIRECT',
          statusCode: 200
        };
      } else {
        let friendlyError = directRes.error || 'Direct browser connection failed';
        if (friendlyError.toLowerCase().includes('fetch') || friendlyError.toLowerCase().includes('network')) {
          if (prov.type === 'cerebras' || prov.type === 'anthropic') {
            friendlyError = `${prov.name} API enforces browser CORS restrictions. Please use Node backend proxy or deploy with intellx.php.`;
          }
        }

        return {
          ok: false,
          status: 'FAILED',
          providerId: prov.id,
          providerType: prov.type,
          modelId: targetModel,
          latencyMs: directRes.latency || (Date.now() - startTime),
          message: friendlyError,
          gatewayEnvironment: 'BROWSER_DIRECT',
          errorType: 'NETWORK'
        };
      }
    } catch (directErr: any) {
      return {
        ok: false,
        status: 'FAILED',
        providerId: prov.id,
        providerType: prov.type,
        modelId: targetModel,
        latencyMs: Date.now() - startTime,
        message: directErr.message || 'Direct connection probe failed',
        gatewayEnvironment: 'BROWSER_DIRECT',
        errorType: 'NETWORK'
      };
    }
  };

  // If user explicitly requests direct browser / on-device mode
  if (preferredGateway === 'browser_direct') {
    return runDirectBrowserTest();
  }

  // 1. Try Node.js Express Backend (/api/models/test) first if running in fullstack mode
  let nodeTested = false;
  let nodeFailedResult: ConnectionTestResult | null = null;
  if (preferredGateway === 'auto' || preferredGateway === 'node_backend') {
    try {
      const nodeRes = await fetch('/api/models/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: prov.type,
          apiKey: prov.apiKey,
          baseUrl: prov.baseUrl,
          model: targetModel
        }),
        signal: AbortSignal.timeout(12000)
      });

      if (nodeRes.ok) {
        nodeTested = true;
        const nodeData = await nodeRes.json();
        if (nodeData.ok === true || nodeData.status === 'CONNECTED') {
          return {
            ok: true,
            status: 'CONNECTED',
            providerId: prov.id,
            providerType: prov.type,
            modelId: targetModel,
            latencyMs: nodeData.latencyMs || (Date.now() - startTime),
            message: nodeData.message || 'Connected successfully via Node.js API gateway',
            models: nodeData.models || prov.models,
            gatewayEnvironment: 'NODE_BACKEND',
            statusCode: nodeData.statusCode || 200
          };
        } else {
          // Explicit failure returned by Node backend for this provider
          nodeFailedResult = {
            ok: false,
            status: 'FAILED',
            providerId: prov.id,
            providerType: prov.type,
            modelId: targetModel,
            latencyMs: nodeData.latencyMs || (Date.now() - startTime),
            message: nodeData.message || nodeData.error || 'Provider connection rejected',
            gatewayEnvironment: 'NODE_BACKEND',
            statusCode: nodeData.statusCode,
            errorType: nodeData.errorType
          };
          // If preferred was node_backend, or if the provider gave a definitive auth/credit/model rejection, return it immediately!
          if (preferredGateway === 'node_backend' || nodeData.statusCode === 401 || nodeData.statusCode === 402 || nodeData.statusCode === 400) {
            return nodeFailedResult;
          }
        }
      }
    } catch (_) {
      // Node backend not responding on /api/models/test
    }
  }

  // 2. Try PHP Backend (Web host / InfinityFree / Shared hosting)
  let phpTested = false;
  let phpFailedResult: ConnectionTestResult | null = null;
  if (preferredGateway === 'auto' || preferredGateway === 'php_backend') {
    const phpEndpoint = await resolveWorkingPhpEndpoint();
    if (phpEndpoint) {
      try {
        const res = await fetch(`${phpEndpoint}?action=provider.test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId: prov.id,
            type: prov.type,
            apiKey: prov.apiKey,
            baseUrl: prov.baseUrl,
            modelId: targetModel
          }),
          signal: AbortSignal.timeout(15000)
        });

        if (res.ok) {
          phpTested = true;
          const data = await res.json();
          const latency = data.latency || (Date.now() - startTime);
          if (data.ok) {
            return {
              ok: true,
              status: 'CONNECTED',
              providerId: prov.id,
              providerType: prov.type,
              modelId: targetModel,
              latencyMs: latency,
              message: data.message || `Connected successfully via ${phpEndpoint} (${latency}ms)`,
              models: data.models && data.models.length > 0 ? data.models : prov.models,
              gatewayEnvironment: 'PHP_BACKEND',
              statusCode: 200
            };
          } else {
            phpFailedResult = {
              ok: false,
              status: 'FAILED',
              providerId: prov.id,
              providerType: prov.type,
              modelId: targetModel,
              latencyMs: latency,
              message: data.error || data.message || `PHP test failed (${data.statusCode || 400})`,
              gatewayEnvironment: 'PHP_BACKEND',
              statusCode: data.statusCode || 400,
              errorType: data.errorType
            };
            if (preferredGateway === 'php_backend' || data.statusCode === 401 || data.statusCode === 402 || data.statusCode === 400) {
              return phpFailedResult;
            }
          }
        }
      } catch (_) {}
    }
  }

  // If node backend or php backend gave a real failure (e.g. 401, 402, 429), return it rather than running browser CORS test
  if (nodeFailedResult) {
    return nodeFailedResult;
  }
  if (phpFailedResult) {
    return phpFailedResult;
  }

  // 3. Fallback to Direct Browser / On-Device Standalone Probe
  return runDirectBrowserTest();
}
