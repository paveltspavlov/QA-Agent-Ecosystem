import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { SafeUser } from "@shared/schema";

// ---------------------------------------------------------------------------
// JWT secret — read from env or generate a stable default stored in DB
// The secret is loaded lazily after DB is ready (see getJwtSecret below)
// ---------------------------------------------------------------------------
let _jwtSecret: string | null = null;

export function initJwtSecret(secret: string): void {
  _jwtSecret = secret;
}

function getJwtSecret(): string {
  if (!_jwtSecret) throw new Error("JWT secret not initialised");
  return _jwtSecret;
}

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------
export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
}

const ACCESS_TOKEN_TTL = "8h";
const COOKIE_MAX_AGE = 8 * 60 * 60 * 1000; // 8 hours in ms

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie("qa_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie("qa_token", { path: "/" });
}

// ---------------------------------------------------------------------------
// Password helpers
// ---------------------------------------------------------------------------
const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ---------------------------------------------------------------------------
// Express middleware
// ---------------------------------------------------------------------------
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/** Requires a valid token. Returns 401 if missing/invalid. */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.qa_token || extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorised — please log in" });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    clearAuthCookie(res);
    res.status(401).json({ error: "Session expired — please log in again" });
    return;
  }
  req.user = payload;
  next();
}

/** Requires the user to have the 'admin' role. */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if ((req as AuthRequest).user?.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

// ---------------------------------------------------------------------------
// Sanitise user for API responses
// ---------------------------------------------------------------------------
export function safeUser(user: any): SafeUser {
  const { passwordHash, ...rest } = user;
  return rest as SafeUser;
}
