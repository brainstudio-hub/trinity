import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/primitives";
import { AdminBreadcrumbs } from "@/components/admin/admin-shell";
import { ParamSelect, SearchInput } from "@/components/admin/admin-kit";
import { CreateUserButton, UsersTable } from "@/components/admin/users-admin";
import { getUsers, requireAdmin } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsersPage({ searchParams }: { searchParams: { q?: string; rol?: string } }) {
  const me = await requireAdmin();
  const { users, byRole } = await getUsers({ q: searchParams.q, role: searchParams.rol });
  const total = (byRole.STUDENT ?? 0) + (byRole.INSTRUCTOR ?? 0) + (byRole.ADMIN ?? 0);

  return (
    <>
      <AdminBreadcrumbs items={[{ label: "Usuarios" }]} />
      <PageHeader
        eyebrow="Institución"
        title="Usuarios"
        description={`${total} cuentas: ${byRole.STUDENT ?? 0} estudiantes, ${byRole.INSTRUCTOR ?? 0} docentes y ${byRole.ADMIN ?? 0} administradores.`}
        actions={<CreateUserButton />}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput placeholder="Buscar por nombre o correo…" className="sm:max-w-sm sm:flex-1" />
        <ParamSelect
          param="rol"
          label="Filtrar por rol"
          allLabel="Todos los roles"
          options={[
            { value: "STUDENT", label: "Estudiantes" },
            { value: "INSTRUCTOR", label: "Docentes" },
            { value: "ADMIN", label: "Administradores" },
          ]}
        />
      </div>
      <UsersTable
        meId={me.id}
        filtered={!!(searchParams.q || searchParams.rol)}
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          avatarUrl: u.avatarUrl,
          isActive: u.isActive,
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
          createdAt: u.createdAt.toISOString(),
          courses: u._count.enrollments,
        }))}
      />
    </>
  );
}
