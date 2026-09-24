import Link from "next/link";
import { BookOpen, Clock, Star } from "lucide-react";
import { formatDuration } from "@/lib/domain/format";
import { LEVEL_LABEL } from "@/lib/queries/courses";
import type { CourseCard as CourseCardData } from "@/lib/queries/courses";
import { CourseCover } from "@/components/course/course-cover";

export function CourseCard({ course }: { course: CourseCardData }) {
  const instructor = course.instructors[0];
  return (
    <Link
      href={`/cursos/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <CourseCover title={course.title} src={course.coverImageUrl} category={course.category} className="aspect-[16/10]" />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2.5 flex items-center gap-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {course.category && <span className="text-tas-crimson">{course.category}</span>}
          {course.category && <span aria-hidden>·</span>}
          <span>{LEVEL_LABEL[course.level]}</span>
        </div>
        <h3 className="font-serif text-[1.4rem] font-medium leading-snug text-tas-navy transition group-hover:text-tas-blue">
          {course.title}
        </h3>
        {course.subtitle && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{course.subtitle}</p>}

        <div className="mt-auto pt-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-3.5" /> {course.lessonCount} lecciones
            </span>
            {(course.durationSeconds > 0 || course.estimatedHours) && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {course.durationSeconds > 0 ? formatDuration(course.durationSeconds) : `${course.estimatedHours} h`}
              </span>
            )}
            {course.rating && (
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <Star className="size-3.5 fill-tas-gold text-tas-gold" /> {course.rating.toFixed(1)}
              </span>
            )}
          </div>
          {instructor && (
            <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{instructor.name}</span>
              {instructor.title && <span> · {instructor.title}</span>}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
