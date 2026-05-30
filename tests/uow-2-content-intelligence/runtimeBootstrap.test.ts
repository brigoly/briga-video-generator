import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { buildContentIntelligenceApp } from "../../src/uow-2-content-intelligence/api/app";

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

describe("content intelligence runtime bootstrap", () => {
  it("starts with runtime provider defaults and handles generation without explicit provider order", async () => {
    const app = buildContentIntelligenceApp();

    const response = await request(app).post("/v1/scripts/generate").send({
      runId: "run-bootstrap",
      input: {
        topic: "AI storyboards",
        platformProfile: "tiktok"
      }
    });

    expect(response.status).toBe(202);
    expect(response.body.script).toBeDefined();
    expect(response.body.script.providerId).toBe("mock-fallback");
  });

  it("returns provider configuration error when strict mode is enabled without real provider config", async () => {
    const app = buildContentIntelligenceApp({ requireRealProvider: true });

    const response = await request(app).post("/v1/scripts/generate").send({
      runId: "run-strict",
      input: {
        topic: "AI storyboards",
        platformProfile: "tiktok"
      }
    });

    expect(response.status).toBe(503);
    expect(response.body.code).toBe("PROVIDER_CONFIGURATION_ERROR");
    expect(response.body.message).toContain("Real provider mode is enabled");
  });
});
