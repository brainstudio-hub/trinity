"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ChevronDown, Lock } from "lucide-react";
import type { LessonType } from "@prisma/client";
import { LessonTypeIcon } from "@/components/course/lesson-type-icon";
import { formatTimestamp } from "@/lib/domain/format";
import { cn } from "@/lib/utils";

type Mod = {
  id: string;
  title: string;
  lessons: { id: string; title: string; type: LessonType; durationSeconds: number; isFreePreview: boolean }[];
};

export function Curriculum({
  slug,
  modules,
  currentLessonId,
  completedIds,
  enrolled,
}: {
  slug: string;
  modules: Mod[];
  currentLessonId: string;
  completedIds: string[];
  enrolled: boolean;
}) {
  const done = React.useMemo(() => new Set(completedIds), [completedIds]);
  const activeModule = modules.find((m) => m.lessons.some((l) => l.id === currentLessonId))?.id;
  const [open, setOpen] = React.useState<Set<string>>(() => new Set(activeModule ? [activeModule] : []));
  const currentRef = React.useRef<HTMLAnchorElement>(null);

  React.useEffect(() => {
    if (activeModule) setOpen((prev) => new Set(prev).add(activeModule));
    currentRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeModule, currentLessonId]);

  return (
    <div className="divide-y">
      {modules.map((m, mi) => {
        const isOpen = open.has(m.id);
        const completed = m.lessons.filter((l) => done.has(l.id)).length;
        return (
          <section key={m.id}>
            <button
              onClick={() =>
                setOpen((prev) => {
                  const next = new Set(prev);
                  if (next.has(m.id)) next.delete(m.id);
                  else next.add(m.id);
                  return next;
                })
              }
              className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-secondary/50"
              aria-expanded={isOpen}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {mi === 0 && m.title === "Antes de comenzar" ? "Introducción" : `Módulo ${mi}`}
                </span>
                <span className="mt-0.5 block text-sm font-semibold leading-snug">{m.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {completed} / {m.lessons.length} completadas
                </span>
              </span>
              <ChevronDown className={cn("mt-1 size-4 shrink-0 text-muted-foreground transition", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <ul className="pb-2">
                {m.lessons.map((l) => {
                  const current = l.id === currentLessonId;
                  const isDone = done.has(l.id);
                  const locked = !enrolled && !l.isFreePreview;
                  return (
                    <li key={l.id}>
                      <Link
                        ref={current ? currentRef : undefined}
                        href={locked ? `/cursos/${slug}` : `/aprender/${slug}/${l.id}`}
                        aria-current={current ? "page" : undefined}
                        className={cn(
                          "relative flex items-start gap-3 py-2.5 pl-4 pr-4 text-sm transition",
                          current ? "bg-tas-navy/[0.06] font-semibold text-tas-navy" : "text-foreground/85 hover:bg-secondary/60"
                        )}
                      >
                        {current && <span className="absolute inset-y-1 left-0 w-[3px] rounded-r bg-tas-crimson" />}
                        <span
                          className={cn(
                            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                            isDone ? "border-success bg-success text-white" : "border-input bg-surface text-muted-foreground"
                          )}
                        >
                          {isDone ? <Check className="size-3" strokeWidth={3} /> : locked ? <Lock className="size-2.5" /> : null}
                        </span>
                        <span className="min-w-0 flex-1 leading-snug">{l.title}</span>
                        <span className="mt-0.5 flex shrink-0 items-center gap-1.5 text-xs font-normal text-muted-foreground">
                          <LessonTypeIcon type={l.type} className="size-3.5" />
                          {l.durationSeconds > 0 && l.type === "VIDEO" && <span className="tabular-nums">{formatTimestamp(l.durationSeconds)}</span>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
