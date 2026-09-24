"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, Info, LayoutList, Paperclip, Rocket, Settings2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { setCourseStatusAction } from "@/lib/actions/admin/courses";
import { cn } from "@/lib/utils";
import { useAdminAction } from "./admin-kit";
import type { CourseStatusValue } from "./labels";

const TABS = [
  { slug: "", label: "Información", icon: Info },
  { slug: "contenido", label: "Currículo", icon: LayoutList },
  { slug: "estudiantes", label: "Estudiantes", icon: Users },
  { slug: "recursos", label: "Recursos", icon: Paperclip },
  { slug: "configuracion", label: "Configuración", icon: Settings2 },
];

export function CourseEditorTabs({ courseId }: { courseId: string }) {
  const pathname = usePathname();
  const base = `/admin/cursos/${courseId}`;
  return (
    <nav aria-label="Secciones del curso" className="mt-6 border-b">
      <ul className="-mb-px flex gap-6 overflow-x-auto scrollbar-thin">
        {TABS.map((t) => {
          const href = t.slug ? `${base}/${t.slug}` : base;
          const active = pathname === href;
          const Icon = t.icon;
          return (
            <li key={t.slug} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap border-b-2 pb-3 pt-1 text-sm font-semibold transition-colors",
                  active
                    ? "border-tas-crimson text-tas-navy"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function PublishButton({
  courseId,
  status,
  missing,
}: {
  courseId: string;
  status: CourseStatusValue;
  missing: string[];
}) {
  const [pending, run] = useAdminAction();
  const [open, setOpen] = React.useState(false);

  if (status === "PUBLISHED") return null;

  return (
    <>
      <Button
        onClick={() => {
          if (missing.length > 0) setOpen(true);
          else run(() => setCourseStatusAction(courseId, "PUBLISHED"), { success: "¡Curso publicado! Ya es visible en el catálogo." });
        }}
        loading={pending}
      >
        <Rocket /> Publicar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Aún no se puede publicar" description="Completa estos puntos antes de publicar el curso." size="sm">
          <ul className="space-y-2">
            {missing.map((m) => (
              <li key={m} className="flex items-start gap-2.5 text-sm">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-tas-crimson" />
                {m}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Entendido
            </Button>
            <Button asChild>
              <Link href={`/admin/cursos/${courseId}/configuracion`} onClick={() => setOpen(false)}>
                Ver lista completa
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
