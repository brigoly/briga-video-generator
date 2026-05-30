import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ManifestIndexService } from "../../src/uow-5-platform-foundation/services/manifestIndexService";
import { PlatformFoundationService } from "../../src/uow-5-platform-foundation/services/platformFoundationService";
import { ArtifactStore } from "../../src/uow-5-platform-foundation/services/artifactStore";
import { TelemetryService } from "../../src/uow-5-platform-foundation/services/telemetryService";

const tempRoots: string[] = [];

async function createService(): Promise<PlatformFoundationService> {
  const root = await mkdtemp(join(tmpdir(), "uow5-foundation-service-"));
  tempRoots.push(root);
  return new PlatformFoundationService({
    artifactStore: new ArtifactStore(root),
    manifestIndexService: new ManifestIndexService(root),
    telemetryService: new TelemetryService(root)
  });
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("platform foundation service", () => {
  it("persists artifact and updates manifest plus telemetry", async () => {
    const service = await createService();

    await service.persistStageArtifact({
      runId: "run-foundation",
      stageId: "uow-4",
      artifactKind: "output",
      artifactName: "tiktok-package",
      payload: { uri: "file:///tmp/package.zip" },
      parameters: { platform: "tiktok" }
    });

    const manifest = await service.getRunManifest("run-foundation");
    const summary = service.getTelemetrySummary("run-foundation");

    expect(manifest?.artifacts).toHaveLength(1);
    expect(manifest?.stageParameters).toHaveLength(1);
    expect(summary.eventCounts.ArtifactPersisted).toBe(1);
  });
});
