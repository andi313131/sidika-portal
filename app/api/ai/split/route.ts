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
            // Ganti bagian systemInstruction di app/api/ai/split/route.ts lo dengan ini:
            systemInstruction: `Anda adalah mesin pengekstrak teks jurnal yang kaku, dingin, dan patuh. Tugas Anda HANYA memindahkan kata yang BENAR-BENAR TERTULIS secara fisik pada dokumen ke dalam skema JSON.

ATURAN ANTI-HALUSINASI MUTLAK:
1. DILARANG KERAS MENGARANG, MENEBAK, ATAU MEMBUAT NAMA ORANG, NIM, DAN UNIVERSITAS FIKTIF!
2. Jika tidak ada nama penulis yang tertulis jelas di awal teks, isi kolom "authors" dengan string kosong "" saja! Jangan pernah mengarang nama seperti "Andika", "Budi", atau nama umum lainnya jika tidak ada di teks asli.
3. Jika judul tidak ditemukan secara gamblang di baris-baris awal, isi "title" dengan kalimat "Judul Tidak Terdeteksi". Dilarang membuat judul karangan sendiri.
4. Jangan menyimpulkan atau berasumsi. Jika teks yang diberikan berantakan atau kosong, kosongkan nilai propertinya.`
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