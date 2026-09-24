import "server-only";
import type { CourseLevel, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { computeCourseProgress, findResumeLesson } from "@/lib/domain/progress";

export const LEVEL_LABEL: Record<CourseLevel, string> = {
  INTRODUCTORIO: "Introductorio",
  INTERMEDIO: "Intermedio",
  AVANZADO: "Avanzado",
};

const cardInclude = {
  category: true,
  instructors: { include: { instructor: true }, orderBy: { position: "asc" } },
  modules: {
    orderBy: { position: "asc" },
    select: {
      lessons: {
        where: { isPublished: true },
        select: { id: true, durationSeconds: true, type: true },
      },
    },
  },
  reviews: { select: { rating: true } },
  _count: { select: { enrollments: true } },
} satisfies Prisma.CourseInclude;

type CourseWithCard = Prisma.CourseGetPayload<{ include: typeof cardInclude }>;

function toCard(c: CourseWithCard) {
  const lessons = c.modules.flatMap((m) => m.lessons);
  const rating = c.reviews.length ? c.reviews.reduce((a, r) => a + r.rating, 0) / c.reviews.length : null;
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    coverImageUrl: c.coverImageUrl,
    level: c.level,
    category: c.category?.name ?? null,
    instructors: c.instructors.map((ci) => ci.instructor),
    lessonCount: lessons.length,
    videoCount: lessons.filter((l) => l.type === "VIDEO").length,
    moduleCount: c.modules.length,
    // Solo video: las lecturas y evaluaciones tienen duraciones estimadas
    durationSeconds: lessons.filter((l) => l.type === "VIDEO").reduce((a, l) => a + l.durationSeconds, 0),
    estimatedHours: c.estimatedHours,
    rating,
    reviewCount: c.reviews.length,
    studentCount: c._count.enrollments,
  };
}

export type CourseCard = ReturnType<typeof toCard>;

export async function getCatalog(filters: { q?: string; category?: string; level?: string }) {
  const where: Prisma.CourseWhereInput = { status: "PUBLISHED" };
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { subtitle: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.category) where.category = { slug: filters.category };
  if (filters.level && filters.level in LEVEL_LABEL) where.level = filters.level as CourseLevel;

  const [courses, categories] = await Promise.all([
    db.course.findMany({ where, include: cardInclude, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }] }),
    db.category.findMany({
      orderBy: { position: "asc" },
      include: { _count: { select: { courses: { where: { status: "PUBLISHED" } } } } },
    }),
  ]);
  return { courses: courses.map(toCard), categories };
}

export async function getCourseDetail(slug: string) {
  const course = await db.course.findUnique({
    where: { slug },
    include: {
      category: true,
      instructors: { include: { instructor: true }, orderBy: { position: "asc" } },
      modules: {
        orderBy: { position: "asc" },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { position: "asc" },
            select: { id: true, title: true, type: true, durationSeconds: true, isFreePreview: true },
          },
        },
      },
      resources: { orderBy: { position: "asc" } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { user: { select: { name: true, avatarUrl: true } } },
      },
      _count: { select: { enrollments: true, reviews: true } },
    },
  });
  if (!course) return null;

  const agg = await db.review.aggregate({ where: { courseId: course.id }, _avg: { rating: true } });
  const lessons = course.modules.flatMap((m) => m.lessons);
  return {
    ...course,
    rating: agg._avg.rating,
    lessonCount: lessons.length,
    durationSeconds: lessons.filter((l) => l.type === "VIDEO").reduce((a, l) => a + l.durationSeconds, 0),
    firstLessonId: lessons[0]?.id ?? null,
  };
}

export type CourseDetail = NonNullable<Awaited<ReturnType<typeof getCourseDetail>>>;

