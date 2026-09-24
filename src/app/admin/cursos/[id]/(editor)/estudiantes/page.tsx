import type { Metadata } from "next";
import { CourseStudents } from "@/components/admin/course-students";
import { getCourseStudents, requireCourseAccess } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Estudiantes del curso" };

export default async function CourseStudentsPage({ params }: { params: { id: string } }) {
  const user = await requireCourseAccess(params.id);
  const rows = await getCourseStudents(params.id);
  return (
    <CourseStudents
      courseId={params.id}
      canViewUsers={user.role === "ADMIN"}
      rows={rows.map((r) => ({
        id: r.id,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        lastAccessedAt: r.lastAccessedAt?.toISOString() ?? null,
        user: r.user,
        progress: r.progress,
      }))}
    />
  );
}
