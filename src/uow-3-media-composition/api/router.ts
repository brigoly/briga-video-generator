import express from "express";
import { MediaCompositionService } from "../services/mediaCompositionService";

export function buildMediaCompositionRouter(service: MediaCompositionService): express.Router {
  const router = express.Router();

  router.post("/media/discover", async (req, res, next) => {
    try {
      const result = await service.discoverAndSelectAssets(req.body);
      res.status(202).json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post("/media/timeline", async (req, res, next) => {
    try {
      const timeline = await service.buildTimeline(
        req.body.runId,
        req.body.platformProfile,
        req.body.scriptContent
      );
      res.status(202).json(timeline);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
