import { RunStateView } from "../../shared-contracts/types";
import { StatusCache } from "./interfaces";

interface Entry {
  expiresAt: number;
  value: RunStateView;
}

export class InMemoryStatusCache implements StatusCache {
  private readonly map = new Map<string, Entry>();

  async get(runId: string): Promise<RunStateView | undefined> {
    const entry = this.map.get(runId);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.map.delete(runId);
      return undefined;
    }

    return entry.value;
  }

  async put(runId: string, value: RunStateView, ttlSeconds: number): Promise<void> {
    this.map.set(runId, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  async invalidate(runId: string): Promise<void> {
    this.map.delete(runId);
  }
}
