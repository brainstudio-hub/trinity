"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { enrollInCourse } from "@/lib/actions/enrollment";
import { Loader2 } from "lucide-react";

export function EnrollButton({ courseId, userId }: { courseId: string; userId?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEnroll = async () => {
    if (!userId) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await enrollInCourse(courseId);
      if (res.success && res.lessonId) {
        router.push(`/courses/${courseId}/lessons/${res.lessonId}`);
      } else if (res.error) {
        alert(res.error);
      }
    } catch {
      alert("Error al inscribirse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="lg" onClick={handleEnroll} disabled={loading} className="w-full md:w-auto">
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Inscribirse Ahora
    </Button>
  );
}
