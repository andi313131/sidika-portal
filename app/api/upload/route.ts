// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma"; // 💡 Sesuaikan dengan jalur import prisma client proyek lo

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        // 1. Validasi Autentikasi secara aman
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Tangkap file image dari FormData frontend
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const articleId = formData.get("articleId") as string; // Dikirim dari frontend saat membuat/mengedit artikel

        if (!file) {
            return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
        }

        // 🛠️ PROSES UTAMA: Ubah file biner langsung jadi string Base64 murni
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64String = `data:${file.type};base64,${buffer.toString("base64")}`;

        // 3. Jika payload membawa articleId, langsung update datanya di database Aiven
        if (articleId) {
            await prisma.article.update({
                where: { id: articleId },
                data: { coverImageUrl: base64String }
            });
        }

        // Kembalikan teks base64String agar frontend bisa langsung me-render gambarnya secara instan
        return NextResponse.json({
            success: true,
            imageUrl: base64String
        });

    } catch (error) {
        console.error("UPLOAD_BASE64_ERROR:", error);
        return NextResponse.json({ error: "Gagal memproses unggahan gambar" }, { status: 500 });
    }
}