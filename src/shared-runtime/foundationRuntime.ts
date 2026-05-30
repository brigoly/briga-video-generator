import { join } from "node:path";
import { ArtifactStore } from "../uow-5-platform-foundation/services/artifactStore";
import { ManifestIndexService } from "../uow-5-platform-foundation/services/manifestIndexService";
import { PlatformFoundationService } from "../uow-5-platform-foundation/services/platformFoundationService";
import { TelemetryService } from "../uow-5-platform-foundation/services/telemetryService";

export interface RuntimeFoundationOptions {
  artifactRootDir?: string;
  enabled?: boolean;
}

function envFlag(name: string, defaultValue = true): boolean {
  const value = process.env[name];
  if (!value) {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function createRuntimeFoundationService(
  options: RuntimeFoundationOptions = {}
): PlatformFoundationService | undefined {
  const enabled = options.enabled ?? envFlag("UOW5_ENABLE_RUNTIME_HOOKS", true);
  if (!enabled) {
    return undefined;
  }

  const configuredRoot = options.artifactRootDir ?? process.env.UOW5_ARTIFACT_ROOT_DIR;
  const rootDir = configuredRoot && configuredRoot.trim().length > 0 ? configuredRoot : join(process.cwd(), "artifacts");

  return new PlatformFoundationService({
    artifactStore: new ArtifactStore(rootDir),
    manifestIndexService: new ManifestIndexService(rootDir),
    telemetryService: new TelemetryService(rootDir)
  });
}
