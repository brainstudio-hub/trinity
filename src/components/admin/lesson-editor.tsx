"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ExternalLink, Info, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Card } from "@/components/ui/primitives";
import { Switch } from "@/components/ui/overlay";
import { updateLessonAction } from "@/lib/actions/admin/lessons";
import { formatTimestamp, parseTimestamp } from "@/lib/domain/format";
import { getEmbedUrl, getThumbnailUrl, parseVideoUrl, supportsTimeSync } from "@/lib/domain/video";
import { cn } from "@/lib/utils";
import { FormSection, MarkdownEditor, SaveBar, useAdminAction } from "./admin-kit";
import { LESSON_TYPES, LessonTypeIcon, type LessonTypeValue } from "./labels";
import { VideoProviderBadge } from "./video-bits";

type LessonValues = {
  id: string;
  title: string;
  summary: string;
  type: LessonTypeValue;
  isPublished: boolean;
  isFreePreview: boolean;
  videoUrl: string;
  durationSeconds: number;
  content: string;
  transcript: string;
};

export function LessonEditor({ lesson, previewHref }: { lesson: LessonValues; previewHref: string }) {
  const router = useRouter();
  const initial = React.useMemo(
    () => ({ ...lesson, duration: lesson.durationSeconds > 0 ? formatTimestamp(lesson.durationSeconds) : "" }),
    [lesson]
  );
  const [v, setV] = React.useState(initial);
  const [pending, run] = useAdminAction();
  const [showTranscript, setShowTranscript] = React.useState(!!lesson.transcript);
  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) => setV((s) => ({ ...s, [key]: value }));
  const dirty = JSON.stringify(v) !== JSON.stringify(initial);

  React.useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const durationSeconds = v.duration.trim() ? parseTimestamp(v.duration) : 0;
  const durationError = durationSeconds === null ? "Usa el formato mm:ss o h:mm:ss (por ejemplo 45:30)." : null;
  const source = v.videoUrl.trim() ? parseVideoUrl(v.videoUrl) : null;
  const videoError = v.videoUrl.trim() && !source ? "No reconocemos este enlace. Pega un enlace de YouTube, Google Drive o Vimeo." : null;
  const isVideo = v.type === "VIDEO";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (durationError || videoError) return;
    run(
      () =>
        updateLessonAction(lesson.id, {
          title: v.title,
          summary: v.summary,
          type: v.type,
          isPublished: v.isPublished,
          isFreePreview: v.isFreePreview,
          videoUrl: v.videoUrl,
          durationSeconds: durationSeconds ?? 0,
          content: v.content,
          transcript: v.transcript,
        }),
      { success: "Lección guardada.", onSuccess: () => router.refresh() }
    );
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 pb-8 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <FormSection title="Datos de la lección" className="lg:grid-cols-1 lg:gap-6">
          <Field label="Título" htmlFor="lesson-title">
            <Input id="lesson-title" value={v.title} onChange={(e) => set("title", e.target.value)} maxLength={200} />
          </Field>
          <Field label="Resumen" htmlFor="lesson-summary" optional hint="Una o dos frases que aparecen bajo el título en el aula.">
            <Textarea id="lesson-summary" value={v.summary} onChange={(e) => set("summary", e.target.value)} rows={2} maxLength={2000} className="min-h-[72px]" />
          </Field>
          <fieldset>
            <legend className="mb-2 text-[0.8125rem] font-semibold">Tipo de lección</legend>
            <div role="radiogroup" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(LESSON_TYPES) as LessonTypeValue[]).map((t) => (
                <label
                  key={t}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 text-sm font-medium transition focus-within:ring-2 focus-within:ring-ring",
                    v.type === t ? "border-tas-navy bg-tas-navy/[0.03] ring-1 ring-tas-navy" : "hover:bg-secondary/40"
                  )}
                >
                  <input type="radio" name="type" value={t} checked={v.type === t} onChange={() => set("type", t)} className="sr-only" />
                  <LessonTypeIcon type={t} className="size-7" />
                  {LESSON_TYPES[t].label}
                </label>
              ))}
            </div>
            {v.type !== lesson.type && (v.type === "QUIZ" || v.type === "ASSIGNMENT") && (
              <p className="mt-2 text-xs text-muted-foreground">Al guardar aparecerá el editor de preguntas.</p>
            )}
          </fieldset>
        </FormSection>

        {isVideo && (
          <FormSection title="Video" className="lg:grid-cols-1 lg:gap-6">
            <Field
              label="Enlace del video"
              htmlFor="video-url"
              error={videoError}
              hint="Pega el enlace de YouTube, Google Drive o Vimeo. Detectamos el proveedor automáticamente."
            >
              <div className="relative">
                <Input
                  id="video-url"
                  type="url"
                  value={v.videoUrl}
                  onChange={(e) => set("videoUrl", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=…"
                  className={source ? "pr-36" : undefined}
                  aria-invalid={!!videoError}
                />
                {source && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">
                    <VideoProviderBadge provider={source.provider} />
                  </span>
                )}
              </div>
            </Field>

            {source && (
              <div className="space-y-3">
                <div className="aspect-video w-full overflow-hidden rounded-lg border bg-tas-navy-deep">
                  <iframe
                    key={getEmbedUrl(source)}
                    src={getEmbedUrl(source)}
                    title="Vista previa del video"
                    className="size-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {getThumbnailUrl(source) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getThumbnailUrl(source)!} alt="Miniatura del video" className="h-12 w-auto rounded border object-cover" />
                  )}
                  <span>
                    ID detectado: <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">{source.provider === "URL" ? "—" : source.id}</code>
                  </span>
                </div>
                {!supportsTimeSync(source.provider) ? (
                  <Notice tone="warning">
                    <strong>Google Drive no permite sincronizar las notas con el minuto del video</strong> ni detectar la duración.
                    Para la mejor experiencia, sube la clase a YouTube como <em>No listado</em> y pega ese enlace.
                  </Notice>
                ) : source.provider === "YOUTUBE" ? (
                  <Notice tone="info">
                    Los estudiantes podrán tomar notas marcadas con el minuto exacto. Si dejas la duración vacía, se detectará
                    automáticamente la primera vez que alguien reproduzca el video.
                  </Notice>
                ) : null}
              </div>
            )}

            <Field
              label="Duración"
              htmlFor="duration"
              optional
              error={durationError}
              hint={
                source?.provider === "YOUTUBE"
                  ? "Formato mm:ss. Con YouTube también se detecta automáticamente en la primera reproducción."
                  : "Formato mm:ss o h:mm:ss. Se usa para calcular la duración del curso y el avance."
              }
            >
              <Input
                id="duration"
                value={v.duration}
                onChange={(e) => set("duration", e.target.value)}
                placeholder="45:30"
                inputMode="numeric"
                className="max-w-[140px] font-mono"
                aria-invalid={!!durationError}
              />
            </Field>
          </FormSection>
        )}

        <FormSection
          title={isVideo ? "Contenido / bosquejo de la clase" : v.type === "READING" ? "Contenido de la lectura" : "Contenido / instrucciones"}
          description={
            isVideo
              ? "Aparece debajo del video: bosquejo, citas bíblicas, preguntas de reflexión y lecturas asignadas."
              : "Admite Markdown: títulos, listas, tablas, citas y enlaces."
          }
          className="lg:grid-cols-1 lg:gap-4"
        >
          <MarkdownEditor
            id="lesson-content"
            value={v.content}
            onChange={(val) => set("content", val)}
            rows={16}
            placeholder={"## Bosquejo\n\n1. Introducción\n2. …\n\n> «Cita bíblica» — Referencia"}
          />
        </FormSection>

        {isVideo && (
          <FormSection title="Transcripción" className="lg:grid-cols-1 lg:gap-4">
            {showTranscript ? (
              <Field label="Transcripción del video" htmlFor="transcript" optional hint="Ayuda a la accesibilidad y a la búsqueda dentro de la clase.">
                <Textarea
                  id="transcript"
                  value={v.transcript}
                  onChange={(e) => set("transcript", e.target.value)}
                  rows={10}
                  className="font-mono text-[0.8125rem]"
                />
              </Field>
            ) : (
              <Button type="button" variant="outline" onClick={() => setShowTranscript(true)} className="self-start">
                Agregar transcripción
              </Button>
            )}
          </FormSection>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className="space-y-5 p-5">
          <p className="eyebrow">Publicación</p>
          <label className="flex items-start justify-between gap-4">
            <span>
              <span className="block text-sm font-semibold">Publicada</span>
              <span className="block text-xs text-muted-foreground">Visible para los estudiantes del curso.</span>
            </span>
            <Switch checked={v.isPublished} onCheckedChange={(c) => set("isPublished", c)} aria-label="Publicada" />
          </label>
          <label className="flex items-start justify-between gap-4">
            <span>
              <span className="block text-sm font-semibold">Vista previa gratis</span>
              <span className="block text-xs text-muted-foreground">Cualquier visitante puede verla sin inscribirse.</span>
            </span>
            <Switch checked={v.isFreePreview} onCheckedChange={(c) => set("isFreePreview", c)} aria-label="Vista previa gratis" />
          </label>
          {isVideo && v.isPublished && !source && (
            <p className="flex gap-2 rounded-md bg-tas-crimson/[0.06] p-2.5 text-xs text-tas-crimson-dark">
              <AlertTriangle className="size-4 shrink-0" /> Agrega el enlace del video antes de publicar.
            </p>
          )}
          <div className="space-y-2 border-t pt-5">
            <Button type="submit" className="w-full" loading={pending} disabled={!dirty && !pending}>
              <Save /> {dirty ? "Guardar cambios" : "Sin cambios"}
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href={previewHref} target="_blank" rel="noreferrer">
                <ExternalLink /> Ver en el aula
              </Link>
            </Button>
          </div>
        </Card>
      </aside>

      <SaveBar dirty={dirty} pending={pending} onReset={() => setV(initial)} />
    </form>
  );
}

function Notice({ tone, children }: { tone: "info" | "warning"; children: React.ReactNode }) {
  const Icon = tone === "warning" ? AlertTriangle : Info;
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-md border px-3.5 py-3 text-[0.8125rem] leading-relaxed",
        tone === "warning" ? "border-tas-gold/40 bg-tas-gold-soft/60 text-[#5C4300]" : "border-tas-blue/15 bg-tas-blue/[0.04] text-tas-navy"
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
