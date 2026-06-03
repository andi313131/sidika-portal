// app/api/public-articles/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        // 🔥 AMAN & SINKRON: Keluarkan semua artikel yang PUBLISHED dan PENDING
        // Supaya halaman utama bisa ambil yang PUBLISHED, dan Dashboard lo bisa menyaring yang PENDING
        const publicArticles = await prisma.article.findMany({
            where: {
                status: {
                    in: ["PUBLISHED", "PENDING"]
                }
            },
            include: {
                author: true // Supaya nama penulis asli mahasiswa UNSIL kelihatan
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json(publicArticles);
    } catch (error) {
        console.error("PUBLIC_GET_ERROR:", error);
        return NextResponse.json({ error: "Gagal memuat feed publik" }, { status: 500 });
    }
}