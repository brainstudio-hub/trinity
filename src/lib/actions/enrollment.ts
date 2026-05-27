"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function enrollInCourse(courseId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Debe iniciar sesión para inscribirse");
  }

  const userId = session.user.id;

  try {
    await db.enrollment.create({
      data: {
        userId,
        courseId,
      },
    });

    // Get first lesson via modules to return its ID for redirection
    const firstModule = await db.module.findFirst({
      where: { courseId },
      orderBy: { order: "asc" }
    });

    let firstLesson = null;
    if (firstModule) {
      firstLesson = await db.lesson.findFirst({
        where: { moduleId: firstModule.id, isPublished: true },
        orderBy: { order: "asc" },
      });
    }

    revalidatePath(`/courses/${courseId}`);

    return {
      success: true,
      lessonId: firstLesson?.id
    };
  } catch {
    return { error: "Ya estás inscrito en este curso o hubo un error." };
  }
}
