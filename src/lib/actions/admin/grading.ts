"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { computeRegrade } from "@/lib/domain/grading";
import { issueCertificateIfEligible } from "@/lib/certificates";
import { GENERIC, NO_SESSION, NOT_FOUND, fail, staffForCourse } from "./guard";
import { id } from "./schemas";
import type { ActionResult } from "./types";

const gradesSchema = z.record(
  id,
  z.object({
    points: z.number().nullable(),
    feedback: z.string().max(10000, "La retroalimentación es demasiado larga.").nullish(),
  })
);

export async function gradeAttemptAction(
  attemptId: string,
  grades: z.input<typeof gradesSchema>
): Promise<ActionResult<{ score: number; passed: boolean; certificateIssued: boolean }>> {
  const parsed = gradesSchema.safeParse(grades);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisa las calificaciones.");

  try {
    const attempt = await db.quizAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        userId: true,
        status: true,
        answers: {
          select: { questionId: true, selectedOptionIds: true, textAnswer: true, pointsAwarded: true, feedback: true },
        },
        quiz: {
          select: {
            passingScore: true,
            lesson: { select: { id: true, module: { select: { courseId: true, course: { select: { slug: true } } } } } },
            questions: {
              orderBy: { position: "asc" },
              select: {
                id: true,
                type: true,
                points: true,
                acceptedAnswers: true,
                options: { select: { id: true, isCorrect: true } },
              },
            },
          },
        },
      },
    });
    if (!attempt) return NOT_FOUND;
    const courseId = attempt.quiz.lesson.module.courseId;
    const user = await staffForCourse(courseId);
    if (!user) return NO_SESSION;
    if (attempt.status === "IN_PROGRESS") return fail("El estudiante aún no ha entregado este intento.");

    const outcome = computeRegrade({
      questions: attempt.quiz.questions,
      answers: attempt.answers,
      grades: parsed.data,
      passingScore: attempt.quiz.passingScore,
    });
    if (!outcome.ok) return outcome;
    const { result, updates } = outcome;

    await db.$transaction([
      ...updates.map((u) =>
        db.quizAnswer.upsert({
          where: { attemptId_questionId: { attemptId, questionId: u.questionId } },
          update: {
            pointsAwarded: u.pointsAwarded,
            ...(u.manual ? { feedback: u.feedback, gradedById: user.id } : {}),
          },
          create: {
            attemptId,
            questionId: u.questionId,
            pointsAwarded: u.pointsAwarded,
            ...(u.manual ? { feedback: u.feedback, gradedById: user.id } : {}),
          },
        })
      ),
      db.quizAttempt.update({
        where: { id: attemptId },
        data: { status: "GRADED", score: result.score, passed: result.passed, gradedAt: new Date() },
      }),
    ]);

    let certificateIssued = false;
    try {
      const existed = await db.certificate.count({ where: { userId: attempt.userId, courseId } });
      const cert = await issueCertificateIfEligible(attempt.userId, courseId);
      certificateIssued = !existed && !!cert;
    } catch (error) {
      // La calificación ya quedó guardada; el certificado puede emitirse después.
      console.error("[admin] gradeAttempt certificate", error);
    }

    const slug = attempt.quiz.lesson.module.course.slug;
    revalidatePath("/admin/calificaciones");
    revalidatePath(`/admin/calificaciones/${attemptId}`);
    revalidatePath("/admin");
    revalidatePath(`/aprender/${slug}`, "layout");
    revalidatePath("/mis-certificados");
    return { ok: true, score: result.score ?? 0, passed: !!result.passed, certificateIssued };
  } catch (error) {
    console.error("[admin] gradeAttempt", error);
    return GENERIC("guardar la calificación");
  }
}
