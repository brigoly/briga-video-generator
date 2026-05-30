import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  TelemetryEvent,
  TelemetryEventType,
  TelemetrySummary
} from "../../shared-contracts/platformFoundationTypes";

function toMillis(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export class TelemetryService {
  private readonly eventsByRun = new Map<string, TelemetryEvent[]>();

  constructor(private readonly rootDir: string) {}

  private logPath(runId: string): string {
    return join(this.rootDir, runId, "telemetry", "events.jsonl");
  }

  async record(input: Omit<TelemetryEvent, "timestamp"> & { timestamp?: string }): Promise<TelemetryEvent> {
    const event: TelemetryEvent = {
      ...input,
      timestamp: input.timestamp ?? new Date().toISOString()
    };

    const existing = this.eventsByRun.get(event.runId) ?? [];
    existing.push(event);
    this.eventsByRun.set(event.runId, existing);

    const filePath = this.logPath(event.runId);
    await mkdir(dirname(filePath), { recursive: true });
    await appendFile(filePath, `${JSON.stringify(event)}\n`, "utf8");

    return event;
  }

  getEvents(runId: string): TelemetryEvent[] {
    return [...(this.eventsByRun.get(runId) ?? [])];
  }

  getSummary(runId: string): TelemetrySummary {
    const events = this.getEvents(runId);
    const eventCounts: Partial<Record<TelemetryEventType, number>> = {};
    const failedStages = new Set<string>();

    for (const event of events) {
      eventCounts[event.eventType] = (eventCounts[event.eventType] ?? 0) + 1;
      if (event.eventType === "StageFailed") {
        failedStages.add(event.stageId);
      }
    }

    const runStarted = events.find((event) => event.eventType === "RunStarted");
    const runCompleted = [...events].reverse().find((event) => event.eventType === "RunCompleted");
    const startedMs = toMillis(runStarted?.timestamp);
    const completedMs = toMillis(runCompleted?.timestamp);

    return {
      runId,
      totalEvents: events.length,
      eventCounts,
      failedStages: [...failedStages],
      elapsedMs:
        startedMs !== undefined && completedMs !== undefined && completedMs >= startedMs
          ? completedMs - startedMs
          : undefined
    };
  }
}
