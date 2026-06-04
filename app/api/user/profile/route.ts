import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { fullName, identityNumber, userType, faculty, studyProgram } = await req.json();
        const userEmail = session.user.email || "";
        const userId = (session.user as any).id;

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

        // 🔒 PROTEKSI BACKEND PERMANEN KETAT:
        // Jika nama lengkap atau NIM sudah ada isinya, blokir upaya pengubahan!
        if (targetUser.fullName && targetUser.fullName !== fullName) {
            return NextResponse.json({ error: "Nama Lengkap sudah dikunci permanen dan tidak dapat diubah!" }, { status: 400 });
        }
        if (targetUser.nim && targetUser.nim !== identityNumber) {
            return NextResponse.json({ error: "NIM/NIP sudah dikunci permanen dan tidak dapat diubah!" }, { status: 400 });
        }

        // Jalankan update untuk data yang boleh diubah (atau pengisian pertama kali)
        const updatedUser = await prisma.user.update({
            where: { id: targetUser.id },
            data: {
                fullName: targetUser.fullName ? undefined : (fullName?.trim() || null), // Isi cuma jika masih kosong
                nim: targetUser.nim ? undefined : (identityNumber?.trim() || null),   // Isi cuma jika masih kosong
                faculty: faculty?.trim() || null,
                studyProgram: studyProgram?.trim() || null,
                role: userType === "Dosen" ? "lecturer" : "student"
            }
        });

        return NextResponse.json({ message: "Profil permanen berhasil disimpan!", user: updatedUser });
    } catch (error: any) {
        console.error("PROFILE_UPDATE_ERROR:", error);
        return NextResponse.json({ error: "Gagal memperbarui profil", details: error.message }, { status: 500 });
    }
}