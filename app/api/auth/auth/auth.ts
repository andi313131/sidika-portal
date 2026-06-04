import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const ALLOWED_DOMAINS = ["student.unsil.ac.id", "gmail.com"];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // Paksa strategi JWT agar token ID sinkron di NextAuth v5
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Amankan tautan akun jika data email duplikat

      // 💡 FIX UTAMA: Tulis parameter authorization secara lengkap agar Google terpaksa memunculkan pop-up akun!
      authorization: {
        params: {
          prompt: "select_account consent", // ← Tambahkan kata 'consent' agar Google bener-bener nanya ulang
          access_type: "offline",
          response_type: "code"
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Paksa email menjadi huruf kecil semua biar tidak sensitif huruf besar-kecil
      const email = (user.email ?? "").toLowerCase();

      const isAllowed = ALLOWED_DOMAINS.some(domain => email.endsWith(`@${domain}`));

      if (!isAllowed) {
        return `/auth/error?error=DomainNotAllowed&email=${encodeURIComponent(email)}`;
      }
      return true;
    },
    // Overwrite data token di browser menggunakan data user baru yang aktif login
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email?.toLowerCase(); // Simpan email dalam bentuk lowercase di token
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.email = token.email as string; // Pastikan email di session ter-update presisi
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});