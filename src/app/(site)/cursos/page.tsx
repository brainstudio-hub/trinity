import type { Metadata } from "next";
import Link from "next/link";
import { Search, SearchX } from "lucide-react";
import { CourseCard } from "@/components/course/course-card";
import { EmptyState } from "@/components/ui/primitives";
import { Input } from "@/components/ui/form";
import { getCatalog, LEVEL_LABEL } from "@/lib/queries/courses";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Catálogo de cursos" };
export const dynamic = "force-dynamic";

type Params = { q?: string; categoria?: string; nivel?: string };

function hrefWith(current: Params, patch: Partial<Params>) {
  const next = { ...current, ...patch };
  const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
  return `/cursos${qs ? `?${qs}` : ""}`;
}

export default async function CatalogPage({ searchParams }: { searchParams: Params }) {
  let data: Awaited<ReturnType<typeof getCatalog>> = { courses: [], categories: [] };
  let failed = false;
  try {
    data = await getCatalog({ q: searchParams.q, category: searchParams.categoria, level: searchParams.nivel });
  } catch (error) {
    console.error("[catalog]", error);
    failed = true;
  }

  const chip = (active: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
      active ? "border-tas-navy bg-tas-navy text-tas-cream" : "bg-surface text-muted-foreground hover:border-tas-navy/30 hover:text-foreground"
    );

  return (
    <div className="container py-12 md:py-16">
      <div className="max-w-3xl">
        <p className="eyebrow mb-3">Catálogo</p>
        <h1 className="display text-5xl">Cursos del Seminario</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Estudios bíblicos, teológicos, históricos y pastorales para formar líderes con profundidad académica y
          vida espiritual.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-5 border-b pb-6">
        <form className="relative max-w-md" action="/cursos">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={searchParams.q} placeholder="Buscar por tema, libro o autor…" className="h-11 pl-9" />
          {searchParams.categoria && <input type="hidden" name="categoria" value={searchParams.categoria} />}
          {searchParams.nivel && <input type="hidden" name="nivel" value={searchParams.nivel} />}
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={hrefWith(searchParams, { categoria: undefined })} className={chip(!searchParams.categoria)}>
            Todas las áreas
          </Link>
          {data.categories
            .filter((c) => c._count.courses > 0)
            .map((c) => (
              <Link key={c.id} href={hrefWith(searchParams, { categoria: c.slug })} className={chip(searchParams.categoria === c.slug)}>
                {c.name}
                <span className="text-xs opacity-60">{c._count.courses}</span>
              </Link>
            ))}
          <span className="mx-2 hidden h-5 w-px bg-border sm:block" />
          {Object.entries(LEVEL_LABEL).map(([value, label]) => (
            <Link
              key={value}
              href={hrefWith(searchParams, { nivel: searchParams.nivel === value ? undefined : value })}
              className={chip(searchParams.nivel === value)}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {failed ? (
          <EmptyState title="No pudimos cargar el catálogo" description="Recarga la página en unos segundos." />
        ) : data.courses.length === 0 ? (
          <EmptyState
            icon={<SearchX />}
            title="Sin resultados"
            description="No hay cursos que coincidan con tu búsqueda. Prueba con otros términos o quita los filtros."
            action={
              <Link href="/cursos" className="text-sm font-semibold text-tas-blue hover:underline">
                Ver todos los cursos
              </Link>
            }
          />
        ) : (
          <>
            <p className="mb-5 text-sm text-muted-foreground">
              {data.courses.length} {data.courses.length === 1 ? "curso" : "cursos"}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.courses.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
