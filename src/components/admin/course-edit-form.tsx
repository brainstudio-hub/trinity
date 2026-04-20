"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCourse, deleteCourse } from "@/lib/actions/admin";
import { Course } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function CourseEditForm({ course }: { course: Course }) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description || "");
  const [isPublished, setIsPublished] = useState(course.isPublished);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await updateCourse(course.id, { title, description, isPublished });
    setLoading(false);
    alert("Guardado");
  };

  const onDelete = async () => {
    if (confirm("¿Estás seguro de que quieres eliminar este curso? Esta acción no se puede deshacer.")) {
      setLoading(true);
      await deleteCourse(course.id);
      router.push("/admin");
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSave} className="space-y-4 bg-white p-6 border rounded-xl shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium">Título</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Descripción</label>
          <textarea
            className="w-full p-2 border rounded-md min-h-[100px] text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              id="published"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="published" className="text-sm font-medium">Publicado</label>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </form>

      <div className="bg-destructive/5 border border-destructive/20 p-6 rounded-xl">
        <h3 className="text-destructive font-bold mb-2">Zona de Peligro</h3>
        <p className="text-sm text-muted-foreground mb-4">Eliminar el curso borrará permanentemente todas sus lecciones e inscripciones.</p>
        <Button variant="destructive" size="sm" onClick={onDelete} disabled={loading}>
          <Trash2 className="h-4 w-4 mr-2" /> Eliminar Curso
        </Button>
      </div>
    </div>
  );
}
