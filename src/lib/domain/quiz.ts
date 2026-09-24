export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY";

export type GradableQuestion = {
  id: string;
  type: QuestionType;
  points: number;
  options: { id: string; isCorrect: boolean }[];
  acceptedAnswers: string[];
};

export type SubmittedAnswer = {
  selectedOptionIds?: string[];
  textAnswer?: string | null;
  /** Puntaje asignado manualmente por el docente (solo ensayos). */
  manualPoints?: number | null;
};

export type GradeResult = {
  earnedPoints: number;
  totalPoints: number;
  /** Porcentaje 0-100 con un decimal; null si falta calificación manual. */
  score: number | null;
  passed: boolean | null;
  needsManualGrading: boolean;
  perQuestion: Record<string, { pointsAwarded: number | null; isCorrect: boolean | null }>;
};

export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.,;:!?¡¿"'«»]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sameSet(a: string[], b: string[]): boolean {
  const sa = new Set(a);
  const sb = new Set(b);
  return sa.size === sb.size && Array.from(sa).every((x) => sb.has(x));
}

export function isManuallyGraded(type: QuestionType): boolean {
  return type === "ESSAY";
}

export function gradeAttempt(
  questions: GradableQuestion[],
  answers: Record<string, SubmittedAnswer | undefined>,
  passingScore: number
): GradeResult {
  let earned = 0;
  let total = 0;
  let pending = false;
  const perQuestion: GradeResult["perQuestion"] = {};

  for (const q of questions) {
    total += q.points;
    const answer = answers[q.id] ?? {};

    if (isManuallyGraded(q.type)) {
      if (answer.manualPoints === null || answer.manualPoints === undefined) {
        pending = true;
        perQuestion[q.id] = { pointsAwarded: null, isCorrect: null };
      } else {
        const pts = Math.min(Math.max(answer.manualPoints, 0), q.points);
        earned += pts;
        perQuestion[q.id] = { pointsAwarded: pts, isCorrect: pts === q.points };
      }
      continue;
    }

    let correct = false;
    if (q.type === "SHORT_ANSWER") {
      const given = normalizeAnswer(answer.textAnswer ?? "");
      correct = given.length > 0 && q.acceptedAnswers.some((a) => normalizeAnswer(a) === given);
    } else {
      const expected = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      correct = expected.length > 0 && sameSet(answer.selectedOptionIds ?? [], expected);
    }
    const pts = correct ? q.points : 0;
    earned += pts;
    perQuestion[q.id] = { pointsAwarded: pts, isCorrect: correct };
  }

  if (pending) {
    return { earnedPoints: earned, totalPoints: total, score: null, passed: null, needsManualGrading: true, perQuestion };
  }
  const score = total === 0 ? 100 : Math.round((earned / total) * 1000) / 10;
  return {
    earnedPoints: earned,
    totalPoints: total,
    score,
    passed: score >= passingScore,
    needsManualGrading: false,
    perQuestion,
  };
}
