import "server-only";
import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { AppRole } from "@/types/next-auth";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  avatarUrl: string | null;
  headline: string | null;
};

/** Usuario actual leído de la base (no solo del JWT), para reflejar cambios de rol o bloqueos. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, headline: true, isActive: true },
    });
    if (!user || !user.isActive) return null;
    const { isActive: _ignored, ...rest } = user;
    return rest;
  } catch (error) {
    console.error("[session] getCurrentUser", error);
    return null;
  }
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  return user;
}

export async function requireRole(...roles: AppRole[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) notFound();
  return user;
}

export const isStaff = (role: AppRole) => role === "ADMIN" || role === "INSTRUCTOR";

/** Un instructor solo gestiona los cursos donde figura como docente o que creó. */
export async function canManageCourse(user: CurrentUser, courseId: string): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (user.role !== "INSTRUCTOR") return false;
  const count = await db.course.count({
    where: {
      id: courseId,
      OR: [{ createdById: user.id }, { instructors: { some: { instructor: { userId: user.id } } } }],
    },
  });
  return count > 0;
}

export function courseScopeFor(user: CurrentUser) {
  if (user.role === "ADMIN") return {};
  return {
    OR: [{ createdById: user.id }, { instructors: { some: { instructor: { userId: user.id } } } }],
  };
}
