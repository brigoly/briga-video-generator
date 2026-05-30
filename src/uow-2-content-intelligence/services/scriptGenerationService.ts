import { randomUUID } from "node:crypto";
import {
  ScriptArtifact,
  ScriptGenerationRequest,
  ScriptVariant
} from "../../shared-contracts/contentIntelligenceTypes";
import { LlmProviderAdapter } from "../providers/providerAdapter";
import { InMemoryScriptRepository, ScriptRepository } from "../repositories/scriptRepository";
import { generateWithFallback } from "./fallbackRouter";
import { buildScriptPrompt, buildVariantPrompt, normalizeTopic } from "./promptBuilder";
import { PlatformFoundationService } from "../../uow-5-platform-foundation/services/platformFoundationService";

export class ScriptGenerationService {
  private readonly providers: Map<string, LlmProviderAdapter>;

  constructor(
    providerList: LlmProviderAdapter[],
    private readonly repository: ScriptRepository = new InMemoryScriptRepository(),
    private readonly foundationService?: PlatformFoundationService
  ) {
    this.providers = new Map(providerList.map((p) => [p.providerId, p]));
  }

  private resolveProviders(order?: string[]): LlmProviderAdapter[] {
    const requestedOrder = order && order.length > 0 ? order : [...this.providers.keys()];
    return requestedOrder
      .map((providerId) => this.providers.get(providerId))
      .filter((provider): provider is LlmProviderAdapter => Boolean(provider));
  }

  async generateScript(request: ScriptGenerationRequest): Promise<{ script: ScriptArtifact; attempts: string[] }> {
    const prompt = buildScriptPrompt(request.input);
    const providersInOrder = this.resolveProviders(request.preferredProviderOrder);

    if (providersInOrder.length === 0) {
      throw new Error("No available providers for generation");
    }

    const fallback = await generateWithFallback(providersInOrder, {
      prompt,
      maxTokens: 500
    });

    const script: ScriptArtifact = {
      scriptId: randomUUID(),
      runId: request.runId,
      providerId: fallback.output.providerId,
      platformProfile: request.input.platformProfile,
      topicNormalized: normalizeTopic(request.input.topic),
      content: fallback.output.content,
      createdAt: new Date().toISOString()
    };

    await this.repository.saveScript(script);

    if (this.foundationService) {
      await this.foundationService.persistStageArtifact({
        runId: request.runId,
        stageId: "uow-2-content-intelligence",
        artifactKind: "output",
        artifactName: "script",
        payload: script,
        parameters: {
          providerOrder: request.preferredProviderOrder,
          platformProfile: request.input.platformProfile,
          topic: request.input.topic
        }
      });
      await this.foundationService.recordTelemetryEvent({
        runId: request.runId,
        stageId: "uow-2-content-intelligence",
        eventType: "StageCompleted",
        message: "Script generation completed",
        metadata: {
          providerId: script.providerId,
          attempts: fallback.attempts
        }
      });
    }

    return {
      script,
      attempts: fallback.attempts.map((attempt) => `${attempt.providerId}:${attempt.success ? "ok" : "fail"}`)
    };
  }

  async regenerateVariant(scriptId: string, changeRequest: string, providerOrder: string[]): Promise<ScriptVariant> {
    const existing = await this.repository.getScript(scriptId);
    if (!existing) {
      throw new Error(`Script not found: ${scriptId}`);
    }

    const prompt = buildVariantPrompt(existing.content, changeRequest);
    const providersInOrder = this.resolveProviders(providerOrder);

    if (providersInOrder.length === 0) {
      throw new Error("No available providers for regeneration");
    }

    const fallback = await generateWithFallback(providersInOrder, {
      prompt,
      maxTokens: 500
    });

    const variant: ScriptVariant = {
      variantId: randomUUID(),
      parentScriptId: existing.scriptId,
      changeRequest,
      content: fallback.output.content,
      createdAt: new Date().toISOString()
    };

    await this.repository.saveVariant(variant);

    if (this.foundationService) {
      await this.foundationService.persistStageArtifact({
        runId: existing.runId,
        stageId: "uow-2-content-intelligence",
        artifactKind: "output",
        artifactName: "script-variant",
        payload: variant,
        parentArtifactId: existing.scriptId,
        parameters: {
          providerOrder,
          changeRequest
        }
      });
      await this.foundationService.recordTelemetryEvent({
        runId: existing.runId,
        stageId: "uow-2-content-intelligence",
        eventType: "StageCompleted",
        message: "Script variant regeneration completed",
        metadata: {
          parentScriptId: existing.scriptId,
          attempts: fallback.attempts
        }
      });
    }

    return variant;
  }
}
