import { CheckpointRecord, RunStateView } from "../../shared-contracts/types";
import { IdempotencyRecord, IdempotencyStore } from "../orchestration/idempotencyResolver";

export interface RunStateRepository {
  get(runId: string): Promise<RunStateView | undefined>;
  upsert(state: RunStateView): Promise<void>;
}

export interface CheckpointRepository {
  write(record: CheckpointRecord): Promise<void>;
  readLatest(runId: string): Promise<CheckpointRecord | undefined>;
}

export interface StatusCache {
  get(runId: string): Promise<RunStateView | undefined>;
  put(runId: string, value: RunStateView, ttlSeconds: number): Promise<void>;
  invalidate(runId: string): Promise<void>;
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly map = new Map<string, IdempotencyRecord>();

  async get(key: string): Promise<IdempotencyRecord | undefined> {
    return this.map.get(key);
  }

  async set(record: IdempotencyRecord): Promise<void> {
    this.map.set(record.idempotencyKey, record);
  }
}

export class InMemoryRunStateRepository implements RunStateRepository {
  private readonly map = new Map<string, RunStateView>();

  async get(runId: string): Promise<RunStateView | undefined> {
    return this.map.get(runId);
  }

  async upsert(state: RunStateView): Promise<void> {
    this.map.set(state.runId, state);
  }
}

export class InMemoryCheckpointRepository implements CheckpointRepository {
  private readonly map = new Map<string, CheckpointRecord[]>();

  async write(record: CheckpointRecord): Promise<void> {
    const list = this.map.get(record.runId) ?? [];
    list.push(record);
    this.map.set(record.runId, list);
  }

  async readLatest(runId: string): Promise<CheckpointRecord | undefined> {
    const list = this.map.get(runId) ?? [];
    return list[list.length - 1];
  }
}

export class PostgresRunStateRepositorySkeleton implements RunStateRepository {
  async get(_runId: string): Promise<RunStateView | undefined> {
    throw new Error("Not implemented: PostgreSQL adapter skeleton placeholder");
  }

  async upsert(_state: RunStateView): Promise<void> {
    throw new Error("Not implemented: PostgreSQL adapter skeleton placeholder");
  }
}
