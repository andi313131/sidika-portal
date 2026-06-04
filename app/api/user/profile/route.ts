import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// 🛠️ FUNGSI BARU: Untuk Mengambil Data Profil Mendalam dari Database
export async function GET() {
    try {
        const session = await auth();
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Cari user secara mendalam ke database berdasarkan email session aktif
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        return NextResponse.json(user);
    } catch (error: any) {
        console.error("GET_PROFILE_ERROR:", error);
        return NextResponse.json({ error: "Gagal memuat profil" }, { status: 500 });
    }
}

// Ini fungsi PUT lo yang kemarin (biarkan tetap ada di bawahnya)
export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, nim, faculty, major, bio } = await req.json();

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                name: name?.trim() || null,
                nim: nim?.trim() || null,
                faculty: faculty?.trim() || null,
                major: major?.trim() || null,
                bio: bio?.trim() || null,
            } as any,
        });

        return NextResponse.json({ message: "Profil berhasil diperbarui!", user: updatedUser });
    } catch (error: any) {
        console.error("PROFILE_UPDATE_ERROR:", error);
        return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
    }
}