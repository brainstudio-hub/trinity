"use client";

import * as React from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { upsertReviewAction } from "@/lib/actions/learning";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/overlay";
import { cn } from "@/lib/utils";

const LABELS = ["", "Deficiente", "Regular", "Bueno", "Muy bueno", "Excelente"];

export function ReviewDialog({
  courseId,
  initial,
  trigger,
}: {
  courseId: string;
  initial?: { rating: number; comment: string | null } | null;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(initial?.rating ?? 0);
  const [hover, setHover] = React.useState(0);
  const [comment, setComment] = React.useState(initial?.comment ?? "");
  const [pending, start] = React.useTransition();
  const shown = hover || rating;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title="Califica este curso" description="Tu opinión ayuda al Seminario a mejorar y orienta a otros estudiantes.">
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setHover(i)}
                onClick={() => setRating(i)}
                aria-label={`${i} estrellas`}
                className="rounded p-1 transition hover:scale-110"
              >
                <Star className={cn("size-8", i <= shown ? "fill-tas-gold text-tas-gold" : "text-tas-stone")} strokeWidth={1.5} />
              </button>
            ))}
          </div>
          <p className="h-5 text-sm font-semibold text-muted-foreground">{LABELS[shown]}</p>
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="¿Qué te pareció el curso? (opcional)"
          className="mt-2"
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            disabled={!rating}
            loading={pending}
            onClick={() =>
              start(async () => {
                const res = await upsertReviewAction({ courseId, rating, comment });
                if (!res.ok) return void toast.error(res.error);
                toast.success("¡Gracias por tu reseña!");
                setOpen(false);
              })
            }
          >
            Publicar reseña
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
