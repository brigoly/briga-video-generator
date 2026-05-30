import {
  LlmProviderAdapter,
  ProviderGenerationInput,
  ProviderGenerationOutput
} from "./providerAdapter";
import { providerFetch } from "../../shared-runtime/providerHttp";

export interface OllamaProviderConfig {
  baseUrl?: string;
  apiKey?: string;
  endpoints?: OllamaEndpointConfig[];
  model: string;
  providerId?: string;
  timeoutMs?: number;
}

export interface OllamaEndpointConfig {
  baseUrl: string;
  apiKey?: string;
}

export interface OllamaResilienceConfig {
  maxRetries?: number;
  initialBackoffMs?: number;
  circuitFailureThreshold?: number;
  circuitOpenMs?: number;
}

interface OllamaGenerateResponse {
  response?: string;
  done?: boolean;
}

function ensureTrailingSlashRemoved(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export class OllamaProviderAdapter implements LlmProviderAdapter {
  public readonly providerId: string;
  private readonly endpoints: OllamaEndpointConfig[];
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly resilience: OllamaResilienceConfig;

  constructor(config: OllamaProviderConfig) {
    this.providerId = config.providerId ?? "ollama-llama3";
    const configuredEndpoints =
      config.endpoints?.map((endpoint) => ({
        baseUrl: ensureTrailingSlashRemoved(endpoint.baseUrl),
        apiKey: endpoint.apiKey
      })) ?? [];

    if (configuredEndpoints.length > 0) {
      this.endpoints = configuredEndpoints;
    } else if (config.baseUrl) {
      this.endpoints = [
        {
          baseUrl: ensureTrailingSlashRemoved(config.baseUrl),
          apiKey: config.apiKey
        }
      ];
    } else {
      throw new Error("OllamaProviderAdapter requires at least one endpoint or baseUrl");
    }

    this.model = config.model;
    this.timeoutMs = config.timeoutMs ?? 60000;
    this.resilience = {
      maxRetries: 2,
      initialBackoffMs: 200,
      circuitFailureThreshold: 3,
      circuitOpenMs: 10000
    };
  }

  private async generateFromEndpoint(
    endpoint: OllamaEndpointConfig,
    input: ProviderGenerationInput
  ): Promise<ProviderGenerationOutput> {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };

    if (endpoint.apiKey) {
      headers.authorization = `Bearer ${endpoint.apiKey}`;
    }

    const response = await providerFetch(`${endpoint.baseUrl}/api/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: this.model,
        prompt: input.prompt,
        stream: false,
        options: {
          num_predict: input.maxTokens
        }
      })
    }, {
      providerId: this.providerId,
      timeoutMs: this.timeoutMs,
      maxRetries: this.resilience.maxRetries,
      initialBackoffMs: this.resilience.initialBackoffMs,
      circuitFailureThreshold: this.resilience.circuitFailureThreshold,
      circuitOpenMs: this.resilience.circuitOpenMs
    });

    const parsed = (await response.json()) as OllamaGenerateResponse;
    const content = parsed.response?.trim();
    if (!content) {
      throw new Error("Ollama returned empty content");
    }

    return {
      providerId: this.providerId,
      content
    };
  }

  async generateScript(input: ProviderGenerationInput): Promise<ProviderGenerationOutput> {
    const failures: string[] = [];

    for (const endpoint of this.endpoints) {
      try {
        return await this.generateFromEndpoint(endpoint, input);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown provider failure";
        failures.push(`${endpoint.baseUrl}: ${message}`);
      }
    }

    throw new Error(`All Ollama endpoints failed. ${failures.join(" | ")}`);
  }
}
