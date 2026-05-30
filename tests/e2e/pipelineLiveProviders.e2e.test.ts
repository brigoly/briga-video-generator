import { describe, expect, it } from "vitest";
import request from "supertest";
import { buildContentIntelligenceApp } from "../../src/uow-2-content-intelligence/api/app";
import { buildMediaCompositionApp } from "../../src/uow-3-media-composition/api/app";
import { buildPlatformPackagingApp } from "../../src/uow-4-platform-packaging/api/app";

function env(name: string): string | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const RUN_LIVE_PROFILE = env("RUN_LIVE_PROVIDER_TESTS") === "true";
const liveDescribe = RUN_LIVE_PROFILE ? describe : describe.skip;

liveDescribe("live provider pipeline profile", () => {
  it("executes strict UOW-2 to UOW-4 flow against live providers", async () => {
    const runId = `live-run-${Date.now()}`;

    const ollamaBaseUrl = env("UOW2_OLLAMA_BASE_URL");
    const ollamaModel = env("UOW2_OLLAMA_MODEL");
    const pexelsApiKey = env("UOW3_PEXELS_API_KEY");
    const localArtifactBaseUrl = env("UOW4_ARTIFACT_PROVIDER_LOCAL_BASE_URL");

    expect(ollamaBaseUrl, "UOW2_OLLAMA_BASE_URL must be set for live profile").toBeDefined();
    expect(ollamaModel, "UOW2_OLLAMA_MODEL must be set for live profile").toBeDefined();
    expect(pexelsApiKey, "UOW3_PEXELS_API_KEY must be set for live profile").toBeDefined();
    expect(localArtifactBaseUrl, "UOW4_ARTIFACT_PROVIDER_LOCAL_BASE_URL must be set for live profile").toBeDefined();

    const uow2 = buildContentIntelligenceApp({
      requireRealProvider: true,
      providerConfig: {
        ollamaBaseUrl,
        ollamaModel
      }
    });

    const scriptResponse = await request(uow2).post("/v1/scripts/generate").send({
      runId,
      input: {
        topic: "future robotics",
        platformProfile: "tiktok"
      }
    });

    expect(scriptResponse.status).toBe(202);

    const uow3 = buildMediaCompositionApp({
      requireRealProvider: true,
      providerConfig: {
        pexelsApiKey,
        pixabayApiKey: env("UOW3_PIXABAY_API_KEY"),
        pexelsBaseUrl: env("UOW3_PEXELS_BASE_URL"),
        pixabayBaseUrl: env("UOW3_PIXABAY_BASE_URL"),
        pollinationsBaseUrl: env("UOW3_POLLINATIONS_BASE_URL")
      }
    });

    const discoverResponse = await request(uow3).post("/v1/media/discover").send({
      runId,
      scriptId: scriptResponse.body.script.scriptId,
      topic: "future robotics",
      platformProfile: "tiktok",
      visualStyle: "cinematic"
    });

    expect(discoverResponse.status).toBe(202);

    const timelineResponse = await request(uow3).post("/v1/media/timeline").send({
      runId,
      platformProfile: "tiktok",
      scriptContent: scriptResponse.body.script.content
    });

    expect(timelineResponse.status).toBe(202);

    const uow4 = buildPlatformPackagingApp({
      requireRealProvider: true,
      providerConfig: {
        localArtifactBaseUrl,
        cloudArtifactBaseUrl: env("UOW4_ARTIFACT_PROVIDER_CLOUD_BASE_URL"),
        cloudArtifactApiKey: env("UOW4_ARTIFACT_PROVIDER_CLOUD_API_KEY")
      }
    });

    const packagingResponse = await request(uow4).post("/v1/packages/build-multi").send({
      runId,
      timelineId: timelineResponse.body.timelineId,
      title: "Future Robotics",
      hashtags: ["ai", "robotics"],
      platforms: ["tiktok", "youtube-shorts", "instagram-reels"]
    });

    expect(packagingResponse.status).toBe(202);
    expect(packagingResponse.body.packages).toHaveLength(3);
  });
});
