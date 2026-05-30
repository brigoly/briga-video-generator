import { describe, expect, it } from "vitest";
import request from "supertest";
import { buildApp } from "../../src/uow-1-experience-orchestration/api/app";
import {
  InMemoryCheckpointRepository,
  InMemoryIdempotencyStore,
  InMemoryRunStateRepository
} from "../../src/uow-1-experience-orchestration/repositories/interfaces";
import { InMemoryStatusCache } from "../../src/uow-1-experience-orchestration/repositories/statusCache";
import { OrchestrationService } from "../../src/uow-1-experience-orchestration/services/orchestrationService";
import { UnifiedPipelineService } from "../../src/uow-1-experience-orchestration/services/unifiedPipelineService";
import { PersistenceHealthResult } from "../../src/uow-1-experience-orchestration/repositories/fileBackedRuntime";
import { MockProviderAdapter } from "../../src/uow-2-content-intelligence/providers/providerAdapter";
import { ScriptGenerationService } from "../../src/uow-2-content-intelligence/services/scriptGenerationService";
import { InMemoryScriptRepository } from "../../src/uow-2-content-intelligence/repositories/scriptRepository";
import {
  MockAiProvider,
  MockStockProvider
} from "../../src/uow-3-media-composition/providers/assetProviders";
import { MediaCompositionService } from "../../src/uow-3-media-composition/services/mediaCompositionService";
import { InMemoryCompositionRepository } from "../../src/uow-3-media-composition/repositories/compositionRepository";
import { MultiPlatformPackagingService } from "../../src/uow-4-platform-packaging/services/multiPlatformOrchestrator";
import { InMemoryPackageRepository } from "../../src/uow-4-platform-packaging/repositories/packageRepository";
import { MockYouTubeShortsPublisher } from "../../src/uow-4-platform-packaging/providers/publishers";

const authHeader = { authorization: "Bearer dev-local-token" };

function createApp(
  enablePipeline = false,
  persistenceHealth?: { startup: PersistenceHealthResult; current: PersistenceHealthResult }
) {
  const runStateRepository = new InMemoryRunStateRepository();
  const checkpointRepository = new InMemoryCheckpointRepository();
  const statusCache = new InMemoryStatusCache();

  const service = new OrchestrationService({
    idempotencyStore: new InMemoryIdempotencyStore(),
    runStateRepository,
    checkpointRepository,
    statusCache,
    cacheTtlSeconds: 3
  });

  if (!enablePipeline) {
    return buildApp(service, undefined, {
      startupPersistenceHealth: persistenceHealth?.startup,
      getPersistenceHealth: persistenceHealth ? async () => persistenceHealth.current : undefined
    });
  }

  const scriptService = new ScriptGenerationService(
    [
      new MockProviderAdapter("mock-script", async () =>
        "Hook: hi\nBeat: this is a deterministic test script\nCTA: follow"
      )
    ],
    new InMemoryScriptRepository()
  );
  const mediaService = new MediaCompositionService(
    new MockStockProvider("mock-stock"),
    new MockAiProvider("mock-ai"),
    new InMemoryCompositionRepository()
  );
  const packagingService = new MultiPlatformPackagingService(new InMemoryPackageRepository());
  const packagingServiceWithPublisher = new MultiPlatformPackagingService(
    new InMemoryPackageRepository(),
    undefined,
    undefined,
    new Map([["youtube-shorts", new MockYouTubeShortsPublisher("mock-youtube")]])
  );
  const pipelineService = new UnifiedPipelineService({
    scriptService,
    mediaService,
    packagingService: enablePipeline ? packagingServiceWithPublisher : packagingService,
    runStateRepository,
    checkpointRepository,
    statusCache,
    cacheTtlSeconds: 3
  });

  return buildApp(service, pipelineService, {
    startupPersistenceHealth: persistenceHealth?.startup,
    getPersistenceHealth: persistenceHealth ? async () => persistenceHealth.current : undefined
  });
}

