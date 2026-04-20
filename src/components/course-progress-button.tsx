"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";
import { toggleLessonProgress } from "@/lib/actions/progress";
import { useRouter } from "next/navigation";

export function CourseProgressButton({
  lessonId,
  initialIsCompleted,
}: {
  lessonId: string;
  initialIsCompleted: boolean;
}) {
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onClick = async () => {
    try {
      setLoading(true);
      await toggleLessonProgress(lessonId, !isCompleted);
      setIsCompleted(!isCompleted);
      router.refresh();
    } catch {
      alert("Algo salió mal");
    } finally {
      setLoading(false);
    }
  };

  const Icon = isCompleted ? CheckCircle2 : Circle;

  return (
    <Button
      onClick={onClick}
      disabled={loading}
      variant={isCompleted ? "secondary" : "default"}
      className="w-full md:w-auto"
    >
      {isCompleted ? "Completada" : "Marcar como completada"}
      <Icon className="ml-2 h-4 w-4" />
    </Button>
  );
}
