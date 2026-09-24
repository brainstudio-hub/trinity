"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enrollAction } from "@/lib/actions/learning";

export function EnrollButton({
  courseId,
  slug,
  state,
  resumeLessonId,
  className,
}: {
  courseId: string;
  slug: string;
  state: "anonymous" | "enrolled" | "available";
  resumeLessonId?: string | null;
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (state === "anonymous") {
    return (
      <Button asChild size="lg" className={className}>
        <Link href={`/ingresar?callbackUrl=${encodeURIComponent(`/cursos/${slug}`)}`}>Ingresar para inscribirte</Link>
      </Button>
    );
  }

  if (state === "enrolled") {
    return (
      <Button asChild size="lg" className={className}>
        <Link href={resumeLessonId ? `/aprender/${slug}/${resumeLessonId}` : `/mis-cursos`}>
          Continuar el curso <ArrowRight />
        </Link>
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className={className}
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await enrollAction(courseId);
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          toast.success("¡Te inscribiste! Comencemos.");
          router.push(res.data?.lessonId ? `/aprender/${slug}/${res.data.lessonId}` : "/mis-cursos");
          router.refresh();
        })
      }
    >
      Inscribirme en el curso
    </Button>
  );
}
