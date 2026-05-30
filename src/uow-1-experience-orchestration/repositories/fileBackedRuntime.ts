import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { CheckpointRecord, RunStateView } from "../../shared-contracts/types";
import { IdempotencyRecord, IdempotencyStore } from "../orchestration/idempotencyResolver";
import { CheckpointRepository, RunStateRepository, StatusCache } from "./interfaces";

async function ensureParentDir(filePath: string): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
}

class JsonFileStore<T> {
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly filePath: string,
    private readonly emptyValue: T
  ) {}

  async read(): Promise<T> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return JSON.parse(raw) as T;
    } catch {
      return this.emptyValue;
    }
  }

  async write(next: T): Promise<void> {
    await this.enqueue(async () => {
      await ensureParentDir(this.filePath);
      await writeFile(this.filePath, JSON.stringify(next, null, 2), "utf8");
    });
  }

  private enqueue(task: () => Promise<void>): Promise<void> {
    this.queue = this.queue.then(task, task);
    return this.queue;
  }
}

export class FileRunStateRepository implements RunStateRepository {
  private readonly store: JsonFileStore<Record<string, RunStateView>>;

  constructor(rootDir: string) {
    this.store = new JsonFileStore(join(rootDir, "run-state.json"), {});
  }

  async get(runId: string): Promise<RunStateView | undefined> {
    const data = await this.store.read();
    return data[runId];
  }

  async upsert(state: RunStateView): Promise<void> {
    const data = await this.store.read();
    data[state.runId] = state;
    await this.store.write(data);
  }
}

export class FileCheckpointRepository implements CheckpointRepository {
  private readonly store: JsonFileStore<Record<string, CheckpointRecord[]>>;

  constructor(rootDir: string) {
    this.store = new JsonFileStore(join(rootDir, "checkpoints.json"), {});
  }

  async write(record: CheckpointRecord): Promise<void> {
    const data = await this.store.read();
    const list = data[record.runId] ?? [];
    list.push(record);
    data[record.runId] = list;
    await this.store.write(data);
  }

  async readLatest(runId: string): Promise<CheckpointRecord | undefined> {
    const data = await this.store.read();
    const list = data[runId] ?? [];
    return list[list.length - 1];
  }
}

interface CachedEntry {
  value: RunStateView;
  expiresAt: number;
}

export class FileStatusCache implements StatusCache {
  private readonly store: JsonFileStore<Record<string, CachedEntry>>;

  constructor(rootDir: string) {
    this.store = new JsonFileStore(join(rootDir, "status-cache.json"), {});
  }

  async get(runId: string): Promise<RunStateView | undefined> {
    const data = await this.store.read();
    const entry = data[runId];
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      delete data[runId];
      await this.store.write(data);
      return undefined;
    }

    return entry.value;
  }

  async put(runId: string, value: RunStateView, ttlSeconds: number): Promise<void> {
    const data = await this.store.read();
    data[runId] = {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    };
    await this.store.write(data);
  }

  async invalidate(runId: string): Promise<void> {
    const data = await this.store.read();
    delete data[runId];
    await this.store.write(data);
  }
}

export class FileIdempotencyStore implements IdempotencyStore {
  private readonly store: JsonFileStore<Record<string, IdempotencyRecord>>;

  constructor(rootDir: string) {
    this.store = new JsonFileStore(join(rootDir, "idempotency.json"), {});
  }

  async get(key: string): Promise<IdempotencyRecord | undefined> {
    const data = await this.store.read();
    return data[key];
  }

  async set(record: IdempotencyRecord): Promise<void> {
    const data = await this.store.read();
    data[record.idempotencyKey] = record;
    await this.store.write(data);
  }
}

export interface PersistenceHealthResult {
  ok: boolean;
  mode: "file" | "memory";
  checkedAt: string;
  rootDir?: string;
  details?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function probeFilePersistenceHealth(rootDir: string): Promise<PersistenceHealthResult> {
  const filePath = join(rootDir, ".healthcheck.tmp");
  const payload = JSON.stringify({ checkedAt: nowIso() });

  try {
    await ensureParentDir(filePath);
    await writeFile(filePath, payload, "utf8");
    const readBack = await readFile(filePath, "utf8");
    await unlink(filePath).catch(() => undefined);

    if (readBack !== payload) {
      return {
        ok: false,
        mode: "file",
        checkedAt: nowIso(),
        rootDir,
        details: "Persistence readback mismatch"
      };
    }

    return {
      ok: true,
      mode: "file",
      checkedAt: nowIso(),
      rootDir,
      details: "Writable and readable"
    };
  } catch (err) {
    return {
      ok: false,
      mode: "file",
      checkedAt: nowIso(),
      rootDir,
      details: err instanceof Error ? err.message : "Unknown persistence error"
    };
  }
}
