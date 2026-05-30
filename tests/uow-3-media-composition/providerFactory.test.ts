import { afterEach, describe, expect, it } from "vitest";
import {
  buildDefaultMediaProviders,
  buildRuntimeMediaProviders,
  MediaProviderConfigurationError
} from "../../src/uow-3-media-composition/providers/providerFactory";

const ENV_KEYS = [
  "UOW3_PEXELS_API_KEY",
  "UOW3_PIXABAY_API_KEY",
  "UOW3_POLLINATIONS_BASE_URL",
  "UOW3_REQUIRE_REAL_PROVIDER"
] as const;

function clearEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

afterEach(() => {
  clearEnv();
});

describe("uow3 providerFactory", () => {
  it("builds configured providers when stock api key is provided", () => {
    const providers = buildDefaultMediaProviders({
      pexelsApiKey: "pexels-key"
    });

    expect(providers).toBeDefined();
    expect(providers?.stockProvider.providerId).toContain("pexels");
  });

  it("returns undefined default providers when no stock provider config exists", () => {
    const providers = buildDefaultMediaProviders();
    expect(providers).toBeUndefined();
  });

  it("throws in strict mode without real provider config", () => {
    expect(() => buildRuntimeMediaProviders({}, { requireRealProvider: true })).toThrow(
      MediaProviderConfigurationError
    );
  });

  it("returns mock fallback providers in non-strict mode", () => {
    const providers = buildRuntimeMediaProviders();
    expect(providers.stockProvider.providerId).toBe("mock-stock-fallback");
    expect(providers.aiProvider.providerId).toBe("mock-ai-fallback");
  });
});
