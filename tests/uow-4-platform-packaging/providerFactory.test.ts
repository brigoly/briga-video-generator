import { afterEach, describe, expect, it } from "vitest";
import {
  buildDefaultPackagingProvider,
  buildRuntimePackagingProvider,
  PackagingProviderConfigurationError
} from "../../src/uow-4-platform-packaging/providers/providerFactory";

const ENV_KEYS = [
  "UOW4_ARTIFACT_PROVIDER_LOCAL_BASE_URL",
  "UOW4_ARTIFACT_PROVIDER_CLOUD_BASE_URL",
  "UOW4_ARTIFACT_PROVIDER_CLOUD_API_KEY",
  "UOW4_ARTIFACT_PROVIDER_TIMEOUT_MS",
  "UOW4_REQUIRE_REAL_PROVIDER"
] as const;

function clearEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

afterEach(() => {
  clearEnv();
});

describe("uow4 packaging providerFactory", () => {
  it("builds configured provider when local endpoint exists", () => {
    const provider = buildDefaultPackagingProvider({
      localArtifactBaseUrl: "http://localhost:9090"
    });

    expect(provider).toBeDefined();
  });

  it("returns undefined default provider when no endpoints are configured", () => {
    const provider = buildDefaultPackagingProvider();
    expect(provider).toBeUndefined();
  });

  it("throws in strict mode without provider config", () => {
    expect(() => buildRuntimePackagingProvider({}, { requireRealProvider: true })).toThrow(
      PackagingProviderConfigurationError
    );
  });

  it("returns deterministic fallback in non-strict mode", () => {
    const provider = buildRuntimePackagingProvider();
    expect(provider.providerId).toBe("deterministic-artifacts");
  });
});
