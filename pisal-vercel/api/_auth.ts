import { Request, Response, NextFunction } from "express";
import { db } from "./_db.js";
import { usersTable } from "./_schema.js";
import { eq } from "drizzle-orm";

export function getTokenFromRequest(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function getUserFromToken(token: string) {
  try {
    const userId = parseInt(Buffer.from(token, "base64").toString("utf-8"));
    if (isNaN(userId)) return null;
    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    return users[0] || null;
  } catch {
    return null;
  }
}

export function makeToken(userId: number): string {
  return Buffer.from(String(userId)).toString("base64");
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getTokenFromRequest(req);
  if (!token) { res.status(401).json({ message: "Unauthorized" }); return; }
  const user = await getUserFromToken(token);
  if (!user) { res.status(401).json({ message: "Unauthorized" }); return; }
  (req as any).user = user;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = getTokenFromRequest(req);
  if (!token) { res.status(401).json({ message: "Unauthorized" }); return; }
  const user = await getUserFromToken(token);
  if (!user || !user.isAdmin) { res.status(403).json({ message: "Forbidden" }); return; }
  (req as any).user = user;
  next();
}
