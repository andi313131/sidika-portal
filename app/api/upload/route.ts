// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
    try {
        const session = await auth();

        // 1. Proteksi Autentikasi: Ganti return biasa dengan NextResponse.json agar aman di frontend
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized", message: "Silakan login terlebih dahulu untuk mengunggah berkas." },
                { status: 401 }
            );
        }

        // 2. Tangkap data FormData
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "Bad Request", message: "File gambar tidak ditemukan atau korup." },
                { status: 400 }
            );
        }

        // 3. Validasi tipe file gambar
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "Invalid File Type", message: "Format tidak didukung! Harus berupa file gambar (.jpg, .png, .jpeg)." },
                { status: 400 }
            );
        }

        // 4. Proses file ke buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Buat nama file unik
        const fileExtension = path.extname(file.name) || ".png";
        const uniqueFileName = `cover-${Date.now()}${fileExtension}`;

        // Target folder lokal: public/uploads
        const uploadDir = path.join(process.cwd(), "public", "uploads");

        // Amankan pembuatan folder secara asinkronus
        await mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, uniqueFileName);

        // 5. Tulis file fisik ke harddisk local proyek
        await writeFile(filePath, buffer);

        // Berhasil! Kembalikan path URL matang untuk disimpan ke MySQL
        return NextResponse.json({ url: `/uploads/${uniqueFileName}` }, { status: 200 });

    } catch (error) {
        console.error("UPLOAD_ERROR_LOG:", error);
        // Pastikan block catch selalu mengembalikan format JSON agar tidak memicu 'Unexpected end of JSON'
        return NextResponse.json(
            { error: "Internal Server Error", message: "Server gagal menyimpan gambar ke folder lokal." },
            { status: 500 }
        );
    }
}