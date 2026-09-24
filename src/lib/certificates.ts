import "server-only";
import { db } from "@/lib/db";
import { computeCourseProgress } from "@/lib/domain/progress";
import { bestAttemptScore, evaluateCertificate } from "@/lib/domain/certificate";
import { generateCertificateCode } from "@/lib/domain/password";

export async function getCertificateStanding(userId: string, courseId: string) {
  const course = await db.course.findUniqueOrThrow({
    where: { id: courseId },
    select: {
      certificateEnabled: true,
      passingScore: true,
      modules: {
        select: {
          lessons: {
            where: { isPublished: true },
            select: { id: true, type: true, quiz: { select: { id: true } } },
          },
        },
      },
    },
  });
  const lessons = course.modules.flatMap((m) => m.lessons);
  const quizIds = lessons.flatMap((l) => (l.quiz ? [l.quiz.id] : []));

  const [progress, attempts] = await Promise.all([
    db.lessonProgress.findMany({
      where: { userId, lessonId: { in: lessons.map((l) => l.id) } },
      select: { lessonId: true, isCompleted: true },
    }),
    db.quizAttempt.findMany({
      where: { userId, quizId: { in: quizIds } },
      select: { quizId: true, status: true, score: true },
    }),
  ]);

  const summary = computeCourseProgress(lessons, progress);
  const assessments = lessons
    .filter((l) => l.quiz && (l.type === "QUIZ" || l.type === "ASSIGNMENT"))
    .map((l) => ({ lessonId: l.id, ...bestAttemptScore(attempts.filter((a) => a.quizId === l.quiz!.id)) }));

  return {
    summary,
    ...evaluateCertificate({
      certificateEnabled: course.certificateEnabled,
      passingScore: course.passingScore,
      progressPercent: summary.percent,
      assessments,
    }),
  };
}

/** Emite el certificado si corresponde; idempotente. */
export async function issueCertificateIfEligible(userId: string, courseId: string) {
  const existing = await db.certificate.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (existing) return existing;

  const standing = await getCertificateStanding(userId, courseId);
  if (!standing.eligible) return null;

  for (let i = 0; i < 5; i++) {
    try {
      const cert = await db.certificate.create({ data: { userId, courseId, code: generateCertificateCode() } });
      await db.enrollment.updateMany({
        where: { userId, courseId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      return cert;
    } catch (error) {
      // Colisión improbable de código: reintentar
      if (i === 4) throw error;
    }
  }
  return null;
}
