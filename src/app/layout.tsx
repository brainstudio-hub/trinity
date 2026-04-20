import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { auth } from "@/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Seminario Anglicano Trinity - LMS",
  description: "Plataforma de aprendizaje para el Seminario Anglicano Trinity",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const role = session?.user?.role;

  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="min-h-screen">
          <Header />
          <div className="flex pt-16">
            <Sidebar role={role} />
            <main className="flex-1 px-4 py-8 md:pl-72 md:pr-8">
              <div className="max-w-6xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
