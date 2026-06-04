import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const ALLOWED_DOMAINS = ["student.unsil.ac.id", "gmail.com"];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // 💡 PAKSA STRATEGI JWT: Agar sinkron dengan modifikasi token ID di NextAuth v5
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email ?? "";

      // Cek apakah email yang login berakhiran dengan salah satu isi array whitelist
      const isAllowed = ALLOWED_DOMAINS.some(domain => email.endsWith(`@${domain}`));

      if (!isAllowed) {
        return `/auth/error?error=DomainNotAllowed&email=${encodeURIComponent(email)}`;
      }
      return true;
    },
    // 💡 SOLUSI SAKTI NEXTAUTH V5: Oper ID dari akun database lewat JWT Token baru ke Session
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string; // 🔐 ID nempel aman dan dikenali oleh TypeScript!
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});