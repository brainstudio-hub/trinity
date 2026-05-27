"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Level, Course, Module, Lesson } from "@prisma/client";

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

// Module Actions
export async function createModule(courseId: string, data: { title: string; order: number }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  const module = await db.module.create({
    data: {
      title: data.title,
      order: data.order,
      courseId,
    },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  return module;
}

export async function updateModule(id: string, data: Partial<Module>) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  const module = await db.module.update({
    where: { id },
    data,
  });

  revalidatePath(`/admin/courses/${module.courseId}`);
  return module;
}

export async function deleteModule(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  const module = await db.module.delete({
    where: { id },
  });

  revalidatePath(`/admin/courses/${module.courseId}`);
}

// Lesson Actions
export async function createLesson(moduleId: string, data: Partial<Lesson>) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  const module = await db.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true }
  });

  if (!module) throw new Error("Módulo no encontrado");

  const lesson = await db.lesson.create({
    data: {
      title: data.title || "",
      description: data.description,
      videoUrl: data.videoUrl || "",
      duration: data.duration || 0,
      transcript: data.transcript,
      order: data.order || 0,
      isPublished: data.isPublished || false,
      moduleId,
    },
  });

  revalidatePath(`/admin/courses/${module.courseId}`);
  revalidatePath(`/courses/${module.courseId}`);
  return lesson;
}

export async function updateLesson(id: string, data: Partial<Lesson>) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  const lesson = await db.lesson.update({
    where: { id },
    data,
    include: {
      module: {
        select: { courseId: true }
      }
    }
  });

  revalidatePath(`/admin/courses/${lesson.module.courseId}`);
  revalidatePath(`/courses/${lesson.module.courseId}`);
  return lesson;
}

export async function deleteLesson(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  const lesson = await db.lesson.delete({
    where: { id },
    include: {
      module: {
        select: { courseId: true }
      }
    }
  });

  revalidatePath(`/admin/courses/${lesson.module.courseId}`);
  revalidatePath(`/courses/${lesson.module.courseId}`);
}
