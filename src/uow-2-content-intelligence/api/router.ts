import express, { Request, Response } from "express";
import { ScriptGenerationService } from "../services/scriptGenerationService";

export function buildContentIntelligenceRouter(service: ScriptGenerationService): express.Router {
  const router = express.Router();

  router.post("/scripts/generate", async (req: Request, res: Response, next) => {
    try {
      const { runId, input, preferredProviderOrder } = req.body;
      const result = await service.generateScript({ runId, input, preferredProviderOrder });
      res.status(202).json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post("/scripts/:scriptId/variants", async (req: Request, res: Response, next) => {
    try {
      const variant = await service.regenerateVariant(
        req.params.scriptId,
        req.body.changeRequest,
        req.body.preferredProviderOrder ?? []
      );
      res.status(202).json(variant);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
