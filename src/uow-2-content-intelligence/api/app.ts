import express, { Request, Response } from "express";
import { InMemoryScriptRepository } from "../repositories/scriptRepository";
import { ScriptGenerationService } from "../services/scriptGenerationService";
import { buildContentIntelligenceRouter } from "./router";
import {
  buildRuntimeProviders,
  ProviderConfigurationError,
  ProviderFactoryConfig
} from "../providers/providerFactory";
import { createRuntimeFoundationService } from "../../shared-runtime/foundationRuntime";

export interface ContentIntelligenceAppOptions {
  service?: ScriptGenerationService;
  providerConfig?: ProviderFactoryConfig;
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

export function createRuntimeScriptGenerationService(
  providerConfig?: ProviderFactoryConfig,
  options: { requireRealProvider?: boolean } = {}
): ScriptGenerationService {
  const providers = buildRuntimeProviders(providerConfig, {
    requireRealProvider: options.requireRealProvider
  });
  const foundationService = createRuntimeFoundationService();
  return new ScriptGenerationService(providers, new InMemoryScriptRepository(), foundationService);
}

export function buildContentIntelligenceApp(options: ContentIntelligenceAppOptions = {}) {
  const app = express();
  app.use(express.json());

  let setupError: ProviderConfigurationError | undefined;

  try {
    const service =
      options.service ??
      createRuntimeScriptGenerationService(options.providerConfig, {
        requireRealProvider: options.requireRealProvider ?? envFlag("UOW2_REQUIRE_REAL_PROVIDER", false)
      });
    app.use("/v1", buildContentIntelligenceRouter(service));
  } catch (err) {
    if (err instanceof ProviderConfigurationError) {
      setupError = err;
      app.use("/v1", (_req, res) => {
        res.status(503).json({
          code: "PROVIDER_CONFIGURATION_ERROR",
          message: setupError?.message
        });
      });
    } else {
      throw err;
    }
  }

  app.use((err: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
    if (err instanceof ProviderConfigurationError) {
      res.status(503).json({ code: "PROVIDER_CONFIGURATION_ERROR", message: err.message });
      return;
    }

    const message = err instanceof Error ? err.message : "Unexpected error";
    res.status(500).json({ code: "UNEXPECTED", message });
  });

  return app;
}
