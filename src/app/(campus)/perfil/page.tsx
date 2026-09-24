import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Avatar, Card, CardContent, CardDescription, CardHeader, CardTitle, PageHeader } from "@/components/ui/primitives";
import { PasswordForm, ProfileForm } from "@/components/campus/profile-forms";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const session = await requireUser();
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.id },
    select: { name: true, email: true, headline: true, bio: true, avatarUrl: true, createdAt: true },
  });

  return (
    <>
      <PageHeader eyebrow="Cuenta" title="Perfil" />
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="h-fit p-6 text-center">
          <Avatar name={user.name} src={user.avatarUrl} size={88} className="mx-auto" />
          <p className="mt-4 font-serif text-2xl text-tas-navy">{user.name}</p>
          {user.headline && <p className="mt-1 text-sm text-muted-foreground">{user.headline}</p>}
          <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">Miembro desde {formatDate(user.createdAt)}</p>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información personal</CardTitle>
              <CardDescription>Estos datos los ven tus docentes y compañeros en las preguntas de clase.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={user} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
              <CardDescription>Cambia tu contraseña de acceso.</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
