"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileCheck2,
  Hourglass,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { getAttemptReviewAction, submitQuizAction, type AttemptReview } from "@/lib/actions/learning";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Badge, Progress } from "@/components/ui/primitives";
import { cn, formatDate } from "@/lib/utils";
import { formatTimestamp } from "@/lib/domain/format";

type QuizQuestion = {
  id: string;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY";
  prompt: string;
  points: number;
  options: { id: string; text: string }[];
};

type AttemptSummary = { id: string; status: "IN_PROGRESS" | "SUBMITTED" | "GRADED"; score: number | null; passed: boolean | null; submittedAt: Date | null };

type Answers = Record<string, { selectedOptionIds?: string[]; textAnswer?: string }>;

const TYPE_HINT: Record<QuizQuestion["type"], string> = {
  SINGLE_CHOICE: "Selecciona una respuesta",
  MULTIPLE_CHOICE: "Selecciona todas las que apliquen",
  TRUE_FALSE: "Verdadero o falso",
  SHORT_ANSWER: "Respuesta corta",
  ESSAY: "Respuesta desarrollada",
};

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function QuizRunner({
  lessonId,
  isAssignment,
  enrolled,
  quiz,
  attempts,
  onCompleted,
}: {
  lessonId: string;
  isAssignment: boolean;
  enrolled: boolean;
  quiz: {
    instructions: string | null;
    passingScore: number;
    maxAttempts: number | null;
    timeLimitMinutes: number | null;
    shuffleQuestions: boolean;
    questions: QuizQuestion[];
  };
  attempts: AttemptSummary[];
  onCompleted: (certificateCode: string | null) => void;
}) {
  const router = useRouter();
  const draftKey = `trinity:quiz-draft:${lessonId}`;
  const [mode, setMode] = React.useState<"intro" | "taking" | "review">("intro");
  const [order, setOrder] = React.useState(quiz.questions);
  const [answers, setAnswers] = React.useState<Answers>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [review, setReview] = React.useState<AttemptReview | null>(null);
  const [deadline, setDeadline] = React.useState<number | null>(null);
  const [now, setNow] = React.useState(Date.now());

  const submitted = attempts.filter((a) => a.status !== "IN_PROGRESS");
  const remaining = quiz.maxAttempts ? quiz.maxAttempts - submitted.length : null;
  const best = submitted.reduce<number | null>((m, a) => (a.score !== null && (m === null || a.score > m) ? a.score : m), null);
  const pendingReview = submitted.some((a) => a.status === "SUBMITTED");
  const passedAny = submitted.some((a) => a.passed);

  // Borrador local para tareas largas
  React.useEffect(() => {
    if (mode !== "taking" || !isAssignment) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify(answers));
    } catch {}
  }, [answers, mode, isAssignment, draftKey]);

  // Temporizador
  React.useEffect(() => {
    if (!deadline || mode !== "taking") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadline, mode]);

  const secondsLeft = deadline ? Math.max(0, Math.round((deadline - now) / 1000)) : null;

  const start = () => {
    setOrder(quiz.shuffleQuestions ? shuffled(quiz.questions) : quiz.questions);
    let restored: Answers = {};
    if (isAssignment) {
      try {
        restored = JSON.parse(localStorage.getItem(draftKey) ?? "{}");
      } catch {}
    }
    setAnswers(restored);
    if (quiz.timeLimitMinutes) setDeadline(Date.now() + quiz.timeLimitMinutes * 60_000);
    setMode("taking");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openReview = async (attemptId: string) => {
    const res = await getAttemptReviewAction(attemptId);
    if (!res.ok || !res.data) return toast.error(res.ok ? "No se pudo cargar." : res.error);
    setReview(res.data);
    setMode("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const answeredCount = order.filter((q) => {
    const a = answers[q.id];
    return (a?.selectedOptionIds?.length ?? 0) > 0 || (a?.textAnswer?.trim().length ?? 0) > 0;
  }).length;

  const submit = React.useCallback(
    async (auto = false) => {
      if (!auto && answeredCount < order.length) {
        const ok = window.confirm(`Tienes ${order.length - answeredCount} pregunta(s) sin responder. ¿Enviar de todas formas?`);
        if (!ok) return;
      }
      setSubmitting(true);
      const res = await submitQuizAction({ lessonId, answers });
      setSubmitting(false);
      if (!res.ok || !res.data) {
        toast.error(res.ok ? "No se pudo enviar." : res.error);
        return;
      }
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      setDeadline(null);
      const d = res.data;
      if (d.needsManualGrading) toast.success(isAssignment ? "Entrega recibida. Tu docente la revisará." : "Respuestas enviadas.");
      else if (d.passed) toast.success(`¡Aprobado! Obtuviste ${d.score}`);
      else toast(`Obtuviste ${d.score}. Necesitas ${quiz.passingScore} para aprobar.`);
      if (d.passed || (d.needsManualGrading && isAssignment)) onCompleted(d.certificateCode);
      await openReview(d.attemptId);
      router.refresh();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answers, answeredCount, order.length, lessonId]
  );

  // Envío automático al agotar el tiempo
  React.useEffect(() => {
    if (mode === "taking" && secondsLeft === 0 && !submitting) {
      toast.warning("Se acabó el tiempo. Enviando tus respuestas…");
      void submit(true);
    }
  }, [secondsLeft, mode, submitting, submit]);

  // ── Revisión ────────────────────────────────────────────────
  if (mode === "review" && review) {
    return <AttemptReviewView review={review} isAssignment={isAssignment} passingScore={quiz.passingScore} onBack={() => setMode("intro")} />;
  }

  // ── Presentando ─────────────────────────────────────────────
  if (mode === "taking") {
    return (
      <div className="space-y-6">
        <div className="sticky top-16 z-10 -mx-4 flex items-center gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
          <div className="flex-1">
            <div className="mb-1.5 flex justify-between text-xs font-semibold">
              <span>{answeredCount} de {order.length} respondidas</span>
              {secondsLeft !== null && (
                <span className={cn("inline-flex items-center gap-1 tabular-nums", secondsLeft < 60 && "text-destructive")}>
                  <Clock className="size-3.5" /> {formatTimestamp(secondsLeft)}
                </span>
              )}
            </div>
            <Progress value={(answeredCount / Math.max(1, order.length)) * 100} />
          </div>
          <Button onClick={() => submit()} loading={submitting}>
            {isAssignment ? "Entregar" : "Enviar respuestas"}
          </Button>
        </div>

        <ol className="space-y-5">
          {order.map((q, i) => (
            <li key={q.id} className="rounded-xl border bg-card p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pregunta {i + 1} · {TYPE_HINT[q.type]}
                </p>
                <span className="shrink-0 text-xs text-muted-foreground">{q.points} {q.points === 1 ? "punto" : "puntos"}</span>
              </div>
              <p className="whitespace-pre-line text-[0.9375rem] font-medium leading-relaxed">{q.prompt}</p>
              <div className="mt-4">
                <QuestionInput
                  question={q}
                  value={answers[q.id]}
                  onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                />
              </div>
            </li>
          ))}
        </ol>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => { if (window.confirm("¿Salir sin enviar? Perderás las respuestas de este intento.")) setMode("intro"); }}>
            Cancelar
          </Button>
          <Button size="lg" onClick={() => submit()} loading={submitting}>
            {isAssignment ? "Entregar guía" : "Enviar respuestas"}
          </Button>
        </div>
      </div>
    );
  }

  // ── Introducción ────────────────────────────────────────────
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between md:p-8">
        <div className="max-w-xl">
          <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-tas-navy/[0.06] text-tas-navy">
            {isAssignment ? <FileCheck2 className="size-5" /> : <Award className="size-5" />}
          </div>
          <p className="font-serif text-2xl text-tas-navy">{isAssignment ? "Guía de estudio para entregar" : "Cuestionario"}</p>
          {quiz.instructions && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{quiz.instructions}</p>}
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            <div><dt className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Preguntas</dt><dd className="mt-0.5 font-semibold">{quiz.questions.length}</dd></div>
            <div><dt className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Para aprobar</dt><dd className="mt-0.5 font-semibold">{quiz.passingScore}%</dd></div>
            <div><dt className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Intentos</dt><dd className="mt-0.5 font-semibold">{quiz.maxAttempts ? `${submitted.length} de ${quiz.maxAttempts}` : "Ilimitados"}</dd></div>
            {quiz.timeLimitMinutes && <div><dt className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Tiempo</dt><dd className="mt-0.5 font-semibold">{quiz.timeLimitMinutes} min</dd></div>}
          </dl>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 md:w-56">
          {!enrolled ? (
            <p className="text-sm text-muted-foreground">Inscríbete en el curso para presentar esta evaluación.</p>
          ) : remaining !== null && remaining <= 0 ? (
            <p className="rounded-md bg-secondary p-3 text-sm text-muted-foreground">Usaste todos los intentos disponibles.</p>
          ) : isAssignment && (pendingReview || passedAny) ? (
            <Button variant="outline" onClick={start}>Enviar una nueva versión</Button>
          ) : (
            <Button size="lg" onClick={start}>
              {submitted.length ? <><RotateCcw /> Intentar de nuevo</> : isAssignment ? "Responder la guía" : "Comenzar"}
            </Button>
          )}
          {best !== null && (
            <p className="text-center text-xs text-muted-foreground">
              Mejor calificación: <span className="font-semibold text-foreground">{best}</span>
            </p>
          )}
        </div>
      </div>

      {submitted.length > 0 && (
        <div className="border-t px-6 py-5 md:px-8">
          <p className="mb-3 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Tus intentos</p>
          <ul className="divide-y rounded-lg border">
            {submitted.map((a, i) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                {a.status === "SUBMITTED" ? (
                  <Hourglass className="size-4 text-tas-gold" />
                ) : a.passed ? (
                  <CheckCircle2 className="size-4 text-success" />
                ) : (
                  <XCircle className="size-4 text-destructive" />
                )}
                <span className="flex-1">
                  {isAssignment ? "Entrega" : "Intento"} {submitted.length - i}
                  {a.submittedAt && <span className="text-muted-foreground"> · {formatDate(a.submittedAt)}</span>}
                </span>
                {a.status === "SUBMITTED" ? (
                  <Badge variant="gold">Pendiente de calificación</Badge>
                ) : (
                  <Badge variant={a.passed ? "success" : "accent"}>{a.score} / 100</Badge>
                )}
                <button onClick={() => openReview(a.id)} className="text-xs font-semibold text-tas-blue hover:underline">
                  Revisar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: QuizQuestion;
  value: Answers[string] | undefined;
  onChange: (v: Answers[string]) => void;
}) {
  if (question.type === "ESSAY" || question.type === "SHORT_ANSWER") {
    return question.type === "ESSAY" ? (
      <Textarea
        value={value?.textAnswer ?? ""}
        onChange={(e) => onChange({ textAnswer: e.target.value })}
        placeholder="Escribe tu respuesta…"
        className="min-h-[140px]"
      />
    ) : (
      <input
        value={value?.textAnswer ?? ""}
        onChange={(e) => onChange({ textAnswer: e.target.value })}
        placeholder="Tu respuesta"
        className="h-10 w-full rounded-md border border-input bg-surface px-3 text-sm focus-visible:border-tas-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tas-blue/15"
      />
    );
  }
  const multiple = question.type === "MULTIPLE_CHOICE";
  const selected = new Set(value?.selectedOptionIds ?? []);
  return (
    <div className="grid gap-2" role={multiple ? "group" : "radiogroup"}>
      {question.options.map((o, i) => {
        const checked = selected.has(o.id);
        return (
          <label
            key={o.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition",
              checked ? "border-tas-navy bg-tas-navy/[0.04] ring-1 ring-tas-navy" : "hover:border-tas-navy/30 hover:bg-secondary/40"
            )}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={question.id}
              checked={checked}
              onChange={() => {
                if (multiple) {
                  const next = new Set(selected);
                  if (checked) next.delete(o.id);
                  else next.add(o.id);
                  onChange({ selectedOptionIds: Array.from(next) });
                } else {
                  onChange({ selectedOptionIds: [o.id] });
                }
              }}
              className="sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center border text-[0.65rem] font-bold transition",
                multiple ? "rounded" : "rounded-full",
                checked ? "border-tas-navy bg-tas-navy text-tas-cream" : "border-input text-muted-foreground"
              )}
            >
              {question.type === "TRUE_FALSE" ? "" : String.fromCharCode(65 + i)}
            </span>
            <span className="leading-relaxed">{o.text}</span>
          </label>
        );
      })}
    </div>
  );
}

