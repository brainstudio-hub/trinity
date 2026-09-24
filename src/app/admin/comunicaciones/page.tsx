import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/primitives";
import { AdminBreadcrumbs } from "@/components/admin/admin-shell";
import { CommunicationsManager } from "@/components/admin/communications-manager";
import { getCommunications, requireAdmin } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Anuncios y eventos" };

export default async function CommunicationsPage({ searchParams }: { searchParams: { tab?: string } }) {
  await requireAdmin();
  const { announcements, events, courses } = await getCommunications();
  return (
    <>
      <AdminBreadcrumbs items={[{ label: "Anuncios y eventos" }]} />
      <PageHeader
        eyebrow="Institución"
        title="Anuncios y eventos"
        description="Comunicados para toda la comunidad o para un curso, y el calendario de clases en vivo, fechas límite y cultos."
      />
      <CommunicationsManager
        defaultTab={searchParams.tab === "eventos" ? "eventos" : "anuncios"}
        courses={courses}
        announcements={announcements.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          link: a.link,
          courseId: a.courseId,
          courseTitle: a.course?.title ?? null,
          isPublished: a.isPublished,
          publishedAt: a.publishedAt.toISOString(),
        }))}
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          kind: e.kind,
          startsAt: e.startsAt.toISOString(),
          endsAt: e.endsAt?.toISOString() ?? null,
          location: e.location,
          courseId: e.courseId,
          courseTitle: e.course?.title ?? null,
        }))}
      />
    </>
  );
}
