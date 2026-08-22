import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required.");
}

export type AuthTokenPayload = {
  sub: string; // user id
  role: Role;
  employeeId: string;
  employeeRecordId: string | null;
  verified: boolean;
};

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]) || "7d",
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export const AUTH_COOKIE_NAME = "dayflow_token";
