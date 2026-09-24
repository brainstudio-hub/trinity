import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getMyCourses } from "@/lib/queries/courses";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { CourseProgressRow } from "@/components/campus/course-progress-card";

export const metadata: Metadata = { title: "Mis cursos" };

export default async function MyCoursesPage() {
  const user = await requireUser();
  const courses = await getMyCourses(user.id);
  const active = courses.filter((c) => !c.summary.isComplete);
  const done = courses.filter((c) => c.summary.isComplete);

  return (
    <>
      <PageHeader
        eyebrow="Aprendizaje"
        title="Mis cursos"
        description="Todos los cursos en los que estás inscrito, con tu avance."
        actions={
          <Button asChild variant="outline">
            <Link href="/cursos">Explorar catálogo</Link>
          </Button>
        }
      />
      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="Todavía no tienes cursos"
          description="Inscríbete en un curso del catálogo para comenzar."
          action={
            <Button asChild>
              <Link href="/cursos">Ver catálogo</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-10">
          {active.length > 0 && (
            <section>
              <h2 className="mb-4 font-serif text-2xl text-tas-navy">En progreso</h2>
              <div className="space-y-3">
                {active.map((c) => <CourseProgressRow key={c.enrollment.id} item={c} />)}
              </div>
            </section>
          )}
          {done.length > 0 && (
            <section>
              <h2 className="mb-4 font-serif text-2xl text-tas-navy">Completados</h2>
              <div className="space-y-3">
                {done.map((c) => <CourseProgressRow key={c.enrollment.id} item={c} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
