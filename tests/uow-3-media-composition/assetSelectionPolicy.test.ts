import { describe, expect, it } from "vitest";
import { selectHybridAssets } from "../../src/uow-3-media-composition/services/assetSelectionPolicy";
import { MediaAsset } from "../../src/shared-contracts/mediaCompositionTypes";

function makeAsset(id: string, sourceType: "stock" | "ai-generated", score: number): MediaAsset {
  return {
    assetId: id,
    sourceType,
    providerId: sourceType === "stock" ? "stock-provider" : "ai-provider",
    uri: `https://example/${id}`,
    previewUri: `https://example/${id}/preview`,
    attributionRequired: sourceType === "stock",
    license: sourceType === "stock" ? "CC-BY" : "Internal-Generated",
    score,
    tags: [sourceType]
  };
}

describe("assetSelectionPolicy", () => {
  it("selects hybrid assets by score and ratio", () => {
    const selected = selectHybridAssets({
      stockAssets: [makeAsset("s1", "stock", 0.9), makeAsset("s2", "stock", 0.7)],
      aiAssets: [makeAsset("a1", "ai-generated", 0.95), makeAsset("a2", "ai-generated", 0.6)],
      preferredMixRatio: { stockWeight: 0.6, aiWeight: 0.4 },
      maxAssets: 3
    });

    expect(selected).toHaveLength(3);
    expect(selected.some((a) => a.assetId === "s1")).toBe(true);
    expect(selected.some((a) => a.assetId === "a1")).toBe(true);
  });
});
