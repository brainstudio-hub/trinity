import { describe, expect, it } from "vitest";
import { slugify, formatTimestamp, formatDuration, parseTimestamp, initials } from "./format";

describe("slugify", () => {
  it("genera slugs legibles en español", () => {
    expect(slugify("Las Buenas Nuevas del Apocalipsis")).toBe("las-buenas-nuevas-del-apocalipsis");
    expect(slugify("  Teología: ¿Qué es la Vía Media?  ")).toBe("teologia-que-es-la-via-media");
    expect(slugify("Año 2024 — Niños")).toBe("ano-2024-ninos");
  });
  it("recorta a 80 caracteres sin guion final", () => {
    const s = slugify("a ".repeat(100));
    expect(s.length).toBeLessThanOrEqual(80);
    expect(s.endsWith("-")).toBe(false);
  });
});

describe("formatTimestamp", () => {
  it("formatea m:ss y h:mm:ss", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(65)).toBe("1:05");
    expect(formatTimestamp(3725)).toBe("1:02:05");
  });
  it("tolera negativos y decimales", () => {
    expect(formatTimestamp(-4)).toBe("0:00");
    expect(formatTimestamp(61.9)).toBe("1:01");
  });
});

describe("parseTimestamp", () => {
  it("interpreta m:ss, h:mm:ss y segundos", () => {
    expect(parseTimestamp("1:05")).toBe(65);
    expect(parseTimestamp("1:02:05")).toBe(3725);
    expect(parseTimestamp("90")).toBe(90);
  });
  it("devuelve null si no es válido", () => {
    expect(parseTimestamp("abc")).toBeNull();
    expect(parseTimestamp("1:75")).toBeNull();
    expect(parseTimestamp("")).toBeNull();
  });
});

describe("formatDuration", () => {
  it("resume duraciones para humanos", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(59)).toBe("1 min");
    expect(formatDuration(600)).toBe("10 min");
    expect(formatDuration(3600)).toBe("1 h");
    expect(formatDuration(5400)).toBe("1 h 30 min");
  });
});

describe("initials", () => {
  it("toma dos iniciales", () => {
    expect(initials("Rodney Whitacre")).toBe("RW");
    expect(initials("rev. dr. Rod Whitacre")).toBe("RW");
    expect(initials("Ana")).toBe("A");
    expect(initials("")).toBe("?");
  });
});
