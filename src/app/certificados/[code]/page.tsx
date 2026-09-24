import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Crest } from "@/components/brand";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = { title: "Certificado" };

export default async function CertificatePage({ params }: { params: { code: string } }) {
  const cert = await db.certificate.findUnique({
    where: { code: params.code.toUpperCase() },
    include: {
      user: { select: { name: true } },
      course: {
        select: {
          title: true,
          estimatedHours: true,
          instructors: { include: { instructor: true }, orderBy: { position: "asc" } },
        },
      },
    },
  });
  if (!cert) notFound();
  const instructor = cert.course.instructors[0]?.instructor;

  return (
    <div className="min-h-screen bg-secondary/60 px-4 py-10 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-6 flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-success">
          <BadgeCheck className="size-5" /> Certificado válido emitido por el Seminario Anglicano Trinity
        </p>
        <div className="flex gap-2">
          <Link href="/mis-certificados" className="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            Mis certificados
          </Link>
          <PrintButton />
        </div>
      </div>

      <article className="relative mx-auto aspect-[1.414/1] max-w-4xl overflow-hidden bg-[#FFFDF8] shadow-lift print:max-w-none print:shadow-none">
        <div className="absolute inset-4 border border-tas-navy/25 md:inset-6" />
        <div className="absolute inset-6 border-[3px] border-double border-tas-gold/60 md:inset-9" />
        <div className="relative flex h-full flex-col items-center justify-between px-10 py-12 text-center md:px-20 md:py-16">
          <div className="flex flex-col items-center">
            <Crest size={56} />
            <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-tas-navy/70 md:text-xs">
              Seminario Anglicano Trinity · Programa Hispano
            </p>
          </div>

          <div>
            <p className="font-serif text-lg italic text-muted-foreground md:text-xl">Certifica que</p>
            <p className="mt-2 font-serif text-4xl text-tas-navy md:text-6xl">{cert.user.name}</p>
            <div className="mx-auto my-5 h-px w-40 bg-tas-gold" />
            <p className="font-serif text-base italic text-muted-foreground md:text-lg">ha completado satisfactoriamente el curso</p>
            <p className="mt-2 font-serif text-2xl text-tas-navy md:text-4xl">{cert.course.title}</p>
            {cert.course.estimatedHours && (
              <p className="mt-3 text-xs text-muted-foreground md:text-sm">Intensidad de {cert.course.estimatedHours} horas de estudio</p>
            )}
          </div>

          <div className="grid w-full grid-cols-2 items-end gap-10 text-xs md:text-sm">
            <div className="text-left">
              <div className="mb-2 h-px w-full max-w-[220px] bg-tas-navy/40" />
              <p className="font-semibold text-tas-navy">{instructor?.name ?? "Coordinación Académica"}</p>
              <p className="text-muted-foreground">{instructor?.title ?? "Programa Hispano"}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Emitido el {formatDate(cert.issuedAt)}</p>
              <p className="mt-1 font-mono text-[0.7rem] tracking-wider text-tas-navy">Código {cert.code}</p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
