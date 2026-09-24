import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { CourseCover } from "@/components/course/course-cover";
import { Progress } from "@/components/ui/primitives";
import type { MyCourse } from "@/lib/queries/courses";
import { formatRelative } from "@/lib/utils";

export function CourseProgressRow({ item }: { item: MyCourse }) {
  const { course, summary, resume, enrollment } = item;
  const href = resume ? `/aprender/${course.slug}/${resume.id}` : `/cursos/${course.slug}`;
  return (
    <Link
      href={href}
      className="group flex items-center gap-5 rounded-xl border bg-card p-4 shadow-soft transition hover:border-tas-navy/20 hover:shadow-lift"
    >
      <CourseCover
        title={course.title}
        src={course.coverImageUrl}
        size="sm"
        className="hidden aspect-[4/3] w-28 shrink-0 rounded-lg sm:flex"
      />
      <div className="min-w-0 flex-1">
        <p className="eyebrow">{course.category?.name ?? "Curso"}</p>
        <p className="mt-1 truncate font-serif text-xl text-tas-navy group-hover:text-tas-blue">{course.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {summary.isComplete ? "Curso completado" : resume ? `Siguiente: ${resume.title}` : "Sin lecciones publicadas"}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <Progress value={summary.percent} tone={summary.isComplete ? "success" : "navy"} className="max-w-xs" />
          <span className="shrink-0 text-xs font-semibold tabular-nums">{summary.percent}%</span>
          {enrollment.lastAccessedAt && (
            <span className="hidden shrink-0 text-xs text-muted-foreground md:inline">· {formatRelative(enrollment.lastAccessedAt)}</span>
          )}
        </div>
      </div>
      <span className="hidden size-10 shrink-0 items-center justify-center rounded-full border bg-surface text-tas-navy transition group-hover:bg-tas-navy group-hover:text-tas-cream sm:flex">
        {summary.isComplete ? <CheckCircle2 className="size-4" /> : <ArrowRight className="size-4" />}
      </span>
    </Link>
  );
}
