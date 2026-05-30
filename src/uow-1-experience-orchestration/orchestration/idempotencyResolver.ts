import { CommandEnvelope } from "../../shared-contracts/types";

export interface IdempotencyRecord {
  idempotencyKey: string;
  commandSignature: string;
  response: unknown;
}

export interface IdempotencyStore {
  get(key: string): Promise<IdempotencyRecord | undefined>;
  set(record: IdempotencyRecord): Promise<void>;
}

export function buildCommandSignature(command: CommandEnvelope): string {
  return JSON.stringify({
    commandType: command.commandType,
    runId: command.runId ?? null,
    payload: command.payload
  });
}

export async function resolveIdempotency(
  store: IdempotencyStore,
  command: CommandEnvelope
): Promise<{ replayed: boolean; response?: unknown; signature: string }> {
  const signature = buildCommandSignature(command);
  const existing = await store.get(command.idempotencyKey);

  if (!existing) {
    return { replayed: false, signature };
  }

  return {
    replayed: true,
    response: existing.response,
    signature: existing.commandSignature
  };
}
