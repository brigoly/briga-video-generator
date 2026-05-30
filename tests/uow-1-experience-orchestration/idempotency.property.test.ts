import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  resolveIdempotency,
  buildCommandSignature,
  IdempotencyStore
} from "../../src/uow-1-experience-orchestration/orchestration/idempotencyResolver";
import { CommandEnvelope } from "../../src/shared-contracts/types";

class MemoryStore implements IdempotencyStore {
  private readonly data = new Map<string, { idempotencyKey: string; commandSignature: string; response: Record<string, unknown> }>();

  async get(key: string) {
    return this.data.get(key);
  }

  async set(record: { idempotencyKey: string; commandSignature: string; response: Record<string, unknown> }) {
    this.data.set(record.idempotencyKey, record);
  }
}

describe("idempotency invariant", () => {
  it("replays identical signature under same idempotency key", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 4, maxLength: 20 }), async (key) => {
        const store = new MemoryStore();
        const command: CommandEnvelope = {
          commandType: "start",
          idempotencyKey: key,
          payload: { topic: "x" },
          requestedAt: new Date().toISOString()
        };

        const signature = buildCommandSignature(command);
        await store.set({
          idempotencyKey: key,
          commandSignature: signature,
          response: { runId: "r1", replayed: false }
        });

        const result = await resolveIdempotency(store, command);
        expect(result.replayed).toBe(true);
      })
    );
  });
});
