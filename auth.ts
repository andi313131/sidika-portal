// auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // WAJIB untuk arsitektur Middleware Next.js
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks, // Mengambil callback signIn dari auth.config.ts
    
    async jwt({ token, user }) {
      // Saat pertama kali login, masukkan id user ke dalam token JWT
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Ambil id dari token JWT dan masukkan ke session objek browser
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});