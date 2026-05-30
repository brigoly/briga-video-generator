import { afterEach, describe, expect, it } from "vitest";
import {
  buildDefaultProviders,
  buildRuntimeProviders,
  ProviderConfigurationError
} from "../../src/uow-2-content-intelligence/providers/providerFactory";

const ENV_KEYS = [
  "UOW2_OLLAMA_BASE_URL",
  "UOW2_OLLAMA_CLOUD_BASE_URL",
  "UOW2_OLLAMA_CLOUD_API_KEY",
  "UOW2_OLLAMA_MODEL",
  "UOW2_OLLAMA_PROVIDER_ID",
  "UOW2_OLLAMA_TIMEOUT_MS",
  "UOW2_REQUIRE_REAL_PROVIDER"
] as const;

function clearEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

afterEach(() => {
  clearEnv();
});

describe("providerFactory", () => {
  it("builds Ollama provider from config", () => {
    const providers = buildDefaultProviders({
      ollamaBaseUrl: "http://localhost:11434",
      ollamaModel: "llama3",
      ollamaProviderId: "ollama-local"
    });

    expect(providers).toHaveLength(1);
    expect(providers[0].providerId).toBe("ollama-local");
  });

  it("returns empty list when required Ollama settings are missing", () => {
    const providers = buildDefaultProviders();
    expect(providers).toHaveLength(0);
  });

  it("builds Ollama provider from env", () => {
    process.env.UOW2_OLLAMA_BASE_URL = "http://localhost:11434";
    process.env.UOW2_OLLAMA_MODEL = "llama3";

    const providers = buildDefaultProviders();

    expect(providers).toHaveLength(1);
    expect(providers[0].providerId).toBe("ollama-llama3");
  });

  it("builds provider with cloud-only endpoint config", () => {
    process.env.UOW2_OLLAMA_CLOUD_BASE_URL = "https://ollama.example.com";
    process.env.UOW2_OLLAMA_CLOUD_API_KEY = "cloud-key";
    process.env.UOW2_OLLAMA_MODEL = "llama3";

    const providers = buildDefaultProviders();

    expect(providers).toHaveLength(1);
    expect(providers[0].providerId).toBe("ollama-llama3");
  });

  it("throws provider configuration error in strict mode when no real provider is configured", () => {
    expect(() => buildRuntimeProviders({}, { requireRealProvider: true })).toThrow(
      ProviderConfigurationError
    );
  });
});
