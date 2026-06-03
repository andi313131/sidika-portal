// app/api/articles/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- FUNGSI POST: MENERIMA DATA FINAL YANG SUDAH TERSTRUKTUR DARI FRONTEND ---
export async function POST(req: Request) {
    try {
        const session = await auth();

        // Proteksi Autentikasi: Kembalikan format JSON objek aman
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized", message: "Silakan login terlebih dahulu." }, { status: 401 });
        }

        // 🔥 SINKRON GAMBER: Ikut tangkap coverImageUrl dari frontend (halaman /write)
        const { title, content, coverImageUrl } = await req.json();

        if (!title || !content) {
            return NextResponse.json({ error: "Bad Request", message: "Judul dan konten tidak boleh kosong." }, { status: 400 });
        }

        // Cari ID User berdasarkan email yang sedang aktif login
        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email.toLowerCase() }
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User not found", message: "Data mahasiswa tidak ditemukan di database." }, { status: 404 });
        }

        // Membuat Slug unik menggunakan penanda waktu (Timestamp)
        const generatedSlug = `${title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")}-${Date.now()}`;

        // Simpan langsung teks terstruktur murni ke dalam tabel MySQL lokal dengan status PENDING
        const newArticle = await prisma.article.create({
            data: {
                title: title.trim(),
                slug: generatedSlug,
                content: content,      // Menyimpan teks gabungan (Author + Isi + Dapus)
                coverImageUrl: coverImageUrl || null, // 🔥 SEKARANG MASUK DATABASE: Menyimpan string path /uploads/xxx.png
                status: "PENDING",    // DIKUNCI DI SINI: Status awal pending, butuh approval Andika
                authorId: dbUser.id,
            },
        });

        return NextResponse.json({ message: "Sukses!", articleId: newArticle.id }, { status: 201 });
    } catch (error) {
        console.error("POST_ARTICLE_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error", details: "Gagal menyimpan artikel baru ke database." }, { status: 500 });
    }
}

// --- FUNGSI GET: UNTUK MENAMPILKAN ARTIKEL MILIK USER DI DASHBOARD PRIBADI ---
export async function GET() {
    try {
        const session = await auth();
        // 🔥 FIX FALLBACK: Samakan pakai email NIM penuh admin lo biar gak miss pas testing local
        let userEmail = "253403111123@student.unsil.ac.id";

        if (session?.user?.email) {
            userEmail = session.user.email.toLowerCase();
        }

        // Tarik artikel yang ditulis khusus oleh user yang sedang aktif
        const articles = await prisma.article.findMany({
            where: {
                author: { email: userEmail }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json(articles);
    } catch (error) {
        console.error("GET_ARTICLES_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error", details: "Gagal memuat daftar artikel dashboard." }, { status: 500 });
    }
}