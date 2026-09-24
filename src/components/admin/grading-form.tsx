"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Circle, MinusCircle, Save, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form";
import { Badge, Card, Progress } from "@/components/ui/primitives";
import { gradeAttemptAction } from "@/lib/actions/admin/grading";
import { cn, pluralize } from "@/lib/utils";
import { useAdminAction } from "./admin-kit";
import { QUESTION_TYPE_LABEL } from "./labels";

type QType = keyof typeof QUESTION_TYPE_LABEL;
type GradingQuestion = {
  id: string;
  type: QType;
  prompt: string;
  explanation: string | null;
  points: number;
  acceptedAnswers: string[];
  options: { id: string; text: string; isCorrect: boolean }[];
  answer: { selectedOptionIds: string[]; textAnswer: string | null; pointsAwarded: number | null; feedback: string | null } | null;
  autoPoints: number | null;
  autoCorrect: boolean | null;
};

export function GradingForm({
  attemptId,
  status,
  passingScore,
  currentScore,
  questions,
}: {
  attemptId: string;
  status: "SUBMITTED" | "GRADED" | "IN_PROGRESS";
  passingScore: number;
  currentScore: number | null;
  questions: GradingQuestion[];
}) {
  const router = useRouter();
  const [pending, run] = useAdminAction();
  const essays = questions.filter((q) => q.type === "ESSAY");
  const [grades, setGrades] = React.useState<Record<string, { points: string; feedback: string }>>(() =>
    Object.fromEntries(
      essays.map((q) => [
        q.id,
        { points: q.answer?.pointsAwarded === null || q.answer?.pointsAwarded === undefined ? "" : String(q.answer.pointsAwarded), feedback: q.answer?.feedback ?? "" },
      ])
    )
  );

  const total = questions.reduce((a, q) => a + q.points, 0);
  const missing = essays.filter((q) => grades[q.id]?.points.trim() === "").length;
  const invalid = essays.some((q) => {
    const raw = grades[q.id]?.points.trim();
    if (!raw) return false;
    const n = Number(raw);
    return !Number.isFinite(n) || n < 0 || n > q.points;
  });
  const earned = questions.reduce((a, q) => {
    if (q.type === "ESSAY") {
      const n = Number(grades[q.id]?.points);
      return a + (grades[q.id]?.points.trim() && Number.isFinite(n) ? Math.min(Math.max(n, 0), q.points) : 0);
    }
    return a + (q.autoPoints ?? 0);
  }, 0);
  const estimate = total === 0 ? 100 : Math.round((earned / total) * 1000) / 10;
  const passes = estimate >= passingScore;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (missing > 0 || invalid) return;
    const payload = Object.fromEntries(
      essays.map((q) => [q.id, { points: Number(grades[q.id].points), feedback: grades[q.id].feedback }])
    );
    run(() => gradeAttemptAction(attemptId, payload), {
      onSuccess: (r) => {
        toast.success(`Calificación guardada: ${r.score}% (${r.passed ? "aprobado" : "no aprobado"}).`);
        if (r.certificateIssued) toast.success("El estudiante completó el curso y recibió su certificado.");
        router.refresh();
      },
    });
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <ol className="min-w-0 space-y-4">
        {questions.map((q, i) => (
          <li key={q.id}>
            <Card className="p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">Pregunta {i + 1}</span>
                <Badge variant={q.type === "ESSAY" ? "accent" : "muted"}>{QUESTION_TYPE_LABEL[q.type].label}</Badge>
                <span className="ml-auto text-xs text-muted-foreground">{pluralize(q.points, "punto")}</span>
              </div>
              <p className="whitespace-pre-line text-[0.9375rem] font-medium text-foreground">{q.prompt}</p>

              <div className="mt-4">
                {q.type === "ESSAY" ? (
                  <EssayGrading
                    question={q}
                    value={grades[q.id]}
                    onChange={(val) => setGrades((g) => ({ ...g, [q.id]: val }))}
                  />
                ) : (
                  <AutoGraded question={q} />
                )}
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className="p-5">
          <p className="eyebrow mb-3">Resultado</p>
          <p className="font-serif text-4xl text-tas-navy">
            {estimate}
            <span className="text-2xl">%</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {Math.round(earned * 10) / 10} de {total} puntos · mínimo para aprobar {passingScore}%
          </p>
          <Progress value={estimate} tone={passes ? "success" : "gold"} className="mt-4 h-2" label="Resultado estimado" />
          <p className={cn("mt-3 text-sm font-semibold", passes ? "text-success" : "text-tas-crimson-dark")}>
            {missing > 0 ? "Faltan preguntas por calificar" : passes ? "Aprobado" : "No aprobado"}
          </p>
          {status === "GRADED" && currentScore !== null && (
            <p className="mt-1 text-xs text-muted-foreground">Nota guardada actualmente: {currentScore}%</p>
          )}
          <div className="mt-5 space-y-2 border-t pt-5">
            <Button type="submit" className="w-full" loading={pending} disabled={missing > 0 || invalid}>
              <Save /> {status === "GRADED" ? "Actualizar calificación" : "Guardar calificación"}
            </Button>
            {missing > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                Asigna puntaje a {pluralize(missing, "pregunta abierta", "preguntas abiertas")}.
              </p>
            )}
            <Button asChild variant="ghost" className="w-full">
              <Link href="/admin/calificaciones">Volver a la cola</Link>
            </Button>
          </div>
        </Card>
      </aside>
    </form>
  );
}

function EssayGrading({
  question: q,
  value,
  onChange,
}: {
  question: GradingQuestion;
  value: { points: string; feedback: string };
  onChange: (v: { points: string; feedback: string }) => void;
}) {
  const n = Number(value.points);
  const error = value.points.trim() && (!Number.isFinite(n) || n < 0 || n > q.points) ? `Debe estar entre 0 y ${q.points}.` : null;
  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-secondary/40 px-4 py-3">
        <p className="mb-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Respuesta del estudiante</p>
        {q.answer?.textAnswer?.trim() ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{q.answer.textAnswer}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">Sin respuesta.</p>
        )}
      </div>
      {q.explanation && (
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Criterios: </span>
          {q.explanation}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div className="space-y-1.5">
          <label htmlFor={`pts-${q.id}`} className="text-[0.8125rem] font-semibold">
            Puntaje
          </label>
          <div className="flex items-center gap-2">
            <Input
              id={`pts-${q.id}`}
              type="number"
              inputMode="decimal"
              min={0}
              max={q.points}
              step="0.5"
              value={value.points}
              onChange={(e) => onChange({ ...value, points: e.target.value })}
              aria-invalid={!!error}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">/ {q.points}</span>
          </div>
          {error && <p className="text-xs font-medium text-destructive">{error}</p>}
          <div className="flex gap-1 pt-1">
            {[0, 0.5, 1].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onChange({ ...value, points: String(Math.round(q.points * f * 2) / 2) })}
                className="rounded border px-1.5 py-0.5 text-2xs font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                {f === 0 ? "0" : f === 1 ? "Todo" : "Mitad"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`fb-${q.id}`} className="text-[0.8125rem] font-semibold">
            Retroalimentación <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <Textarea
            id={`fb-${q.id}`}
            value={value.feedback}
            onChange={(e) => onChange({ ...value, feedback: e.target.value })}
            rows={3}
            placeholder="Comentario para el estudiante…"
          />
        </div>
      </div>
    </div>
  );
}

function AutoGraded({ question: q }: { question: GradingQuestion }) {
  const selected = new Set(q.answer?.selectedOptionIds ?? []);
  return (
    <div className="space-y-3">
      {q.type === "SHORT_ANSWER" ? (
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Respuesta: </span>
            <span className="font-medium">{q.answer?.textAnswer?.trim() || <em className="text-muted-foreground">Sin respuesta</em>}</span>
          </p>
          <p className="text-xs text-muted-foreground">Aceptadas: {q.acceptedAnswers.join(" · ")}</p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {q.options.map((o) => {
            const chosen = selected.has(o.id);
            const Icon = chosen ? (o.isCorrect ? CheckCircle2 : XCircle) : o.isCorrect ? MinusCircle : Circle;
            return (
              <li
                key={o.id}
                className={cn(
                  "flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm",
                  chosen && o.isCorrect && "border-success/30 bg-success/[0.06]",
                  chosen && !o.isCorrect && "border-destructive/25 bg-destructive/[0.05]",
                  !chosen && o.isCorrect && "border-dashed border-success/40"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    chosen ? (o.isCorrect ? "text-success" : "text-destructive") : o.isCorrect ? "text-success/70" : "text-muted-foreground/50"
                  )}
                />
                <span className="flex-1">{o.text}</span>
                {chosen && <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Elegida</span>}
                {!chosen && o.isCorrect && <span className="text-2xs font-semibold uppercase tracking-wider text-success">Correcta</span>}
              </li>
            );
          })}
        </ul>
      )}
      <p className={cn("text-xs font-semibold", q.autoCorrect ? "text-success" : "text-tas-crimson-dark")}>
        Calificación automática: {q.autoPoints ?? 0} / {q.points} {q.autoCorrect ? "· Correcta" : "· Incorrecta"}
      </p>
    </div>
  );
}
