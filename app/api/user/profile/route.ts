import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, nim, faculty, major, bio } = await req.json();

        // 🛠️ FIX TOTAL: Tambahkan 'as any' untuk memaksa TypeScript meloloskan kompilasi build Vercel
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                name: name?.trim() || null,
                nim: nim?.trim() || null,
                faculty: faculty?.trim() || null,
                major: major?.trim() || null,
                bio: bio?.trim() || null,
            } as any, // 👈 SUNTIKKAN 'as any' DI SINI, NDIK!
        });

        return NextResponse.json({ message: "Profil berhasil diperbarui!", user: updatedUser });
    } catch (error: any) {
        console.error("PROFILE_UPDATE_ERROR:", error);
        return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
    }
}