import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { buildPlatformPackagingApp } from "../../src/uow-4-platform-packaging/api/app";

const ENV_KEYS = [
  "UOW4_ARTIFACT_PROVIDER_LOCAL_BASE_URL",
  "UOW4_ARTIFACT_PROVIDER_CLOUD_BASE_URL",
  "UOW4_ARTIFACT_PROVIDER_CLOUD_API_KEY",
  "UOW4_ARTIFACT_PROVIDER_TIMEOUT_MS",
  "UOW4_REQUIRE_REAL_PROVIDER",
  "UOW4_YOUTUBE_PUBLISH_BASE_URL",
  "UOW4_YOUTUBE_PUBLISH_API_KEY",
  "UOW4_YOUTUBE_PUBLISH_TIMEOUT_MS",
  "UOW4_YOUTUBE_OAUTH_TOKEN_URL",
  "UOW4_YOUTUBE_OAUTH_CLIENT_ID",
  "UOW4_YOUTUBE_OAUTH_CLIENT_SECRET",
  "UOW4_YOUTUBE_OAUTH_REFRESH_TOKEN",
  "UOW4_YOUTUBE_OAUTH_SCOPE",
  "UOW4_REQUIRE_REAL_PUBLISHER"
] as const;

function clearEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

afterEach(() => {
  clearEnv();
});

describe("uow4 runtime bootstrap", () => {
  it("starts with deterministic runtime defaults in non-strict mode", async () => {
    const app = buildPlatformPackagingApp();

    const response = await request(app).post("/v1/packages/build").send({
      runId: "run-packaging",
      timelineId: "timeline-1",
      platform: "tiktok",
      title: "AI City",
      hashtags: ["ai", "city"]
    });

    expect(response.status).toBe(202);
    expect(response.body.platform).toBe("tiktok");
    expect(Array.isArray(response.body.files)).toBe(true);
    expect(response.body.files.length).toBeGreaterThan(0);
  });

  it("returns configuration error in strict mode without configured provider", async () => {
    const app = buildPlatformPackagingApp({ requireRealProvider: true });

    const response = await request(app).post("/v1/packages/build").send({
      runId: "run-packaging-strict",
      timelineId: "timeline-1",
      platform: "tiktok",
      title: "AI City",
      hashtags: ["ai", "city"]
    });

    expect(response.status).toBe(503);
    expect(response.body.code).toBe("PACKAGING_PROVIDER_CONFIGURATION_ERROR");
    expect(response.body.message).toContain("Real packaging provider mode is enabled");
  });

  it("returns configuration error in strict mode without configured publisher", async () => {
    const app = buildPlatformPackagingApp({ requireRealPublisher: true });

    const response = await request(app).post("/v1/packages/build").send({
      runId: "run-publisher-strict",
      timelineId: "timeline-1",
      platform: "tiktok",
      title: "AI City",
      hashtags: ["ai", "city"]
    });

    expect(response.status).toBe(503);
    expect(response.body.code).toBe("PUBLISHER_CONFIGURATION_ERROR");
    expect(response.body.message).toContain("Real publisher mode is enabled");
  });

  it("publishes youtube shorts package with runtime defaults", async () => {
    const app = buildPlatformPackagingApp();

    const buildResponse = await request(app).post("/v1/packages/build").send({
      runId: "run-publish",
      timelineId: "timeline-1",
      platform: "youtube-shorts",
      title: "AI City",
      hashtags: ["ai", "city"]
    });

    expect(buildResponse.status).toBe(202);

    const publishResponse = await request(app).post("/v1/packages/publish/youtube-shorts").send({
      runId: "run-publish"
    });

    expect(publishResponse.status).toBe(202);
    expect(publishResponse.body.platform).toBe("youtube-shorts");
    expect(publishResponse.body.status).toBe("published");
  });
});
