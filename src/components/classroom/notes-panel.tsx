"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Clock, MoreHorizontal, NotebookPen, Pencil, Trash2, X } from "lucide-react";
import type { Note } from "@prisma/client";
import { createNoteAction, deleteNoteAction, updateNoteAction } from "@/lib/actions/learning";
import { formatTimestamp } from "@/lib/domain/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/overlay";
import { cn } from "@/lib/utils";
import { usePlayer } from "./player-context";

export function NotesPanel({ lessonId, initialNotes, canWrite }: { lessonId: string; initialNotes: Note[]; canWrite: boolean }) {
  const { syncable, currentTime, getCurrentTime, seekTo, pause } = usePlayer();
  const [notes, setNotes] = React.useState(initialNotes);
  const [draft, setDraft] = React.useState("");
  const [pinnedTime, setPinnedTime] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState("");
  const listEnd = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setNotes(initialNotes), [initialNotes]);

  // Al empezar a escribir, se fija el minuto del video (y se pausa para no perder el hilo).
  const onFocus = () => {
    if (!syncable) return;
    if (pinnedTime === null) setPinnedTime(Math.floor(getCurrentTime()));
  };

  const save = async () => {
    const content = draft.trim();
    if (!content) return;
    setSaving(true);
    const ts = syncable ? pinnedTime ?? Math.floor(getCurrentTime()) : null;
    const res = await createNoteAction({ lessonId, content, timestampSeconds: ts });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const created = res.data as Note;
    setNotes((prev) =>
      [...prev, created].sort((a, b) => (a.timestampSeconds ?? -1) - (b.timestampSeconds ?? -1))
    );
    setDraft("");
    setPinnedTime(null);
    toast.success("Nota guardada");
    requestAnimationFrame(() => listEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  const saveEdit = async (id: string) => {
    const res = await updateNoteAction(id, editText);
    if (!res.ok) return toast.error(res.error);
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, content: editText.trim() } : n)));
    setEditing(null);
  };

  const remove = async (id: string) => {
    const prev = notes;
    setNotes((n) => n.filter((x) => x.id !== id));
    const res = await deleteNoteAction(id);
    if (!res.ok) {
      setNotes(prev);
      toast.error(res.error);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {canWrite ? (
        <div className="border-b p-4">
          <div className="rounded-lg border bg-surface focus-within:border-tas-blue focus-within:ring-2 focus-within:ring-tas-blue/15">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={onFocus}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  void save();
                }
              }}
              placeholder={syncable ? "Escribe una nota sobre este momento de la clase…" : "Escribe una nota sobre esta lección…"}
              className="min-h-[88px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
              aria-label="Nueva nota"
            />
            <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
              {syncable ? (
                <button
                  type="button"
                  onClick={() => setPinnedTime(Math.floor(getCurrentTime()))}
                  className="inline-flex items-center gap-1.5 rounded-full bg-tas-navy/[0.06] px-2.5 py-1 text-xs font-semibold tabular-nums text-tas-navy transition hover:bg-tas-navy/10"
                  title="Actualizar al minuto actual"
                >
                  <Clock className="size-3.5" />
                  {formatTimestamp(pinnedTime ?? currentTime)}
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">Nota general</span>
              )}
              <div className="flex items-center gap-1">
                {syncable && (
                  <Button type="button" size="sm" variant="ghost" onClick={pause} className="hidden text-xs sm:inline-flex">
                    Pausar video
                  </Button>
                )}
                <Button size="sm" onClick={save} loading={saving} disabled={!draft.trim()}>
                  Guardar
                </Button>
              </div>
            </div>
          </div>
          <p className="mt-2 text-2xs text-muted-foreground">Ctrl + Enter para guardar · Tus notas son privadas</p>
        </div>
      ) : (
        <p className="border-b p-4 text-sm text-muted-foreground">Inscríbete en el curso para tomar notas.</p>
      )}

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <NotebookPen className="size-8 text-tas-stone" strokeWidth={1.4} />
            <p className="mt-3 text-sm font-semibold">Aún no tienes notas en esta lección</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {syncable
                ? "Cada nota guarda el minuto del video. Haz clic en el tiempo para volver a ese momento."
                : "Anota ideas, preguntas y referencias mientras estudias."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {notes.map((n) => {
              const active = syncable && n.timestampSeconds !== null && Math.abs(currentTime - n.timestampSeconds) < 4;
              return (
                <li
                  key={n.id}
                  className={cn(
                    "group rounded-lg border bg-surface p-3.5 transition",
                    active && "border-tas-gold/60 bg-tas-gold-soft/40"
                  )}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    {n.timestampSeconds !== null ? (
                      <button
                        onClick={() => seekTo(n.timestampSeconds!)}
                        disabled={!syncable}
                        className="inline-flex items-center gap-1 rounded-full bg-tas-navy px-2 py-0.5 text-2xs font-semibold tabular-nums text-tas-cream transition hover:bg-tas-blue disabled:opacity-70"
                        title="Ir a este momento"
                      >
                        <Clock className="size-3" />
                        {formatTimestamp(n.timestampSeconds)}
                      </button>
                    ) : (
                      <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">General</span>
                    )}
                    {canWrite && editing !== n.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-secondary group-hover:opacity-100 focus:opacity-100" aria-label="Opciones de la nota">
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => { setEditing(n.id); setEditText(n.content); }}>
                            <Pencil /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem destructive onSelect={() => remove(n.id)}>
                            <Trash2 /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  {editing === n.id ? (
                    <div className="space-y-2">
                      <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[72px] text-sm" autoFocus />
                      <div className="flex justify-end gap-1">
                        <Button size="icon-sm" variant="ghost" onClick={() => setEditing(null)} aria-label="Cancelar"><X /></Button>
                        <Button size="icon-sm" onClick={() => saveEdit(n.id)} aria-label="Guardar cambios"><Check /></Button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{n.content}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div ref={listEnd} />
      </div>
    </div>
  );
}
