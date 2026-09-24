"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Award,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Download,
  ExternalLink,
  FileText,
  Link2,
  ListTree,
  NotebookPen,
  Star,
} from "lucide-react";
import type { LessonType, Note, Resource } from "@prisma/client";
import { setLessonCompleteAction, toggleBookmarkAction } from "@/lib/actions/learning";
import { supportsTimeSync, type VideoSource } from "@/lib/domain/video";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger, Tooltip } from "@/components/ui/overlay";
import { Crest } from "@/components/brand";
import { LESSON_TYPE_LABEL } from "@/components/course/lesson-type-icon";
import { cn } from "@/lib/utils";
import { PlayerProvider } from "./player-context";
import { VideoPlayer } from "./video-player";
import { NotesPanel } from "./notes-panel";
import { Curriculum } from "./curriculum";
import { QuizRunner } from "./quiz-runner";
import { Discussion, type DiscussionComment } from "./discussion";
import { ReviewDialog } from "./review-dialog";

export type ClassroomProps = {
  course: {
    id: string;
    slug: string;
    title: string;
    modules: {
      id: string;
      title: string;
      lessons: { id: string; title: string; type: LessonType; durationSeconds: number; isFreePreview: boolean }[];
    }[];
  };
  lesson: {
    id: string;
    title: string;
    summary: string | null;
    type: LessonType;
    moduleTitle: string;
    contentHtml: React.ReactNode | null;
    transcriptHtml: React.ReactNode | null;
    resources: Resource[];
    video: VideoSource | null;
    quiz: React.ComponentProps<typeof QuizRunner>["quiz"] | null;
  };
  enrolled: boolean;
  isStaff: boolean;
  userId: string;
  progress: { lessonId: string; isCompleted: boolean; lastPositionSeconds: number; watchedSeconds: number }[];
  summary: { completed: number; total: number; percent: number; isComplete: boolean };
  notes: Note[];
  isBookmarked: boolean;
  attempts: React.ComponentProps<typeof QuizRunner>["attempts"];
  comments: DiscussionComment[];
  prevLessonId: string | null;
  nextLessonId: string | null;
  position: { index: number; total: number };
  certificateCode: string | null;
  myReview: { rating: number; comment: string | null } | null;
  userMenu: React.ReactNode;
  /** Segundo inicial explícito (p. ej. desde una nota: ?t=123) */
  startAtOverride?: number | null;
};

