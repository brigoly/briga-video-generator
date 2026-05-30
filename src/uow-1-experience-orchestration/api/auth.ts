import { NextFunction, Request, Response } from "express";
import { AuthorizationError, ForbiddenError } from "../orchestration/errors";

export interface AuthenticatedRequest extends Request {
  principal?: {
    subject: string;
    roles: string[];
  };
}

export function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    next(new AuthorizationError("Bearer token missing"));
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  const expected = process.env.ORCH_BEARER_TOKEN ?? "dev-local-token";
  if (token !== expected) {
    next(new AuthorizationError("Invalid bearer token"));
    return;
  }

  req.principal = {
    subject: "local-operator",
    roles: ["operator"]
  };
  next();
}

export function requireRunAccess(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  if (!req.principal) {
    next(new AuthorizationError("No authenticated principal"));
    return;
  }

  const runId = req.params.runId;
  if (!runId) {
    next(new ForbiddenError("runId scope required"));
    return;
  }

  next();
}
