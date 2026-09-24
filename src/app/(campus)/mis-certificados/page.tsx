import type { Metadata } from "next";
import Link from "next/link";
import { Award, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getMyCourses } from "@/lib/queries/courses";
import { getCertificateStanding } from "@/lib/certificates";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader, Progress } from "@/components/ui/primitives";
import { Crest } from "@/components/brand";

export const metadata: Metadata = { title: "Certificados" };

export default async function MyCertificatesPage() {
  const user = await requireUser();
  const [certificates, courses] = await Promise.all([
    db.certificate.findMany({
      where: { userId: user.id },
      orderBy: { issuedAt: "desc" },
      include: { course: { select: { title: true } } },
    }),
    getMyCourses(user.id),
  ]);
  const certified = new Set(certificates.map((c) => c.courseId));
  const inProgress = courses.filter((c) => !certified.has(c.course.id) && c.course.certificateEnabled);
  const standings = await Promise.all(inProgress.map((c) => getCertificateStanding(user.id, c.course.id)));

  return (
    <>
      <PageHeader eyebrow="Logros" title="Certificados" description="Certificados de finalización con código de verificación público." />

      {certificates.length === 0 ? (
        <EmptyState icon={<Award />} title="Aún no tienes certificados" description="Completa un curso y aprueba sus evaluaciones para recibir tu certificado." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {certificates.map((c) => (
            <Card key={c.id} className="relative overflow-hidden p-6">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-tas-navy via-tas-gold to-tas-crimson" />
              <div className="flex items-start gap-4">
                <Crest size={40} />
                <div className="min-w-0 flex-1">
                  <p className="eyebrow">Certificado de finalización</p>
                  <p className="mt-1 font-serif text-2xl leading-snug text-tas-navy">{c.course.title}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Emitido el {formatDate(c.issuedAt)} · Código <span className="font-mono font-semibold text-foreground">{c.code}</span>
                  </p>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <Button asChild size="sm">
                  <Link href={`/certificados/${c.code}`}>Ver e imprimir</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/certificados/${c.code}`} target="_blank">
                    Enlace de verificación <ExternalLink />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {inProgress.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-serif text-2xl text-tas-navy">En camino</h2>
          <div className="space-y-3">
            {inProgress.map((c, i) => {
              const s = standings[i];
              return (
                <div key={c.course.id} className="rounded-xl border bg-card p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold">{c.course.title}</p>
                    <span className="text-xs font-semibold tabular-nums">{s.summary.percent}%</span>
                  </div>
                  <Progress value={s.summary.percent} className="mt-3" />
                  {s.reasons.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {s.reasons.map((r) => (
                        <li key={r}>• {r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
