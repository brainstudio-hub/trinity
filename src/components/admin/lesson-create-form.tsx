"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLesson } from "@/lib/actions/admin";

export function LessonCreateForm({ courseId, nextOrder }: { courseId: string; nextOrder: number }) {
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await createLesson(courseId, {
        title,
        videoUrl,
        order: nextOrder,
        isPublished: true
    });
    setTitle("");
    setVideoUrl("");
    setLoading(false);
  };

  return (
    <form onSubmit={onAdd} className="space-y-4 bg-white p-6 border rounded-xl">
      <div className="space-y-2">
        <label className="text-sm font-medium">Título de la Lección</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">URL del Video (YouTube/Vimeo)</label>
        <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} required />
      </div>
      <Button type="submit" disabled={loading} className="w-full" variant="outline">
        {loading ? "Añadiendo..." : "Añadir Lección"}
      </Button>
    </form>
  );
}
