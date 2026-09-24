import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, isStaff } from "@/lib/session";
import { getClassroom } from "@/lib/queries/courses";
import { parseVideoUrl } from "@/lib/domain/video";
import { Markdown } from "@/components/markdown";
import { UserMenu } from "@/components/user-menu";
import { Classroom } from "@/components/classroom/classroom";
import type { DiscussionComment } from "@/components/classroom/discussion";

export async function generateMetadata({ params }: { params: { lessonId: string } }): Promise<Metadata> {
  const lesson = await db.lesson.findUnique({ where: { id: params.lessonId }, select: { title: true } });
  return { title: lesson?.title ?? "Aula" };
}

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: { slug: string; lessonId: string };
  searchParams: { t?: string };
}) {
  const t = Number(searchParams.t);
  const startAtOverride = Number.isFinite(t) && t >= 0 ? Math.floor(t) : null;
  const user = await requireUser();
  const data = await getClassroom(params.slug, params.lessonId, user.id);
  if (!data) notFound();
  if (!data.lesson) redirect(`/aprender/${params.slug}`);

  const staff = isStaff(user.role);
  const enrolled = !!data.enrollment;
  if (!enrolled && !data.lesson.isFreePreview && !staff) redirect(`/cursos/${params.slug}`);
  if (data.course.status !== "PUBLISHED" && !staff) notFound();

  const lesson = data.lesson;
  const moduleTitle = data.course.modules.find((m) => m.lessons.some((l) => l.id === lesson.id))?.title ?? "";

  const { comments, certificateCode, myReview } = data;

  const video = lesson.videoUrl ? parseVideoUrl(lesson.videoUrl) : null;

  return (
    <Classroom
      course={{ id: data.course.id, slug: data.course.slug, title: data.course.title, modules: data.course.modules }}
      lesson={{
        id: lesson.id,
        title: lesson.title,
        summary: lesson.summary,
        type: lesson.type,
        moduleTitle,
        contentHtml: lesson.content ? <Markdown>{lesson.content}</Markdown> : null,
        transcriptHtml: lesson.transcript ? <Markdown>{lesson.transcript}</Markdown> : null,
        resources: lesson.resources,
        video,
        quiz: lesson.quiz
          ? {
              instructions: lesson.quiz.instructions,
              passingScore: lesson.quiz.passingScore,
              maxAttempts: lesson.quiz.maxAttempts,
              timeLimitMinutes: lesson.quiz.timeLimitMinutes,
              shuffleQuestions: lesson.quiz.shuffleQuestions,
              questions: lesson.quiz.questions.map((q) => ({
                id: q.id,
                type: q.type,
                prompt: q.prompt,
                points: q.points,
                options: q.options.map((o) => ({ id: o.id, text: o.text })),
              })),
            }
          : null,
      }}
      enrolled={enrolled}
      isStaff={staff}
      userId={user.id}
      progress={data.progress}
      summary={data.summary}
      notes={data.notes}
      isBookmarked={data.isBookmarked}
      attempts={data.attempts}
      comments={comments as DiscussionComment[]}
      prevLessonId={data.prevLessonId}
      nextLessonId={data.nextLessonId}
      position={data.position}
      certificateCode={certificateCode}
      myReview={myReview}
      userMenu={<UserMenu user={user} />}
      startAtOverride={searchParams.t !== undefined ? startAtOverride : null}
    />
  );
}
