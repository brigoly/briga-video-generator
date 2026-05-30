import { describe, expect, it } from "vitest";
import { MockProviderAdapter } from "../../src/uow-2-content-intelligence/providers/providerAdapter";
import { InMemoryScriptRepository } from "../../src/uow-2-content-intelligence/repositories/scriptRepository";
import { ScriptGenerationService } from "../../src/uow-2-content-intelligence/services/scriptGenerationService";

describe("script generation service", () => {
  it("generates script artifact", async () => {
    const provider = new MockProviderAdapter("mock-1", async () => "hook\nbeat1\ncta");
    const service = new ScriptGenerationService([provider], new InMemoryScriptRepository());

    const result = await service.generateScript({
      runId: "run-1",
      input: {
        topic: "AI music videos",
        platformProfile: "youtube-shorts",
        tone: "cinematic"
      },
      preferredProviderOrder: ["mock-1"]
    });

    expect(result.script.runId).toBe("run-1");
    expect(result.script.providerId).toBe("mock-1");
    expect(result.script.content).toContain("hook");
  });

  it("regenerates a variant from existing script", async () => {
    const provider = new MockProviderAdapter("mock-1", async () => "variant output");
    const repo = new InMemoryScriptRepository();
    const service = new ScriptGenerationService([provider], repo);

    const generated = await service.generateScript({
      runId: "run-2",
      input: {
        topic: "robot cooking show",
        platformProfile: "instagram-reels"
      },
      preferredProviderOrder: ["mock-1"]
    });

    const variant = await service.regenerateVariant(
      generated.script.scriptId,
      "make it more playful",
      ["mock-1"]
    );

    expect(variant.parentScriptId).toBe(generated.script.scriptId);
    expect(variant.content).toContain("variant");
  });
});
