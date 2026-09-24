import Link from "next/link";
import { ArrowRight, Award, BookOpenText, MessagesSquare, NotebookPen, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course/course-card";
import { CourseCover } from "@/components/course/course-cover";
import { getCatalog } from "@/lib/queries/courses";
import { getCurrentUser } from "@/lib/session";
import { formatDuration } from "@/lib/domain/format";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: PlayCircle,
    title: "Clases magistrales en video",
    body: "Sesiones grabadas por docentes del Seminario, organizadas en módulos y con el bosquejo de cada clase a la mano.",
  },
  {
    icon: NotebookPen,
    title: "Notas sincronizadas",
    body: "Toma apuntes mientras ves la clase. Cada nota guarda el minuto exacto para volver a ese momento con un clic.",
  },
  {
    icon: BookOpenText,
    title: "Guías de estudio y evaluaciones",
    body: "Preguntas de reflexión, cuestionarios y tareas revisadas por el docente para afianzar lo aprendido.",
  },
  {
    icon: Award,
    title: "Certificado verificable",
    body: "Al completar el curso recibes un certificado con código único que cualquier persona puede verificar.",
  },
];

export default async function HomePage() {
  let courses: Awaited<ReturnType<typeof getCatalog>>["courses"] = [];
  try {
    courses = (await getCatalog({})).courses;
  } catch (error) {
    console.error("[home] catálogo", error);
  }
  const user = await getCurrentUser();
  const featured = courses[0];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-tas-cream/60">
        <div className="container grid items-center gap-14 py-16 md:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div className="animate-fade-up">
            <p className="eyebrow mb-5 flex items-center gap-2">
              <span className="h-px w-8 bg-tas-crimson" /> Programa hispano · Campus virtual
            </p>
            <h1 className="display text-[2.75rem] leading-[1.05] sm:text-6xl">
              Formación teológica con rigor académico y corazón pastoral.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Estudia las Escrituras y la tradición anglicana con los docentes del Seminario Anglicano Trinity, a tu
              ritmo y desde cualquier lugar.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/cursos">
                  Explorar cursos <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={user ? "/inicio" : "/registro"}>{user ? "Continuar aprendiendo" : "Crear cuenta gratuita"}</Link>
              </Button>
            </div>
          </div>

          {featured ? (
            <Link
              href={`/cursos/${featured.slug}`}
              className="group relative mx-auto w-full max-w-md rounded-2xl border bg-card p-3 shadow-lift transition hover:-translate-y-1 lg:ml-auto"
            >
              <CourseCover
                title={featured.title}
                src={featured.coverImageUrl}
                category={featured.category}
                size="lg"
                className="aspect-[4/3] rounded-xl"
              />
              <div className="px-3 pb-3 pt-5">
                <p className="eyebrow">Curso destacado</p>
                <p className="mt-2 font-serif text-2xl leading-snug text-tas-navy">{featured.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {featured.instructors[0]?.name}
                  {featured.lessonCount > 0 && ` · ${featured.lessonCount} lecciones`}
                  {featured.durationSeconds > 0 && ` · ${formatDuration(featured.durationSeconds)}`}
                </p>
              </div>
            </Link>
          ) : (
            <div className="hidden lg:block" />
          )}
        </div>
      </section>

      {/* Qué ofrece */}
      <section className="container py-20">
        <div className="max-w-2xl">
          <p className="eyebrow mb-3">Una experiencia de estudio completa</p>
          <h2 className="display text-4xl">Todo lo que necesitas para estudiar con profundidad</h2>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-card p-7">
              <Icon className="size-6 text-tas-crimson" strokeWidth={1.6} />
              <h3 className="mt-5 text-[0.9375rem] font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cursos */}
      {courses.length > 0 && (
        <section className="container">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-3">Catálogo</p>
              <h2 className="display text-4xl">Cursos disponibles</h2>
            </div>
            <Link href="/cursos" className="hidden items-center gap-1.5 text-sm font-semibold text-tas-blue hover:underline sm:inline-flex">
              Ver todo el catálogo <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}

      {/* Cierre */}
      <section className="container mt-24">
        <div className="relative overflow-hidden rounded-2xl bg-tas-navy px-8 py-14 text-tas-cream md:px-14">
          <MessagesSquare aria-hidden className="absolute -right-6 -top-6 size-48 text-white/[0.04]" />
          <div className="relative max-w-2xl">
            <h2 className="font-serif text-4xl leading-tight text-tas-cream">
              «Procura con diligencia presentarte a Dios aprobado».
            </h2>
            <p className="mt-3 text-sm text-tas-cream/60">2 Timoteo 2:15</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="inverse">
                <Link href={user ? "/inicio" : "/registro"}>{user ? "Ir a mi aprendizaje" : "Comenzar ahora"}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
