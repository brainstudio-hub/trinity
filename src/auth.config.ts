import type { NextAuthConfig } from "next-auth";
import type { AppRole } from "@/types/next-auth";

// Configuración compatible con el runtime Edge (middleware): sin Prisma ni bcrypt.

const STUDENT_AREAS = ["/inicio", "/mis-cursos", "/aprender", "/notas", "/calendario", "/mis-certificados", "/perfil"];
const AUTH_PAGES = ["/ingresar", "/registro", "/recuperar", "/restablecer"];

export const authConfig = {
  pages: { signIn: "/ingresar" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      const user = auth?.user;

      if (path.startsWith("/admin")) {
        if (!user) return false;
        if (user.role === "ADMIN" || user.role === "INSTRUCTOR") return true;
        return Response.redirect(new URL("/inicio", nextUrl));
      }

      if (STUDENT_AREAS.some((p) => path === p || path.startsWith(`${p}/`))) {
        return !!user;
      }

      if (user && AUTH_PAGES.some((p) => path.startsWith(p))) {
        return Response.redirect(new URL("/inicio", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role ?? "STUDENT";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as AppRole;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
