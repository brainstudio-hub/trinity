import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Crest({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/tas-logo.png"
      alt="Escudo del Seminario Anglicano Trinity"
      width={size}
      height={Math.round(size * 1.14)}
      className={cn("shrink-0", className)}
      priority
    />
  );
}

export function Logo({
  href = "/",
  inverse,
  compact,
  className,
}: {
  href?: string;
  inverse?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-3", className)}>
      <Crest size={compact ? 26 : 30} />
      <span className="flex flex-col leading-none">
        <span className={cn("font-serif text-[1.35rem] font-medium tracking-tight", inverse ? "text-tas-cream" : "text-tas-navy")}>
          Trinity
        </span>
        {!compact && (
          <span
            className={cn(
              "mt-1 whitespace-nowrap text-[0.6rem] font-semibold uppercase tracking-[0.18em]",
              inverse ? "text-tas-cream/60" : "text-muted-foreground"
            )}
          >
            Seminario Anglicano
          </span>
        )}
      </span>
    </Link>
  );
}
