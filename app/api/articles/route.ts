import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized", message: "Silakan login terlebih dahulu." }, { status: 401 });
        }

        const { title, content, coverImageUrl, abstract, keywords } = await req.json();

        if (!title || !content) {
            return NextResponse.json({ error: "Bad Request", message: "Judul dan konten tidak boleh kosong." }, { status: 400 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email.toLowerCase() }
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User not found", message: "Data mahasiswa tidak ditemukan di database." }, { status: 404 });
        }

        const generatedSlug = `${title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")}-${Date.now()}`;

        const newArticle = await prisma.article.create({
            data: {
                title: title.trim(),
                slug: generatedSlug,
                content: content,
                abstract: abstract ? abstract.trim() : null,
                keywords: keywords ? keywords.trim() : null,
                coverImageUrl: coverImageUrl || null,
                status: "PENDING",
                authorId: dbUser.id,
            },
        });

        return NextResponse.json({ message: "Sukses!", articleId: newArticle.id }, { status: 201 });
    } catch (error) {
        console.error("POST_ARTICLE_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error", details: "Gagal menyimpan artikel baru ke database." }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await auth();
        let userEmail = "253403111123@student.unsil.ac.id";

        if (session?.user?.email) {
            userEmail = session.user.email.toLowerCase();
        }

        const articles = await prisma.article.findMany({
            where: { author: { email: userEmail } },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(articles);
    } catch (error) {
        console.error("GET_ARTICLES_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}