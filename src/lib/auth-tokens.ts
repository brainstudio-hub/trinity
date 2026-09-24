import "server-only";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/email";
import { generateToken, hashToken } from "@/lib/domain/password";

/**
 * Crea un enlace de restablecimiento de un solo uso (1 h).
 * Módulo interno: NO exportar desde un archivo "use server".
 */
export async function createPasswordResetLink(userId: string, ttlMs = 60 * 60 * 1000): Promise<string> {
  const token = generateToken();
  await db.passwordResetToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + ttlMs) },
  });
  return appUrl(`/restablecer/${token}`);
}
