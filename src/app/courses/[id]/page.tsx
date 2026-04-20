import { db } from "@/lib/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { EnrollButton } from "@/components/enroll-button";
import { PlayCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/video-player";

export default async function CoursePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const session = await auth();
  const userId = session?.user?.id;

  const course = await db.course.findUnique({
    where: { id, isPublished: true },
    include: {
      lessons: {
        where: { isPublished: true },
        orderBy: { order: "asc" },
      },
      enrollments: userId ? {
        where: { userId }
      } : false,
    }
  });

  if (!course) {
    notFound();
  }

  const isEnrolled = !!(course.enrollments && course.enrollments.length > 0);
  const introVideoUrl = course.lessons[0]?.videoUrl;

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 space-y-4">
          <div className="flex gap-2">
            <Badge variant="secondary">{course.category}</Badge>
            <Badge variant="outline">{course.level}</Badge>
          </div>
          <h1 className="text-4xl font-bold text-primary">{course.title}</h1>
          <p className="text-lg text-muted-foreground">{course.description}</p>

          <div className="pt-4">
            {isEnrolled ? (
              <Link href={`/courses/${id}/lessons/${course.lessons[0]?.id}`}>
                <Button size="lg">Continuar Aprendiendo</Button>
              </Link>
            ) : (
              <EnrollButton courseId={id} userId={userId} />
            )}
          </div>
        </div>
        <div className="w-full lg:w-96">
          {introVideoUrl ? (
             <VideoPlayer url={introVideoUrl} />
          ) : (
            <div className="aspect-video bg-primary/10 rounded-2xl flex items-center justify-center">
               <PlayCircle className="h-16 w-16 text-primary/40" />
            </div>
          )}
          <p className="text-xs text-center text-muted-foreground mt-2 italic">Video de introducción</p>
        </div>
      </div>

      {/* Syllabus */}
      <div className="bg-white border rounded-2xl p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-6">Programa del Curso</h2>
        <div className="space-y-4">
          {course.lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className="flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{lesson.title}</h3>
              </div>
              {!isEnrolled && (
                <div className="text-muted-foreground text-sm">
                  Protegido
                </div>
              )}
            </div>
          ))}
          {course.lessons.length === 0 && (
            <p className="text-muted-foreground italic">No hay lecciones publicadas aún.</p>
          )}
        </div>
      </div>
    </div>
  );
}
