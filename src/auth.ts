import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { db } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

// Hash real para comparar cuando el correo no existe (evita diferencias de tiempo).
const DUMMY_HASH = bcrypt.hashSync("trinity-dummy-password", 10);

class InactiveAccount extends CredentialsSignin {
  code = "inactive";
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        try {
          const user = await db.user.findUnique({ where: { email } });
          // Comparar siempre para no revelar por tiempo de respuesta si el correo existe.
          const hash = user?.passwordHash ?? DUMMY_HASH;
          const valid = await bcrypt.compare(password, hash);
          if (!user || !valid) return null;
          if (!user.isActive) throw new InactiveAccount();

          await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
          return { id: user.id, name: user.name, email: user.email, image: user.avatarUrl, role: user.role };
        } catch (error) {
          if (error instanceof CredentialsSignin) throw error;
          console.error("[auth] authorize", error);
          return null;
        }
      },
    }),
  ],
});
