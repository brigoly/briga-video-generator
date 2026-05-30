import { describe, expect, it } from "vitest";
import { MockAiProvider, MockStockProvider } from "../../src/uow-3-media-composition/providers/assetProviders";
import { InMemoryCompositionRepository } from "../../src/uow-3-media-composition/repositories/compositionRepository";
import { MediaCompositionService } from "../../src/uow-3-media-composition/services/mediaCompositionService";

describe("mediaCompositionService", () => {
  it("discovers and selects assets", async () => {
    const service = new MediaCompositionService(
      new MockStockProvider("stock-1"),
      new MockAiProvider("ai-1"),
      new InMemoryCompositionRepository()
    );

    const result = await service.discoverAndSelectAssets({
      runId: "run-3",
      scriptId: "script-1",
      topic: "future city skyline",
      platformProfile: "youtube-shorts",
      visualStyle: "cinematic"
    });

    expect(result.selectedAssets.length).toBeGreaterThan(0);
  });

  it("builds timeline from selected assets", async () => {
    const repository = new InMemoryCompositionRepository();
    const service = new MediaCompositionService(
      new MockStockProvider("stock-1"),
      new MockAiProvider("ai-1"),
      repository
    );

    await service.discoverAndSelectAssets({
      runId: "run-3b",
      scriptId: "script-2",
      topic: "robot chef",
      platformProfile: "instagram-reels"
    });

    const timeline = await service.buildTimeline(
      "run-3b",
      "instagram-reels",
      "Hook\nBeat\nBeat\nCTA"
    );

    expect(timeline.scenes.length).toBeGreaterThan(0);
    expect(timeline.platformProfile).toBe("instagram-reels");
  });
});
