"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCourse } from "@/lib/actions/admin";

export default function NewCoursePage() {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("BASICO");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createCourse({ title, category, level, code });
      router.push(`/admin/courses/${res.id}`);
    } catch {
      alert("Error al crear curso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Crear Nuevo Curso</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Código Único (Slug)</label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ej: THEO-101" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Título</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Categoría</label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Nivel</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="BASICO">Básico</option>
            <option value="INTERMEDIO">Intermedio</option>
            <option value="AVANZADO">Avanzado</option>
          </select>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creando..." : "Crear Curso"}
        </Button>
      </form>
    </div>
  );
}
