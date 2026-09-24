"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Card } from "@/components/ui/primitives";
import { createCourseAction } from "@/lib/actions/admin/courses";
import { slugify } from "@/lib/domain/format";
import { useAdminAction } from "./admin-kit";
import { LEVEL_OPTIONS } from "./labels";

export function NewCourseForm({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, run] = useAdminAction();
  const [title, setTitle] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [level, setLevel] = React.useState<(typeof LEVEL_OPTIONS)[number]["value"]>("INTRODUCTORIO");
  const [error, setError] = React.useState<string | null>(null);
  const slug = slugify(title);

  return (
    <Card className="p-6 md:p-8">
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) {
            setError("Escribe el título del curso.");
            return;
          }
          setError(null);
          run(() => createCourseAction({ title, categoryId, level }), {
            success: "Curso creado como borrador.",
            onSuccess: (r) => router.push(`/admin/cursos/${r.id}/contenido`),
            onError: setError,
          });
        }}
        noValidate
      >
        <Field
          label="Título del curso"
          htmlFor="title"
          error={error}
          hint={slug ? <>Dirección pública: /cursos/<span className="font-medium text-foreground">{slug}</span></> : "Por ejemplo: Introducción al Nuevo Testamento"}
        >
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Introducción al Nuevo Testamento"
            autoFocus
            maxLength={160}
            aria-invalid={!!error}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Categoría" htmlFor="category" optional>
            <Select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nivel" htmlFor="level">
            <Select id="level" value={level} onChange={(e) => setLevel(e.target.value as typeof level)}>
              {LEVEL_OPTIONS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t pt-6 sm:flex-row sm:justify-end">
          <Button asChild variant="ghost">
            <Link href="/admin/cursos">Cancelar</Link>
          </Button>
          <Button type="submit" loading={pending}>
            Crear y armar el currículo <ArrowRight />
          </Button>
        </div>
      </form>
    </Card>
  );
}
