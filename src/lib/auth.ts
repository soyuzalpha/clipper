import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials as { email?: string }).email;
        const password = (credentials as { password?: string }).password;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});

/**
 * Guard for mutating server actions. Returns an "unauthorized" result to
 * return early with, or null when the caller is authenticated. Middleware
 * already blocks unauthenticated page requests; this is defense-in-depth so
 * the actions stay safe even if the middleware matcher is ever loosened.
 */
export async function requireAuth(): Promise<{ ok: false; error: string } | null> {
  const session = await auth();
  return session?.user ? null : { ok: false, error: "Unauthorized" };
}