// app/api/articles/approve/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(req: Request) {
    try {
        const session = await auth();

        // 🔥 KUNCI AMAN: Menggunakan email NIM asli Andika sebagai satu-satunya Admin
        const adminEmail = "253403111123@student.unsil.ac.id";

        // Validasi ketat: Jika email yang login tidak sama dengan NIM admin, tendang langsung (403 Forbidden)
        if (!session || !session.user?.email || session.user.email.toLowerCase() !== adminEmail.toLowerCase()) {
            return NextResponse.json(
                { error: "Forbidden", message: "Akses ditolak! Hanya Andika (Admin) yang bisa menyetujui artikel." },
                { status: 403 }
            );
        }

        const { articleId } = await req.json();
        if (!articleId) {
            return NextResponse.json({ error: "Bad Request", message: "ID Artikel tidak ditemukan." }, { status: 400 });
        }

        // Jalankan perintah update status ke database MySQL lokal via Prisma
        const approvedArticle = await prisma.article.update({
            where: { id: articleId },
            data: { status: "PUBLISHED" } // Mengubah status dari PENDING menjadi PUBLISHED
        });

        return NextResponse.json({
            message: "Artikel berhasil disetujui dan resmi terbit!",
            article: approvedArticle
        }, { status: 200 });

    } catch (error) {
        console.error("APPROVE_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error", details: "Gagal memproses persetujuan artikel." }, { status: 500 });
    }
}