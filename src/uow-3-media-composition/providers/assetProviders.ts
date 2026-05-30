import { randomUUID } from "node:crypto";
import { MediaAsset } from "../../shared-contracts/mediaCompositionTypes";

export interface StockAssetProvider {
  readonly providerId: string;
  discover(topic: string, count: number): Promise<MediaAsset[]>;
}

export interface AiAssetProvider {
  readonly providerId: string;
  generate(prompt: string, count: number): Promise<MediaAsset[]>;
}

export class MockStockProvider implements StockAssetProvider {
  constructor(public readonly providerId: string) {}

  async discover(topic: string, count: number): Promise<MediaAsset[]> {
    return Array.from({ length: count }).map((_, index) => ({
      assetId: randomUUID(),
      sourceType: "stock",
      providerId: this.providerId,
      uri: `https://stock.example/${topic}/${index}`,
      previewUri: `https://stock.example/${topic}/${index}/preview`,
      attributionRequired: true,
      license: "CC-BY",
      score: Math.max(0.55, 0.9 - index * 0.08),
      tags: [topic, "stock"]
    }));
  }
}

export class MockAiProvider implements AiAssetProvider {
  constructor(public readonly providerId: string) {}

  async generate(prompt: string, count: number): Promise<MediaAsset[]> {
    return Array.from({ length: count }).map((_, index) => ({
      assetId: randomUUID(),
      sourceType: "ai-generated",
      providerId: this.providerId,
      uri: `https://ai.example/generated/${encodeURIComponent(prompt)}/${index}`,
      previewUri: `https://ai.example/generated/${encodeURIComponent(prompt)}/${index}/preview`,
      attributionRequired: false,
      license: "Internal-Generated",
      score: Math.max(0.6, 0.92 - index * 0.07),
      tags: [prompt, "ai"]
    }));
  }
}
