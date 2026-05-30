import express from "express";
import { PlatformFoundationService } from "../services/platformFoundationService";

export function buildPlatformFoundationRouter(service: PlatformFoundationService): express.Router {
  const router = express.Router();

  router.post("/foundation/artifacts", async (req, res, next) => {
    try {
      const artifact = await service.persistStageArtifact(req.body);
      res.status(202).json(artifact);
    } catch (err) {
      next(err);
    }
  });

  router.get("/foundation/runs/:runId/manifest", async (req, res, next) => {
    try {
      const manifest = await service.getRunManifest(req.params.runId);
      if (!manifest) {
        res.status(404).json({ code: "MANIFEST_NOT_FOUND", message: "Run manifest not found" });
        return;
      }
      res.status(200).json(manifest);
    } catch (err) {
      next(err);
    }
  });

  router.post("/foundation/runs/:runId/telemetry", async (req, res, next) => {
    try {
      const event = await service.recordTelemetryEvent({
        ...req.body,
        runId: req.params.runId
      });
      res.status(202).json(event);
    } catch (err) {
      next(err);
    }
  });

  router.get("/foundation/runs/:runId/telemetry-summary", (req, res) => {
    const summary = service.getTelemetrySummary(req.params.runId);
    res.status(200).json(summary);
  });

  router.post("/foundation/runs/:runId/retry-decision", (req, res) => {
    const decision = service.decideRetry(req.body);
    res.status(200).json(decision);
  });

  router.post("/foundation/runs/:runId/resume-plan", (req, res) => {
    const plan = service.buildResumePlan(req.body);
    res.status(200).json(plan);
  });

  router.post("/foundation/runs/compare", async (req, res, next) => {
    try {
      const comparison = await service.compareRunManifests(req.body.baseRunId, req.body.candidateRunId);
      res.status(200).json(comparison);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
