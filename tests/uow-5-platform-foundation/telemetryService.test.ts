import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { TelemetryService } from "../../src/uow-5-platform-foundation/services/telemetryService";

const tempRoots: string[] = [];

async function createService(): Promise<TelemetryService> {
  const root = await mkdtemp(join(tmpdir(), "uow5-telemetry-"));
  tempRoots.push(root);
  return new TelemetryService(root);
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("telemetry service", () => {
  it("aggregates telemetry summary for a run", async () => {
    const service = await createService();

    await service.record({
      runId: "run-telemetry",
      stageId: "uow-1",
      eventType: "RunStarted",
      timestamp: "2026-05-26T20:00:00.000Z"
    });
    await service.record({
      runId: "run-telemetry",
      stageId: "uow-2",
      eventType: "StageStarted",
      timestamp: "2026-05-26T20:00:01.000Z"
    });
    await service.record({
      runId: "run-telemetry",
      stageId: "uow-2",
      eventType: "StageFailed",
      timestamp: "2026-05-26T20:00:02.000Z"
    });
    await service.record({
      runId: "run-telemetry",
      stageId: "uow-1",
      eventType: "RunCompleted",
      timestamp: "2026-05-26T20:00:05.000Z"
    });

    const summary = service.getSummary("run-telemetry");

    expect(summary.totalEvents).toBe(4);
    expect(summary.eventCounts.RunStarted).toBe(1);
    expect(summary.eventCounts.StageFailed).toBe(1);
    expect(summary.failedStages).toEqual(["uow-2"]);
    expect(summary.elapsedMs).toBe(5000);
  });
});
