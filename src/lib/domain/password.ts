import { createHash, randomBytes, randomInt } from "node:crypto";

export const BCRYPT_COST = 12;

export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) issues.push("Debe tener al menos 8 caracteres.");
  if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(password)) issues.push("Debe incluir al menos una letra.");
  if (!/\d/.test(password)) issues.push("Debe incluir al menos un número.");
  return issues;
}

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Sin caracteres ambiguos (0/O, 1/I)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCertificateCode(): string {
  const block = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `TAS-${block()}-${block()}`;
}
