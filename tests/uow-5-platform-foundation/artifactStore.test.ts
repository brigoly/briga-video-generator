import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ArtifactStore } from "../../src/uow-5-platform-foundation/services/artifactStore";

const tempRoots: string[] = [];

async function createStore(): Promise<ArtifactStore> {
  const root = await mkdtemp(join(tmpdir(), "uow5-artifact-store-"));
  tempRoots.push(root);
  return new ArtifactStore(root);
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("artifact store", () => {
  it("persists versioned stage artifacts", async () => {
    const store = await createStore();

    const first = await store.persist({
      runId: "run-5",
      stageId: "uow-2",
      artifactKind: "output",
      artifactName: "script",
      payload: { content: "v1" }
    });

    const second = await store.persist({
      runId: "run-5",
      stageId: "uow-2",
      artifactKind: "output",
      artifactName: "script",
      payload: { content: "v2" }
    });

    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
    expect(second.path).toContain("run-5/uow-2/output/script.v2.json");
  });

  it("reads persisted payload", async () => {
    const store = await createStore();

    const artifact = await store.persist({
      runId: "run-6",
      stageId: "uow-3",
      artifactKind: "metadata",
      artifactName: "timeline-metadata",
      payload: { scenes: 4, duration: 29 }
    });

    const payload = await store.readPayload(artifact);
    expect(payload).toEqual({ scenes: 4, duration: 29 });
  });
});
