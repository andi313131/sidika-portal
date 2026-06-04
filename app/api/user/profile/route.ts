import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// 🛠️ FUNGSI GET: Mengambil data profil mendalam secara aman
export async function GET() {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userEmail = session.user.email || "";
        const userId = (session.user as any).id;

        // Cari berdasarkan ID jika ada, kalau tidak ada baru cari berdasarkan email
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: userId || undefined },
                    { email: userEmail || undefined }
                ]
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User tidak ditemukan di database" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error: any) {
        console.error("GET_PROFILE_ERROR:", error);
        return NextResponse.json({ error: "Gagal memuat profil", details: error.message }, { status: 500 });
    }
}

// 🛠️ FUNGSI PUT: Memperbarui data profil secara fleksibel (Anti-Gagal)
export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, nim, faculty, major, bio } = await req.json();

        const userEmail = session.user.email || "";
        const userId = (session.user as any).id;

        // Ambil data user terlebih dahulu untuk memastikan baris data mana yang mau di-update
        const targetUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: userId || undefined },
                    { email: userEmail || undefined }
                ]
            }
        });

        if (!targetUser) {
            return NextResponse.json({ error: "Record user tidak ditemukan untuk diperbarui" }, { status: 404 });
        }

        // Eksekusi update langsung ke ID data yang sudah pasti valid dan ketemu
        const updatedUser = await prisma.user.update({
            where: { id: targetUser.id },
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
        return NextResponse.json({ error: "Gagal memperbarui profil", details: error.message }, { status: 500 });
    }
}