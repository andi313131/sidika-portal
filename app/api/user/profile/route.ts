import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Tangkap data dari form frontend lo (tetap biarkan nama variabel ini)
        const { name, major } = await req.json();

        const userEmail = session.user.email || "";
        const userId = (session.user as any).id;

        // Cari user yang valid
        const targetUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: userId || undefined },
                    { email: userEmail || undefined }
                ]
            }
        });

        if (!targetUser) {
            return NextResponse.json({ error: "Record user tidak ditemukan" }, { status: 404 });
        }

        // 🛠️ SINKRONISASI UTAMA: Petakan variabel form ke kolom asli database lo
        const updatedUser = await prisma.user.update({
            where: { id: targetUser.id },
            data: {
                // name dari form dimasukkan ke kolom fullName database lo
                fullName: name?.trim() || null,
                // major (jurusan Akuntansi) dari form dimasukkan ke kolom studyProgram database lo
                studyProgram: major?.trim() || null,
            } as any,
        });

        return NextResponse.json({ message: "Profil berhasil diperbarui!", user: updatedUser });
    } catch (error: any) {
        console.error("PROFILE_UPDATE_ERROR:", error);
        return NextResponse.json({ error: "Gagal memperbarui profil", details: error.message }, { status: 500 });
    }
}