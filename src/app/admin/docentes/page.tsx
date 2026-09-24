import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/primitives";
import { AdminBreadcrumbs } from "@/components/admin/admin-shell";
import { InstructorsManager } from "@/components/admin/instructors-manager";
import { getInstructorsAdmin, requireAdmin } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Docentes" };

export default async function InstructorsPage() {
  await requireAdmin();
  const { instructors, accounts } = await getInstructorsAdmin();
  return (
    <>
      <AdminBreadcrumbs items={[{ label: "Docentes" }]} />
      <PageHeader
        eyebrow="Institución"
        title="Docentes"
        description="Perfiles públicos que aparecen en las páginas de los cursos. Vincula una cuenta para que el docente pueda administrar sus cursos."
      />
      <InstructorsManager
        instructors={instructors.map((i) => ({
          id: i.id,
          name: i.name,
          title: i.title,
          bio: i.bio,
          photoUrl: i.photoUrl,
          userId: i.userId,
          user: i.user,
          courseCount: i._count.courses,
        }))}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name, email: a.email, role: a.role, profileId: a.instructorProfile?.id ?? null }))}
      />
    </>
  );
}
