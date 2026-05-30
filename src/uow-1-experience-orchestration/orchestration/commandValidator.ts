import { z } from "zod";
import { CommandEnvelope } from "../../shared-contracts/types";
import { DomainError } from "./errors";

const commandSchema = z.object({
  commandType: z.enum(["start", "resume", "retry", "status", "inspect"]),
  idempotencyKey: z.string().min(4),
  runId: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
  requestedAt: z.string().datetime()
});

export function validateAndNormalizeCommand(input: unknown): CommandEnvelope {
  const parsed = commandSchema.safeParse(input);

  if (!parsed.success) {
    throw new DomainError("CMD_VALIDATION_FAILED", parsed.error.message, 422);
  }

  const command = parsed.data;
  if ((command.commandType === "resume" || command.commandType === "retry" || command.commandType === "status" || command.commandType === "inspect") && !command.runId) {
    throw new DomainError("CMD_RUN_ID_REQUIRED", "runId is required for this command", 422);
  }

  return {
    ...command,
    payload: command.payload ?? {}
  };
}
