import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLogin = nextUrl.pathname.startsWith("/login");
      if (isLogin) return isLoggedIn ? Response.redirect(new URL("/", nextUrl)) : true;
      return isLoggedIn ? true : false;
    },
  },
} satisfies NextAuthConfig;