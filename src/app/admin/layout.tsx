import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireStaff } from "@/lib/queries/admin";

export const metadata: Metadata = {
  title: { default: "Administración", template: "%s · Administración Trinity" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  return (
    <AdminShell user={{ name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl }}>
      {children}
    </AdminShell>
  );
}
