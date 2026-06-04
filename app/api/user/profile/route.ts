import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// 1. Ambil Data Profil Saat Halaman Dimuat
export async function GET() {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userEmail = session.user.email || "";
        const userId = (session.user as any).id;

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: userId || undefined },
                    { email: userEmail || undefined }
                ]
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error: any) {
        console.error("GET_PROFILE_ERROR:", error);
        return NextResponse.json({ error: "Gagal memuat profil" }, { status: 500 });
    }
}

// 2. Simpan Permanen Data Profil (Sekali Kunci)
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

        // 🔒 EKSEKUSI SIMPAN PERMANEN KESELURUHAN FIELD SKEMA LO
        const updatedUser = await prisma.user.update({
            where: { id: targetUser.id },
            data: {
                fullName: fullName?.trim() || null,
                nim: identityNumber?.trim() || null, // NIM/NIP lo simpan permanen di sini
                faculty: faculty?.trim() || null,
                studyProgram: studyProgram?.trim() || null,
                role: userType === "Dosen" ? "lecturer" : "student" // Mengunci status di field role
            }
        });

        return NextResponse.json({ message: "Profil permanen berhasil disimpan!", user: updatedUser });
    } catch (error: any) {
        console.error("PROFILE_UPDATE_ERROR:", error);
        return NextResponse.json({ error: "Gagal memperbarui profil", details: error.message }, { status: 500 });
    }
}