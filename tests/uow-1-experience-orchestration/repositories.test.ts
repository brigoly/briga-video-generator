import { describe, expect, it } from "vitest";
import {
  InMemoryCheckpointRepository,
  InMemoryRunStateRepository
} from "../../src/uow-1-experience-orchestration/repositories/interfaces";

describe("repositories", () => {
  it("stores and reads run state", async () => {
    const repo = new InMemoryRunStateRepository();
    await repo.upsert({
      runId: "r1",
      runState: "Running",
      stageSubState: "InProgress",
      updatedAt: new Date().toISOString()
    });

    const state = await repo.get("r1");
    expect(state?.runState).toBe("Running");
  });

  it("stores latest checkpoint", async () => {
    const repo = new InMemoryCheckpointRepository();
    await repo.write({
      checkpointId: "c1",
      runId: "r1",
      stageId: "s1",
      checkpointType: "StageStart",
      stateSnapshotRef: "x",
      createdAt: new Date().toISOString()
    });

    await repo.write({
      checkpointId: "c2",
      runId: "r1",
      stageId: "s2",
      checkpointType: "StageComplete",
      stateSnapshotRef: "y",
      createdAt: new Date().toISOString()
    });

    const latest = await repo.readLatest("r1");
    expect(latest?.checkpointId).toBe("c2");
  });
});
