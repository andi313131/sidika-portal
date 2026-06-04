import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
    try {
        // 1. Cek autentikasi session user yang sedang login via Auth.js
        const session = await auth();
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Tangkap payload body data dari frontend
        const { name, nim, faculty, major, bio } = await req.json();

        // 3. Update data ke database menggunakan prisma berdasarkan email user yang aktif
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                name: name?.trim() || null,
                nim: nim?.trim() || null,
                faculty: faculty?.trim() || null,
                major: major?.trim() || null,
                bio: bio?.trim() || null,
            },
        });

        return NextResponse.json({ message: "Profil berhasil diperbarui!", user: updatedUser });
    } catch (error: any) {
        console.error("PROFILE_UPDATE_ERROR:", error);
        return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
    }
}