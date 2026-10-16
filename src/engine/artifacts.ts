/**
 * Omnintellx — Artifacts & Canonical Contracts Engine
 * Enforces schema integrity, contracts, and cross-agent consistency.
 */

import { Artifact, ArtifactType, ProjectContract } from '../types';

export class ArtifactManager {
  private artifacts: Map<string, Artifact> = new Map();
  private contracts: Map<string, ProjectContract> = new Map();

  createArtifact(
    type: ArtifactType,
    title: string,
    authorAgentId: string,
    taskId: string,
    content: string,
    structuredData?: Record<string, any>,
    dependencies: string[] = []
  ): Artifact {
    const id = `ART-${type}-${Date.now().toString(36).toUpperCase()}`;
    const artifact: Artifact = {
      id,
      type,
      title,
      version: 1,
      authorAgentId,
      taskId,
      dependencies,
      content,
      structuredData,
      status: 'validated',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.artifacts.set(id, artifact);
    return artifact;
  }

  getArtifact(id: string): Artifact | undefined {
    return this.artifacts.get(id);
  }

  getAllArtifacts(): Artifact[] {
    return Array.from(this.artifacts.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  getArtifactsByType(type: ArtifactType): Artifact[] {
    return this.getAllArtifacts().filter(a => a.type === type);
  }

  registerContract(contract: ProjectContract): void {
    this.contracts.set(contract.id, contract);
  }

  getContract(id: string): ProjectContract | undefined {
    return this.contracts.get(id);
  }

  getAllContracts(): ProjectContract[] {
    return Array.from(this.contracts.values());
  }

  validateCodeAgainstContracts(code: string): { valid: boolean; violations: string[] } {
    const violations: string[] = [];
    for (const contract of this.contracts.values()) {
      if (contract.type === 'API_CONTRACT' || contract.type === 'NAMING_CONVENTIONS') {
        for (const [logicalKey, canonicalName] of Object.entries(contract.canonicalKeys)) {
          // Check for anti-patterns (e.g. using camelCase when canonical is snake_case or vice versa)
          const forbiddenAlternate = logicalKey;
          if (forbiddenAlternate !== canonicalName && code.includes(`"${forbiddenAlternate}"`)) {
            violations.push(`Contract mismatch: Code uses "${forbiddenAlternate}" instead of canonical "${canonicalName}"`);
          }
        }
      }
    }
    return { valid: violations.length === 0, violations };
  }

  clear(): void {
    this.artifacts.clear();
    this.contracts.clear();
  }
}