export function Classroom(p: ClassroomProps) {
  const router = useRouter();
  const current = p.progress.find((x) => x.lessonId === p.lesson.id);
  const [completedIds, setCompletedIds] = React.useState(() => p.progress.filter((x) => x.isCompleted).map((x) => x.lessonId));
  const [bookmarked, setBookmarked] = React.useState(p.isBookmarked);
  const [pending, start] = React.useTransition();
  const isDone = completedIds.includes(p.lesson.id);

  React.useEffect(() => {
    setCompletedIds(p.progress.filter((x) => x.isCompleted).map((x) => x.lessonId));
  }, [p.progress]);

  const percent = Math.floor((completedIds.length / Math.max(1, p.summary.total)) * 100);
  const syncable = !!p.lesson.video && supportsTimeSync(p.lesson.video.provider);

  const markDone = (value: boolean) =>
    start(async () => {
      const res = await setLessonCompleteAction(p.lesson.id, value);
      if (!res.ok) return void toast.error(res.error);
      setCompletedIds((prev) => (value ? Array.from(new Set([...prev, p.lesson.id])) : prev.filter((x) => x !== p.lesson.id)));
      if (res.data?.certificateCode) {
        toast.success("¡Completaste el curso! Tu certificado está listo.");
      } else if (value && p.nextLessonId) {
        toast.success("Lección completada", {
          action: { label: "Siguiente", onClick: () => router.push(`/aprender/${p.course.slug}/${p.nextLessonId}`) },
        });
      }
      router.refresh();
    });

  const onAutoCompleted = React.useCallback(
    (certificateCode?: string | null) => {
      setCompletedIds((prev) => Array.from(new Set([...prev, p.lesson.id])));
      if (certificateCode) toast.success("¡Completaste el curso! Tu certificado está listo.");
      router.refresh();
    },
    [p.lesson.id, router]
  );

  const sidePanel = (
    <Tabs defaultValue="contenido" className="flex h-full flex-col">
      <TabsList className="shrink-0 gap-0 px-2">
        <TabsTrigger value="contenido" className="flex-1 justify-center">
          <ListTree /> Contenido
        </TabsTrigger>
        <TabsTrigger value="notas" className="flex-1 justify-center">
          <NotebookPen /> Notas
          {p.notes.length > 0 && <span className="rounded-full bg-secondary px-1.5 text-2xs">{p.notes.length}</span>}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="contenido" className="min-h-0 flex-1 overflow-y-auto pt-0 scrollbar-thin">
        {p.certificateCode && (
          <Link
            href={`/certificados/${p.certificateCode}`}
            className="m-4 flex items-center gap-3 rounded-lg border border-tas-gold/40 bg-tas-gold-soft/60 p-3.5 text-sm transition hover:bg-tas-gold-soft"
          >
            <Award className="size-5 text-[#7A5600]" />
            <span className="flex-1 font-semibold text-tas-navy">¡Curso completado! Ver certificado</span>
            <ChevronRight className="size-4" />
          </Link>
        )}
        <Curriculum
          slug={p.course.slug}
          modules={p.course.modules}
          currentLessonId={p.lesson.id}
          completedIds={completedIds}
          enrolled={p.enrolled || p.isStaff}
        />
      </TabsContent>
      <TabsContent value="notas" className="min-h-0 flex-1 pt-0">
        <NotesPanel lessonId={p.lesson.id} initialNotes={p.notes} canWrite={p.enrolled || p.isStaff} />
      </TabsContent>
    </Tabs>
  );

  const resourceIcon = (kind: string) =>
    kind === "PDF" ? <FileText className="size-4 text-tas-crimson" /> : kind === "LINK" ? <Link2 className="size-4 text-tas-blue" /> : <Download className="size-4 text-muted-foreground" />;

  return (
    <PlayerProvider syncable={syncable}>
      <div className="flex min-h-screen flex-col lg:h-screen">
        {/* Barra superior */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-surface px-3 md:px-5">
          <Tooltip content="Volver al curso">
            <Link href={`/cursos/${p.course.slug}`} className="flex items-center gap-2 rounded-md p-1.5 hover:bg-secondary">
              <ChevronLeft className="size-4 text-muted-foreground" />
              <Crest size={22} />
            </Link>
          </Tooltip>
          <div className="h-6 w-px bg-border" />
          <p className="min-w-0 flex-1 truncate font-serif text-lg text-tas-navy">{p.course.title}</p>
          {p.enrolled && (
            <div className="hidden items-center gap-3 md:flex">
              <div className="w-36">
                <Progress value={percent} tone={percent === 100 ? "success" : "navy"} />
              </div>
              <span className="text-xs font-semibold tabular-nums">{percent}%</span>
            </div>
          )}
          {p.enrolled && (
            <ReviewDialog
              courseId={p.course.id}
              initial={p.myReview}
              trigger={
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Star /> Calificar
                </Button>
              }
            />
          )}
          {p.userMenu}
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Contenido principal */}
          <main className="min-w-0 flex-1 lg:overflow-y-auto scrollbar-thin">
            {p.lesson.type === "VIDEO" && (
              <div className="bg-tas-navy-deep">
                <div className="mx-auto max-w-[1100px]">
                  <VideoPlayer
                    lessonId={p.lesson.id}
                    source={p.lesson.video}
                    startAt={p.startAtOverride ?? current?.lastPositionSeconds ?? 0}
                    initialWatched={current?.watchedSeconds ?? 0}
                    alreadyCompleted={isDone && p.startAtOverride == null}
                    enrolled={p.enrolled}
                    onCompleted={onAutoCompleted}
                  />
                </div>
              </div>
            )}

            <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-8 md:py-8">
              <div className="flex flex-col gap-5 border-b pb-6 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="eyebrow">
                    {p.lesson.moduleTitle} · {LESSON_TYPE_LABEL[p.lesson.type]} · Lección {p.position.index} de {p.position.total}
                  </p>
                  <h1 className="display mt-2 text-3xl leading-tight md:text-[2.25rem]">{p.lesson.title}</h1>
                  {p.lesson.summary && <p className="mt-2 text-sm text-muted-foreground">{p.lesson.summary}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {p.enrolled && (
                    <Tooltip content={bookmarked ? "Quitar de guardados" : "Guardar lección"}>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Guardar lección"
                        onClick={async () => {
                          setBookmarked((b) => !b);
                          const res = await toggleBookmarkAction(p.lesson.id);
                          if (!res.ok) {
                            setBookmarked((b) => !b);
                            toast.error(res.error);
                          }
                        }}
                      >
                        {bookmarked ? <BookmarkCheck className="text-tas-crimson" /> : <Bookmark />}
                      </Button>
                    </Tooltip>
                  )}
                  {p.enrolled && (p.lesson.type === "VIDEO" || p.lesson.type === "READING") && (
                    <Button variant={isDone ? "secondary" : "default"} loading={pending} onClick={() => markDone(!isDone)}>
                      {isDone ? <CheckCircle2 className="text-success" /> : <Circle />}
                      {isDone ? "Completada" : "Marcar como completada"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Evaluaciones */}
              {p.lesson.quiz && (p.lesson.type === "QUIZ" || p.lesson.type === "ASSIGNMENT") && (
                <div className="py-8">
                  {p.lesson.contentHtml && <div className="mb-6">{p.lesson.contentHtml}</div>}
                  <QuizRunner
                    lessonId={p.lesson.id}
                    isAssignment={p.lesson.type === "ASSIGNMENT"}
                    enrolled={p.enrolled}
                    quiz={p.lesson.quiz}
                    attempts={p.attempts}
                    onCompleted={(code) => onAutoCompleted(code)}
                  />
                </div>
              )}

              {/* Lectura */}
              {p.lesson.type === "READING" && p.lesson.contentHtml && <div className="py-8">{p.lesson.contentHtml}</div>}

              <Tabs defaultValue={p.lesson.type === "VIDEO" && p.lesson.contentHtml ? "bosquejo" : p.lesson.resources.length ? "recursos" : "preguntas"} className="mt-6">
                <TabsList>
                  {p.lesson.type === "VIDEO" && p.lesson.contentHtml && <TabsTrigger value="bosquejo">Bosquejo de la clase</TabsTrigger>}
                  {p.lesson.resources.length > 0 && <TabsTrigger value="recursos">Recursos ({p.lesson.resources.length})</TabsTrigger>}
                  <TabsTrigger value="preguntas">Preguntas ({p.comments.length})</TabsTrigger>
                  {p.lesson.transcriptHtml && <TabsTrigger value="transcripcion">Transcripción</TabsTrigger>}
                </TabsList>
                {p.lesson.type === "VIDEO" && p.lesson.contentHtml && (
                  <TabsContent value="bosquejo">
                    <div className="rounded-xl border bg-card p-6 md:p-8">{p.lesson.contentHtml}</div>
                  </TabsContent>
                )}
                {p.lesson.resources.length > 0 && (
                  <TabsContent value="recursos">
                    <ul className="divide-y rounded-xl border bg-card">
                      {p.lesson.resources.map((r) => (
                        <li key={r.id}>
                          <a href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-3.5 text-sm transition hover:bg-secondary/40">
                            {resourceIcon(r.kind)}
                            <span className="flex-1 font-medium">{r.title}</span>
                            <ExternalLink className="size-3.5 text-muted-foreground" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </TabsContent>
                )}
                <TabsContent value="preguntas">
                  <Discussion
                    lessonId={p.lesson.id}
                    comments={p.comments}
                    currentUserId={p.userId}
                    isStaff={p.isStaff}
                    canPost={p.enrolled || p.isStaff}
                  />
                </TabsContent>
                {p.lesson.transcriptHtml && (
                  <TabsContent value="transcripcion">
                    <div className="rounded-xl border bg-card p-6 text-sm leading-relaxed">{p.lesson.transcriptHtml}</div>
                  </TabsContent>
                )}
              </Tabs>

              {/* Navegación */}
              <nav className="mt-10 flex items-center justify-between gap-3 border-t pt-6">
                {p.prevLessonId ? (
                  <Button asChild variant="outline">
                    <Link href={`/aprender/${p.course.slug}/${p.prevLessonId}`}><ChevronLeft /> Anterior</Link>
                  </Button>
                ) : <span />}
                {p.nextLessonId ? (
                  <Button asChild>
                    <Link href={`/aprender/${p.course.slug}/${p.nextLessonId}`}>Siguiente lección <ChevronRight /></Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link href="/mis-cursos">Terminar</Link>
                  </Button>
                )}
              </nav>
            </div>
          </main>

          {/* Panel lateral */}
          <aside className={cn("flex h-[70vh] shrink-0 flex-col border-t bg-surface lg:h-auto lg:w-[380px] lg:border-l lg:border-t-0")}>
            {sidePanel}
          </aside>
        </div>
      </div>
    </PlayerProvider>
  );
}
