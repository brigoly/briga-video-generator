import { buildApp } from "./app";
import { InMemoryCheckpointRepository, InMemoryIdempotencyStore, InMemoryRunStateRepository } from "../repositories/interfaces";
import { InMemoryStatusCache } from "../repositories/statusCache";
import { OrchestrationService } from "../services/orchestrationService";
import { UnifiedPipelineService } from "../services/unifiedPipelineService";
import {
  FileCheckpointRepository,
  FileIdempotencyStore,
  PersistenceHealthResult,
  FileRunStateRepository,
  FileStatusCache,
  probeFilePersistenceHealth
} from "../repositories/fileBackedRuntime";
import { FilePipelineStatusStore, InMemoryPipelineStatusStore } from "../services/pipelineStatusStore";
import { buildRuntimeProviders } from "../../uow-2-content-intelligence/providers/providerFactory";
import { ScriptGenerationService } from "../../uow-2-content-intelligence/services/scriptGenerationService";
import { InMemoryScriptRepository } from "../../uow-2-content-intelligence/repositories/scriptRepository";
import { buildRuntimeMediaProviders } from "../../uow-3-media-composition/providers/providerFactory";
import { MediaCompositionService } from "../../uow-3-media-composition/services/mediaCompositionService";
import { InMemoryCompositionRepository } from "../../uow-3-media-composition/repositories/compositionRepository";
import { buildRuntimePackagingProvider } from "../../uow-4-platform-packaging/providers/providerFactory";
import { buildRuntimePublishers } from "../../uow-4-platform-packaging/providers/publisherFactory";
import { MultiPlatformPackagingService } from "../../uow-4-platform-packaging/services/multiPlatformOrchestrator";
import { InMemoryPackageRepository } from "../../uow-4-platform-packaging/repositories/packageRepository";
import { createRuntimeFoundationService } from "../../shared-runtime/foundationRuntime";
import { join } from "node:path";

const port = Number(process.env.PORT ?? "3000");
const cacheTtlSeconds = Number(process.env.STATUS_CACHE_TTL_SECONDS ?? "3");
const persistRootDir =
  process.env.UOW1_PERSIST_ROOT_DIR && process.env.UOW1_PERSIST_ROOT_DIR.trim().length > 0
    ? process.env.UOW1_PERSIST_ROOT_DIR
    : join(process.cwd(), "artifacts", "uow1-runtime");
const useInMemoryPersistence = process.env.UOW1_USE_IN_MEMORY === "true";
const defaultEnablePublishing = process.env.UOW1_ENABLE_PUBLISH_STAGE === "true";

const startupPersistenceHealth: PersistenceHealthResult = {
  ok: true,
  mode: useInMemoryPersistence ? "memory" : "file",
  checkedAt: new Date().toISOString(),
  rootDir: useInMemoryPersistence ? undefined : persistRootDir,
  details: useInMemoryPersistence ? "In-memory persistence enabled" : "Pending startup probe"
};

const runStateRepository = useInMemoryPersistence
  ? new InMemoryRunStateRepository()
  : new FileRunStateRepository(persistRootDir);
const checkpointRepository = useInMemoryPersistence
  ? new InMemoryCheckpointRepository()
  : new FileCheckpointRepository(persistRootDir);
const statusCache = useInMemoryPersistence
  ? new InMemoryStatusCache()
  : new FileStatusCache(persistRootDir);
const idempotencyStore = useInMemoryPersistence
  ? new InMemoryIdempotencyStore()
  : new FileIdempotencyStore(persistRootDir);
const pipelineStatusStore = useInMemoryPersistence
  ? new InMemoryPipelineStatusStore()
  : new FilePipelineStatusStore(persistRootDir);

const foundationService = createRuntimeFoundationService();

const uow2Providers = buildRuntimeProviders({}, {
  requireRealProvider: process.env.UOW2_REQUIRE_REAL_PROVIDER === "true"
});
const scriptService = new ScriptGenerationService(
  uow2Providers,
  new InMemoryScriptRepository(),
  foundationService
);

const uow3Providers = buildRuntimeMediaProviders({}, {
  requireRealProvider: process.env.UOW3_REQUIRE_REAL_PROVIDER === "true"
});
const mediaService = new MediaCompositionService(
  uow3Providers.stockProvider,
  uow3Providers.aiProvider,
  new InMemoryCompositionRepository(),
  foundationService
);

const uow4ArtifactProvider = buildRuntimePackagingProvider({}, {
  requireRealProvider: process.env.UOW4_REQUIRE_REAL_PROVIDER === "true"
});
const uow4Publishers = buildRuntimePublishers({}, {
  requireRealPublisher: process.env.UOW4_REQUIRE_REAL_PUBLISHER === "true"
});
const packagingService = new MultiPlatformPackagingService(
  new InMemoryPackageRepository(),
  uow4ArtifactProvider,
  foundationService,
  uow4Publishers
);

const orchestrationService = new OrchestrationService({
  idempotencyStore,
  runStateRepository,
  checkpointRepository,
  statusCache,
  cacheTtlSeconds
});

const unifiedPipelineService = new UnifiedPipelineService({
  scriptService,
  mediaService,
  packagingService,
  runStateRepository,
  checkpointRepository,
  statusCache,
  cacheTtlSeconds,
  pipelineStatusStore,
  defaultEnablePublishing
});

if (!useInMemoryPersistence) {
  probeFilePersistenceHealth(persistRootDir)
    .then((result) => {
      startupPersistenceHealth.ok = result.ok;
      startupPersistenceHealth.mode = result.mode;
      startupPersistenceHealth.checkedAt = result.checkedAt;
      startupPersistenceHealth.rootDir = result.rootDir;
      startupPersistenceHealth.details = result.details;
    })
    .catch((err) => {
      startupPersistenceHealth.ok = false;
      startupPersistenceHealth.mode = "file";
      startupPersistenceHealth.checkedAt = new Date().toISOString();
      startupPersistenceHealth.rootDir = persistRootDir;
      startupPersistenceHealth.details = err instanceof Error ? err.message : "Startup persistence probe failed";
    });
}

const app = buildApp(orchestrationService, unifiedPipelineService, {
  startupPersistenceHealth,
  getPersistenceHealth: async () => {
    if (useInMemoryPersistence) {
      return {
        ok: true,
        mode: "memory",
        checkedAt: new Date().toISOString(),
        details: "In-memory persistence enabled"
      };
    }
    return probeFilePersistenceHealth(persistRootDir);
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`UOW-1 orchestration API running on port ${port}`);
});
