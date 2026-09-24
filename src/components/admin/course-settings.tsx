"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, CheckCircle2, Circle, ExternalLink, EyeOff, Rocket, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives";
import { deleteCourseAction, setCourseStatusAction } from "@/lib/actions/admin/courses";
import type { ChecklistItem } from "@/lib/domain/curriculum";
import { cn, pluralize } from "@/lib/utils";
import { ConfirmDialog, useAdminAction } from "./admin-kit";
import { COURSE_STATUS, CourseStatusBadge, type CourseStatusValue } from "./labels";

const STATUS_HELP: Record<CourseStatusValue, string> = {
  DRAFT: "Solo el equipo docente puede verlo. Los estudiantes no lo encuentran en el catálogo.",
  PUBLISHED: "Visible en el catálogo; los estudiantes pueden inscribirse y estudiar las lecciones publicadas.",
  ARCHIVED: "Oculto del catálogo. Los estudiantes inscritos conservan su historial, pero no se admiten nuevas inscripciones.",
};

export function CourseSettings({
  course,
  checklist,
  canPublish,
  canDelete,
}: {
  course: { id: string; title: string; slug: string; status: CourseStatusValue; students: number };
  checklist: ChecklistItem[];
  canPublish: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, run] = useAdminAction();
  const [target, setTarget] = React.useState<CourseStatusValue | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const changeStatus = (status: CourseStatusValue) =>
    run(() => setCourseStatusAction(course.id, status), {
      success:
        status === "PUBLISHED" ? "¡Curso publicado!" : status === "ARCHIVED" ? "Curso archivado." : "El curso volvió a borrador.",
      onSuccess: () => setTarget(null),
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado del curso</CardTitle>
            <CardDescription>Controla quién puede ver el curso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg bg-secondary/50 p-4">
              <CourseStatusBadge status={course.status} className="mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">{STATUS_HELP[course.status]}</p>
            </div>

            <div>
              <p className="mb-3 text-[0.8125rem] font-semibold">Lista previa a la publicación</p>
              <ul className="space-y-2">
                {checklist.map((item) => (
                  <li key={item.key} className="flex items-start gap-2.5 text-sm">
                    {item.ok ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    ) : item.required ? (
                      <Circle className="mt-0.5 size-4 shrink-0 text-tas-crimson" />
                    ) : (
                      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-tas-gold" />
                    )}
                    <span className={cn(item.ok ? "text-muted-foreground" : "text-foreground")}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2 border-t pt-5">
              {course.status !== "PUBLISHED" && (
                <Button onClick={() => changeStatus("PUBLISHED")} disabled={!canPublish} loading={pending && target === null}>
                  <Rocket /> Publicar curso
                </Button>
              )}
              {course.status !== "DRAFT" && (
                <Button variant="outline" onClick={() => setTarget("DRAFT")}>
                  <EyeOff /> Volver a borrador
                </Button>
              )}
              {course.status !== "ARCHIVED" && (
                <Button variant="outline" onClick={() => setTarget("ARCHIVED")}>
                  <Archive /> Archivar
                </Button>
              )}
            </div>
            {!canPublish && course.status !== "PUBLISHED" && (
              <p className="text-xs text-muted-foreground">Completa los puntos obligatorios para habilitar la publicación.</p>
            )}
          </CardContent>
        </Card>

        {canDelete && (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de peligro</CardTitle>
              <CardDescription>
                Eliminar el curso borra sus módulos, lecciones, evaluaciones, inscripciones, progreso y certificados. No se puede
                deshacer. Si solo quieres ocultarlo, archívalo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 /> Eliminar curso
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <aside className="space-y-4">
        <Card className="p-5">
          <p className="eyebrow mb-2">Vista del estudiante</p>
          <p className="text-sm text-muted-foreground">Revisa cómo se ve la página pública del curso y su currículo.</p>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link href={`/cursos/${course.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink /> Ver como estudiante
            </Link>
          </Button>
        </Card>
        <Card className="p-5">
          <p className="eyebrow mb-2">Dirección pública</p>
          <p className="break-all font-mono text-xs text-foreground">/cursos/{course.slug}</p>
          <p className="mt-3 text-xs text-muted-foreground">Puedes cambiarla en la pestaña Información.</p>
        </Card>
      </aside>

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(o) => !o && setTarget(null)}
        title={target === "ARCHIVED" ? "¿Archivar el curso?" : "¿Volver a borrador?"}
        description={
          target === "ARCHIVED"
            ? "El curso dejará de aparecer en el catálogo y no aceptará nuevas inscripciones."
            : course.students > 0
              ? `El curso dejará de estar disponible, incluso para ${pluralize(course.students, "estudiante inscrito", "estudiantes inscritos")}.`
              : "El curso dejará de estar visible en el catálogo."
        }
        confirmLabel={target ? (target === "ARCHIVED" ? "Archivar" : `Pasar a ${COURSE_STATUS.DRAFT.label.toLowerCase()}`) : ""}
        destructive={false}
        pending={pending}
        onConfirm={() => target && changeStatus(target)}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar curso definitivamente"
        description={
          course.students > 0
            ? `Hay ${pluralize(course.students, "estudiante inscrito", "estudiantes inscritos")}. Perderán su progreso y certificados.`
            : "Esta acción no se puede deshacer."
        }
        confirmLabel="Eliminar para siempre"
        requireText={course.title}
        pending={pending}
        onConfirm={(typed) =>
          run(() => deleteCourseAction(course.id, typed), {
            success: "Curso eliminado.",
            onSuccess: () => {
              setConfirmDelete(false);
              router.push("/admin/cursos");
            },
          })
        }
      />
    </div>
  );
}
