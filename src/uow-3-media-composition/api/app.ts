import express, { Request, Response } from "express";
import { InMemoryCompositionRepository } from "../repositories/compositionRepository";
import { MediaCompositionService } from "../services/mediaCompositionService";
import { buildMediaCompositionRouter } from "./router";
import {
  buildRuntimeMediaProviders,
  MediaProviderConfigurationError,
  MediaProviderFactoryConfig
} from "../providers/providerFactory";
import { createRuntimeFoundationService } from "../../shared-runtime/foundationRuntime";

export interface MediaCompositionAppOptions {
  service?: MediaCompositionService;
  providerConfig?: MediaProviderFactoryConfig;
  requireRealProvider?: boolean;
}

function envFlag(name: string, defaultValue = false): boolean {
  const value = process.env[name];
  if (!value) {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function createRuntimeMediaCompositionService(
  providerConfig?: MediaProviderFactoryConfig,
  options: { requireRealProvider?: boolean } = {}
): MediaCompositionService {
  const providers = buildRuntimeMediaProviders(providerConfig, {
    requireRealProvider: options.requireRealProvider
  });
  const foundationService = createRuntimeFoundationService();

  return new MediaCompositionService(
    providers.stockProvider,
    providers.aiProvider,
    new InMemoryCompositionRepository(),
    foundationService
  );
}

export function buildMediaCompositionApp(options: MediaCompositionAppOptions = {}) {
  const app = express();
  app.use(express.json());

  try {
    const service =
      options.service ??
      createRuntimeMediaCompositionService(options.providerConfig, {
        requireRealProvider: options.requireRealProvider ?? envFlag("UOW3_REQUIRE_REAL_PROVIDER", false)
      });

    app.use("/v1", buildMediaCompositionRouter(service));
  } catch (err) {
    if (err instanceof MediaProviderConfigurationError) {
      app.use("/v1", (_req, res) => {
        res.status(503).json({
          code: "MEDIA_PROVIDER_CONFIGURATION_ERROR",
          message: err.message
        });
      });
    } else {
      throw err;
    }
  }

  app.use((err: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
    if (err instanceof MediaProviderConfigurationError) {
      res.status(503).json({ code: "MEDIA_PROVIDER_CONFIGURATION_ERROR", message: err.message });
      return;
    }

    const message = err instanceof Error ? err.message : "Unexpected error";
    res.status(500).json({ code: "UNEXPECTED", message });
  });

  return app;
}
