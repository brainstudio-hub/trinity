import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminBreadcrumbs } from "@/components/admin/admin-shell";
import { CourseStatusBadge } from "@/components/admin/labels";
import { CourseEditorTabs, PublishButton } from "@/components/admin/course-editor-chrome";
import { getCourseHeader, requireCourseAccess } from "@/lib/queries/admin";
import { publishChecklist } from "@/lib/domain/curriculum";
import { formatRelative, pluralize } from "@/lib/utils";

export default async function CourseEditorLayout({ params, children }: { params: { id: string }; children: React.ReactNode }) {
  await requireCourseAccess(params.id);
  const course = await getCourseHeader(params.id);
  if (!course) notFound();
  const checklist = publishChecklist(course);
  const lessonCount = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: "Cursos", href: "/admin/cursos" }, { label: course.title }]} />
      <Link
        href="/admin/cursos"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Todos los cursos
      </Link>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <CourseStatusBadge status={course.status} />
            <span className="text-xs text-muted-foreground">
              {pluralize(course.modules.length, "módulo")} · {pluralize(lessonCount, "lección", "lecciones")} ·{" "}
              {pluralize(course._count.enrollments, "estudiante")} · Editado {formatRelative(course.updatedAt)}
            </span>
          </div>
          <h1 className="display text-2xl leading-tight md:text-[2.125rem]">{course.title}</h1>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/cursos/${course.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink /> Vista previa
            </Link>
          </Button>
          <PublishButton
            courseId={course.id}
            status={course.status}
            missing={checklist.items.filter((i) => i.required && !i.ok).map((i) => i.label)}
          />
        </div>
      </div>
      <CourseEditorTabs courseId={course.id} />
      <div className="pt-8">{children}</div>
    </div>
  );
}
