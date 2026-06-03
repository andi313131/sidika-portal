// app/api/articles/delete/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(req: Request) {
    try {
        const session = await auth();

        // 1. Proteksi Autentikasi
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { articleId } = await req.json();
        if (!articleId) {
            return NextResponse.json({ error: "Bad Request", message: "ID Artikel wajib diisi." }, { status: 400 });
        }

        // 2. Ambil data artikel yang mau dihapus untuk dicek kepemilikannya
        const targetArticle = await prisma.article.findUnique({
            where: { id: articleId },
            include: { author: true }
        });

        if (!targetArticle) {
            return NextResponse.json({ error: "Not Found", message: "Artikel tidak ditemukan." }, { status: 404 });
        }

        // 3. Pengecekan Hak Akses: Hanya Admin (lo) ATAU Penulis aslinya yang boleh hapus
        const adminEmail = "253403111123@student.unsil.ac.id";
        const userEmail = session.user.email.toLowerCase();

        const isOwner = targetArticle.author.email.toLowerCase() === userEmail;
        const isAdmin = userEmail === adminEmail.toLowerCase();

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: "Forbidden", message: "Kamu tidak berhak menghapus artikel ini!" }, { status: 403 });
        }

        // 4. Eksekusi Hapus dari Database
        await prisma.article.delete({
            where: { id: articleId }
        });

        return NextResponse.json({ message: "Artikel berhasil dihapus permanen!" }, { status: 200 });

    } catch (error) {
        console.error("DELETE_ARTICLE_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error", details: "Gagal menghapus data dari database." }, { status: 500 });
    }
}