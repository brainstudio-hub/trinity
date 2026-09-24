type AttemptLike = { status: "IN_PROGRESS" | "SUBMITTED" | "GRADED"; score: number | null };

export function bestAttemptScore(attempts: AttemptLike[]): { score: number | null; pending: boolean } {
  const graded = attempts.filter((a) => a.status === "GRADED" && a.score !== null);
  if (graded.length > 0) return { score: Math.max(...graded.map((a) => a.score as number)), pending: false };
  return { score: null, pending: attempts.some((a) => a.status === "SUBMITTED") };
}

export type AssessmentStanding = { lessonId: string; score: number | null; pending: boolean };

export function evaluateCertificate(input: {
  certificateEnabled: boolean;
  passingScore: number;
  progressPercent: number;
  assessments: AssessmentStanding[];
}): { eligible: boolean; average: number | null; reasons: string[] } {
  const reasons: string[] = [];
  if (!input.certificateEnabled) reasons.push("Este curso no emite certificado.");
  if (input.progressPercent < 100) reasons.push("Completa todas las lecciones del curso.");
  if (input.assessments.some((a) => a.pending)) reasons.push("Hay entregas pendientes de calificación.");
  if (input.assessments.some((a) => a.score === null && !a.pending)) reasons.push("Presenta todas las evaluaciones.");

  const scored = input.assessments.filter((a) => a.score !== null).map((a) => a.score as number);
  const average = scored.length ? Math.round((scored.reduce((x, y) => x + y, 0) / scored.length) * 10) / 10 : null;

  if (average !== null && scored.length === input.assessments.length && average < input.passingScore) {
    reasons.unshift(`Necesitas un promedio mínimo de ${input.passingScore} en las evaluaciones (actual: ${average}).`);
  }
  return { eligible: reasons.length === 0, average, reasons };
}
