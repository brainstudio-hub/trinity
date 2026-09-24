import { describe, expect, it } from "vitest";
import { evaluateCertificate, bestAttemptScore } from "./certificate";

describe("bestAttemptScore", () => {
  it("toma el mejor intento calificado", () => {
    expect(
      bestAttemptScore([
        { status: "GRADED", score: 60 },
        { status: "GRADED", score: 85 },
        { status: "SUBMITTED", score: null },
      ])
    ).toEqual({ score: 85, pending: false });
  });

  it("marca pendiente si solo hay entregas sin calificar", () => {
    expect(bestAttemptScore([{ status: "SUBMITTED", score: null }])).toEqual({ score: null, pending: true });
  });

  it("ignora intentos en curso", () => {
    expect(bestAttemptScore([{ status: "IN_PROGRESS", score: null }])).toEqual({ score: null, pending: false });
  });
});

describe("evaluateCertificate", () => {
  const base = { certificateEnabled: true, passingScore: 70, progressPercent: 100 };

  it("certifica con progreso completo y promedio suficiente", () => {
    const r = evaluateCertificate({
      ...base,
      assessments: [
        { lessonId: "q1", score: 80, pending: false },
        { lessonId: "q2", score: 70, pending: false },
      ],
    });
    expect(r).toEqual({ eligible: true, average: 75, reasons: [] });
  });

  it("no certifica si falta completar lecciones", () => {
    const r = evaluateCertificate({ ...base, progressPercent: 90, assessments: [] });
    expect(r.eligible).toBe(false);
    expect(r.reasons).toContain("Completa todas las lecciones del curso.");
  });

  it("no certifica con evaluaciones pendientes de calificación", () => {
    const r = evaluateCertificate({ ...base, assessments: [{ lessonId: "a1", score: null, pending: true }] });
    expect(r.eligible).toBe(false);
    expect(r.reasons).toContain("Hay entregas pendientes de calificación.");
  });

  it("no certifica con evaluaciones sin presentar", () => {
    const r = evaluateCertificate({ ...base, assessments: [{ lessonId: "q1", score: null, pending: false }] });
    expect(r.eligible).toBe(false);
    expect(r.reasons).toContain("Presenta todas las evaluaciones.");
  });

  it("no certifica si el promedio no alcanza el mínimo", () => {
    const r = evaluateCertificate({
      ...base,
      assessments: [
        { lessonId: "q1", score: 50, pending: false },
        { lessonId: "q2", score: 60, pending: false },
      ],
    });
    expect(r.eligible).toBe(false);
    expect(r.average).toBe(55);
    expect(r.reasons[0]).toMatch(/promedio mínimo de 70/);
  });

  it("un curso sin evaluaciones certifica solo por progreso", () => {
    expect(evaluateCertificate({ ...base, assessments: [] })).toEqual({ eligible: true, average: null, reasons: [] });
  });

  it("no certifica si el curso no emite certificados", () => {
    const r = evaluateCertificate({ ...base, certificateEnabled: false, assessments: [] });
    expect(r.eligible).toBe(false);
  });
});
