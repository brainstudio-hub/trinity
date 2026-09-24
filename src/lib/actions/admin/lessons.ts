"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { parseVideoUrl } from "@/lib/domain/video";
import { GENERIC, NO_SESSION, NOT_FOUND, courseOfLesson, fail, firstIssue, revalidateCourse, staffForCourse } from "./guard";
import { LESSON_TYPES, optionalText, requiredText } from "./schemas";
import type { ActionResult } from "./types";

const lessonSchema = z.object({
  title: requiredText(200, "Escribe el título de la lección."),
  summary: optionalText(2000, "El resumen"),
  type: z.enum(LESSON_TYPES),
  isPublished: z.boolean(),
  isFreePreview: z.boolean(),
  videoUrl: optionalText(2000, "El enlace del video"),
  durationSeconds: z
    .number()
    .int()
    .min(0, "La duración no puede ser negativa.")
    .max(60 * 60 * 24, "La duración es demasiado larga."),
  content: optionalText(200000, "El contenido"),
  transcript: optionalText(400000, "La transcripción"),
});

export async function updateLessonAction(lessonId: string, input: z.input<typeof lessonSchema>): Promise<ActionResult> {
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const data = parsed.data;

  let video: { videoProvider: "YOUTUBE" | "GOOGLE_DRIVE" | "VIMEO" | "URL" | null; videoUrl: string | null; videoId: string | null } = {
    videoProvider: null,
    videoUrl: null,
    videoId: null,
  };
  if (data.videoUrl) {
    const source = parseVideoUrl(data.videoUrl);
    if (!source) return fail("No reconocemos el enlace del video. Pega un enlace de YouTube, Google Drive, Vimeo o un archivo de video.");
    video = { videoProvider: source.provider, videoUrl: data.videoUrl, videoId: source.id };
  } else if (data.type === "VIDEO" && data.isPublished) {
    return fail("Una lección de video publicada necesita un enlace de video.");
  }

  try {
    const courseId = await courseOfLesson(lessonId);
    if (!courseId) return NOT_FOUND;
    if (!(await staffForCourse(courseId))) return NO_SESSION;

    const needsQuiz = data.type === "QUIZ" || data.type === "ASSIGNMENT";
    await db.lesson.update({
      where: { id: lessonId },
      data: {
        title: data.title,
        summary: data.summary,
        type: data.type,
        isPublished: data.isPublished,
        isFreePreview: data.isFreePreview,
        durationSeconds: data.durationSeconds,
        content: data.content,
        transcript: data.transcript,
        ...video,
      },
    });
    if (needsQuiz) {
      await db.quiz.upsert({ where: { lessonId }, update: {}, create: { lessonId } });
    }
    await revalidateCourse(courseId);
    return { ok: true };
  } catch (error) {
    console.error("[admin] updateLesson", error);
    return GENERIC("guardar la lección");
  }
}
