import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import LessonClientPage from "./lesson-client";

export default async function LessonPage({
  params,
}: {
  params: { id: string; lessonId: string };
}) {
  const { id: courseId, lessonId } = params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Check enrollment
  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  if (!enrollment) {
    redirect(`/courses/${courseId}`);
  }

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: {
            include: {
              modules: {
                orderBy: { order: "asc" },
                include: {
                  lessons: {
                    where: { isPublished: true },
                    orderBy: { order: "asc" },
                    include: {
                      userProgress: {
                        where: { userId }
                      }
                    }
                  }
                }
              },
            },
          },
        },
      },
      userProgress: {
        where: { userId },
      },
      notes: {
        where: { userId },
        orderBy: { timestamp: "asc" }
      }
    },
  });

  if (!lesson || lesson.module.courseId !== courseId) {
    redirect(`/courses/${courseId}`);
  }

  const course = lesson.module.course;

  return (
    <LessonClientPage
      courseId={courseId}
      lesson={lesson}
      course={course}
      userId={userId}
      initialNotes={lesson.notes}
    />
  );
}
