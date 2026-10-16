/**
 * Omnintellx — Intelligent Model Router & Inference Orchestrator
 * 
 * Invariants Enforced:
 * 1. AUTHORITATIVE IDENTITY: Inference target is ALWAYS { providerId, providerType, modelId }.
 * 2. EXACT MANUAL EXECUTION:
 *    - Manual mode forces fallbackMode = 'NONE'.
 *    - Resolves exact provider ID and model ID.
 *    - Replaces model-only lookup with:
 *      providers.find(p => p.id === target.providerId && p.type === target.providerType)
 *      Verify provider.models.includes(target.modelId)
 *    - Zero silent provider substitution or fallback.
 * 3. EXPLICIT FALLBACK POLICY:
 *    - Default: 'NONE'.
 *    - AUTO mode selects healthy providers and outputs explicit fallback chain in telemetry.
 * 4. REAL TELEMETRY:
 *    - Every execution yields InferenceTelemetry with exact providerName, modelId, duration, status, error.
 */

import {
  ProviderConfig,
  AgentDefinition,
  RoutingMode,
  FallbackMode,
  InferenceTarget,
  InferenceTelemetry,
  ChatMessagePayload,
  ProviderExecutionError
} from '../types';
import { getProviderAdapter } from './providers';

export interface RouteRequest {
  agent?: AgentDefinition;
  taskType?: string;
  contextTokens?: number;
  isPrivate?: boolean;
}

export interface RouteResolution {
  target: InferenceTarget;
  provider: ProviderConfig;
  modelId: string;
  reason: string;
  fallbackChain: InferenceTarget[];
}

export class ModelRouter {
  private routingMode: RoutingMode = 'AUTO';
  private fallbackMode: FallbackMode = 'NONE';
  private localOnly: boolean = false;
  private providers: ProviderConfig[] = [];
  private activeTarget: InferenceTarget | null = null;

  constructor(
    providers: ProviderConfig[] = [],
    routingMode: RoutingMode = 'AUTO',
    localOnly: boolean = false,
    activeTarget: InferenceTarget | null = null,
    fallbackMode: FallbackMode = 'NONE'
  ) {
    this.providers = providers;
    this.routingMode = routingMode;
    this.localOnly = localOnly;
    this.activeTarget = activeTarget;
    this.fallbackMode = fallbackMode;
  }

  getRoutingMode(): RoutingMode {
    return this.routingMode;
  }

  setRoutingMode(mode: RoutingMode): void {
    this.routingMode = mode;
  }

  getFallbackMode(): FallbackMode {
    return this.fallbackMode;
  }

  setFallbackMode(mode: FallbackMode): void {
    this.fallbackMode = mode;
  }

  isLocalOnly(): boolean {
    return this.localOnly;
  }

  setLocalOnly(active: boolean): void {
    this.localOnly = active;
  }

  setProviders(providers: ProviderConfig[]): void {
    this.providers = providers;
  }

  getProviders(): ProviderConfig[] {
    return this.providers;
  }

  setActiveTarget(target: InferenceTarget | null): void {
    this.activeTarget = target;
  }

  getActiveTarget(): InferenceTarget | null {
    return this.activeTarget;
  }

