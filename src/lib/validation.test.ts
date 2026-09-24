import { describe, expect, it } from "vitest";
import { registerSchema, safeRedirect, loginSchema } from "./validation";

describe("registerSchema", () => {
  const base = { name: "Rodny Pérez", email: " Rodny@Correo.com ", password: "Trinidad2024", confirmPassword: "Trinidad2024" };

  it("normaliza el correo", () => {
    const r = registerSchema.parse(base);
    expect(r.email).toBe("rodny@correo.com");
  });

  it("rechaza contraseñas distintas", () => {
    const r = registerSchema.safeParse({ ...base, confirmPassword: "otra2024x" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.confirmPassword).toContain("Las contraseñas no coinciden.");
  });

  it("rechaza contraseñas débiles con mensajes en español", () => {
    const r = registerSchema.safeParse({ ...base, password: "abc", confirmPassword: "abc" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.password).toContain("Debe tener al menos 8 caracteres.");
  });
});

describe("loginSchema", () => {
  it("pide correo válido", () => {
    const r = loginSchema.safeParse({ email: "no", password: "x" });
    expect(r.success).toBe(false);
  });
});

describe("safeRedirect", () => {
  it("permite rutas internas", () => {
    expect(safeRedirect("/aprender/curso/leccion")).toBe("/aprender/curso/leccion");
  });
  it("de una URL absoluta conserva solo la ruta (el middleware envía URLs completas)", () => {
    expect(safeRedirect("http://localhost:3000/admin?x=1")).toBe("/admin?x=1");
    expect(safeRedirect("https://malicioso.com/robar")).toBe("/robar");
  });

  it("bloquea redirecciones externas", () => {
    expect(safeRedirect("javascript:alert(1)")).toBe("/inicio");
    expect(safeRedirect("//malicioso.com")).toBe("/inicio");
    expect(safeRedirect("/\\malicioso.com")).toBe("/inicio");
    expect(safeRedirect(null)).toBe("/inicio");
  });
});
