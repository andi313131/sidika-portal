// app/api/ai/split/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { GoogleGenAI, Type } from "@google/genai";

export const dynamic = 'force-dynamic';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
    try {
        // 1. Pengecekan Autentikasi Menggunakan Auth.js v5
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { rawText } = await req.json();
        if (!rawText) {
            return NextResponse.json({ error: "Teks kosong" }, { status: 400 });
        }

        // 🛡️ TUNING STRUKTUR: Pindahkan instruksi ketat ke dalam config utama
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
            // Masukkan aturan pembatas halusinasi di sini agar Gemini patuh mutlak
            systemInstruction: `Anda adalah AI asisten jurnal ilmiah yang sangat patuh dan akurat. 
Tugas Anda adalah memilah teks mentah hasil ekstrak dokumen menjadi struktur JSON yang ketat sesuai fakta dokumen.

ATURAN MUTLAK PENJINAK HALUSINASI:
1. DILARANG KERAS mengada-ada, berhalusinasi, atau menambahkan informasi, judul, nama orang, universitas, atau topik fiktif yang tidak tertera di dalam teks mentah yang diberikan!
2. Ambil judul utama dari dokumen secara lengkap apa adanya untuk properti "title". Jika tidak ada judul jelas, ambil baris pertama dokumen. Jangan mengarang judul baru!
3. Cari nama-nama penulis, NIM, fakultas, atau universitas di awal dokumen untuk "authors". Jika tidak ditemukan, biarkan string tersebut kosong (""). Jangan memunculkan nama fiktif!
4. "content" harus berisi seluruh teks dari awal BAB PENDAHULUAN sampai bagian KESIMPULAN/PENUTUP murni dari dokumen asli. Pastikan berikan Enter ganda antar-paragraf dan rapikan spasi kata yang pecah.
5. "references" berisi seluruh daftar pustaka di akhir dokumen. Ambil langsung isinya saja tanpa memasukkan kata judul "DAFTAR PUSTAKA". Jika kosong, isi dengan "".`
        };

        // Bungkus input dokumen yang dikirim dari frontend lo
        const runtimeContent = `Berikut adalah teks dokumen asli yang harus Anda pilah tanpa rekayasa:\n\n${rawText}`;

        let extractedText = "";

        try {
            // Tembakan Pertama: Gunakan model Flash (Super Cepat)
            const aiResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: runtimeContent,
                config: aiConfig
            });
            extractedText = aiResponse.text || "";
        } catch (flashError: any) {
            console.warn("Gemini Flash sibuk atau kendala, beralih ke Gemini Pro...", flashError?.message);
            try {
                // Tembakan Kedua: Fallback ke Pro jika Flash terkendala
                const proResponse = await ai.models.generateContent({
                    model: "gemini-2.5-pro",
                    contents: runtimeContent,
                    config: aiConfig
                });
                extractedText = proResponse.text || "";
            } catch (proError) {
                console.error("Gemini Pro juga sibuk, gunakan fallback lokal.");
            }
        }

        // --- 🛡️ BAN SEREP: RUNTIME FALLBACK REGEX LOKAL ---
        if (!extractedText) {
            console.log("Menjalankan Pemisahan Teks Menggunakan Kode Regex Lokal...");
            const lines = rawText.split("\n").map((l: string) => l.trim()).filter(Boolean);
            const fallbackTitle = lines[0] || "Dokumen Tanpa Judul";
            const fallbackAuthors = lines.slice(1, 5).join(", ") || "";

            const splitDapus = rawText.split(/(DAFTAR PUSTAKA|REFERENSI)/i);
            const fallbackContent = splitDapus[0] || rawText;
            const fallbackReferences = splitDapus[2] || "";

            return NextResponse.json({
                title: fallbackTitle,
                authors: fallbackAuthors,
                content: fallbackContent.trim(),
                references: fallbackReferences.trim()
            });
        }

        const parsedData = JSON.parse(extractedText.trim());
        return NextResponse.json(parsedData);

    } catch (error) {
        console.error("AI_SPLIT_FATAL_ERROR:", error);
        return NextResponse.json({ error: "Gagal memproses dokumen" }, { status: 500 });
    }
}