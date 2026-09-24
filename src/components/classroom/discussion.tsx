"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessagesSquare, Trash2 } from "lucide-react";
import { addCommentAction, deleteCommentAction } from "@/lib/actions/learning";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Avatar, Badge } from "@/components/ui/primitives";
import { formatRelative } from "@/lib/utils";

export type DiscussionComment = {
  id: string;
  body: string;
  createdAt: Date;
  userId: string;
  user: { name: string; avatarUrl: string | null; role: "STUDENT" | "INSTRUCTOR" | "ADMIN" };
  replies: Omit<DiscussionComment, "replies">[];
};

function Composer({
  lessonId,
  parentId,
  placeholder,
  onDone,
  autoFocus,
}: {
  lessonId: string;
  parentId: string | null;
  placeholder: string;
  onDone?: () => void;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [pending, start] = React.useTransition();
  return (
    <div className="space-y-2">
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={placeholder} className="min-h-[80px]" autoFocus={autoFocus} />
      <div className="flex justify-end gap-2">
        {onDone && (
          <Button size="sm" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        )}
        <Button
          size="sm"
          loading={pending}
          disabled={body.trim().length < 2}
          onClick={() =>
            start(async () => {
              const res = await addCommentAction({ lessonId, body, parentId });
              if (!res.ok) return void toast.error(res.error);
              setBody("");
              onDone?.();
              router.refresh();
            })
          }
        >
          {parentId ? "Responder" : "Publicar pregunta"}
        </Button>
      </div>
    </div>
  );
}

function CommentBody({
  c,
  currentUserId,
  isStaff,
}: {
  c: Omit<DiscussionComment, "replies">;
  currentUserId: string;
  isStaff: boolean;
}) {
  const router = useRouter();
  const staffAuthor = c.user.role !== "STUDENT";
  return (
    <div className="flex gap-3">
      <Avatar name={c.user.name} src={c.user.avatarUrl} size={32} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="font-semibold text-foreground">{c.user.name}</span>
          {staffAuthor && <Badge variant="blue">Docente</Badge>}
          <span className="text-muted-foreground">{formatRelative(c.createdAt)}</span>
          {(c.userId === currentUserId || isStaff) && (
            <button
              className="ml-auto text-muted-foreground transition hover:text-destructive"
              aria-label="Eliminar"
              onClick={async () => {
                if (!window.confirm("¿Eliminar este comentario?")) return;
                const res = await deleteCommentAction(c.id);
                if (!res.ok) return toast.error(res.error);
                router.refresh();
              }}
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>
      </div>
    </div>
  );
}

export function Discussion({
  lessonId,
  comments,
  currentUserId,
  isStaff,
  canPost,
}: {
  lessonId: string;
  comments: DiscussionComment[];
  currentUserId: string;
  isStaff: boolean;
  canPost: boolean;
}) {
  const [replying, setReplying] = React.useState<string | null>(null);
  return (
    <div className="space-y-6">
      {canPost ? (
        <Composer lessonId={lessonId} parentId={null} placeholder="¿Tienes una pregunta sobre esta lección? Compártela con tu docente y compañeros." />
      ) : (
        <p className="text-sm text-muted-foreground">Inscríbete en el curso para participar.</p>
      )}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed py-10 text-center">
          <MessagesSquare className="size-7 text-tas-stone" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-semibold">Todavía no hay preguntas</p>
          <p className="mt-1 text-xs text-muted-foreground">Sé el primero en abrir la conversación.</p>
        </div>
      ) : (
        <ul className="space-y-5">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl border bg-card p-5">
              <CommentBody c={c} currentUserId={currentUserId} isStaff={isStaff} />
              {c.replies.length > 0 && (
                <ul className="mt-4 space-y-4 border-l-2 border-tas-stone pl-5 ml-4">
                  {c.replies.map((r) => (
                    <li key={r.id}>
                      <CommentBody c={r} currentUserId={currentUserId} isStaff={isStaff} />
                    </li>
                  ))}
                </ul>
              )}
              {canPost && (
                <div className="ml-11 mt-3">
                  {replying === c.id ? (
                    <Composer lessonId={lessonId} parentId={c.id} placeholder="Escribe tu respuesta…" onDone={() => setReplying(null)} autoFocus />
                  ) : (
                    <button onClick={() => setReplying(c.id)} className="text-xs font-semibold text-tas-blue hover:underline">
                      Responder
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
