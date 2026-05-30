import express, { Request, Response } from "express";
import { DomainError } from "../orchestration/errors";
import { authMiddleware, requireRunAccess } from "./auth";
import { OrchestrationService } from "../services/orchestrationService";
import { UnifiedPipelineService } from "../services/unifiedPipelineService";
import { PersistenceHealthResult } from "../repositories/fileBackedRuntime";

export interface AppHealthOptions {
  getPersistenceHealth?: () => Promise<PersistenceHealthResult>;
  startupPersistenceHealth?: PersistenceHealthResult;
}

export function buildApp(
  orchestrationService: OrchestrationService,
  pipelineService?: UnifiedPipelineService,
  healthOptions: AppHealthOptions = {}
) {
  const app = express();
  app.use(express.json());

  if (healthOptions.getPersistenceHealth) {
    app.get("/v1/health/persistence", async (_req, res, next) => {
      try {
        const current = await healthOptions.getPersistenceHealth?.();
        res.status(current?.ok ? 200 : 503).json({
          startup: healthOptions.startupPersistenceHealth,
          current
        });
      } catch (err) {
        next(err);
      }
    });
  }

  app.post("/v1/runs/:commandType", authMiddleware, async (req: Request, res: Response, next) => {
    try {
      const commandType = req.params.commandType;
      const response = await orchestrationService.handleCommand({
        commandType,
        idempotencyKey: req.header("x-idempotency-key") ?? req.body.idempotencyKey,
        runId: req.body.runId,
        payload: req.body.payload ?? {},
        requestedAt: new Date().toISOString()
      });

      res.status(response.replayed ? 200 : 202).json(response);
    } catch (err) {
      next(err);
    }
  });

  app.get("/v1/runs/:runId/status", authMiddleware, requireRunAccess, async (req, res, next) => {
    try {
      const status = await orchestrationService.getStatus(req.params.runId);
      if (!status) {
        res.status(404).json({ code: "RUN_NOT_FOUND", message: "Run not found" });
        return;
      }
      res.status(200).json(status);
    } catch (err) {
      next(err);
    }
  });

  app.get("/v1/runs/:runId/inspect", authMiddleware, requireRunAccess, async (req, res, next) => {
    try {
      const status = await orchestrationService.getStatus(req.params.runId);
      if (!status) {
        res.status(404).json({ code: "RUN_NOT_FOUND", message: "Run not found" });
        return;
      }

      res.status(200).json({
        runId: status.runId,
        runState: status.runState,
        stageSubState: status.stageSubState,
        reasonCode: status.reasonCode,
        recommendedAction: status.recommendedAction,
        updatedAt: status.updatedAt
      });
    } catch (err) {
      next(err);
    }
  });

  if (pipelineService) {
    app.post("/v1/pipeline/runs/start", authMiddleware, async (req, res, next) => {
      try {
        const response = await pipelineService.startPipeline({
          runId: req.body.runId,
          topic: req.body.topic,
          title: req.body.title,
          hashtags: req.body.hashtags,
          platformProfile: req.body.platformProfile,
          platforms: req.body.platforms,
          enablePublishing: req.body.enablePublishing
        });
        res.status(response.runState === "Completed" ? 202 : 500).json(response);
      } catch (err) {
        next(err);
      }
    });

    app.get("/v1/pipeline/runs/:runId/status", authMiddleware, requireRunAccess, async (req, res, next) => {
      try {
        const status = await pipelineService.getPipelineStatus(req.params.runId);
        if (!status) {
          res.status(404).json({ code: "RUN_NOT_FOUND", message: "Run not found" });
          return;
        }
        res.status(200).json(status);
      } catch (err) {
        next(err);
      }
    });
  }

  app.use((err: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
    if (err instanceof DomainError) {
      res.status(err.statusCode).json({ code: err.code, message: err.message });
      return;
    }

    const message = err instanceof Error ? err.message : "Unexpected error";
    res.status(500).json({ code: "UNEXPECTED", message });
  });

  return app;
}
