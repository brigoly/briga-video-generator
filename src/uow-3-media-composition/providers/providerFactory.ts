import { AiAssetProvider, MockAiProvider, MockStockProvider, StockAssetProvider } from "./assetProviders";
import {
  PexelsStockProvider,
  PixabayStockProvider,
  PollinationsAiProvider,
  SequentialAiProvider,
  SequentialStockProvider
} from "./externalProviders";

export interface MediaProviderFactoryConfig {
  pexelsApiKey?: string;
  pexelsBaseUrl?: string;
  pixabayApiKey?: string;
  pixabayBaseUrl?: string;
  pollinationsBaseUrl?: string;
}

export interface RuntimeMediaProviderOptions {
  requireRealProvider?: boolean;
}

export class MediaProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaProviderConfigurationError";
  }
}

export interface MediaProviderBundle {
  stockProvider: StockAssetProvider;
  aiProvider: AiAssetProvider;
}

function fromEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function buildDefaultMediaProviders(
  config: MediaProviderFactoryConfig = {}
): MediaProviderBundle | undefined {
  const pexelsApiKey = config.pexelsApiKey ?? fromEnv("UOW3_PEXELS_API_KEY");
  const pexelsBaseUrl = config.pexelsBaseUrl ?? fromEnv("UOW3_PEXELS_BASE_URL");
  const pixabayApiKey = config.pixabayApiKey ?? fromEnv("UOW3_PIXABAY_API_KEY");
  const pixabayBaseUrl = config.pixabayBaseUrl ?? fromEnv("UOW3_PIXABAY_BASE_URL");
  const pollinationsBaseUrl = config.pollinationsBaseUrl ?? fromEnv("UOW3_POLLINATIONS_BASE_URL");

  const stockProviders: StockAssetProvider[] = [
    ...(pexelsApiKey ? [new PexelsStockProvider(pexelsApiKey, { baseUrl: pexelsBaseUrl })] : []),
    ...(pixabayApiKey ? [new PixabayStockProvider(pixabayApiKey, { baseUrl: pixabayBaseUrl })] : [])
  ];

  const aiProviders: AiAssetProvider[] = [
    new PollinationsAiProvider({
      baseUrl: pollinationsBaseUrl
    })
  ];

  if (stockProviders.length === 0) {
    return undefined;
  }

  return {
    stockProvider:
      stockProviders.length === 1
        ? stockProviders[0]
        : new SequentialStockProvider("stock-provider-chain", stockProviders),
    aiProvider:
      aiProviders.length === 1
        ? aiProviders[0]
        : new SequentialAiProvider("ai-provider-chain", aiProviders)
  };
}

export function buildRuntimeMediaProviders(
  config: MediaProviderFactoryConfig = {},
  options: RuntimeMediaProviderOptions = {}
): MediaProviderBundle {
  const configured = buildDefaultMediaProviders(config);
  if (configured) {
    return configured;
  }

  if (options.requireRealProvider) {
    throw new MediaProviderConfigurationError(
      "Real media provider mode is enabled but no stock provider is configured. Set UOW3_PEXELS_API_KEY or UOW3_PIXABAY_API_KEY, and optionally UOW3_POLLINATIONS_BASE_URL."
    );
  }

  return {
    stockProvider: new MockStockProvider("mock-stock-fallback"),
    aiProvider: new MockAiProvider("mock-ai-fallback")
  };
}
