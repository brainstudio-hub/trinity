"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createLessonNote(data: {
  lessonId: string;
  content: string;
  timestamp: number;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("No autorizado");
  }

  const userId = session.user.id;

  try {
    const note = await db.lessonNote.create({
      data: {
        content: data.content,
        timestamp: data.timestamp,
        userId,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/courses/[id]/lessons/[lessonId]", "page");
    return { success: true, note };
  } catch (error) {
    console.error("Error creating note:", error);
    return { error: "No se pudo guardar la nota" };
  }
}

export async function deleteLessonNote(noteId: string, lessonId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("No autorizado");
  }

  try {
    await db.lessonNote.delete({
      where: {
        id: noteId,
        userId: session.user.id, // Security: ensure user owns the note
      },
    });

    revalidatePath("/courses/[id]/lessons/[lessonId]", "page");
    return { success: true };
  } catch (error) {
    return { error: "No se pudo eliminar la nota" };
  }
}
