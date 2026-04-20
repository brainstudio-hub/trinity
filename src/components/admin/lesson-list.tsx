"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateLesson, deleteLesson } from "@/lib/actions/admin";
import { Lesson } from "@prisma/client";
import { Pencil, Trash2, X, Check } from "lucide-react";

export function LessonList({ lessons, courseId }: { lessons: Lesson[], courseId: string }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const startEdit = (lesson: Lesson) => {
    setEditingId(lesson.id);
    setEditTitle(lesson.title);
    setEditUrl(lesson.videoUrl);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const onSave = async (id: string) => {
    setLoading(true);
    await updateLesson(id, { title: editTitle, videoUrl: editUrl });
    setEditingId(null);
    setLoading(false);
  };

  const onDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta lección?")) {
      setLoading(true);
      await deleteLesson(id);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {lessons.map((lesson) => (
        <div key={lesson.id} className="p-4 border rounded-lg bg-white shadow-sm">
          {editingId === lesson.id ? (
            <div className="space-y-3">
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Título" />
              <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="Video URL" />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onSave(lesson.id)} disabled={loading}>
                  <Check className="h-4 w-4 mr-1" /> Guardar
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold mr-2">{lesson.order}.</span>
                <span>{lesson.title}</span>
                <p className="text-xs text-muted-foreground truncate max-w-[200px] md:max-w-xs">{lesson.videoUrl}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => startEdit(lesson)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(lesson.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
      {lessons.length === 0 && <p className="text-sm text-muted-foreground italic">No hay lecciones aún.</p>}
    </div>
  );
}
