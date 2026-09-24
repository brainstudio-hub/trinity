import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ClipboardCheck, Inbox } from "lucide-react";
import { Avatar, Badge, EmptyState, PageHeader } from "@/components/ui/primitives";
import { AdminBreadcrumbs } from "@/components/admin/admin-shell";
import { ParamSelect } from "@/components/admin/admin-kit";
import { LESSON_TYPES } from "@/components/admin/labels";
import { getGradingQueue, requireStaff } from "@/lib/queries/admin";
import { cn, formatRelative, formatShortDate, pluralize } from "@/lib/utils";

export const metadata: Metadata = { title: "Calificaciones" };

export default async function GradingQueuePage({ searchParams }: { searchParams: { curso?: string; estado?: string } }) {
  const user = await requireStaff();
  const { attempts, courses, status } = await getGradingQueue(user, { courseId: searchParams.curso, status: searchParams.estado });
  const pendingView = status === "SUBMITTED";

  const tabs = [
    { value: "", label: "Pendientes" },
    { value: "GRADED", label: "Calificadas" },
  ];
  const qs = (estado: string) => {
    const p = new URLSearchParams();
    if (estado) p.set("estado", estado);
    if (searchParams.curso) p.set("curso", searchParams.curso);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <>
      <AdminBreadcrumbs items={[{ label: "Calificaciones" }]} />
      <PageHeader
        eyebrow="Académico"
        title="Calificaciones"
        description="Revisa las tareas y ensayos entregados. Las preguntas cerradas ya vienen calificadas automáticamente."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Estado de las entregas" className="inline-flex rounded-lg border bg-surface p-1">
          {tabs.map((t) => {
            const active = (t.value === "GRADED") === !pendingView;
            return (
              <Link
                key={t.label}
                href={`/admin/calificaciones${qs(t.value)}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3.5 py-1.5 text-sm font-semibold transition",
                  active ? "bg-tas-navy text-tas-cream" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <ParamSelect
          param="curso"
          label="Filtrar por curso"
          allLabel="Todos los cursos"
          options={courses.map((c) => ({ value: c.id, label: c.title }))}
          className="sm:max-w-xs"
        />
      </div>

      {attempts.length === 0 ? (
        <EmptyState
          icon={pendingView ? <Inbox /> : <ClipboardCheck />}
          title={pendingView ? "¡Todo al día!" : "Aún no hay entregas calificadas"}
          description={
            pendingView
              ? "No hay entregas esperando calificación. Te avisaremos aquí cuando llegue una nueva."
              : "Las entregas que califiques aparecerán aquí."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-soft">
          <ul className="divide-y">
            {attempts.map((a) => {
              const lesson = a.quiz.lesson;
              return (
                <li key={a.id}>
                  <Link
                    href={`/admin/calificaciones/${a.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-secondary/40 md:gap-4 md:px-5"
                  >
                    <Avatar name={a.user.name} src={a.user.avatarUrl} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{lesson.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.user.name} · {lesson.module.course.title}
                      </p>
                    </div>
                    <Badge variant="muted" className="hidden sm:inline-flex">
                      {LESSON_TYPES[lesson.type].label}
                    </Badge>
                    {pendingView ? (
                      <span className="hidden w-32 shrink-0 text-right text-xs text-muted-foreground md:block">
                        Entregada {a.submittedAt ? formatRelative(a.submittedAt) : "—"}
                      </span>
                    ) : (
                      <span className="w-28 shrink-0 text-right">
                        <span className={cn("block text-sm font-semibold tabular-nums", a.passed ? "text-success" : "text-tas-crimson-dark")}>
                          {a.score !== null ? `${a.score}%` : "—"}
                        </span>
                        <span className="block text-2xs text-muted-foreground">{a.gradedAt ? formatShortDate(a.gradedAt) : ""}</span>
                      </span>
                    )}
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="border-t bg-secondary/30 px-5 py-2.5 text-xs text-muted-foreground">
            {pluralize(attempts.length, pendingView ? "entrega pendiente" : "entrega calificada", pendingView ? "entregas pendientes" : "entregas calificadas")}
            {attempts.length === 100 && " (mostrando las primeras 100)"}
          </p>
        </div>
      )}
    </>
  );
}
