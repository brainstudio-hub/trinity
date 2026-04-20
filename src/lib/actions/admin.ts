"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Level, Course, Lesson } from "@prisma/client";

export async function createCourse(data: { title: string; category: string; level: string }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  const course = await db.course.create({
    data: {
      title: data.title,
      category: data.category,
      level: data.level as Level,
    },
  });

  revalidatePath("/admin");
  return { id: course.id };
}

export async function updateCourse(id: string, data: Partial<Course>) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  await db.course.update({
    where: { id },
    data,
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${id}`);
  revalidatePath(`/courses/${id}`);
}

export async function deleteCourse(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  await db.course.delete({
    where: { id },
  });

  revalidatePath("/admin");
}

export async function createLesson(courseId: string, data: Partial<Lesson>) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  await db.lesson.create({
    data: {
      title: data.title || "",
      videoUrl: data.videoUrl || "",
      order: data.order || 0,
      isPublished: data.isPublished || false,
      courseId,
    },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}`);
}

export async function updateLesson(id: string, data: Partial<Lesson>) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  const lesson = await db.lesson.update({
    where: { id },
    data,
  });

  revalidatePath(`/admin/courses/${lesson.courseId}`);
}

export async function deleteLesson(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  const lesson = await db.lesson.delete({
    where: { id },
  });

  revalidatePath(`/admin/courses/${lesson.courseId}`);
}
