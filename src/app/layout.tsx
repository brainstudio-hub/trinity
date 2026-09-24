import type { Metadata } from "next";
import { EB_Garamond, Montserrat } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const serif = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Campus Virtual — Seminario Anglicano Trinity",
    template: "%s · Campus Trinity",
  },
  description:
    "Campus virtual del Seminario Anglicano Trinity: formación teológica en español para líderes anglicanos.",
  icons: { icon: "/tas-logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-screen">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!rounded-lg !border-border !shadow-lift !font-sans",
              title: "!text-sm !font-semibold",
            },
          }}
        />
      </body>
    </html>
  );
}
