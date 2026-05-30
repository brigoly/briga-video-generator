import express from "express";
import { MultiPlatformPackagingService } from "../services/multiPlatformOrchestrator";

export function buildPlatformPackagingRouter(service: MultiPlatformPackagingService): express.Router {
  const router = express.Router();

  router.post("/packages/build", async (req, res, next) => {
    try {
      const platformPackage = await service.buildSingle(req.body);
      res.status(202).json(platformPackage);
    } catch (err) {
      next(err);
    }
  });

  router.post("/packages/build-multi", async (req, res, next) => {
    try {
      const result = await service.buildMulti(
        req.body.runId,
        req.body.timelineId,
        req.body.title,
        req.body.hashtags ?? [],
        req.body.platforms ?? ["tiktok", "youtube-shorts", "instagram-reels"]
      );
      res.status(202).json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post("/packages/publish/youtube-shorts", async (req, res, next) => {
    try {
      const receipt = await service.publishYouTubeShorts(req.body.runId);
      res.status(202).json(receipt);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
