import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  FileCheckpointRepository,
  FileIdempotencyStore,
  FileRunStateRepository,
  FileStatusCache
} from "../../src/uow-1-experience-orchestration/repositories/fileBackedRuntime";
import { FilePipelineStatusStore } from "../../src/uow-1-experience-orchestration/services/pipelineStatusStore";

describe("file backed runtime persistence", () => {
  it("persists run state, idempotency, and checkpoints across instances", async () => {
    const root = await mkdtemp(join(tmpdir(), "uow1-runtime-"));

    const runState1 = new FileRunStateRepository(root);
    const idempotency1 = new FileIdempotencyStore(root);
    const checkpoint1 = new FileCheckpointRepository(root);

    await runState1.upsert({
      runId: "run-1",
      runState: "Running",
      stageSubState: "InProgress",
      updatedAt: new Date().toISOString()
    });
    await idempotency1.set({
      idempotencyKey: "idem-1",
      commandSignature: "sig",
      response: { ok: true }
    });
    await checkpoint1.write({
      checkpointId: "cp-1",
      runId: "run-1",
      stageId: "uow-1",
      checkpointType: "StageStart",
      stateSnapshotRef: "snap",
      createdAt: new Date().toISOString()
    });

    const runState2 = new FileRunStateRepository(root);
    const idempotency2 = new FileIdempotencyStore(root);
    const checkpoint2 = new FileCheckpointRepository(root);

    expect((await runState2.get("run-1"))?.runState).toBe("Running");
    expect((await idempotency2.get("idem-1"))?.commandSignature).toBe("sig");
    expect((await checkpoint2.readLatest("run-1"))?.checkpointId).toBe("cp-1");
  });

  it("persists status cache and pipeline outputs across instances", async () => {
    const root = await mkdtemp(join(tmpdir(), "uow1-runtime-"));

    const cache1 = new FileStatusCache(root);
    await cache1.put(
      "run-2",
      {
        runId: "run-2",
        runState: "Completed",
        stageSubState: "Succeeded",
        updatedAt: new Date().toISOString()
      },
      60
    );

    const pipelineStore1 = new FilePipelineStatusStore(root);
    await pipelineStore1.set("run-2", {
      outputs: {
        script: {
          scriptId: "script-1",
          runId: "run-2",
          providerId: "mock",
          platformProfile: "tiktok",
          topicNormalized: "ai",
          content: "test",
          createdAt: new Date().toISOString()
        }
      },
      progress: {
        script: { startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
        mediaSelection: {},
        timeline: {},
        packaging: {},
        publish: {}
      }
    });

    const cache2 = new FileStatusCache(root);
    const pipelineStore2 = new FilePipelineStatusStore(root);

    expect((await cache2.get("run-2"))?.runState).toBe("Completed");
    expect((await pipelineStore2.get("run-2"))?.outputs.script?.scriptId).toBe("script-1");
  });
});
