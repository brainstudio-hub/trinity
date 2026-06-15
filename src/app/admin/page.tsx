import { db } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, Megaphone, Calendar, UserCheck, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AdminCreationModals } from "@/components/admin/creation-modals";

export default async function AdminPage() {
  const courses = await db.course.findMany({
    include: { modules: { include: { lessons: true } } },
    orderBy: { createdAt: "desc" }
  });

  const instructors = await db.instructor.findMany({
    orderBy: { name: "asc" }
  });

  const announcements = await db.announcement.findMany({
    orderBy: { createdAt: "desc" }
  });

  const events = await db.event.findMany({
    orderBy: { date: "asc" }
  });

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary font-headline">Panel de Administración Global</h1>
        <p className="text-muted-foreground font-body">Gestiona todos los aspectos de la plataforma educativa.</p>
      </div>

      <AdminCreationModals />

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="bg-surface-container-low p-1 rounded-xl w-fit flex-wrap h-auto">
          <TabsTrigger value="courses" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary font-bold text-sm">
            <BookOpen className="h-4 w-4 mr-2" /> Cursos
          </TabsTrigger>
          <TabsTrigger value="faculty" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary font-bold text-sm">
            <Users className="h-4 w-4 mr-2" /> Facultad
          </TabsTrigger>
          <TabsTrigger value="announcements" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary font-bold text-sm">
            <Megaphone className="h-4 w-4 mr-2" /> Anuncios
          </TabsTrigger>
          <TabsTrigger value="calendar" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary font-bold text-sm">
            <Calendar className="h-4 w-4 mr-2" /> Calendario
          </TabsTrigger>
          <TabsTrigger value="users" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary font-bold text-sm">
            <UserCheck className="h-4 w-4 mr-2" /> Usuarios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4 animate-fade-in">
          <div className="flex justify-end">
            <Link href="/admin/courses/new">
              <Button size="sm">
                <PlusCircle className="h-4 w-4 mr-2" /> Nuevo Curso
              </Button>
            </Link>
          </div>
          <div className="grid gap-4">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden border-outline-variant/10">
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">{course.code}</span>
                        <CardTitle className="text-base font-headline">{course.title}</CardTitle>
                        <Badge variant={course.isPublished ? "default" : "secondary"}>
                          {course.isPublished ? "Publicado" : "Borrador"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-body">
                        {course.category} • {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lecciones
                      </p>
                    </div>
                    <Link href={`/admin/courses/${course.id}`}>
                      <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
                    </Link>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="faculty" className="space-y-4 animate-fade-in">
           <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold font-headline">Miembros de la Facultad</h3>
              <Button size="sm" variant="outline"><PlusCircle className="h-4 w-4 mr-2" /> Añadir Instructor</Button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instructors.map((inst) => (
                <Card key={inst.id} className="border-outline-variant/10">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">{inst.name}</CardTitle>
                    <p className="text-xs text-primary font-medium">{inst.department}</p>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-xs text-muted-foreground line-clamp-2">{inst.bio}</p>
                  </CardContent>
                </Card>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4 animate-fade-in">
           <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold font-headline">Comunicados Estudiantiles</h3>
              <Button size="sm" variant="outline"><PlusCircle className="h-4 w-4 mr-2" /> Crear Anuncio</Button>
           </div>
           <div className="space-y-3">
              {announcements.map((ann) => (
                <div key={ann.id} className="flex items-center justify-between p-4 bg-white border rounded-xl border-outline-variant/10 shadow-sm">
                   <div>
                      <h4 className="font-bold text-sm">{ann.title}</h4>
                      <p className="text-xs text-muted-foreground">{new Date(ann.createdAt).toLocaleDateString()}</p>
                   </div>
                   <Badge variant={ann.isPublished ? "default" : "outline"}>{ann.isPublished ? "Visible" : "Borrador"}</Badge>
                </div>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4 animate-fade-in">
           <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold font-headline">Eventos Próximos</h3>
              <Button size="sm" variant="outline"><Calendar className="h-4 w-4 mr-2" /> Programar Evento</Button>
           </div>
           <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-4 bg-white border rounded-xl border-outline-variant/10 shadow-sm">
                   <div className="bg-primary/5 text-primary p-2 rounded-lg text-center min-w-[60px]">
                      <p className="text-[10px] font-bold uppercase">{new Date(event.date).toLocaleString('es', { month: 'short' })}</p>
                      <p className="text-lg font-black">{new Date(event.date).getDate()}</p>
                   </div>
                   <div>
                      <h4 className="font-bold text-sm">{event.title}</h4>
                      <p className="text-xs text-muted-foreground">{event.description || "Sin descripción"}</p>
                   </div>
                </div>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4 animate-fade-in">
           <div className="bg-white border rounded-xl border-outline-variant/10 overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Nombre</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Rol</th>
                    <th className="px-6 py-3">Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium">{user.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                      <td className="px-6 py-4">
                        <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>{user.role}</Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
