import { Request, Response, NextFunction } from "express";
<<<<<<< HEAD:artifacts/api-server/src/lib/auth.ts
import { db, supabase } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
=======
import { db } from "./_db.js";
import { usersTable } from "./_schema.js";
>>>>>>> c82a176945e006e3b2dc7a0ffa41e041241a6856:api/_auth.ts
import { eq } from "drizzle-orm";
import jwt from 'jsonwebtoken';

export function getTokenFromRequest(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function getUserFromToken(token: string) {
  try {
    // First try Supabase JWT verification
    if (supabase) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        // Get user from our database using the Supabase user ID
        const users = await db.select().from(usersTable).where(eq(usersTable.phone, user.phone || ''));
        if (users.length > 0) {
          return users[0];
        }
        
        // If user doesn't exist in our DB, create them
        const [newUser] = await db.insert(usersTable).values({
          phone: user.phone || '',
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || '',
          isAdmin: false,
          loyaltyPoints: 0,
        }).returning();
        
        return newUser;
      }
    }
    
    // Fallback to old base64 token system for backward compatibility
    const userId = parseInt(Buffer.from(token, "base64").toString("utf-8"));
    if (isNaN(userId)) return null;
    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    return users[0] || null;
  } catch (error) {
    console.error('Error verifying token:', error);
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
