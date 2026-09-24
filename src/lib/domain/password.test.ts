import { describe, expect, it } from "vitest";
import { passwordIssues, generateToken, hashToken, generateCertificateCode } from "./password";

describe("passwordIssues", () => {
  it("acepta contraseñas razonables", () => {
    expect(passwordIssues("Trinidad2024")).toEqual([]);
  });
  it("exige longitud mínima, letras y números", () => {
    expect(passwordIssues("abc")).toContain("Debe tener al menos 8 caracteres.");
    expect(passwordIssues("abcdefghij")).toContain("Debe incluir al menos un número.");
    expect(passwordIssues("1234567890")).toContain("Debe incluir al menos una letra.");
  });
});

describe("tokens", () => {
  it("genera tokens aleatorios url-safe", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{40,}$/);
  });
  it("el hash es determinista y distinto del token", () => {
    const t = generateToken();
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toBe(t);
    expect(hashToken(t)).toMatch(/^[a-f0-9]{64}$/);
  });
  it("códigos de certificado legibles", () => {
    expect(generateCertificateCode()).toMatch(/^TAS-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  });
});
