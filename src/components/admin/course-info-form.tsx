"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ImageOff, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Avatar, Badge } from "@/components/ui/primitives";
import { Switch } from "@/components/ui/overlay";
import { updateCourseInfoAction } from "@/lib/actions/admin/courses";
import { slugify } from "@/lib/domain/format";
import { getEmbedUrl, parseVideoUrl } from "@/lib/domain/video";
import { FormSection, MarkdownEditor, SaveBar, StringListEditor, useAdminAction } from "./admin-kit";
import { LEVEL_OPTIONS } from "./labels";
import { VideoProviderBadge } from "./video-bits";

type Values = {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  code: string;
  description: string;
  coverImageUrl: string;
  trailerUrl: string;
  categoryId: string;
  level: "INTRODUCTORIO" | "INTERMEDIO" | "AVANZADO";
  language: string;
  estimatedHours: string;
  learningOutcomes: string[];
  requirements: string[];
  instructorIds: string[];
  certificateEnabled: boolean;
  passingScore: string;
};

type InstructorOption = { id: string; name: string; title: string | null; photoUrl: string | null };

const isHttpUrl = (v: string) => /^https?:\/\/\S+$/i.test(v.trim());

export function CourseInfoForm({
  course,
  categories,
  instructors,
}: {
  course: Values;
  categories: { id: string; name: string }[];
  instructors: InstructorOption[];
}) {
  const router = useRouter();
  const [values, setValues] = React.useState<Values>(course);
  const [pending, run] = useAdminAction();
  const [coverError, setCoverError] = React.useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(course);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  // Avisar antes de salir con cambios sin guardar.
  React.useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const trailer = values.trailerUrl.trim() ? parseVideoUrl(values.trailerUrl) : null;
  const byId = new Map(instructors.map((i) => [i.id, i]));
  const selected = values.instructorIds.map((id) => byId.get(id)).filter(Boolean) as InstructorOption[];
  const available = instructors.filter((i) => !values.instructorIds.includes(i.id));

  const moveInstructor = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= values.instructorIds.length) return;
    const next = [...values.instructorIds];
    [next[i], next[j]] = [next[j], next[i]];
    set("instructorIds", next);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = values.estimatedHours.trim();
    run(
      () =>
        updateCourseInfoAction(course.id, {
          title: values.title,
          subtitle: values.subtitle,
          slug: values.slug.trim(),
          code: values.code,
          description: values.description,
          coverImageUrl: values.coverImageUrl,
          trailerUrl: values.trailerUrl,
          categoryId: values.categoryId,
          level: values.level,
          language: values.language,
          estimatedHours: hours === "" ? null : Number(hours),
          learningOutcomes: values.learningOutcomes,
          requirements: values.requirements,
          instructorIds: values.instructorIds,
          certificateEnabled: values.certificateEnabled,
          passingScore: Number(values.passingScore),
        }),
      { success: "Información del curso guardada.", onSuccess: () => router.refresh() }
    );
  };

  return (
    <form onSubmit={submit} noValidate className="pb-24">
      <FormSection title="Datos básicos" description="Cómo se presenta el curso en el catálogo y en su página pública.">
        <Field label="Título" htmlFor="title">
          <Input id="title" value={values.title} onChange={(e) => set("title", e.target.value)} maxLength={160} required />
        </Field>
        <Field label="Subtítulo" htmlFor="subtitle" optional hint="Una frase que resuma el curso.">
          <Input id="subtitle" value={values.subtitle} onChange={(e) => set("subtitle", e.target.value)} maxLength={240} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
          <Field label="Slug (dirección pública)" htmlFor="slug" hint={`/cursos/${values.slug || "…"}`}>
            <div className="flex gap-2">
              <Input
                id="slug"
                value={values.slug}
                onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                maxLength={80}
                className="font-mono text-[0.8125rem]"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => set("slug", slugify(values.title))}
                aria-label="Generar slug desde el título"
                title="Generar desde el título"
              >
                <RefreshCw />
              </Button>
            </div>
          </Field>
          <Field label="Código" htmlFor="code" optional hint="Código académico, p. ej. NT-310">
            <Input id="code" value={values.code} onChange={(e) => set("code", e.target.value.toUpperCase())} maxLength={24} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Categoría" htmlFor="category">
            <Select id="category" value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nivel" htmlFor="level">
            <Select id="level" value={values.level} onChange={(e) => set("level", e.target.value as Values["level"])}>
              {LEVEL_OPTIONS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Idioma" htmlFor="language">
            <Input id="language" value={values.language} onChange={(e) => set("language", e.target.value)} maxLength={40} />
          </Field>
          <Field label="Horas estimadas" htmlFor="hours" optional>
            <Input
              id="hours"
              type="number"
              inputMode="numeric"
              min={0}
              max={2000}
              value={values.estimatedHours}
              onChange={(e) => set("estimatedHours", e.target.value)}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Descripción"
        description="Explica de qué trata el curso, a quién está dirigido y cómo se desarrolla. Admite formato Markdown."
      >
        <MarkdownEditor
          id="description"
          value={values.description}
          onChange={(v) => set("description", v)}
          rows={12}
          placeholder={"## Sobre este curso\n\nEste curso recorre…"}
        />
      </FormSection>

      <FormSection title="Portada y presentación" description="Imagen horizontal (16:9, al menos 1280 px de ancho) y un video corto opcional.">
        <Field label="URL de la imagen de portada" htmlFor="cover" optional>
          <Input
            id="cover"
            type="url"
            value={values.coverImageUrl}
            onChange={(e) => {
              set("coverImageUrl", e.target.value);
              setCoverError(false);
            }}
            placeholder="https://…"
          />
        </Field>
        <div className="aspect-video w-full max-w-md overflow-hidden rounded-lg border bg-tas-sand">
          {isHttpUrl(values.coverImageUrl) && !coverError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={values.coverImageUrl.trim()}
              alt="Vista previa de la portada"
              className="size-full object-cover"
              onError={() => setCoverError(true)}
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
              <ImageOff className="size-5" />
              {coverError ? "No pudimos cargar la imagen. Revisa el enlace." : "Sin portada"}
            </div>
          )}
        </div>

        <Field
          label="Video de presentación"
          htmlFor="trailer"
          optional
          error={values.trailerUrl.trim() && !trailer ? "No reconocemos este enlace. Usa YouTube, Google Drive o Vimeo." : null}
          hint="Enlace de YouTube (recomendado: no listado), Google Drive o Vimeo."
        >
          <div className="relative">
            <Input
              id="trailer"
              type="url"
              value={values.trailerUrl}
              onChange={(e) => set("trailerUrl", e.target.value)}
              placeholder="https://youtu.be/…"
              className={trailer ? "pr-32" : undefined}
            />
            {trailer && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2">
                <VideoProviderBadge provider={trailer.provider} />
              </span>
            )}
          </div>
        </Field>
        {trailer && (
          <div className="aspect-video w-full max-w-md overflow-hidden rounded-lg border bg-black">
            <iframe
              src={getEmbedUrl(trailer)}
              title="Vista previa del video de presentación"
              className="size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </FormSection>

      <FormSection title="Qué aprenderán" description="Resultados de aprendizaje que se muestran como lista en la página del curso.">
        <StringListEditor
          value={values.learningOutcomes}
          onChange={(v) => set("learningOutcomes", v)}
          placeholder="Por ejemplo: Interpretar el Sermón del Monte en su contexto"
        />
      </FormSection>

      <FormSection title="Requisitos" description="Conocimientos o materiales previos recomendados.">
        <StringListEditor
          value={values.requirements}
          onChange={(v) => set("requirements", v)}
          placeholder="Por ejemplo: Una Biblia (se recomienda RVR1960 o NVI)"
        />
      </FormSection>

      <FormSection title="Docentes" description="Aparecen en la página del curso en este orden. Un docente con cuenta vinculada puede administrar el curso.">
        {selected.length === 0 ? (
          <p className="rounded-md border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
            Aún no hay docentes asignados.
          </p>
        ) : (
          <ul className="space-y-2">
            {selected.map((ins, i) => (
              <li key={ins.id} className="flex items-center gap-3 rounded-lg border bg-surface p-2.5 pl-3">
                <Avatar name={ins.name} src={ins.photoUrl} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{ins.name}</p>
                  {ins.title && <p className="truncate text-xs text-muted-foreground">{ins.title}</p>}
                </div>
                {i === 0 && <Badge variant="gold" className="hidden sm:inline-flex">Principal</Badge>}
                <div className="flex shrink-0">
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => moveInstructor(i, -1)} disabled={i === 0} aria-label={`Subir a ${ins.name}`}>
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => moveInstructor(i, 1)}
                    disabled={i === selected.length - 1}
                    aria-label={`Bajar a ${ins.name}`}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => set("instructorIds", values.instructorIds.filter((x) => x !== ins.id))}
                    aria-label={`Quitar a ${ins.name}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {available.length > 0 ? (
          <Select
            aria-label="Agregar docente"
            value=""
            onChange={(e) => e.target.value && set("instructorIds", [...values.instructorIds, e.target.value])}
            className="max-w-sm"
          >
            <option value="">+ Agregar docente…</option>
            {available.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
                {i.title ? ` — ${i.title}` : ""}
              </option>
            ))}
          </Select>
        ) : (
          instructors.length === 0 && (
            <p className="text-xs text-muted-foreground">No hay perfiles docentes creados. Un administrador puede crearlos en Docentes.</p>
          )
        )}
      </FormSection>

      <FormSection title="Certificado" description="Se emite automáticamente al completar todas las lecciones y aprobar las evaluaciones.">
        <label className="flex items-start justify-between gap-4 rounded-lg border bg-surface p-4">
          <span>
            <span className="block text-sm font-semibold">Emitir certificado</span>
            <span className="block text-xs text-muted-foreground">Los estudiantes podrán descargar y verificar su certificado.</span>
          </span>
          <Switch checked={values.certificateEnabled} onCheckedChange={(v) => set("certificateEnabled", v)} aria-label="Emitir certificado" />
        </label>
        <Field label="Nota mínima promedio en evaluaciones (%)" htmlFor="passing" hint="Promedio de cuestionarios y tareas necesario para certificar.">
          <Input
            id="passing"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={values.passingScore}
            onChange={(e) => set("passingScore", e.target.value)}
            className="max-w-[140px]"
            disabled={!values.certificateEnabled}
          />
        </Field>
      </FormSection>

      <SaveBar dirty={dirty} pending={pending} onReset={() => setValues(course)} />
    </form>
  );
}
