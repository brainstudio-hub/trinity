"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookOpen, LayoutDashboard, School, Users, Megaphone, ArrowRight, Play } from "lucide-react";

const sidebarItems = [
  { name: "Catálogo", href: "/courses", icon: BookOpen },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Mis Cursos", href: "/dashboard", icon: School },
  { name: "Facultad", href: "/faculty/alistair-mcgrath", icon: Users },
  { name: "Noticias", href: "#", icon: Megaphone },
];

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 hidden h-[calc(100vh-4rem)] w-72 bg-[#f2f4f6] dark:bg-[#111416] py-8 border-none md:flex flex-col z-40">
      <div className="px-6 mb-10 flex flex-col items-start">
        <div className="h-12 w-12 rounded-full bg-primary-container text-on-primary flex items-center justify-center mb-4 overflow-hidden border border-outline-variant/20 shadow-sm">
            <School className="h-6 w-6 text-on-primary-container" />
        </div>
        <h1 className="font-headline font-bold text-[#002a58] dark:text-[#c9e7f7] text-xl tracking-tight">The Digital Curator</h1>
        <p className="font-body text-[15px] leading-relaxed text-on-surface-variant">Academic Portal</p>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 transition-all duration-300",
                    isActive
                      ? "bg-white dark:bg-[#191c1e] text-[#002a58] font-bold border-l-4 border-[#002a58]"
                      : "text-[#424750] dark:text-[#c3c6d2] hover:bg-[#eceef0] dark:hover:bg-[#2a2d31]"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive && "fill-current")} />
                  <span className="font-label">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-6 mt-auto">
        <button className="w-full bg-gradient-to-r from-primary to-primary-container text-white rounded-xl py-3 px-4 font-headline font-semibold text-sm tracking-wide transition-all duration-300 hover:opacity-90 flex items-center justify-center gap-2 shadow-md">
          <span>Start Lesson</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
