import { gradeAttempt, isManuallyGraded, type GradableQuestion, type GradeResult, type QuestionType, type SubmittedAnswer } from "./quiz";

export type StoredQuestion = {
  id: string;
  type: QuestionType;
  points: number;
  acceptedAnswers: string[];
  options: { id: string; isCorrect: boolean }[];
};

export type StoredAnswer = {
  questionId: string;
  selectedOptionIds: string[];
  textAnswer: string | null;
  pointsAwarded: number | null;
  feedback: string | null;
};

export type ManualGrade = { points: number | null; feedback?: string | null };

/** Convierte lo guardado en la base (más las calificaciones manuales nuevas) al formato de gradeAttempt. */
export function buildGradingInput(
  questions: StoredQuestion[],
  answers: StoredAnswer[],
  grades: Record<string, ManualGrade | undefined>
): { questions: GradableQuestion[]; answers: Record<string, SubmittedAnswer> } {
  const byQuestion = new Map(answers.map((a) => [a.questionId, a]));
  const mapped: Record<string, SubmittedAnswer> = {};

  for (const q of questions) {
    const stored = byQuestion.get(q.id);
    let manualPoints: number | null | undefined = undefined;
    if (isManuallyGraded(q.type)) {
      const grade = grades[q.id];
      manualPoints = grade && grade.points !== undefined ? grade.points : (stored?.pointsAwarded ?? null);
    }
    mapped[q.id] = {
      selectedOptionIds: stored?.selectedOptionIds ?? [],
      textAnswer: stored?.textAnswer ?? null,
      manualPoints,
    };
  }

  return {
    questions: questions.map((q) => ({
      id: q.id,
      type: q.type,
      points: q.points,
      acceptedAnswers: q.acceptedAnswers,
      options: q.options.map((o) => ({ id: o.id, isCorrect: o.isCorrect })),
    })),
    answers: mapped,
  };
}

export type AnswerUpdate = { questionId: string; pointsAwarded: number | null; feedback: string | null; manual: boolean };

export type RegradeOutcome =
  | { ok: true; result: GradeResult; updates: AnswerUpdate[] }
  | { ok: false; error: string };

/** Recalcula una entrega a partir de lo guardado y las calificaciones manuales del docente. */
export function computeRegrade({
  questions,
  answers,
  grades,
  passingScore,
}: {
  questions: StoredQuestion[];
  answers: StoredAnswer[];
  grades: Record<string, ManualGrade | undefined>;
  passingScore: number;
}): RegradeOutcome {
  for (const q of questions) {
    const g = grades[q.id];
    if (!isManuallyGraded(q.type) || !g || g.points === null) continue;
    if (!Number.isFinite(g.points) || g.points < 0 || g.points > q.points) {
      return { ok: false, error: `El puntaje debe estar entre 0 y ${q.points}.` };
    }
  }

  const input = buildGradingInput(questions, answers, grades);
  const result = gradeAttempt(input.questions, input.answers, passingScore);
  if (result.needsManualGrading) {
    return { ok: false, error: "Asigna un puntaje a todas las preguntas abiertas antes de guardar." };
  }

  const stored = new Map(answers.map((a) => [a.questionId, a]));
  const updates = questions.map((q) => {
    const manual = isManuallyGraded(q.type);
    const grade = grades[q.id];
    const feedback = manual && grade?.feedback !== undefined ? grade.feedback?.trim() || null : (stored.get(q.id)?.feedback ?? null);
    return { questionId: q.id, pointsAwarded: result.perQuestion[q.id]?.pointsAwarded ?? null, feedback, manual };
  });
  return { ok: true, result, updates };
}
