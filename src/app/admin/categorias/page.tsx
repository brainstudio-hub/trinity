import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/primitives";
import { AdminBreadcrumbs } from "@/components/admin/admin-shell";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { getCategoriesAdmin, requireAdmin } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Categorías" };

export default async function CategoriesPage() {
  await requireAdmin();
  const categories = await getCategoriesAdmin();
  return (
    <div className="max-w-3xl">
      <AdminBreadcrumbs items={[{ label: "Categorías" }]} />
      <PageHeader
        eyebrow="Institución"
        title="Categorías"
        description="Áreas de estudio que organizan el catálogo. Arrastra para cambiar el orden en que aparecen."
      />
      <CategoriesManager
        categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description, courseCount: c._count.courses }))}
      />
    </div>
  );
}
