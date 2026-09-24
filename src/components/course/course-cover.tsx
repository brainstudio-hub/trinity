import { cn } from "@/lib/utils";

/**
 * Portada del curso. Sin imagen, genera una portada tipográfica sobria
 * con los colores del seminario (evita placeholders genéricos).
 */
export function CourseCover({
  title,
  src,
  category,
  className,
  size = "md",
}: {
  title: string;
  src?: string | null;
  category?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-tas-navy", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="size-full object-cover transition duration-500 group-hover:scale-[1.02]" />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden bg-tas-navy p-5 text-tas-cream",
        size === "lg" && "p-8",
        size === "sm" && "p-3",
        className
      )}
    >
      <div aria-hidden className="absolute inset-0 opacity-[0.12]" style={{
        backgroundImage: "radial-gradient(circle at 85% 15%, #F2AF00 0, transparent 35%), radial-gradient(circle at 10% 110%, #CD1543 0, transparent 40%)",
      }} />
      <svg aria-hidden viewBox="0 0 100 100" className="absolute -right-6 -top-6 size-40 text-tas-cream/[0.06]">
        <path d="M44 0h12v44h44v12H56v44H44V56H0V44h44z" fill="currentColor" />
      </svg>
      {size !== "sm" && (
        <span className="relative text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-tas-cream/60">
          {category ?? "Seminario Anglicano Trinity"}
        </span>
      )}
      <span
        className={cn(
          "relative line-clamp-3 font-serif leading-tight",
          size === "lg" ? "text-4xl" : size === "sm" ? "text-xs" : "text-2xl"
        )}
      >
        {title}
      </span>
    </div>
  );
}
