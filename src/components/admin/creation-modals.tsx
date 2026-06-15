"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createInstructor, createAnnouncement, createEvent } from "@/lib/actions/admin";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

export function AdminCreationModals() {
  const [modalType, setModalType] = useState<"none" | "instructor" | "announcement" | "event">("none");
  const [loading, setLoading] = useState(false);

  const handleCreateInstructor = async (formData: FormData) => {
    setLoading(true);
    try {
      await createInstructor({
        name: formData.get("name") as string,
        department: formData.get("department") as string,
        bio: formData.get("bio") as string,
      });
      toast.success("Instructor creado");
      setModalType("none");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (formData: FormData) => {
    setLoading(true);
    try {
      await createAnnouncement({
        title: formData.get("title") as string,
        content: formData.get("content") as string,
        link: formData.get("link") as string,
        isPublished: true
      });
      toast.success("Anuncio creado");
      setModalType("none");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (formData: FormData) => {
    setLoading(true);
    try {
      await createEvent({
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        date: new Date(formData.get("date") as string),
      });
      toast.success("Evento programado");
      setModalType("none");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => setModalType("instructor")}>
        <PlusCircle className="h-4 w-4 mr-2" /> Instructor
      </Button>
      <Button size="sm" variant="outline" onClick={() => setModalType("announcement")}>
        <PlusCircle className="h-4 w-4 mr-2" /> Anuncio
      </Button>
      <Button size="sm" variant="outline" onClick={() => setModalType("event")}>
        <PlusCircle className="h-4 w-4 mr-2" /> Evento
      </Button>

      {/* Instructor Modal */}
      <Dialog open={modalType === "instructor"} onOpenChange={() => setModalType("none")}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Miembro de Facultad</DialogTitle></DialogHeader>
          <form action={handleCreateInstructor} className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input name="name" required />
            </div>
            <div>
              <Label>Departamento</Label>
              <Input name="department" />
            </div>
            <div>
              <Label>Biografía</Label>
              <Textarea name="bio" />
            </div>
            <DialogFooter><Button type="submit" disabled={loading}>Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Announcement Modal */}
      <Dialog open={modalType === "announcement"} onOpenChange={() => setModalType("none")}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Anuncio</DialogTitle></DialogHeader>
          <form action={handleCreateAnnouncement} className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input name="title" required />
            </div>
            <div>
              <Label>Contenido</Label>
              <Textarea name="content" required />
            </div>
            <div>
              <Label>Enlace Externo (Opcional)</Label>
              <Input name="link" />
            </div>
            <DialogFooter><Button type="submit" disabled={loading}>Publicar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Event Modal */}
      <Dialog open={modalType === "event"} onOpenChange={() => setModalType("none")}>
        <DialogContent>
          <DialogHeader><DialogTitle>Programar Evento</DialogTitle></DialogHeader>
          <form action={handleCreateEvent} className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input name="title" required />
            </div>
            <div>
              <Label>Fecha y Hora</Label>
              <Input name="date" type="datetime-local" required />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea name="description" />
            </div>
            <DialogFooter><Button type="submit" disabled={loading}>Programar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
