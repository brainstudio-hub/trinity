"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCourse, deleteCourse } from "@/lib/actions/admin";
import { Course } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Trash2, Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface FAQ {
  question: string;
  answer: string;
}

export function CourseEditForm({ course }: { course: Course }) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description || "");
  const [professorName, setProfessorName] = useState(course.professorName || "");
  const [faqs, setFaqs] = useState<FAQ[]>(Array.isArray(course.faqs) ? (course.faqs as any) : []);
  const [isPublished, setIsPublished] = useState(course.isPublished);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateCourse(course.id, {
        title,
        description,
        professorName,
        faqs: faqs as any,
        isPublished
      });
      toast.success("Curso actualizado", { description: "Los detalles del curso se guardaron en la base de datos." });
    } catch (error: any) {
      toast.error("Error al guardar", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const removeFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const updateFaq = (index: number, field: keyof FAQ, value: string) => {
    const newFaqs = [...faqs];
    newFaqs[index][field] = value;
    setFaqs(newFaqs);
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Nombre del Profesor</label>
          <Input value={professorName} onChange={(e) => setProfessorName(e.target.value)} placeholder="Ej: Dr. Alistair McGrath" />
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-bold">Preguntas Frecuentes (FAQs)</Label>
            <Button type="button" variant="outline" size="sm" onClick={addFaq} className="rounded-lg">
              <Plus className="h-4 w-4 mr-1" /> Añadir Pregunta
            </Button>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative space-y-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFaq(index)}
                  className="absolute top-2 right-2 text-slate-400 hover:text-error"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pregunta</Label>
                  <Input
                    value={faq.question}
                    onChange={(e) => updateFaq(index, "question", e.target.value)}
                    placeholder="¿Cuál es el requisito para este curso?"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Respuesta</Label>
                  <textarea
                    className="w-full p-2 border rounded-md min-h-[80px] text-sm bg-white"
                    value={faq.answer}
                    onChange={(e) => updateFaq(index, "answer", e.target.value)}
                    placeholder="Debes haber completado Griego I..."
                  />
                </div>
              </div>
            ))}
            {faqs.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-4 italic">No hay FAQs configuradas.</p>
            )}
          </div>
        </div>

        <Separator className="my-6" />
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