  /**
   * Resolves the exact InferenceTarget for a task or manual selection
   */
  resolveTarget(req?: RouteRequest, manualTarget?: InferenceTarget): RouteResolution {
    const targetToUse = manualTarget || (this.routingMode === 'MANUAL' ? this.activeTarget : null);

    // ----------------------------------------------------
    // 1. MANUAL MODE / EXACT TARGET RESOLUTION
    // ----------------------------------------------------
    if (targetToUse) {
      const provider = this.providers.find(
        p => p.id === targetToUse.providerId && p.type === targetToUse.providerType
      );

      if (!provider) {
        throw new ProviderExecutionError({
          providerId: targetToUse.providerId,
          providerType: targetToUse.providerType,
          modelId: targetToUse.modelId,
          message: `Selected provider [${targetToUse.providerId}] (${targetToUse.providerType}) is no longer configured.`
        });
      }

      if (provider.models.length > 0 && !provider.models.includes(targetToUse.modelId)) {
        throw new ProviderExecutionError({
          providerId: targetToUse.providerId,
          providerType: targetToUse.providerType,
          modelId: targetToUse.modelId,
          message: `Selected model [${targetToUse.modelId}] is no longer available from provider [${provider.name}].`
        });
      }

      return {
        target: {
          providerId: provider.id,
          providerType: provider.type,
          modelId: targetToUse.modelId
        },
        provider,
        modelId: targetToUse.modelId,
        reason: `Manual selection: ${provider.name} / ${targetToUse.modelId}`,
        // Manual mode forces ZERO silent fallback
        fallbackChain: []
      };
    }

    // ----------------------------------------------------
    // 2. AUTO MODE: Select among healthy configured providers
    // ----------------------------------------------------
    let candidates = this.providers.filter(p => p.status !== 'offline' && p.status !== 'authentication_failed');

    if (this.localOnly) {
      candidates = candidates.filter(p => p.type === 'ollama' || p.isLocalOnly);
      if (candidates.length === 0) {
        throw new Error('LOCAL ONLY mode active: No active local provider (e.g. Ollama) is configured.');
      }
    }

    if (candidates.length === 0) {
      candidates = this.providers;
    }

    if (candidates.length === 0) {
      throw new Error('No AI providers configured in settings. Please add at least one provider.');
    }

    // Agent trait selection
    const trait = req?.agent?.preferredModelTrait;
    let selectedProvider = candidates[0];
    let selectedModel = selectedProvider.selectedModelId || selectedProvider.defaultModel || selectedProvider.models[0] || 'default';
    let reason = `Primary configured provider: ${selectedProvider.name}`;

    for (const p of candidates) {
      if (trait === 'coding') {
        const coderModel = p.models.find(m => m.includes('coder') || m.includes('claude') || m.includes('code') || m.includes('sonnet') || m.includes('4o'));
        if (coderModel) {
          selectedProvider = p;
          selectedModel = coderModel;
          reason = `Specialized for coding: ${coderModel} (${p.name})`;
          break;
        }
      } else if (trait === 'security' || trait === 'reasoning') {
        const reasoningModel = p.models.find(m => m.includes('r1') || m.includes('o1') || m.includes('pro') || m.includes('thinking'));
        if (reasoningModel) {
          selectedProvider = p;
          selectedModel = reasoningModel;
          reason = `Reasoning & security model: ${reasoningModel} (${p.name})`;
          break;
        }
      } else if (trait === 'fast') {
        const fastModel = p.models.find(m => m.includes('flash') || m.includes('mini') || m.includes('fast'));
        if (fastModel) {
          selectedProvider = p;
          selectedModel = fastModel;
          reason = `Low-latency execution: ${fastModel} (${p.name})`;
          break;
        }
      }
    }

    // Build explicit fallback chain only if fallbackMode is enabled
    const fallbackChain: InferenceTarget[] = [];
    if (this.fallbackMode !== 'NONE') {
      candidates.forEach(p => {
        p.models.forEach(m => {
          if (p.id !== selectedProvider.id || m !== selectedModel) {
            fallbackChain.push({
              providerId: p.id,
              providerType: p.type,
              modelId: m
            });
          }
        });
      });
    }

    const resolvedTarget: InferenceTarget = {
      providerId: selectedProvider.id,
      providerType: selectedProvider.type,
      modelId: selectedModel
    };

    return {
      target: resolvedTarget,
      provider: selectedProvider,
      modelId: selectedModel,
      reason,
      fallbackChain: this.fallbackMode === 'NONE' ? [] : fallbackChain.slice(0, 3)
    };
  }

