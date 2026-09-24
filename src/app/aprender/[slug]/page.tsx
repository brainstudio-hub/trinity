import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getResumeLessonId } from "@/lib/queries/courses";

export default async function ResumeCoursePage({ params }: { params: { slug: string } }) {
  const user = await requireUser();
  const course = await db.course.findUnique({ where: { slug: params.slug }, select: { id: true } });
  if (!course) notFound();
  const lessonId = await getResumeLessonId(course.id, user.id);
  redirect(lessonId ? `/aprender/${params.slug}/${lessonId}` : `/cursos/${params.slug}`);
}
