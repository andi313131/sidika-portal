// proxy.ts
import { auth } from "@/auth";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { nextUrl } = req;

    const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");
    const isWriteRoute = nextUrl.pathname.startsWith("/write");

    // Jika mencoba masuk ke area privat tapi belum login, lempar ke halaman Sign In Google
    if ((isDashboardRoute || isWriteRoute) && !isLoggedIn) {
        return Response.redirect(new URL("/api/auth/signin", nextUrl));
    }
});

export const config = {
    // Jalankan pengecekan rute di semua tempat kecuali file statis & aset bawaan
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|pdf.worker.min.mjs).*)"],
};