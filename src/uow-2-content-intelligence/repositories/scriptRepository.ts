import { ScriptArtifact, ScriptVariant } from "../../shared-contracts/contentIntelligenceTypes";

export interface ScriptRepository {
  saveScript(script: ScriptArtifact): Promise<void>;
  saveVariant(variant: ScriptVariant): Promise<void>;
  getScript(scriptId: string): Promise<ScriptArtifact | undefined>;
  listVariants(parentScriptId: string): Promise<ScriptVariant[]>;
}

export class InMemoryScriptRepository implements ScriptRepository {
  private readonly scripts = new Map<string, ScriptArtifact>();
  private readonly variants = new Map<string, ScriptVariant[]>();

  async saveScript(script: ScriptArtifact): Promise<void> {
    this.scripts.set(script.scriptId, script);
  }

  async saveVariant(variant: ScriptVariant): Promise<void> {
    const current = this.variants.get(variant.parentScriptId) ?? [];
    current.push(variant);
    this.variants.set(variant.parentScriptId, current);
  }

  async getScript(scriptId: string): Promise<ScriptArtifact | undefined> {
    return this.scripts.get(scriptId);
  }

  async listVariants(parentScriptId: string): Promise<ScriptVariant[]> {
    return this.variants.get(parentScriptId) ?? [];
  }
}
