// app/api/ai/split/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { rawText } = await req.json();
        if (!rawText) {
            return NextResponse.json({ error: "Teks kosong" }, { status: 400 });
        }

        const promptAI = `
            Kamu adalah asisten editor jurnal ilmiah Universitas Siliwangi.
            Tugasmu adalah menganalisis teks hasil ekstraksi dokumen di bawah ini dan memilahnya ke dalam bagian yang tepat sesuai skema JSON yang diminta.

            Aturan Analisis:
            1. title: Ambil judul utama artikel/esai secara lengkap.
            2. authors: Cari nama-nama penulis, NIM, fakultas, atau universitas yang tertera di bagian awal dokumen.
            3. content: Ambil seluruh isi teks dari BAB I PENDAHULUAN sampai bagian PENUTUP/KESIMPULAN. Pastikan setiap judul Bab (seperti I. PENDAHULUAN, B. Kebijakan Fiskal) berada di awal baris baru dan berikan Enter ganda antar-paragraf agar rapi. Perbaiki spasi kata yang pecah.
            4. references: Ambil seluruh daftar pustaka atau referensi rujukan di akhir dokumen. Jangan masukkan kata judul "DAFTAR PUSTAKA"-nya, ambil langsung isi daftarnya saja.

            Berikut teks dokumen yang harus kamu analisis:
            ${rawText}
        `;

        const aiConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    authors: { type: Type.STRING },
                    content: { type: Type.STRING },
                    references: { type: Type.STRING },
                },
                required: ["title", "authors", "content", "references"],
            },
        };

        let extractedText = "";

        try {
            // Tembakan Pertama: Pakai model Flash yang super cepat
            const aiResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: promptAI,
                config: aiConfig
            });
            extractedText = aiResponse.text || "";
        } catch (flashError: any) {
            // Jika kena limit 503 / High Demand, otomatis lempar ke model Pro
            if (flashError?.status === 503 || flashError?.message?.includes("503")) {
                console.warn("Gemini Flash sibuk, beralih ke Gemini Pro...");
                try {
                    const proResponse = await ai.models.generateContent({
                        model: "gemini-2.5-pro",
                        contents: promptAI,
                        config: aiConfig
                    });
                    extractedText = proResponse.text || "";
                } catch (proError) {
                    console.error("Gemini Pro juga sibuk, gunakan fallback lokal.");
                }
            }
        }

        // --- 🛡️ BAN SEREP: JIKA GOOGLE CLOUD DOWN TOTAL, GUNAKAN PARSING LOCAL REGEX ---
        if (!extractedText) {
            console.log("Menjalankan Pemisahan Teks Menggunakan Kode Regex Lokal...");

            // Ambil baris pertama sebagai tebakan judul
            const lines = rawText.split("\n").map((l: string) => l.trim()).filter(Boolean);
            const fallbackTitle = lines[0] || "Dokumen Tanpa Judul";

            // Cari bagian author
            const fallbackAuthors = lines.slice(1, 5).join(", ") || "Penulis Tidak Terdeteksi";

            // Pisahkan isi dan daftar pustaka secara manual
            const splitDapus = rawText.split(/(DAFTAR PUSTAKA|REFERENSI)/i);
            const fallbackContent = splitDapus[0] || rawText;
            const fallbackReferences = splitDapus[2] || "Daftar pustaka tidak terdeteksi otomatis.";

            return NextResponse.json({
                title: fallbackTitle,
                authors: fallbackAuthors,
                content: fallbackContent.trim(),
                references: fallbackReferences.trim()
            });
        }

        // Jika AI sukses mengembalikan data
        const parsedData = JSON.parse(extractedText.trim());
        return NextResponse.json(parsedData);

    } catch (error) {
        console.error("AI_SPLIT_FATAL_ERROR:", error);
        return NextResponse.json({ error: "Gagal memproses dokumen" }, { status: 500 });
    }
}