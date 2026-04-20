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

    // Get first lesson to return its ID for redirection
    const firstLesson = await db.lesson.findFirst({
      where: { courseId, isPublished: true },
      orderBy: { order: "asc" },
    });

    revalidatePath(`/courses/${courseId}`);

    return {
      success: true,
      lessonId: firstLesson?.id
    };
  } catch {
    return { error: "Ya estás inscrito en este curso o hubo un error." };
  }
}
