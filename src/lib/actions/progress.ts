"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleLessonProgress(lessonId: string, isCompleted: boolean) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");

  const userId = session.user.id;

  try {
    await db.userProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        isCompleted,
      },
      create: {
        userId,
        lessonId,
        isCompleted,
      },
    });

    revalidatePath(`/courses/[id]/lessons/${lessonId}`, "page");
    return { success: true };
  } catch {
    return { error: "Error al actualizar progreso" };
  }
}
