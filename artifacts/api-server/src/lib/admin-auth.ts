import { timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export const ADMIN_PASSWORD_HEADER = "x-admin-password";

/** The configured admin password, or undefined when none is set. */
export function getAdminPassword(): string | undefined {
  const pwd = process.env.ADMIN_PASSWORD;
  return pwd && pwd.length > 0 ? pwd : undefined;
}

/** Constant-time comparison of a candidate against the configured password. */
export function verifyAdminPassword(candidate: unknown): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;
  if (typeof candidate !== "string" || candidate.length === 0) return false;

  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Express middleware that protects admin-only write routes. Requires the
 * `x-admin-password` header to match the `ADMIN_PASSWORD` env var.
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!getAdminPassword()) {
    req.log.error(
      "ADMIN_PASSWORD is not configured; rejecting protected admin request",
    );
    res
      .status(503)
      .json({ error: "La protección de administrador no está configurada." });
    return;
  }

  const candidate = req.header(ADMIN_PASSWORD_HEADER);
  if (!verifyAdminPassword(candidate)) {
    res.status(401).json({ error: "Contraseña incorrecta." });
    return;
  }

  next();
}