describe("API handlers", () => {
  it("accepts start command", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/v1/runs/start")
      .set(authHeader)
      .set("x-idempotency-key", "id-1")
      .send({ payload: { topic: "ai" } });

    expect(response.status).toBe(202);
    expect(response.body.runId).toBeDefined();
  });

  it("enforces auth", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/v1/runs/start")
      .set("x-idempotency-key", "id-2")
      .send({ payload: { topic: "ai" } });

    expect(response.status).toBe(401);
  });

  it("returns idempotent replay response", async () => {
    const app = createApp();
    const idemKey = "id-replay";

    const first = await request(app)
      .post("/v1/runs/start")
      .set(authHeader)
      .set("x-idempotency-key", idemKey)
      .send({ payload: { topic: "ai" } });

    const second = await request(app)
      .post("/v1/runs/start")
      .set(authHeader)
      .set("x-idempotency-key", idemKey)
      .send({ payload: { topic: "ai" } });

    expect(first.status).toBe(202);
    expect(second.status).toBe(200);
    expect(second.body.runId).toBe(first.body.runId);
  });

  it("runs a unified pipeline from uow-1", async () => {
    const app = createApp(true);

    const startResponse = await request(app)
      .post("/v1/pipeline/runs/start")
      .set(authHeader)
      .send({
        topic: "future robotics",
        hashtags: ["ai", "robotics"],
        platforms: ["tiktok", "youtube-shorts"]
      });

    expect(startResponse.status).toBe(202);
    expect(startResponse.body.runState).toBe("Completed");
    expect(startResponse.body.stageSubState).toBe("Succeeded");
    expect(startResponse.body.summary.scriptId).toBeDefined();
    expect(startResponse.body.summary.timelineId).toBeDefined();
    expect(startResponse.body.summary.packagesBuilt).toBe(2);

    const statusResponse = await request(app)
      .get(`/v1/pipeline/runs/${startResponse.body.runId}/status`)
      .set(authHeader);

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.runState).toBe("Completed");
    expect(statusResponse.body.stages.script.status).toBe("completed");
    expect(statusResponse.body.stages.timeline.status).toBe("completed");
    expect(statusResponse.body.stages.packaging.status).toBe("completed");
    expect(statusResponse.body.stages.publish.status).toBe("pending");
    expect(statusResponse.body.stages.script.startedAt).toBeDefined();
    expect(statusResponse.body.stages.script.completedAt).toBeDefined();
    expect(statusResponse.body.stages.mediaSelection.startedAt).toBeDefined();
    expect(statusResponse.body.stages.mediaSelection.completedAt).toBeDefined();
    expect(statusResponse.body.stages.timeline.startedAt).toBeDefined();
    expect(statusResponse.body.stages.timeline.completedAt).toBeDefined();
    expect(statusResponse.body.stages.packaging.startedAt).toBeDefined();
    expect(statusResponse.body.stages.packaging.completedAt).toBeDefined();
    expect(statusResponse.body.stages.publish.startedAt).toBeUndefined();
    expect(statusResponse.body.stages.publish.completedAt).toBeUndefined();
    expect(Array.isArray(statusResponse.body.stages.mediaSelection.output)).toBe(true);
    expect(Array.isArray(statusResponse.body.stages.packaging.output)).toBe(true);
    expect(statusResponse.body.stages.script.output.scriptId).toBe(startResponse.body.summary.scriptId);
  });

  it("runs publish stage when explicitly enabled in pipeline config", async () => {
    const app = createApp(true);

    const startResponse = await request(app)
      .post("/v1/pipeline/runs/start")
      .set(authHeader)
      .send({
        topic: "future robotics",
        hashtags: ["ai", "robotics"],
        platforms: ["tiktok"],
        enablePublishing: true
      });

    expect(startResponse.status).toBe(202);

    const statusResponse = await request(app)
      .get(`/v1/pipeline/runs/${startResponse.body.runId}/status`)
      .set(authHeader);

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.stages.publish.status).toBe("completed");
    expect(statusResponse.body.stages.publish.startedAt).toBeDefined();
    expect(statusResponse.body.stages.publish.completedAt).toBeDefined();
    expect(statusResponse.body.stages.publish.output.destinationId).toBeDefined();
    expect(Array.isArray(statusResponse.body.stages.packaging.output)).toBe(true);
    expect(statusResponse.body.stages.packaging.output.some((p: { platform: string }) => p.platform === "youtube-shorts")).toBe(true);
  });

  it("returns persistence health snapshot", async () => {
    const app = createApp(false, {
      startup: {
        ok: true,
        mode: "file",
        checkedAt: new Date().toISOString(),
        rootDir: "artifacts/uow1-runtime",
        details: "Writable and readable"
      },
      current: {
        ok: true,
        mode: "file",
        checkedAt: new Date().toISOString(),
        rootDir: "artifacts/uow1-runtime",
        details: "Writable and readable"
      }
    });

    const response = await request(app).get("/v1/health/persistence");

    expect(response.status).toBe(200);
    expect(response.body.startup.ok).toBe(true);
    expect(response.body.current.ok).toBe(true);
    expect(response.body.current.mode).toBe("file");
  });
});
