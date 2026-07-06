"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Level, Course, Module, Lesson } from "@prisma/client";
import { z } from "zod";

const LessonSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  videoUrl: z.string().url("URL de video inválida"),
  duration: z.number().min(0, "La duración no puede ser negativa"),
  transcript: z.string().optional(),
  order: z.number().int().default(1),
  isPublished: z.boolean().default(false),
});

export async function createCourse(data: { title: string; category: string; level: string; code: string }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  const course = await db.course.create({
    data: {
      code: data.code.toUpperCase().trim(),
      title: data.title,
      category: data.category,
      level: data.level as Level,
      faqs: [],
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
    data: {
      ...data,
      faqs: data.faqs as any,
    },
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

  const newModule = await db.module.create({
    data: {
      title: data.title,
      order: data.order,
      courseId,
    },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  return newModule;
}

export async function updateModule(id: string, data: Partial<Module>) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  const updatedModule = await db.module.update({
    where: { id },
    data,
  });

  revalidatePath(`/admin/courses/${updatedModule.courseId}`);
  return updatedModule;
}

export async function deleteModule(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  const deletedModule = await db.module.delete({
    where: { id },
  });

  revalidatePath(`/admin/courses/${deletedModule.courseId}`);
}

// Lesson Actions
export async function createLesson(moduleId: string, data: any) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return { success: false, error: "No autorizado" };

    const validatedData = LessonSchema.parse(data);

    const parentModule = await db.module.findUnique({
      where: { id: moduleId },
      select: { courseId: true }
    });

    if (!parentModule) return { success: false, error: "Módulo no encontrado" };

    const lesson = await db.lesson.create({
      data: {
        ...validatedData,
        duration: validatedData.duration * 60,
        moduleId,
      },
    });

    revalidatePath(`/admin/courses/${parentModule.courseId}`);
    revalidatePath(`/courses/${parentModule.courseId}`);
    return { success: true, lesson };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Error al crear la lección" };
  }
}

export async function updateLesson(id: string, data: any) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return { success: false, error: "No autorizado" };

    const validatedData = LessonSchema.partial().parse(data);

    const lesson = await db.lesson.update({
      where: { id },
      data: {
        ...validatedData,
        duration: validatedData.duration !== undefined ? validatedData.duration * 60 : undefined,
      },
      include: {
        module: {
          select: { courseId: true }
        }
      }
    });

    revalidatePath(`/admin/courses/${lesson.module.courseId}`);
    revalidatePath(`/courses/${lesson.module.courseId}`);
    return { success: true, lesson };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Error al actualizar la lección" };
  }
}

export async function generateAITranscription(lessonId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { success: false, error: "No autorizado" };

  // Skeleton action
  return {
    success: true,
    message: "Función en desarrollo. La IA procesará el video próximamente."
  };
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

// Instructor Actions
export async function createInstructor(data: { name: string; department?: string; bio?: string }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  const instructor = await db.instructor.create({ data });
  revalidatePath("/admin");
  return instructor;
}

export async function updateInstructor(id: string, data: any) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  await db.instructor.update({ where: { id }, data });
  revalidatePath("/admin");
}

export async function deleteInstructor(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  await db.instructor.delete({ where: { id } });
  revalidatePath("/admin");
}

// Announcement Actions
export async function createAnnouncement(data: { title: string; content: string; link?: string; isPublished?: boolean }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  const announcement = await db.announcement.create({ data });
  revalidatePath("/admin");
  revalidatePath("/");
  return announcement;
}

export async function updateAnnouncement(id: string, data: any) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  await db.announcement.update({ where: { id }, data });
  revalidatePath("/admin");
}

export async function deleteAnnouncement(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  await db.announcement.delete({ where: { id } });
  revalidatePath("/admin");
}

// Event Actions
export async function createEvent(data: { title: string; description?: string; date: Date }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  const event = await db.event.create({ data });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return event;
}

export async function updateEvent(id: string, data: any) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  await db.event.update({ where: { id }, data });
  revalidatePath("/admin");
}

export async function deleteEvent(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("No autorizado");

  await db.event.delete({ where: { id } });
  revalidatePath("/admin");
}
