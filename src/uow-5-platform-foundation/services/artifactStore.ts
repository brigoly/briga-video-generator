import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { ArtifactWriteRequest, StoredArtifact } from "../../shared-contracts/platformFoundationTypes";

interface StoredEnvelope {
  artifact: StoredArtifact;
  payload: unknown;
}

function nowIso(): string {
  return new Date().toISOString();
}

function sanitizePathSegment(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "artifact";
}

export class ArtifactStore {
  constructor(private readonly rootDir: string) {}

  private stageDir(runId: string, stageId: string, artifactKind: string): string {
    return join(this.rootDir, sanitizePathSegment(runId), sanitizePathSegment(stageId), artifactKind);
  }

  private async nextVersion(
    runId: string,
    stageId: string,
    artifactKind: string,
    artifactName: string
  ): Promise<number> {
    const dir = this.stageDir(runId, stageId, artifactKind);
    try {
      const files = await readdir(dir);
      const prefix = `${sanitizePathSegment(artifactName)}.v`;
      const matches = files
        .filter((file) => file.startsWith(prefix) && file.endsWith(".json"))
        .map((file) => file.slice(prefix.length, file.length - 5))
        .map((version) => Number(version))
        .filter((version) => Number.isFinite(version));
      return (matches.length ? Math.max(...matches) : 0) + 1;
    } catch {
      return 1;
    }
  }

  async persist(request: ArtifactWriteRequest): Promise<StoredArtifact> {
    const safeRunId = sanitizePathSegment(request.runId);
    const safeStageId = sanitizePathSegment(request.stageId);
    const safeArtifactName = sanitizePathSegment(request.artifactName);
    const version = await this.nextVersion(
      safeRunId,
      safeStageId,
      request.artifactKind,
      safeArtifactName
    );

    const dir = this.stageDir(safeRunId, safeStageId, request.artifactKind);
    await mkdir(dir, { recursive: true });

    const fileName = `${safeArtifactName}.v${version}.json`;
    const absolutePath = join(dir, fileName);
    const payloadJson = JSON.stringify(request.payload);

    const artifact: StoredArtifact = {
      artifactId: randomUUID(),
      runId: request.runId,
      stageId: request.stageId,
      artifactKind: request.artifactKind,
      artifactName: request.artifactName,
      version,
      path: relative(this.rootDir, absolutePath).replace(/\\/g, "/"),
      checksum: createHash("sha256").update(payloadJson).digest("hex"),
      createdAt: nowIso(),
      parentArtifactId: request.parentArtifactId,
      reusedFromRunId: request.reusedFromRunId
    };

    const envelope: StoredEnvelope = {
      artifact,
      payload: request.payload
    };

    await writeFile(absolutePath, JSON.stringify(envelope, null, 2), "utf8");
    return artifact;
  }

  async readPayload(artifact: StoredArtifact): Promise<unknown> {
    const absolutePath = join(this.rootDir, artifact.path);
    const file = await readFile(absolutePath, "utf8");
    const parsed = JSON.parse(file) as StoredEnvelope;
    return parsed.payload;
  }
}
