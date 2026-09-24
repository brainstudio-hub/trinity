import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ImageOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { AdminBreadcrumbs } from "@/components/admin/admin-shell";
import { ParamSelect, SearchInput } from "@/components/admin/admin-kit";
import { CourseStatusBadge } from "@/components/admin/labels";
import { getAdminCourses, requireStaff } from "@/lib/queries/admin";
import { formatShortDate, pluralize } from "@/lib/utils";

export const metadata: Metadata = { title: "Cursos" };

function Cover({ url, title }: { url: string | null; title: string }) {
  return (
    <div className="relative aspect-[16/10] w-20 shrink-0 overflow-hidden rounded-md bg-tas-sand ring-1 ring-black/5 sm:w-24">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        <div className="flex size-full items-center justify-center bg-gradient-to-br from-tas-navy to-tas-navy-mid">
          <span className="font-serif text-lg text-tas-cream/90">{title.charAt(0)}</span>
        </div>
      )}
    </div>
  );
}

export default async function AdminCoursesPage({ searchParams }: { searchParams: { q?: string; estado?: string } }) {
  const user = await requireStaff();
  const courses = await getAdminCourses(user, { q: searchParams.q, status: searchParams.estado });
  const filtered = !!(searchParams.q || searchParams.estado);

  return (
    <>
      <AdminBreadcrumbs items={[{ label: "Cursos" }]} />
      <PageHeader
        eyebrow="Académico"
        title="Cursos"
        description={
          user.role === "ADMIN"
            ? "Crea, edita y publica los cursos del campus."
            : "Los cursos en los que participas como docente."
        }
        actions={
          <Button asChild>
            <Link href="/admin/cursos/nuevo">
              <Plus /> Nuevo curso
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput placeholder="Buscar por título o código…" className="sm:max-w-sm sm:flex-1" />
        <ParamSelect
          param="estado"
          label="Filtrar por estado"
          allLabel="Todos los estados"
          options={[
            { value: "PUBLISHED", label: "Publicados" },
            { value: "DRAFT", label: "Borradores" },
            { value: "ARCHIVED", label: "Archivados" },
          ]}
        />
      </div>

      {courses.length === 0 ? (
        filtered ? (
          <EmptyState icon={<ImageOff />} title="Sin resultados" description="Ningún curso coincide con tu búsqueda." />
        ) : (
          <EmptyState
            icon={<BookOpen />}
            title="Aún no hay cursos"
            description="Crea el primero: empieza con un título y luego arma el currículo por módulos y lecciones."
            action={
              <Button asChild>
                <Link href="/admin/cursos/nuevo">
                  <Plus /> Crear curso
                </Link>
              </Button>
            }
          />
        )
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-soft">
          <div className="hidden grid-cols-[1fr_120px_140px_100px_110px] gap-4 border-b bg-secondary/40 px-5 py-2.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
            <span>Curso</span>
            <span>Estado</span>
            <span>Contenido</span>
            <span className="text-right">Estudiantes</span>
            <span className="text-right">Actualizado</span>
          </div>
          <ul className="divide-y">
            {courses.map((c) => (
              <li key={c.id} className="relative transition-colors hover:bg-secondary/30">
                <div className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-[1fr_120px_140px_100px_110px] md:items-center md:gap-4 md:px-5">
                  <div className="flex min-w-0 items-center gap-4">
                    <Cover url={c.coverImageUrl} title={c.title} />
                    <div className="min-w-0">
                      <Link
                        href={`/admin/cursos/${c.id}`}
                        className="line-clamp-2 text-sm font-semibold text-tas-navy after:absolute after:inset-0 hover:underline"
                      >
                        {c.title}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {[c.code, c.category?.name].filter(Boolean).join(" · ") || "Sin categoría"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:hidden">
                        <CourseStatusBadge status={c.status} />
                        <span>{pluralize(c.lessonCount, "lección", "lecciones")}</span>
                        <span>·</span>
                        <span>{pluralize(c.studentCount, "estudiante")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <CourseStatusBadge status={c.status} />
                  </div>
                  <p className="hidden text-sm text-muted-foreground md:block">
                    {pluralize(c.moduleCount, "módulo")}
                    <br />
                    <span className="text-xs">{pluralize(c.lessonCount, "lección", "lecciones")}</span>
                  </p>
                  <p className="hidden text-right text-sm font-semibold tabular-nums text-tas-navy md:block">{c.studentCount}</p>
                  <p className="hidden text-right text-xs text-muted-foreground md:block">{formatShortDate(c.updatedAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
