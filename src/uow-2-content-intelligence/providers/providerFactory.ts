import { LlmProviderAdapter, MockProviderAdapter } from "./providerAdapter";
import { OllamaProviderAdapter } from "./ollamaProviderAdapter";

export interface ProviderFactoryConfig {
  ollamaBaseUrl?: string;
  ollamaCloudBaseUrl?: string;
  ollamaCloudApiKey?: string;
  ollamaModel?: string;
  ollamaProviderId?: string;
  ollamaTimeoutMs?: number;
}

export interface RuntimeProviderOptions {
  requireRealProvider?: boolean;
}

export class ProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigurationError";
  }
}

function fromEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function buildDefaultProviders(config: ProviderFactoryConfig = {}): LlmProviderAdapter[] {
  const baseUrl = config.ollamaBaseUrl ?? fromEnv("UOW2_OLLAMA_BASE_URL");
  const cloudBaseUrl = config.ollamaCloudBaseUrl ?? fromEnv("UOW2_OLLAMA_CLOUD_BASE_URL");
  const cloudApiKey = config.ollamaCloudApiKey ?? fromEnv("UOW2_OLLAMA_CLOUD_API_KEY");
  const model = config.ollamaModel ?? fromEnv("UOW2_OLLAMA_MODEL");
  const providerId = config.ollamaProviderId ?? fromEnv("UOW2_OLLAMA_PROVIDER_ID") ?? "ollama-llama3";

  const timeoutMsFromConfig = config.ollamaTimeoutMs;
  const timeoutMsFromEnv = fromEnv("UOW2_OLLAMA_TIMEOUT_MS");
  const timeoutMs =
    timeoutMsFromConfig ??
    (timeoutMsFromEnv && Number.isFinite(Number(timeoutMsFromEnv)) ? Number(timeoutMsFromEnv) : undefined);

  if (!model || (!baseUrl && !cloudBaseUrl)) {
    return [];
  }

  const endpoints = [
    ...(baseUrl
      ? [
          {
            baseUrl
          }
        ]
      : []),
    ...(cloudBaseUrl
      ? [
          {
            baseUrl: cloudBaseUrl,
            apiKey: cloudApiKey
          }
        ]
      : [])
  ];

  return [
    new OllamaProviderAdapter({
      endpoints,
      model,
      providerId,
      timeoutMs
    })
  ];
}

export function buildRuntimeProviders(
  config: ProviderFactoryConfig = {},
  options: RuntimeProviderOptions = {}
): LlmProviderAdapter[] {
  const providers = buildDefaultProviders(config);
  if (providers.length > 0) {
    return providers;
  }

  if (options.requireRealProvider) {
    throw new ProviderConfigurationError(
      "Real provider mode is enabled but no Ollama endpoints are configured. Set UOW2_OLLAMA_BASE_URL and UOW2_OLLAMA_MODEL for local usage, or set UOW2_OLLAMA_CLOUD_BASE_URL, UOW2_OLLAMA_CLOUD_API_KEY, and UOW2_OLLAMA_MODEL for cloud fallback."
    );
  }

  return [
    new MockProviderAdapter("mock-fallback", async (input) => {
      const normalized = input.prompt.replace(/\s+/g, " ").trim();
      return `Hook: ${normalized.slice(0, 60)}\nBeat: Expand the key idea with one concrete moment.\nCTA: Follow for the next part.`;
    })
  ];
}
