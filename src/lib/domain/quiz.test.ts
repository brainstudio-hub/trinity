import { describe, expect, it } from "vitest";
import { gradeAttempt, normalizeAnswer, type GradableQuestion } from "./quiz";

const questions: GradableQuestion[] = [
  {
    id: "q1",
    type: "SINGLE_CHOICE",
    points: 1,
    options: [
      { id: "a", isCorrect: false },
      { id: "b", isCorrect: true },
    ],
    acceptedAnswers: [],
  },
  {
    id: "q2",
    type: "MULTIPLE_CHOICE",
    points: 2,
    options: [
      { id: "a", isCorrect: true },
      { id: "b", isCorrect: true },
      { id: "c", isCorrect: false },
    ],
    acceptedAnswers: [],
  },
  {
    id: "q3",
    type: "TRUE_FALSE",
    points: 1,
    options: [
      { id: "v", isCorrect: true },
      { id: "f", isCorrect: false },
    ],
    acceptedAnswers: [],
  },
  {
    id: "q4",
    type: "SHORT_ANSWER",
    points: 1,
    options: [],
    acceptedAnswers: ["Éfeso", "Efeso"],
  },
];

describe("normalizeAnswer", () => {
  it("ignora mayúsculas, tildes, espacios y puntuación final", () => {
    expect(normalizeAnswer("  ÉFESO. ")).toBe("efeso");
    expect(normalizeAnswer("La  Nueva   Jerusalén")).toBe("la nueva jerusalen");
  });
});

describe("gradeAttempt", () => {
  it("califica todo correcto como 100%", () => {
    const r = gradeAttempt(
      questions,
      {
        q1: { selectedOptionIds: ["b"] },
        q2: { selectedOptionIds: ["a", "b"] },
        q3: { selectedOptionIds: ["v"] },
        q4: { textAnswer: "efeso" },
      },
      70
    );
    expect(r.score).toBe(100);
    expect(r.passed).toBe(true);
    expect(r.needsManualGrading).toBe(false);
    expect(r.earnedPoints).toBe(5);
    expect(r.totalPoints).toBe(5);
  });

  it("opción múltiple exige la combinación exacta (sin puntaje parcial)", () => {
    const r = gradeAttempt(questions, { q2: { selectedOptionIds: ["a"] } }, 70);
    expect(r.perQuestion.q2.pointsAwarded).toBe(0);
    const r2 = gradeAttempt(questions, { q2: { selectedOptionIds: ["a", "b", "c"] } }, 70);
    expect(r2.perQuestion.q2.pointsAwarded).toBe(0);
  });

  it("preguntas sin responder valen 0", () => {
    const r = gradeAttempt(questions, {}, 70);
    expect(r.score).toBe(0);
    expect(r.passed).toBe(false);
  });

  it("calcula el porcentaje con decimales redondeados a 1", () => {
    const r = gradeAttempt(
      questions.slice(0, 3),
      { q1: { selectedOptionIds: ["b"] } },
      70
    );
    // 1 de 4 puntos
    expect(r.score).toBe(25);
  });

  it("las preguntas de ensayo quedan pendientes de calificación manual", () => {
    const withEssay: GradableQuestion[] = [
      ...questions.slice(0, 1),
      { id: "e1", type: "ESSAY", points: 4, options: [], acceptedAnswers: [] },
    ];
    const r = gradeAttempt(withEssay, { q1: { selectedOptionIds: ["b"] }, e1: { textAnswer: "Mi reflexión" } }, 70);
    expect(r.needsManualGrading).toBe(true);
    expect(r.score).toBeNull();
    expect(r.passed).toBeNull();
    expect(r.perQuestion.e1.pointsAwarded).toBeNull();
    expect(r.perQuestion.q1.pointsAwarded).toBe(1);
  });

  it("usa la calificación manual existente para ensayos", () => {
    const withEssay: GradableQuestion[] = [
      { id: "e1", type: "ESSAY", points: 4, options: [], acceptedAnswers: [] },
    ];
    const r = gradeAttempt(withEssay, { e1: { textAnswer: "x", manualPoints: 3 } }, 70);
    expect(r.needsManualGrading).toBe(false);
    expect(r.score).toBe(75);
    expect(r.passed).toBe(true);
  });

  it("recorta puntajes manuales al rango válido", () => {
    const withEssay: GradableQuestion[] = [
      { id: "e1", type: "ESSAY", points: 4, options: [], acceptedAnswers: [] },
    ];
    expect(gradeAttempt(withEssay, { e1: { manualPoints: 10 } }, 70).score).toBe(100);
    expect(gradeAttempt(withEssay, { e1: { manualPoints: -2 } }, 70).score).toBe(0);
  });

  it("un cuestionario sin puntos aprueba si no hay nada que calificar", () => {
    const r = gradeAttempt([], {}, 70);
    expect(r.score).toBe(100);
    expect(r.passed).toBe(true);
  });
});
