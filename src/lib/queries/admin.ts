import "server-only";
import { notFound } from "next/navigation";
import type { Prisma, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { canManageCourse, courseScopeFor, requireRole, type CurrentUser } from "@/lib/session";
import { computeCourseProgress } from "@/lib/domain/progress";

/** Envuelve una consulta para registrar el error y mostrar un mensaje amigable en la frontera de error. */
async function run<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[admin:query] ${label}`, error);
    throw new Error("No pudimos cargar esta información. Intenta de nuevo en un momento.");
  }
}

export const requireStaff = () => requireRole("ADMIN", "INSTRUCTOR");
export const requireAdmin = () => requireRole("ADMIN");

/** Staff con permiso sobre el curso; si no, 404 (no revelar la existencia del curso). */
export async function requireCourseAccess(courseId: string): Promise<CurrentUser> {
  const user = await requireStaff();
  const allowed = await run("canManageCourse", () => canManageCourse(user, courseId));
  if (!allowed) notFound();
  return user;
}

const scopedAttempts = (user: CurrentUser): Prisma.QuizAttemptWhereInput => ({
  quiz: { lesson: { module: { course: courseScopeFor(user) } } },
});

// ── Resumen ────────────────────────────────────────────────────
export function getAdminOverview(user: CurrentUser) {
  return run("overview", async () => {
    const scope = courseScopeFor(user);
    const [students, activeEnrollments, publishedCourses, pendingCount, recentEnrollments, pending, courses] = await Promise.all([
      user.role === "ADMIN"
        ? db.user.count({ where: { role: "STUDENT", isActive: true } })
        : db.user.count({ where: { enrollments: { some: { course: scope } } } }),
      db.enrollment.count({ where: { status: "ACTIVE", course: scope } }),
      db.course.count({ where: { AND: [scope, { status: "PUBLISHED" }] } }),
      db.quizAttempt.count({ where: { AND: [scopedAttempts(user), { status: "SUBMITTED" }] } }),
      db.enrollment.findMany({
        where: { course: scope },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          course: { select: { id: true, title: true } },
        },
      }),
      db.quizAttempt.findMany({
        where: { AND: [scopedAttempts(user), { status: "SUBMITTED" }] },
        orderBy: { submittedAt: "asc" },
        take: 6,
        select: {
          id: true,
          submittedAt: true,
          user: { select: { name: true, avatarUrl: true } },
          quiz: { select: { lesson: { select: { title: true, module: { select: { course: { select: { title: true } } } } } } } },
        },
      }),
      db.course.findMany({
        where: { AND: [scope, { status: { not: "ARCHIVED" } }] },
        orderBy: { enrollments: { _count: "desc" } },
        take: 6,
        select: {
          id: true,
          title: true,
          status: true,
          modules: { select: { lessons: { where: { isPublished: true }, select: { id: true } } } },
          enrollments: { select: { userId: true, status: true } },
        },
      }),
    ]);

    const completion = await Promise.all(
      courses.map(async (c) => {
        const lessonIds = c.modules.flatMap((m) => m.lessons.map((l) => l.id));
        const userIds = c.enrollments.map((e) => e.userId);
        const completed = c.enrollments.filter((e) => e.status === "COMPLETED").length;
        let averageProgress = 0;
        if (lessonIds.length && userIds.length) {
          const grouped = await db.lessonProgress.groupBy({
            by: ["userId"],
            where: { isCompleted: true, lessonId: { in: lessonIds }, userId: { in: userIds } },
            _count: { _all: true },
          });
          const sum = grouped.reduce((acc, g) => acc + Math.min(g._count._all, lessonIds.length) / lessonIds.length, 0);
          averageProgress = Math.round((sum / userIds.length) * 100);
        }
        return {
          id: c.id,
          title: c.title,
          status: c.status,
          enrolled: userIds.length,
          completed,
          completionRate: userIds.length ? Math.round((completed / userIds.length) * 100) : 0,
          averageProgress,
        };
      })
    );

    return { stats: { students, activeEnrollments, publishedCourses, pendingCount }, recentEnrollments, pending, completion };
  });
}

// ── Cursos ─────────────────────────────────────────────────────
export function getAdminCourses(user: CurrentUser, filters: { q?: string; status?: string }) {
  return run("courses", async () => {
    const and: Prisma.CourseWhereInput[] = [courseScopeFor(user)];
    const q = filters.q?.trim();
    if (q) {
      and.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { code: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ],
      });
    }
    if (filters.status === "DRAFT" || filters.status === "PUBLISHED" || filters.status === "ARCHIVED") {
      and.push({ status: filters.status });
    }
    const courses = await db.course.findMany({
      where: { AND: and },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        code: true,
        status: true,
        coverImageUrl: true,
        updatedAt: true,
        category: { select: { name: true } },
        modules: { select: { _count: { select: { lessons: true } } } },
        _count: { select: { enrollments: true } },
      },
    });
    return courses.map((c) => ({
      ...c,
      moduleCount: c.modules.length,
      lessonCount: c.modules.reduce((acc, m) => acc + m._count.lessons, 0),
      studentCount: c._count.enrollments,
    }));
  });
}

export type AdminCourseRow = Awaited<ReturnType<typeof getAdminCourses>>[number];

export function getCategoryOptions() {
  return run("categoryOptions", () =>
    db.category.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } })
  );
}

/** Encabezado del editor de curso (título, estado, slug). */
export function getCourseHeader(courseId: string) {
  return run("courseHeader", () =>
    db.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        description: true,
        coverImageUrl: true,
        updatedAt: true,
        createdById: true,
        modules: { select: { lessons: { select: { isPublished: true } } } },
        _count: { select: { enrollments: true } },
      },
    })
  );
}

export type CourseHeader = NonNullable<Awaited<ReturnType<typeof getCourseHeader>>>;

export function getCourseInfo(courseId: string) {
  return run("courseInfo", async () => {
    const [course, categories, instructors] = await Promise.all([
      db.course.findUnique({
        where: { id: courseId },
        include: { instructors: { orderBy: { position: "asc" }, select: { instructorId: true } } },
      }),
      db.category.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
      db.instructor.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, title: true, photoUrl: true } }),
    ]);
    return { course, categories, instructors };
  });
}

export function getCurriculum(courseId: string) {
  return run("curriculum", () =>
    db.module.findMany({
      where: { courseId },
      orderBy: { position: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        lessons: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            type: true,
            durationSeconds: true,
            isPublished: true,
            isFreePreview: true,
            videoProvider: true,
            quiz: { select: { _count: { select: { questions: true } } } },
          },
        },
      },
    })
  );
}

export type CurriculumModule = Awaited<ReturnType<typeof getCurriculum>>[number];

export function getCourseStudents(courseId: string) {
  return run("courseStudents", async () => {
    const [lessons, enrollments] = await Promise.all([
      db.lesson.findMany({ where: { isPublished: true, module: { courseId } }, select: { id: true } }),
      db.enrollment.findMany({
        where: { courseId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
          lastAccessedAt: true,
          completedAt: true,
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      }),
    ]);
    const progress = await db.lessonProgress.findMany({
      where: { lessonId: { in: lessons.map((l) => l.id) }, userId: { in: enrollments.map((e) => e.user.id) }, isCompleted: true },
      select: { userId: true, lessonId: true, isCompleted: true },
    });
    return enrollments.map((e) => ({
      ...e,
      progress: computeCourseProgress(
        lessons,
        progress.filter((p) => p.userId === e.user.id)
      ),
    }));
  });
}

export type CourseStudentRow = Awaited<ReturnType<typeof getCourseStudents>>[number];

export function getCourseResources(courseId: string) {
  return run("courseResources", () =>
    db.resource.findMany({
      where: { courseId, lessonId: null },
      orderBy: { position: "asc" },
      select: { id: true, title: true, url: true, kind: true },
    })
  );
}

// ── Editor de lección ──────────────────────────────────────────
export function getLessonForEditor(courseId: string, lessonId: string) {
  return run("lessonEditor", async () => {
    const lesson = await db.lesson.findFirst({
      where: { id: lessonId, module: { courseId } },
      include: {
        module: { select: { id: true, title: true, course: { select: { id: true, title: true, slug: true } } } },
        resources: { orderBy: { position: "asc" }, select: { id: true, title: true, url: true, kind: true } },
        quiz: {
          include: {
            questions: {
              orderBy: { position: "asc" },
              include: { options: { orderBy: { position: "asc" } } },
            },
            _count: { select: { attempts: true } },
          },
        },
      },
    });
    if (!lesson) return null;

    const ordered = await db.lesson.findMany({
      where: { module: { courseId } },
      orderBy: [{ module: { position: "asc" } }, { position: "asc" }],
      select: { id: true, title: true },
    });
    const index = ordered.findIndex((l) => l.id === lessonId);
    return {
      lesson,
      prev: index > 0 ? ordered[index - 1] : null,
      next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null,
      position: { index: index + 1, total: ordered.length },
    };
  });
}

export type LessonEditorData = NonNullable<Awaited<ReturnType<typeof getLessonForEditor>>>;

// ── Calificaciones ─────────────────────────────────────────────
export function getGradingQueue(user: CurrentUser, filters: { courseId?: string; status?: string }) {
  return run("gradingQueue", async () => {
    const status = filters.status === "GRADED" ? "GRADED" : "SUBMITTED";
    const and: Prisma.QuizAttemptWhereInput[] = [scopedAttempts(user), { status }];
    if (filters.courseId) and.push({ quiz: { lesson: { module: { courseId: filters.courseId } } } });
    const [attempts, courses] = await Promise.all([
      db.quizAttempt.findMany({
        where: { AND: and },
        orderBy: status === "SUBMITTED" ? { submittedAt: "asc" } : { gradedAt: "desc" },
        take: 100,
        select: {
          id: true,
          status: true,
          score: true,
          passed: true,
          submittedAt: true,
          gradedAt: true,
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          quiz: {
            select: {
              lesson: {
                select: { id: true, title: true, type: true, module: { select: { course: { select: { id: true, title: true } } } } },
              },
            },
          },
        },
      }),
      db.course.findMany({
        where: courseScopeFor(user),
        orderBy: { title: "asc" },
        select: { id: true, title: true },
      }),
    ]);
    return { attempts, courses, status };
  });
}

export function getAttemptForGrading(attemptId: string) {
  return run("attempt", () =>
    db.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        answers: true,
        quiz: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                type: true,
                module: { select: { title: true, course: { select: { id: true, title: true } } } },
              },
            },
            questions: { orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" } } } },
          },
        },
      },
    })
  );
}

export function countUserAttempts(quizId: string, userId: string) {
  return run("attemptCount", () => db.quizAttempt.count({ where: { quizId, userId } }));
}

// ── Usuarios ───────────────────────────────────────────────────
export function getUsers(filters: { q?: string; role?: string }) {
  return run("users", async () => {
    const where: Prisma.UserWhereInput = {};
    const q = filters.q?.trim();
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }
    if (filters.role === "STUDENT" || filters.role === "INSTRUCTOR" || filters.role === "ADMIN") {
      where.role = filters.role as Role;
    }
    const [users, counts] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        take: 200,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { enrollments: true } },
        },
      }),
      db.user.groupBy({ by: ["role"], _count: { _all: true } }),
    ]);
    const byRole = Object.fromEntries(counts.map((c) => [c.role, c._count._all])) as Partial<Record<Role, number>>;
    return { users, byRole };
  });
}

export type AdminUserRow = Awaited<ReturnType<typeof getUsers>>["users"][number];

export function getUserDetail(userId: string) {
  return run("userDetail", async () => {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        headline: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        instructorProfile: { select: { id: true, name: true } },
        certificates: { select: { id: true, code: true, issuedAt: true, course: { select: { title: true } } } },
        enrollments: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            createdAt: true,
            lastAccessedAt: true,
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                modules: { select: { lessons: { where: { isPublished: true }, select: { id: true } } } },
              },
            },
          },
        },
        quizAttempts: {
          where: { status: { not: "IN_PROGRESS" } },
          orderBy: { submittedAt: "desc" },
          take: 10,
          select: {
            id: true,
            status: true,
            score: true,
            passed: true,
            submittedAt: true,
            quiz: { select: { lesson: { select: { title: true, module: { select: { course: { select: { title: true } } } } } } } },
          },
        },
      },
    });
    if (!user) return null;
    const lessonIds = user.enrollments.flatMap((e) => e.course.modules.flatMap((m) => m.lessons.map((l) => l.id)));
    const progress = await db.lessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds }, isCompleted: true },
      select: { lessonId: true, isCompleted: true },
    });
    const enrollments = user.enrollments.map((e) => ({
      id: e.id,
      status: e.status,
      createdAt: e.createdAt,
      lastAccessedAt: e.lastAccessedAt,
      course: { id: e.course.id, title: e.course.title, slug: e.course.slug },
      progress: computeCourseProgress(e.course.modules.flatMap((m) => m.lessons), progress),
    }));
    return { ...user, enrollments };
  });
}

// ── Docentes, categorías y comunicaciones ─────────────────────
export function getInstructorsAdmin() {
  return run("instructors", async () => {
    const [instructors, accounts] = await Promise.all([
      db.instructor.findMany({
        orderBy: { name: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { courses: true } },
        },
      }),
      db.user.findMany({
        where: { role: { in: ["INSTRUCTOR", "ADMIN"] } },
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true, role: true, instructorProfile: { select: { id: true } } },
      }),
    ]);
    return { instructors, accounts };
  });
}

export function getCategoriesAdmin() {
  return run("categories", () =>
    db.category.findMany({ orderBy: { position: "asc" }, include: { _count: { select: { courses: true } } } })
  );
}

export function getCommunications() {
  return run("communications", async () => {
    const [announcements, events, courses] = await Promise.all([
      db.announcement.findMany({
        orderBy: { publishedAt: "desc" },
        take: 100,
        include: { course: { select: { id: true, title: true } } },
      }),
      db.event.findMany({
        orderBy: { startsAt: "desc" },
        take: 150,
        include: { course: { select: { id: true, title: true } } },
      }),
      db.course.findMany({ orderBy: { title: "asc" }, where: { status: { not: "ARCHIVED" } }, select: { id: true, title: true } }),
    ]);
    return { announcements, events, courses };
  });
}
