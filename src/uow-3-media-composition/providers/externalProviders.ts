import { randomUUID } from "node:crypto";
import { MediaAsset } from "../../shared-contracts/mediaCompositionTypes";
import { AiAssetProvider, StockAssetProvider } from "./assetProviders";
import { providerFetch } from "../../shared-runtime/providerHttp";

interface PexelsSearchResponse {
  photos?: Array<{
    id: number;
    alt?: string;
    url?: string;
    src?: {
      medium?: string;
      large?: string;
      original?: string;
    };
  }>;
}

interface PixabaySearchResponse {
  hits?: Array<{
    id: number;
    tags?: string;
    pageURL?: string;
    previewURL?: string;
    webformatURL?: string;
  }>;
}

function clampCount(count: number, max = 20): number {
  return Math.max(1, Math.min(max, count));
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

export class PexelsStockProvider implements StockAssetProvider {
  public readonly providerId: string;
  private readonly baseUrl: string;

  constructor(
    private readonly apiKey: string,
    options: { providerId?: string; baseUrl?: string } = {}
  ) {
    this.providerId = options.providerId ?? "pexels";
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? "https://api.pexels.com");
  }

  async discover(topic: string, count: number): Promise<MediaAsset[]> {
    const limit = clampCount(count, 50);
    const url = new URL(`${this.baseUrl}/v1/search`);
    url.searchParams.set("query", topic);
    url.searchParams.set("per_page", String(limit));

    const resilientResponse = await providerFetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: this.apiKey
      }
    }, {
      providerId: this.providerId,
      timeoutMs: 20000,
      maxRetries: 2,
      initialBackoffMs: 200,
      circuitFailureThreshold: 3,
      circuitOpenMs: 10000
    });

    const parsed = (await resilientResponse.json()) as PexelsSearchResponse;
    const photos = parsed.photos ?? [];

    return photos.slice(0, limit).map((photo, index) => ({
      assetId: `pexels-${photo.id ?? randomUUID()}`,
      sourceType: "stock",
      providerId: this.providerId,
      uri: photo.src?.large ?? photo.src?.original ?? photo.url ?? "",
      previewUri: photo.src?.medium ?? photo.src?.large ?? photo.url ?? "",
      attributionRequired: true,
      license: "Pexels-License",
      score: Math.max(0.5, 0.95 - index * 0.04),
      tags: [topic, "stock", ...(photo.alt ? [photo.alt] : [])]
    }));
  }
}

export class PixabayStockProvider implements StockAssetProvider {
  public readonly providerId: string;
  private readonly baseUrl: string;

  constructor(
    private readonly apiKey: string,
    options: { providerId?: string; baseUrl?: string } = {}
  ) {
    this.providerId = options.providerId ?? "pixabay";
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? "https://pixabay.com");
  }

  async discover(topic: string, count: number): Promise<MediaAsset[]> {
    const limit = clampCount(count, 50);
    const url = new URL(`${this.baseUrl}/api/`);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("q", topic);
    url.searchParams.set("per_page", String(limit));
    url.searchParams.set("image_type", "photo");

    const response = await providerFetch(url.toString(), {
      method: "GET"
    }, {
      providerId: this.providerId,
      timeoutMs: 20000,
      maxRetries: 2,
      initialBackoffMs: 200,
      circuitFailureThreshold: 3,
      circuitOpenMs: 10000
    });

    const parsed = (await response.json()) as PixabaySearchResponse;
    const hits = parsed.hits ?? [];

    return hits.slice(0, limit).map((hit, index) => ({
      assetId: `pixabay-${hit.id ?? randomUUID()}`,
      sourceType: "stock",
      providerId: this.providerId,
      uri: hit.webformatURL ?? hit.pageURL ?? "",
      previewUri: hit.previewURL ?? hit.webformatURL ?? hit.pageURL ?? "",
      attributionRequired: true,
      license: "Pixabay-License",
      score: Math.max(0.45, 0.92 - index * 0.04),
      tags: [topic, "stock", ...(hit.tags ? hit.tags.split(",").map((t) => t.trim()) : [])]
    }));
  }
}

export class PollinationsAiProvider implements AiAssetProvider {
  public readonly providerId: string;
  private readonly baseUrl: string;

  constructor(options: { providerId?: string; baseUrl?: string } = {}) {
    this.providerId = options.providerId ?? "pollinations";
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? "https://image.pollinations.ai");
  }

  async generate(prompt: string, count: number): Promise<MediaAsset[]> {
    const limit = clampCount(count, 12);
    const assets: MediaAsset[] = [];

    for (let index = 0; index < limit; index += 1) {
      const seededPrompt = `${prompt} cinematic frame ${index + 1}`;
      const uri = `${this.baseUrl}/prompt/${encodeURIComponent(seededPrompt)}?width=720&height=1280&seed=${index + 1}`;

      // Validate endpoint reachability so failures can trigger fallback behavior.
      await providerFetch(uri, { method: "HEAD" }, {
        providerId: this.providerId,
        timeoutMs: 15000,
        maxRetries: 2,
        initialBackoffMs: 200,
        circuitFailureThreshold: 3,
        circuitOpenMs: 10000
      });

      assets.push({
        assetId: `pollinations-${randomUUID()}`,
        sourceType: "ai-generated",
        providerId: this.providerId,
        uri,
        previewUri: uri,
        attributionRequired: false,
        license: "Pollinations-Generated",
        score: Math.max(0.55, 0.9 - index * 0.05),
        tags: [prompt, "ai-generated"]
      });
    }

    return assets;
  }
}

export class SequentialStockProvider implements StockAssetProvider {
  constructor(
    public readonly providerId: string,
    private readonly providers: StockAssetProvider[]
  ) {}

  async discover(topic: string, count: number): Promise<MediaAsset[]> {
    const errors: string[] = [];
    for (const provider of this.providers) {
      try {
        const assets = await provider.discover(topic, count);
        if (assets.length > 0) {
          return assets;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${provider.providerId}: ${message}`);
      }
    }

    throw new Error(`All stock providers failed. ${errors.join(" | ")}`);
  }
}

export class SequentialAiProvider implements AiAssetProvider {
  constructor(
    public readonly providerId: string,
    private readonly providers: AiAssetProvider[]
  ) {}

  async generate(prompt: string, count: number): Promise<MediaAsset[]> {
    const errors: string[] = [];
    for (const provider of this.providers) {
      try {
        const assets = await provider.generate(prompt, count);
        if (assets.length > 0) {
          return assets;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${provider.providerId}: ${message}`);
      }
    }

    throw new Error(`All AI providers failed. ${errors.join(" | ")}`);
  }
}