  /**
   * Executes inference through the exact adapter with telemetry & explicit fallback
   */
  async executeInference(
    messages: ChatMessagePayload[],
    options?: {
      target?: InferenceTarget;
      taskType?: string;
      agentId?: string;
      taskId?: string;
      temperature?: number;
      jsonMode?: boolean;
    }
  ): Promise<{ text: string; telemetry: InferenceTelemetry }> {
    const resolution = this.resolveTarget(
      { taskType: options?.taskType },
      options?.target
    );

    const primaryTarget = resolution.target;
    const primaryProvider = resolution.provider;
    const startedAt = Date.now();

    // 1. Try Primary Target
    try {
      const adapter = getProviderAdapter(primaryProvider.type);
      const text = await adapter.chat(primaryProvider, primaryTarget.modelId, messages, {
        temperature: options?.temperature,
        jsonMode: options?.jsonMode
      });

      const durationMs = Date.now() - startedAt;
      const telemetry: InferenceTelemetry = {
        taskId: options?.taskId,
        agentId: options?.agentId,
        providerId: primaryProvider.id,
        providerType: primaryProvider.type,
        providerName: primaryProvider.name,
        modelId: primaryTarget.modelId,
        routingMode: this.routingMode,
        fallbackUsed: false,
        startedAt,
        durationMs,
        status: 'SUCCESS'
      };

      return { text, telemetry };
    } catch (primaryError: any) {
      // If manual mode or fallback is NONE, NEVER fallback
      if (this.routingMode === 'MANUAL' || this.fallbackMode === 'NONE' || resolution.fallbackChain.length === 0) {
        const durationMs = Date.now() - startedAt;
        const failedTelemetry: InferenceTelemetry = {
          taskId: options?.taskId,
          agentId: options?.agentId,
          providerId: primaryProvider.id,
          providerType: primaryProvider.type,
          providerName: primaryProvider.name,
          modelId: primaryTarget.modelId,
          routingMode: this.routingMode,
          fallbackUsed: false,
          startedAt,
          durationMs,
          status: 'FAILED',
          error: primaryError.message
        };

        if (primaryError instanceof ProviderExecutionError) {
          throw primaryError;
        }

        throw new ProviderExecutionError({
          providerId: primaryProvider.id,
          providerType: primaryProvider.type,
          modelId: primaryTarget.modelId,
          message: primaryError.message,
          cause: primaryError
        });
      }

      // 2. Explicit Fallback Chain (Only in AUTO mode when fallbackMode != 'NONE')
      for (const fallbackTarget of resolution.fallbackChain) {
        const fbProvider = this.providers.find(p => p.id === fallbackTarget.providerId);
        if (!fbProvider) continue;

        try {
          const fbAdapter = getProviderAdapter(fbProvider.type);
          const fbText = await fbAdapter.chat(fbProvider, fallbackTarget.modelId, messages, {
            temperature: options?.temperature,
            jsonMode: options?.jsonMode
          });

          const durationMs = Date.now() - startedAt;
          const telemetry: InferenceTelemetry = {
            taskId: options?.taskId,
            agentId: options?.agentId,
            providerId: fbProvider.id,
            providerType: fbProvider.type,
            providerName: fbProvider.name,
            modelId: fallbackTarget.modelId,
            routingMode: this.routingMode,
            fallbackUsed: true,
            fallbackProviderId: primaryProvider.id,
            fallbackModelId: primaryTarget.modelId,
            startedAt,
            durationMs,
            status: 'SUCCESS'
          };

          return { text: fbText, telemetry };
        } catch (_) {
          // Continue to next explicit fallback
        }
      }

      // All fallbacks exhausted
      throw new ProviderExecutionError({
        providerId: primaryProvider.id,
        providerType: primaryProvider.type,
        modelId: primaryTarget.modelId,
        message: `Primary provider [${primaryProvider.name}] and all explicit fallback targets failed. Original error: ${primaryError.message}`
      });
    }
  }

  /**
   * Static helper for backwards-compatibility with Orchestrator
   */
  static selectModel(
    providers: ProviderConfig[],
    req?: RouteRequest,
    routingMode: RoutingMode = 'AUTO',
    userPreferredModel?: string,
    localOnly = false
  ): { provider: ProviderConfig; model: string; reason: string } {
    const router = new ModelRouter(providers, routingMode, localOnly);
    let manualTarget: InferenceTarget | undefined;
    if (userPreferredModel) {
      const matchProv = providers.find(p => p.models.includes(userPreferredModel));
      if (matchProv) {
        manualTarget = {
          providerId: matchProv.id,
          providerType: matchProv.type,
          modelId: userPreferredModel
        };
      }
    }
    const res = router.resolveTarget(req, manualTarget);
    return {
      provider: res.provider,
      model: res.modelId,
      reason: res.reason
    };
  }
}
