import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseSettings } from "@/components/admin/course-settings";
import { getCourseHeader, requireCourseAccess } from "@/lib/queries/admin";
import { publishChecklist } from "@/lib/domain/curriculum";

export const metadata: Metadata = { title: "Configuración del curso" };

export default async function CourseSettingsPage({ params }: { params: { id: string } }) {
  const user = await requireCourseAccess(params.id);
  const course = await getCourseHeader(params.id);
  if (!course) notFound();
  const checklist = publishChecklist(course);

  return (
    <CourseSettings
      course={{ id: course.id, title: course.title, slug: course.slug, status: course.status, students: course._count.enrollments }}
      checklist={checklist.items}
      canPublish={checklist.canPublish}
      canDelete={user.role === "ADMIN" || course.createdById === user.id}
    />
  );
}
