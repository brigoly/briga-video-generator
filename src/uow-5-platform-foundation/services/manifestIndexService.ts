import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  ArtifactWriteRequest,
  ManifestComparison,
  RunManifest,
  StageParameterSnapshot,
  StoredArtifact
} from "../../shared-contracts/platformFoundationTypes";

function nowIso(): string {
  return new Date().toISOString();
}

function artifactIdentity(artifact: StoredArtifact): string {
  return `${artifact.stageId}:${artifact.artifactKind}:${artifact.artifactName}`;
}

function stableJsonHash(input: unknown): string {
  return JSON.stringify(input);
}

function emptyManifest(runId: string): RunManifest {
  return {
    runId,
    updatedAt: nowIso(),
    artifacts: [],
    lineage: [],
    stageParameters: []
  };
}

export class ManifestIndexService {
  private readonly manifests = new Map<string, RunManifest>();

  constructor(private readonly rootDir: string) {}

  private manifestPath(runId: string): string {
    return join(this.rootDir, runId, "manifest.json");
  }

  private async writeManifest(manifest: RunManifest): Promise<void> {
    const filePath = this.manifestPath(manifest.runId);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(manifest, null, 2), "utf8");
  }

  private async getOrLoad(runId: string): Promise<RunManifest> {
    const cached = this.manifests.get(runId);
    if (cached) {
      return cached;
    }

    try {
      const file = await readFile(this.manifestPath(runId), "utf8");
      const parsed = JSON.parse(file) as RunManifest;
      this.manifests.set(runId, parsed);
      return parsed;
    } catch {
      const manifest = emptyManifest(runId);
      this.manifests.set(runId, manifest);
      return manifest;
    }
  }

  async recordArtifact(artifact: StoredArtifact, request: ArtifactWriteRequest): Promise<RunManifest> {
    const manifest = await this.getOrLoad(artifact.runId);
    if (!manifest.artifacts.some((existing) => existing.artifactId === artifact.artifactId)) {
      manifest.artifacts.push(artifact);
    }

    if (artifact.parentArtifactId) {
      manifest.lineage.push({
        parentArtifactId: artifact.parentArtifactId,
        childArtifactId: artifact.artifactId
      });
    }

    if (request.parameters) {
      const nextSnapshot: StageParameterSnapshot = {
        stageId: artifact.stageId,
        parameters: request.parameters,
        updatedAt: nowIso()
      };
      const existingIndex = manifest.stageParameters.findIndex(
        (snapshot) => snapshot.stageId === artifact.stageId
      );
      if (existingIndex >= 0) {
        manifest.stageParameters[existingIndex] = nextSnapshot;
      } else {
        manifest.stageParameters.push(nextSnapshot);
      }
    }

    manifest.updatedAt = nowIso();
    await this.writeManifest(manifest);
    return manifest;
  }

  async getManifest(runId: string): Promise<RunManifest | undefined> {
    try {
      return await this.getOrLoad(runId);
    } catch {
      return undefined;
    }
  }

  async compareManifests(baseRunId: string, candidateRunId: string): Promise<ManifestComparison> {
    const base = (await this.getManifest(baseRunId)) ?? emptyManifest(baseRunId);
    const candidate = (await this.getManifest(candidateRunId)) ?? emptyManifest(candidateRunId);

    const baseKeys = new Set(base.artifacts.map((artifact) => artifactIdentity(artifact)));
    const candidateKeys = new Set(candidate.artifacts.map((artifact) => artifactIdentity(artifact)));

    const addedArtifacts = [...candidateKeys].filter((key) => !baseKeys.has(key));
    const removedArtifacts = [...baseKeys].filter((key) => !candidateKeys.has(key));

    const baseSnapshotMap = new Map(base.stageParameters.map((snapshot) => [snapshot.stageId, snapshot]));
    const changedParameters = candidate.stageParameters
      .map((snapshot) => {
        const prior = baseSnapshotMap.get(snapshot.stageId);
        if (!prior) {
          return {
            stageId: snapshot.stageId,
            base: {},
            candidate: snapshot.parameters
          };
        }
        if (stableJsonHash(prior.parameters) === stableJsonHash(snapshot.parameters)) {
          return undefined;
        }
        return {
          stageId: snapshot.stageId,
          base: prior.parameters,
          candidate: snapshot.parameters
        };
      })
      .filter((entry): entry is { stageId: string; base: Record<string, unknown>; candidate: Record<string, unknown> } => Boolean(entry));

    return {
      baseRunId,
      candidateRunId,
      addedArtifacts,
      removedArtifacts,
      changedParameters
    };
  }
}
