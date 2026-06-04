import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Force Next.js untuk selalu menjalankan fungsi ini secara live (tanpa cache)
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();

        // Pastikan lo udah posisi login pakai akun Google lo di web sidika
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Lo belum login di browser ini, Ndik!" }, { status: 401 });
        }

        // Paksa kosongkan kembali fullName dan nim khusus untuk akun lo yang sedang aktif
        const resetUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                fullName: null,
                nim: null
            }
        });

        return NextResponse.json({
            message: "🔒 SUKSES RESET TOTAL! Kolom nama lengkap dan NIM akun lo udah bersih kembali jadi null di database cloud Aiven.",
            user: {
                email: resetUser.email,
                fullName: resetUser.fullName,
                nim: resetUser.nim
            }
        });
    } catch (error: any) {
        console.error("RESET_ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}