"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createLessonNote, deleteLessonNote } from "@/lib/actions/notes";
import { Clock, Trash2, Send } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface Note {
  id: string;
  content: string;
  timestamp: number;
  createdAt: Date;
}

interface LessonNotesProps {
  lessonId: string;
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  currentSeconds: number;
  onSeek: (seconds: number) => void;
}

export function LessonNotes({
  lessonId,
  notes,
  setNotes,
  currentSeconds = 0,
  onSeek,
}: LessonNotesProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState(0);

  const handleFocus = () => {
    setCurrentTimeDisplay(Math.floor(currentSeconds));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const timestamp = Math.floor(currentSeconds);
      setIsSubmitting(true);

      const result = await createLessonNote({
        lessonId,
        content,
        timestamp,
      });

      if (result.success && result.note) {
        // Cast to match our interface since Prisma returns full objects
        const updatedNotes = [...(notes || []), result.note as any].sort((a, b) => a.timestamp - b.timestamp);
        setNotes(updatedNotes);
        setContent("");
      }
    } catch (error) {
      console.error("Error creating note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      const result = await deleteLessonNote(noteId, lessonId);
      if (result.success) {
        setNotes((prevNotes) => (prevNotes || []).filter((n) => n.id !== noteId));
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const safeNotes = notes || [];
  // Use reactive currentSeconds when typing
  const displayTime = content ? Math.floor(currentSeconds) : (currentTimeDisplay || 0);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Textarea
            placeholder="Toma una nota académica en este momento del video..."
            value={content}
            onFocus={handleFocus}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] bg-surface-container-low border-outline-variant/20 focus:border-brand-navy/50 rounded-xl resize-none font-body"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-container-highest rounded-md text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              <Clock className="h-3 w-3" />
              {formatTime(displayTime)}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="bg-brand-navy hover:bg-brand-navy/90 text-on-primary rounded-lg px-6"
          >
            <Send className="h-4 w-4 mr-2" />
            Guardar Nota
          </Button>
        </div>
      </form>

      <div className="space-y-4 pt-4">
        <h3 className="font-headline font-bold text-on-surface">Mis Notas ({safeNotes.length})</h3>
        {safeNotes.length === 0 ? (
          <div className="text-center py-12 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/50">
            <p className="text-on-surface-variant font-body text-sm">No has tomado notas en esta lección.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {safeNotes.map((note) => (
              <div
                key={note?.id}
                className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 group transition-all hover:border-brand-navy/20"
              >
                <div className="flex justify-between items-start mb-2">
                  <button
                    onClick={() => note?.timestamp !== undefined && onSeek(note.timestamp)}
                    className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-navy/10 text-brand-navy rounded text-xs font-bold hover:bg-brand-navy hover:text-white transition-colors"
                  >
                    <Clock className="h-3 w-3" />
                    {formatTime(note?.timestamp || 0)}
                  </button>
                  <button
                    onClick={() => note?.id && handleDelete(note.id)}
                    className="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-on-surface font-body text-sm leading-relaxed">{note?.content}</p>
                <span className="text-[10px] text-on-surface-variant mt-2 block uppercase tracking-widest opacity-60">
                   {note?.createdAt ? new Date(note.createdAt).toLocaleDateString() : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
