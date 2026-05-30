import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { buildMediaCompositionApp } from "../../src/uow-3-media-composition/api/app";

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

describe("uow3 runtime bootstrap", () => {
  it("starts with runtime defaults and discovers assets without explicit provider setup", async () => {
    const app = buildMediaCompositionApp();

    const response = await request(app).post("/v1/media/discover").send({
      runId: "run-media-boot",
      scriptId: "script-1",
      topic: "future skyline",
      platformProfile: "tiktok",
      visualStyle: "cinematic"
    });

    expect(response.status).toBe(202);
    expect(Array.isArray(response.body.selectedAssets)).toBe(true);
    expect(response.body.selectedAssets.length).toBeGreaterThan(0);
  });

  it("returns clear provider error in strict mode without stock provider config", async () => {
    const app = buildMediaCompositionApp({ requireRealProvider: true });

    const response = await request(app).post("/v1/media/discover").send({
      runId: "run-media-strict",
      scriptId: "script-1",
      topic: "future skyline",
      platformProfile: "tiktok"
    });

    expect(response.status).toBe(503);
    expect(response.body.code).toBe("MEDIA_PROVIDER_CONFIGURATION_ERROR");
    expect(response.body.message).toContain("Real media provider mode is enabled");
  });
});
