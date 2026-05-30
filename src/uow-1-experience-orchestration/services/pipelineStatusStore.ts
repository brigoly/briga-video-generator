import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { join } from "node:path";
import { PipelineStageOutputs, RunStageProgress } from "./unifiedPipelineService";

export interface PipelineStatusSnapshot {
  outputs: PipelineStageOutputs;
  progress: RunStageProgress;
}

export interface PipelineStatusStore {
  get(runId: string): Promise<PipelineStatusSnapshot | undefined>;
  set(runId: string, snapshot: PipelineStatusSnapshot): Promise<void>;
}

function defaultProgress(): RunStageProgress {
  return {
    script: {},
    mediaSelection: {},
    timeline: {},
    packaging: {},
    publish: {}
  };
}

export class InMemoryPipelineStatusStore implements PipelineStatusStore {
  private readonly map = new Map<string, PipelineStatusSnapshot>();

  async get(runId: string): Promise<PipelineStatusSnapshot | undefined> {
    return this.map.get(runId);
  }

  async set(runId: string, snapshot: PipelineStatusSnapshot): Promise<void> {
    this.map.set(runId, snapshot);
  }
}

interface PipelineStatusFileEnvelope {
  [runId: string]: PipelineStatusSnapshot;
}

export class FilePipelineStatusStore implements PipelineStatusStore {
  private readonly filePath: string;
  private queue: Promise<void> = Promise.resolve();

  constructor(rootDir: string) {
    this.filePath = join(rootDir, "pipeline-status.json");
  }

  private async readAll(): Promise<PipelineStatusFileEnvelope> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as PipelineStatusFileEnvelope;
      return parsed;
    } catch {
      return {};
    }
  }

  private async writeAll(data: PipelineStatusFileEnvelope): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(data, null, 2), "utf8");
  }

  private enqueue(task: () => Promise<void>): Promise<void> {
    this.queue = this.queue.then(task, task);
    return this.queue;
  }

  async get(runId: string): Promise<PipelineStatusSnapshot | undefined> {
    const data = await this.readAll();
    const entry = data[runId];
    if (!entry) {
      return undefined;
    }

    return {
      outputs: entry.outputs ?? {},
      progress: entry.progress ?? defaultProgress()
    };
  }

  async set(runId: string, snapshot: PipelineStatusSnapshot): Promise<void> {
    await this.enqueue(async () => {
      const data = await this.readAll();
      data[runId] = {
        outputs: snapshot.outputs,
        progress: snapshot.progress
      };
      await this.writeAll(data);
    });
  }
}
