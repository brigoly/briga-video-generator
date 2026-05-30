import { describe, expect, it } from "vitest";
import { assembleTimeline } from "../../src/uow-3-media-composition/services/timelineAssembler";
import { MediaAsset } from "../../src/shared-contracts/mediaCompositionTypes";

const assets: MediaAsset[] = [
  {
    assetId: "a1",
    sourceType: "stock",
    providerId: "stock",
    uri: "https://example/a1",
    previewUri: "https://example/a1/preview",
    attributionRequired: true,
    license: "CC-BY",
    score: 0.9,
    tags: ["city"]
  },
  {
    assetId: "a2",
    sourceType: "ai-generated",
    providerId: "ai",
    uri: "https://example/a2",
    previewUri: "https://example/a2/preview",
    attributionRequired: false,
    license: "Internal-Generated",
    score: 0.88,
    tags: ["city"]
  }
];

describe("timelineAssembler", () => {
  it("builds timeline with scenes", () => {
    const timeline = assembleTimeline({
      runId: "run-3",
      platformProfile: "tiktok",
      scriptContent: "Hook line\nBeat one\nBeat two\nCTA",
      assets
    });

    expect(timeline.runId).toBe("run-3");
    expect(timeline.scenes.length).toBeGreaterThan(0);
    expect(timeline.totalDurationSeconds).toBeGreaterThan(0);
  });
});
