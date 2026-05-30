import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ArtifactStore } from "../../src/uow-5-platform-foundation/services/artifactStore";
import { ManifestIndexService } from "../../src/uow-5-platform-foundation/services/manifestIndexService";

const tempRoots: string[] = [];

async function createServices() {
  const root = await mkdtemp(join(tmpdir(), "uow5-manifest-index-"));
  tempRoots.push(root);
  return {
    store: new ArtifactStore(root),
    manifest: new ManifestIndexService(root)
  };
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("manifest index service", () => {
  it("records artifacts and lineage", async () => {
    const { store, manifest } = await createServices();

    const first = await store.persist({
      runId: "run-base",
      stageId: "uow-2",
      artifactKind: "output",
      artifactName: "script",
      payload: { content: "alpha" }
    });
    await manifest.recordArtifact(first, {
      runId: "run-base",
      stageId: "uow-2",
      artifactKind: "output",
      artifactName: "script",
      payload: { content: "alpha" },
      parameters: { tone: "calm" }
    });

    const second = await store.persist({
      runId: "run-base",
      stageId: "uow-2",
      artifactKind: "output",
      artifactName: "script-variant",
      payload: { content: "beta" },
      parentArtifactId: first.artifactId
    });
    await manifest.recordArtifact(second, {
      runId: "run-base",
      stageId: "uow-2",
      artifactKind: "output",
      artifactName: "script-variant",
      payload: { content: "beta" },
      parentArtifactId: first.artifactId
    });

    const runManifest = await manifest.getManifest("run-base");

    expect(runManifest?.artifacts).toHaveLength(2);
    expect(runManifest?.lineage).toEqual([
      {
        parentArtifactId: first.artifactId,
        childArtifactId: second.artifactId
      }
    ]);
  });

  it("compares manifests and reports parameter changes", async () => {
    const { store, manifest } = await createServices();

    const baseArtifact = await store.persist({
      runId: "run-a",
      stageId: "uow-3",
      artifactKind: "output",
      artifactName: "timeline",
      payload: { scenes: 5 }
    });
    await manifest.recordArtifact(baseArtifact, {
      runId: "run-a",
      stageId: "uow-3",
      artifactKind: "output",
      artifactName: "timeline",
      payload: { scenes: 5 },
      parameters: { duration: 30 }
    });

    const candidateArtifact = await store.persist({
      runId: "run-b",
      stageId: "uow-3",
      artifactKind: "output",
      artifactName: "timeline-v2",
      payload: { scenes: 6 }
    });
    await manifest.recordArtifact(candidateArtifact, {
      runId: "run-b",
      stageId: "uow-3",
      artifactKind: "output",
      artifactName: "timeline-v2",
      payload: { scenes: 6 },
      parameters: { duration: 45 }
    });

    const comparison = await manifest.compareManifests("run-a", "run-b");

    expect(comparison.addedArtifacts).toContain("uow-3:output:timeline-v2");
    expect(comparison.removedArtifacts).toContain("uow-3:output:timeline");
    expect(comparison.changedParameters).toHaveLength(1);
    expect(comparison.changedParameters[0].stageId).toBe("uow-3");
  });
});
