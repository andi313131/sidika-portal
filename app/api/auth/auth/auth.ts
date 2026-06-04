import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// 🛠️ PERUBAHAN 1: Ganti domain tunggal jadi array whitelist biar bisa muat banyak domain
const ALLOWED_DOMAINS = ["student.unsil.ac.id", "gmail.com"];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email ?? "";

      // 🛠️ PERUBAHAN 2: Cek apakah email yang login berakhiran dengan salah satu isi array di atas
      const isAllowed = ALLOWED_DOMAINS.some(domain => email.endsWith(`@${domain}`));

      if (!isAllowed) {
        return `/auth/error?error=DomainNotAllowed&email=${encodeURIComponent(email)}`;
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});