/** Todo lo necesario para el aula: temario, progreso, notas del usuario y lección activa. */
export async function getClassroom(slug: string, lessonId: string, userId: string) {
  const course = await db.course.findUnique({
    where: { slug },
    include: {
      instructors: { include: { instructor: true }, orderBy: { position: "asc" } },
      modules: {
        orderBy: { position: "asc" },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { position: "asc" },
            select: { id: true, title: true, type: true, durationSeconds: true, isFreePreview: true, videoProvider: true },
          },
        },
      },
    },
  });
  if (!course) return null;

  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, isPublished: true, module: { courseId: course.id } },
    include: {
      resources: { orderBy: { position: "asc" } },
      quiz: {
        include: {
          questions: {
            orderBy: { position: "asc" },
            include: { options: { orderBy: { position: "asc" }, select: { id: true, text: true, position: true } } },
          },
        },
      },
    },
  });
  if (!lesson) return { course, lesson: null } as const;

  const orderedLessons = course.modules.flatMap((m) => m.lessons);
  const [enrollment, progress, notes, bookmark, attempts] = await Promise.all([
    db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId: course.id } } }),
    db.lessonProgress.findMany({
      where: { userId, lessonId: { in: orderedLessons.map((l) => l.id) } },
      select: { lessonId: true, isCompleted: true, lastPositionSeconds: true, watchedSeconds: true },
    }),
    db.note.findMany({
      where: { userId, lessonId },
      orderBy: [{ timestampSeconds: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }],
    }),
    db.bookmark.findUnique({ where: { userId_lessonId: { userId, lessonId } } }),
    lesson.quiz
      ? db.quizAttempt.findMany({
          where: { userId, quizId: lesson.quiz.id },
          orderBy: { startedAt: "desc" },
          include: { answers: true },
        })
      : Promise.resolve([]),
  ]);

  const index = orderedLessons.findIndex((l) => l.id === lessonId);
  return {
    course,
    lesson,
    enrollment,
    progress,
    notes,
    isBookmarked: !!bookmark,
    attempts,
    summary: computeCourseProgress(orderedLessons, progress),
    prevLessonId: index > 0 ? orderedLessons[index - 1].id : null,
    nextLessonId: index < orderedLessons.length - 1 ? orderedLessons[index + 1].id : null,
    position: { index: index + 1, total: orderedLessons.length },
  } as const;
}

export async function getResumeLessonId(courseId: string, userId: string): Promise<string | null> {
  const [modules, progress, enrollment] = await Promise.all([
    db.module.findMany({
      where: { courseId },
      orderBy: { position: "asc" },
      select: { lessons: { where: { isPublished: true }, orderBy: { position: "asc" }, select: { id: true } } },
    }),
    db.lessonProgress.findMany({ where: { userId, lesson: { module: { courseId } } }, select: { lessonId: true, isCompleted: true } }),
    db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } }, select: { lastLessonId: true } }),
  ]);
  return findResumeLesson(modules.flatMap((m) => m.lessons), progress, enrollment?.lastLessonId ?? null);
}

/** Cursos inscritos con su progreso, ordenados por actividad reciente. */
export async function getMyCourses(userId: string) {
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    orderBy: [{ lastAccessedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    include: {
      course: {
        include: {
          category: true,
          instructors: { include: { instructor: true }, orderBy: { position: "asc" } },
          modules: {
            orderBy: { position: "asc" },
            select: {
              title: true,
              lessons: {
                where: { isPublished: true },
                orderBy: { position: "asc" },
                select: { id: true, title: true, durationSeconds: true },
              },
            },
          },
        },
      },
    },
  });

  const allLessonIds = enrollments.flatMap((e) => e.course.modules.flatMap((m) => m.lessons.map((l) => l.id)));
  const progress = await db.lessonProgress.findMany({
    where: { userId, lessonId: { in: allLessonIds } },
    select: { lessonId: true, isCompleted: true },
  });

  return enrollments.map((e) => {
    const lessons = e.course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title })));
    const summary = computeCourseProgress(lessons, progress);
    const resumeId = findResumeLesson(lessons, progress, e.lastLessonId);
    const resume = lessons.find((l) => l.id === resumeId) ?? null;
    return {
      enrollment: e,
      course: e.course,
      summary,
      resume,
      totalSeconds: lessons.reduce((a, l) => a + l.durationSeconds, 0),
    };
  });
}

export type MyCourse = Awaited<ReturnType<typeof getMyCourses>>[number];
