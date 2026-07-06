import { BookOpen, GraduationCap, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col gap-16 py-8">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center gap-4 py-12 bg-brand-navy/5 rounded-3xl">
        <h1 className="text-3xl md:text-6xl font-bold text-brand-navy max-w-3xl leading-tight">
          Formación Teológica de Excelencia en la Tradición Anglicana
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
          Descubre nuestros cursos y profundiza en tu fe y conocimiento bíblico con el Seminario Anglicano Trinity.
        </p>
        <div className="flex gap-4 mt-4">
          <Link href="/courses">
            <Button size="lg">Explorar Cursos</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">Unirse Ahora</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center text-center p-6 bg-white border rounded-2xl shadow-sm">
          <div className="p-3 bg-brand-navy/10 rounded-full mb-4">
            <BookOpen className="h-6 w-6 text-brand-navy" />
          </div>
          <h3 className="text-xl font-bold mb-2">Contenido de Calidad</h3>
          <p className="text-muted-foreground">Accede a lecciones en video grabadas por expertos en teología e historia.</p>
        </div>
        <div className="flex flex-col items-center text-center p-6 bg-white border rounded-2xl shadow-sm">
          <div className="p-3 bg-brand-navy/10 rounded-full mb-4">
            <GraduationCap className="h-6 w-6 text-brand-navy" />
          </div>
          <h3 className="text-xl font-bold mb-2">Aprende a tu Ritmo</h3>
          <p className="text-muted-foreground">Estudia desde cualquier lugar y en el horario que mejor te convenga.</p>
        </div>
        <div className="flex flex-col items-center text-center p-6 bg-white border rounded-2xl shadow-sm">
          <div className="p-3 bg-brand-navy/10 rounded-full mb-4">
            <Users className="h-6 w-6 text-brand-navy" />
          </div>
          <h3 className="text-xl font-bold mb-2">Comunidad Global</h3>
          <p className="text-muted-foreground">Únete a cientos de estudiantes que buscan crecer en su ministerio.</p>
        </div>
      </section>
    </div>
  );
}
