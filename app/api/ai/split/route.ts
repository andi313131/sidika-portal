import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export const dynamic = 'force-dynamic';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
    try {
        const { rawText } = await request.json();

        if (!rawText || !rawText.trim()) {
            return NextResponse.json({ error: "Teks mentah kosong" }, { status: 400 });
        }

        // 🛠️ MODIFIKASI 1: Update Prompt agar Gemini memilah Abstrak & Metode Penelitian
        const promptContents = `Analisislah teks mentah hasil ekstraksi dokumen berikut dan pisahkan strukturnya menjadi 6 bagian secara akurat sesuai fakta dokumen:
1. title: Judul utama esai/artikel lengkap.
2. authors: Nama penulis, NIM, kelas, atau afiliasi universitas (jika tidak ada, biarkan string kosong ""). Jangan mengarang nama fiktif!
3. abstract: Bagian ringkasan/intisari artikel (Abstrak) baik dalam Bahasa Indonesia atau English. Jika tidak ditemukan, isi "".
4. methodology: Bagian Metode Penelitian yang menjelaskan pendekatan, lokasi, atau metode analisis data. Jika tidak ditemukan, isi "".
5. content: Isi utama/pembahasan esai (mencakup bagian Pendahuluan, hasil pembahasan, hingga Kesimpulan). Pertahankan teks "[📸 Gambar Terlampir]" di posisi aslinya jika ditemukan.
6. references: Bagian Daftar Pustaka, Rujukan, atau Referensi di akhir dokumen (ambil langsung isinya saja tanpa kata judul "DAFTAR PUSTAKA").

Berikut adalah teks mentahnya:
---
${rawText}
---`;

        // Pemanggilan Gemini dengan mengaktifkan Structured Output (JSON)
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: promptContents,
            config: {
                responseMimeType: "application/json",
                // 🛠️ MODIFIKASI 2: Update Schema JSON agar ikut menampung key baru
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        authors: { type: Type.STRING },
                        abstract: { type: Type.STRING },     // 👈 Tambah ini
                        methodology: { type: Type.STRING },  // 👈 Tambah ini
                        content: { type: Type.STRING },
                        references: { type: Type.STRING },
                    },
                    // 🛠️ MODIFIKASI 3: Wajibkan semua key baru masuk barisan validasi
                    required: ["title", "authors", "abstract", "methodology", "content", "references"],
                },
                temperature: 0.2, // Tetap gunakan suhu rendah agar AI patuh & anti-halusinasi
            },
        });

        const aiResponseText = response.text;

        if (!aiResponseText) {
            throw new Error("AI mengembalikan respons kosong");
        }

        const parsedData = JSON.parse(aiResponseText.trim());
        return NextResponse.json(parsedData);

    } catch (error: any) {
        console.error("Error pada AI Split API:", error);
        return NextResponse.json(
            { error: "Gagal memproses pemisahan teks oleh AI", details: error.message },
            { status: 500 }
        );
    }
}