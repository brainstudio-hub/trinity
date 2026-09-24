import { describe, expect, it } from "vitest";
import { buildGradingInput, computeRegrade, type StoredAnswer, type StoredQuestion } from "./grading";

const questions: StoredQuestion[] = [
  {
    id: "q1",
    type: "SINGLE_CHOICE",
    points: 2,
    acceptedAnswers: [],
    options: [
      { id: "o1", isCorrect: true },
      { id: "o2", isCorrect: false },
    ],
  },
  { id: "q2", type: "SHORT_ANSWER", points: 1, acceptedAnswers: ["Nicea"], options: [] },
  { id: "q3", type: "ESSAY", points: 5, acceptedAnswers: [], options: [] },
];

const answers: StoredAnswer[] = [
  { questionId: "q1", selectedOptionIds: ["o1"], textAnswer: null, pointsAwarded: 2, feedback: null },
  { questionId: "q2", selectedOptionIds: [], textAnswer: "nicea", pointsAwarded: 1, feedback: null },
  { questionId: "q3", selectedOptionIds: [], textAnswer: "Mi ensayo…", pointsAwarded: null, feedback: null },
];

describe("buildGradingInput", () => {
  it("mapea preguntas y respuestas almacenadas al formato de gradeAttempt", () => {
    const input = buildGradingInput(questions, answers, {});
    expect(input.questions).toHaveLength(3);
    expect(input.answers.q1).toEqual({ selectedOptionIds: ["o1"], textAnswer: null, manualPoints: undefined });
    expect(input.answers.q3.manualPoints).toBeNull();
  });

  it("usa el puntaje manual nuevo y conserva el anterior si no se envía", () => {
    const withPrev: StoredAnswer[] = answers.map((a) => (a.questionId === "q3" ? { ...a, pointsAwarded: 3 } : a));
    expect(buildGradingInput(questions, withPrev, {}).answers.q3.manualPoints).toBe(3);
    expect(buildGradingInput(questions, withPrev, { q3: { points: 4 } }).answers.q3.manualPoints).toBe(4);
  });

  it("incluye preguntas sin respuesta del estudiante", () => {
    const input = buildGradingInput(questions, answers.slice(0, 2), { q3: { points: 0 } });
    expect(input.answers.q3).toEqual({ selectedOptionIds: [], textAnswer: null, manualPoints: 0 });
  });
});

describe("computeRegrade", () => {
  it("recalcula la nota final con los puntajes manuales", () => {
    const r = computeRegrade({ questions, answers, grades: { q3: { points: 4, feedback: "Buen trabajo" } }, passingScore: 70 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.result.score).toBe(87.5);
    expect(r.result.passed).toBe(true);
    const essay = r.updates.find((u) => u.questionId === "q3");
    expect(essay).toEqual({ questionId: "q3", pointsAwarded: 4, feedback: "Buen trabajo", manual: true });
    expect(r.updates.find((u) => u.questionId === "q1")).toMatchObject({ pointsAwarded: 2, manual: false });
  });

  it("marca reprobado si no alcanza el mínimo", () => {
    const r = computeRegrade({ questions, answers, grades: { q3: { points: 0 } }, passingScore: 70 });
    expect(r.ok && r.result.score).toBe(37.5);
    expect(r.ok && r.result.passed).toBe(false);
  });

  it("exige calificar todas las preguntas abiertas", () => {
    const r = computeRegrade({ questions, answers, grades: {}, passingScore: 70 });
    expect(r).toEqual({ ok: false, error: expect.stringMatching(/todas las preguntas abiertas/) });
  });

  it("rechaza puntajes fuera de rango", () => {
    const r = computeRegrade({ questions, answers, grades: { q3: { points: 6 } }, passingScore: 70 });
    expect(r.ok).toBe(false);
    const neg = computeRegrade({ questions, answers, grades: { q3: { points: -1 } }, passingScore: 70 });
    expect(neg.ok).toBe(false);
  });

  it("ignora puntajes manuales enviados para preguntas autocalificadas", () => {
    const r = computeRegrade({ questions, answers, grades: { q1: { points: 0 }, q3: { points: 5 } }, passingScore: 70 });
    expect(r.ok && r.result.score).toBe(100);
  });
});
