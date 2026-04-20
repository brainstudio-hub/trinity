import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { VideoPlayer } from "@/components/video-player";
import { CourseProgressButton } from "@/components/course-progress-button";
import Link from "next/link";
import { PlayCircle, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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
    where: { id: lessonId, courseId },
    include: {
      course: {
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
          },
        },
      },
      userProgress: {
        where: { userId },
      },
    },
  });

  if (!lesson) {
    redirect(`/courses/${courseId}`);
  }

  const isCompleted = lesson.userProgress[0]?.isCompleted ?? false;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <Link
          href={`/courses/${courseId}`}
          className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver al curso
        </Link>

        <VideoPlayer url={lesson.videoUrl} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            <p className="text-muted-foreground">{lesson.course.title}</p>
          </div>
          <CourseProgressButton
            lessonId={lessonId}
            initialIsCompleted={isCompleted}
          />
        </div>

        {lesson.description && (
          <div className="prose max-w-none">
            <p>{lesson.description}</p>
          </div>
        )}
      </div>

      {/* Syllabus Sidebar */}
      <div className="w-full lg:w-80 space-y-4">
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="p-4 border-b bg-primary/5">
            <h3 className="font-bold text-primary">Contenido del Curso</h3>
          </div>
          <div className="divide-y">
            {lesson.course.lessons.map((l) => (
              <Link
                key={l.id}
                href={`/courses/${courseId}/lessons/${l.id}`}
                className={cn(
                  "flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-sm",
                  l.id === lessonId ? "bg-accent text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {l.id === lessonId ? (
                   <PlayCircle className="h-4 w-4 text-primary shrink-0" />
                ) : (
                   <div className="h-4 w-4 rounded-full border border-muted-foreground shrink-0" />
                )}
                <span className="line-clamp-2 flex-1">{l.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
