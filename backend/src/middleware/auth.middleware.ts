import type { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "../lib/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        employeeId: string;
        employeeRecordId: string | null;
        verified: boolean;
      };
    }
  }
}

/**
 * Resolves the authenticated user strictly from the signed JWT cookie —
 * the request body/query is never trusted for identity, so a client cannot
 * impersonate another user or employee record by editing form fields.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  const payload = token ? verifyAuthToken(token) : null;

  if (!payload) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  req.user = {
    id: payload.sub,
    role: payload.role,
    employeeId: payload.employeeId,
    employeeRecordId: payload.employeeRecordId,
    verified: payload.verified,
  };
  next();
}

export function requireVerified(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.verified) {
    return res.status(403).json({ error: "Please verify your email before continuing.", code: "EMAIL_NOT_VERIFIED" });
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    next();
  };
}

export const requireAdmin = requireRole("ADMIN", "HR");