function AttemptReviewView({
  review,
  isAssignment,
  passingScore,
  onBack,
}: {
  review: AttemptReview;
  isAssignment: boolean;
  passingScore: number;
  onBack: () => void;
}) {
  const pending = review.status === "SUBMITTED";
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm font-semibold text-tas-blue hover:underline">
        <ChevronLeft className="size-4" /> Volver
      </button>

      <div
        className={cn(
          "flex flex-col gap-4 rounded-xl border p-6 sm:flex-row sm:items-center",
          pending ? "border-tas-gold/40 bg-tas-gold-soft/40" : review.passed ? "border-success/30 bg-success/[0.05]" : "border-destructive/20 bg-destructive/[0.04]"
        )}
      >
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface shadow-soft">
          {pending ? <Hourglass className="size-6 text-[#7A5600]" /> : review.passed ? <CheckCircle2 className="size-6 text-success" /> : <AlertTriangle className="size-6 text-destructive" />}
        </div>
        <div className="flex-1">
          <p className="font-serif text-2xl text-tas-navy">
            {pending ? (isAssignment ? "Entrega recibida" : "Pendiente de calificación") : review.passed ? "¡Aprobado!" : "Aún no alcanzas el puntaje mínimo"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {pending
              ? "Tu docente revisará tus respuestas. Recibirás la calificación y comentarios en esta misma página."
              : `Calificación: ${review.score} / 100 · Mínimo para aprobar: ${passingScore}`}
          </p>
        </div>
        {!pending && <p className="font-serif text-5xl tabular-nums text-tas-navy">{review.score}</p>}
      </div>

      <ol className="space-y-4">
        {review.questions.map((q, i) => {
          const isChoice = q.options.length > 0;
          const correct = q.pointsAwarded !== null && q.pointsAwarded >= q.points;
          return (
            <li key={q.id} className="rounded-xl border bg-card p-6">
              <div className="mb-3 flex items-start justify-between gap-4">
                <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Pregunta {i + 1}</p>
                {q.pointsAwarded !== null ? (
                  <Badge variant={correct ? "success" : q.pointsAwarded > 0 ? "gold" : "accent"}>
                    {q.pointsAwarded} / {q.points}
                  </Badge>
                ) : (
                  <Badge variant="muted">Por calificar</Badge>
                )}
              </div>
              <p className="whitespace-pre-line text-[0.9375rem] font-medium leading-relaxed">{q.prompt}</p>
              {isChoice ? (
                <ul className="mt-4 grid gap-2">
                  {q.options.map((o) => (
                    <li
                      key={o.id}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border px-4 py-2.5 text-sm",
                        o.isCorrect === true && "border-success/40 bg-success/[0.06]",
                        o.selected && o.isCorrect === false && "border-destructive/30 bg-destructive/[0.05]",
                        o.selected && o.isCorrect === null && "border-tas-navy/40 bg-tas-navy/[0.04]"
                      )}
                    >
                      {o.isCorrect === true ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      ) : o.selected && o.isCorrect === false ? (
                        <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                      ) : (
                        <span className={cn("mt-0.5 size-4 shrink-0 rounded-full border", o.selected && "border-4 border-tas-navy")} />
                      )}
                      <span className="flex-1">{o.text}</span>
                      {o.selected && <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Tu respuesta</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-4 whitespace-pre-wrap rounded-lg bg-secondary/60 p-4 text-sm leading-relaxed">
                  {q.textAnswer || <span className="italic text-muted-foreground">Sin respuesta</span>}
                </div>
              )}
              {q.explanation && (
                <p className="mt-4 border-l-2 border-tas-gold pl-3 text-sm leading-relaxed text-muted-foreground">{q.explanation}</p>
              )}
              {q.feedback && (
                <div className="mt-4 rounded-lg border border-tas-blue/20 bg-tas-blue/[0.04] p-4 text-sm">
                  <p className="mb-1 text-2xs font-semibold uppercase tracking-wider text-tas-blue">Comentario del docente</p>
                  <p className="whitespace-pre-wrap leading-relaxed">{q.feedback}</p>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
