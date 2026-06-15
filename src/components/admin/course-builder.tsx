"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Video, FileText, Clock, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createModule, updateModule, deleteModule, createLesson, updateLesson, deleteLesson } from "@/lib/actions/admin";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CourseBuilderProps {
  courseId: string;
  initialModules: any[];
}

export function CourseBuilder({ courseId, initialModules }: CourseBuilderProps) {
  const router = useRouter();
  const [modules, setModules] = useState(initialModules);

  useEffect(() => {
    setModules(initialModules);
  }, [initialModules]);

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(
    initialModules.reduce((acc, m) => ({ ...acc, [m.id]: true }), {})
  );

  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const toggleModule = (id: string) => {
    setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Module Handlers
  const handleAddModule = () => {
    setEditingModule(null);
    setIsModuleModalOpen(true);
  };

  const handleEditModule = (m: any) => {
    setEditingModule(m);
    setIsModuleModalOpen(true);
  };

  const saveModule = async (formData: FormData) => {
    setLoading(true);
    try {
      const title = formData.get("title") as string;
      const order = parseInt(formData.get("order") as string);

      if (editingModule) {
        await updateModule(editingModule.id, { title, order });
      } else {
        await createModule(courseId, { title, order });
      }

      setIsModuleModalOpen(false);
      router.refresh();
    } catch (error: any) {
      alert("Error al guardar el módulo: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (confirm("¿Eliminar este módulo y todas sus lecciones?")) {
      try {
        await deleteModule(id);
        router.refresh();
      } catch (error: any) {
        alert("Error al eliminar el módulo: " + error.message);
      }
    }
  };

  // Lesson Handlers
  const handleAddLesson = (moduleId: string) => {
    setActiveModuleId(moduleId);
    setEditingLesson(null);
    setIsLessonModalOpen(true);
  };

  const handleEditLesson = (lesson: any, moduleId: string) => {
    setActiveModuleId(moduleId);
    // Convert duration to minutes for display in the form
    setEditingLesson({
      ...lesson,
      duration: Math.floor(lesson.duration / 60)
    });
    setIsLessonModalOpen(true);
  };

  const saveLesson = async (formData: FormData) => {
    setLoading(true);
    try {
      const data = {
        title: formData.get("title") as string,
        videoUrl: formData.get("videoUrl") as string,
        duration: parseInt(formData.get("duration") as string),
        transcript: formData.get("transcript") as string,
        order: parseInt(formData.get("order") as string),
        isPublished: true
      };

      if (editingLesson) {
        await updateLesson(editingLesson.id, data);
      } else if (activeModuleId) {
        await createLesson(activeModuleId, data);
      }

      setIsLessonModalOpen(false);
      router.refresh();
    } catch (error: any) {
      alert("Error al guardar la lección: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (confirm("¿Eliminar esta lección?")) {
      try {
        await deleteLesson(id);
        router.refresh();
      } catch (error: any) {
        alert("Error al eliminar la lección: " + error.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
        <div>
           <h2 className="font-headline font-bold text-xl text-primary">Constructor de Currículo</h2>
           <p className="text-on-surface-variant text-sm font-body">Gestiona la estructura de módulos y lecciones.</p>
        </div>
        <Button onClick={handleAddModule} className="bg-primary hover:bg-primary/90 text-on-primary rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Módulo
        </Button>
      </div>

      <div className="space-y-4">
        {modules.map((m) => (
          <div key={m.id} className="bg-white rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm transition-all hover:shadow-md">
            <div className="p-4 flex items-center justify-between bg-surface-container-low/30 group">
              <div className="flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-outline-variant cursor-grab active:cursor-grabbing" />
                <button
                  onClick={() => toggleModule(m.id)}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {m.order}
                  </div>
                  <h3 className="font-headline font-bold text-on-surface">{m.title}</h3>
                  {expandedModules[m.id] ? <ChevronUp className="h-4 w-4 text-outline-variant" /> : <ChevronDown className="h-4 w-4 text-outline-variant" />}
                </button>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => handleEditModule(m)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-error" onClick={() => handleDeleteModule(m.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {expandedModules[m.id] && (
              <div className="p-4 pt-0 space-y-2">
                <Separator className="mb-4 opacity-50" />
                <div className="grid gap-2">
                  {m.lessons.map((l: any) => (
                    <div key={l.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/5 group/lesson hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-6 h-6 rounded bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                           {l.order}
                         </div>
                         <div className="flex items-center gap-2">
                            <Video className="h-4 w-4 text-primary/60" />
                            <span className="font-body text-sm font-medium text-on-surface">{l.title}</span>
                         </div>
                         <div className="flex items-center gap-3 text-[10px] text-on-surface-variant uppercase tracking-wider font-bold opacity-60">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {l.duration} min</span>
                            <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Transcripción</span>
                         </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover/lesson:opacity-100 transition-opacity">
                         <Button variant="ghost" size="sm" onClick={() => handleEditLesson(l, m.id)}>
                            <Pencil className="h-3.5 w-3.5" />
                         </Button>
                         <Button variant="ghost" size="sm" className="text-error" onClick={() => handleDeleteLesson(l.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                         </Button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => handleAddLesson(m.id)}
                    className="w-full py-3 mt-2 rounded-xl border border-dashed border-outline-variant/50 flex items-center justify-center gap-2 text-sm font-medium text-on-surface-variant hover:bg-primary/5 hover:border-primary/30 transition-all group"
                  >
                    <Plus className="h-4 w-4 text-outline-variant group-hover:text-primary" />
                    <span>Añadir Lección</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {modules.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-outline-variant/50">
             <h3 className="font-headline font-bold text-on-surface mb-1">Sin estructura</h3>
             <p className="text-on-surface-variant text-sm mb-6">Comienza creando el primer módulo de tu curso.</p>
             <Button onClick={handleAddModule} variant="outline">Crear Módulo</Button>
          </div>
        )}
      </div>

      {/* Module Modal */}
      <Dialog open={isModuleModalOpen} onOpenChange={setIsModuleModalOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingModule ? "Editar Módulo" : "Nuevo Módulo"}</DialogTitle>
          </DialogHeader>
          <form action={saveModule} className="space-y-4 py-4">
             <div className="space-y-2">
                <Label htmlFor="title">Título del Módulo</Label>
                <Input id="title" name="title" defaultValue={editingModule?.title} required className="rounded-xl" />
             </div>
             <div className="space-y-2">
                <Label htmlFor="order">Orden</Label>
                <Input id="order" name="order" type="number" defaultValue={editingModule?.order || modules.length + 1} required className="rounded-xl" />
             </div>
             <DialogFooter className="pt-4">
                <Button type="submit" disabled={loading} className="w-full bg-primary text-on-primary rounded-xl">
                  {loading ? "Guardando..." : "Guardar Módulo"}
                </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lesson Modal */}
      <Dialog open={isLessonModalOpen} onOpenChange={setIsLessonModalOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingLesson ? "Editar Lección" : "Añadir Nueva Lección"}</DialogTitle>
          </DialogHeader>
          <form action={saveLesson} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="l-title">Título</Label>
                    <Input id="l-title" name="title" defaultValue={editingLesson?.title} required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="l-order">Orden</Label>
                    <Input id="l-order" name="order" type="number" defaultValue={editingLesson?.order || 1} required className="rounded-xl" />
                </div>
             </div>

             <div className="space-y-2">
                <Label htmlFor="l-video">URL del Video</Label>
                <Input id="l-video" name="videoUrl" defaultValue={editingLesson?.videoUrl} required className="rounded-xl" placeholder="https://youtube.com/..." />
             </div>

             <div className="space-y-2">
                <Label htmlFor="l-duration">Duración (minutos)</Label>
                <Input id="l-duration" name="duration" type="number" defaultValue={editingLesson?.duration || 0} required className="rounded-xl" />
             </div>

             <div className="space-y-2">
                <Label htmlFor="l-transcript">Transcripción Académica</Label>
                <Textarea id="l-transcript" name="transcript" defaultValue={editingLesson?.transcript} className="min-h-[200px] rounded-xl font-body" placeholder="Pega aquí el texto de la lección..." />
             </div>

             <DialogFooter className="pt-4 sticky bottom-0 bg-background pb-2">
                <Button type="submit" disabled={loading} className="w-full bg-primary text-on-primary rounded-xl py-6 text-lg font-bold">
                  {loading ? "Procesando..." : editingLesson ? "Actualizar Lección" : "Crear Lección"}
                </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
