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

        // 🔒 PROTEKSI BACKEND YANG SUDAH DIJINAKKAN:
        // Sistem hanya mengunci kalau user sudah pernah sukses menyimpan data nama asli mereka sendiri 
        // (Mendeteksi apakah nama lama mengandung format default Google '_Unsil' atau tidak)
        const isDefaultGoogleName = targetUser.fullName?.includes("_Unsil");

        if (targetUser.fullName && !isDefaultGoogleName && targetUser.fullName !== fullName) {
            return NextResponse.json({ error: "Nama Lengkap sudah dikunci permanen dan tidak dapat diubah!" }, { status: 400 });
        }

        // NIM/NIP dikunci jika sudah terisi dan nilainya berbeda
        if (targetUser.nim && targetUser.nim !== identityNumber) {
            return NextResponse.json({ error: "NIM/NIP sudah dikunci permanen dan tidak dapat diubah!" }, { status: 400 });
        }

        // Eksekusi update data permanen
        const updatedUser = await prisma.user.update({
            where: { id: targetUser.id },
            data: {
                fullName: fullName?.trim() || null,
                nim: identityNumber?.trim() || null,
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