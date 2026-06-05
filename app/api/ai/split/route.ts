import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export const dynamic = 'force-dynamic';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 🛠️ ALGORITMA MANUAL UNTUK WORD (.DOCX)
function parseWordContentManual(rawText: string) {
    const lines = rawText.split("\n").map(line => line.trim()).filter(line => line.length > 0);

    let judul = "";
    let penulis = "";

    if (lines.length > 0) {
        judul = lines[0];
    }

    for (let line of lines) {
        const matchAuthor = line.match(/(?:Ditulis|Disusun|Dibuat)(?:\s+oleh)?\s*[:\-=]?\s*(.*)/i);
        if (matchAuthor && matchAuthor[1]) {
            penulis = matchAuthor[1].trim();
            break;
        }
    }

    const abstrakIdx = rawText.search(/\b(abstrak|abstract)\b/i);
    const metodeIdx = rawText.search(/\b(metode penelitian|metodologi|metodelogi|metode)\b/i);
    const dapusIdx = rawText.search(/\b(daftar pustaka|daftar referensi|referensi|references|rujukan)\b/i);

    let abstrakContent = "";
    if (abstrakIdx !== -1) {
        const endAbstrakIdx = metodeIdx !== -1 ? metodeIdx : (dapusIdx !== -1 ? dapusIdx : rawText.length);
        abstrakContent = rawText.substring(abstrakIdx, endAbstrakIdx).replace(/\b(abstrak|abstract)\b/i, "").trim();
    }

    let metodeContent = "";
    if (metodeIdx !== -1) {
        const endMetodeIdx = dapusIdx !== -1 ? dapusIdx : rawText.length;
        metodeContent = rawText.substring(metodeIdx, endMetodeIdx).replace(/\b(metode penelitian|metodologi|metodelogi|metode)\b/i, "").trim();
    }

    let referencesContent = "";
    if (dapusIdx !== -1) {
        referencesContent = rawText.substring(dapusIdx).replace(/\b(daftar pustaka|daftar referensi|referensi|references|rujukan)\b/i, "").trim();
    }

    let pembahasanContent = rawText;
    if (dapusIdx !== -1) {
        pembahasanContent = pembahasanContent.substring(0, dapusIdx);
    }
    if (abstrakIdx !== -1 && abstrakContent) {
        pembahasanContent = pembahasanContent.replace(rawText.substring(abstrakIdx, metodeIdx !== -1 ? metodeIdx : dapusIdx), "");
    }
    if (metodeIdx !== -1 && metodeContent) {
        pembahasanContent = pembahasanContent.replace(rawText.substring(metodeIdx, dapusIdx !== -1 ? dapusIdx : rawText.length), "");
    }
    if (judul) {
        pembahasanContent = pembahasanContent.replace(judul, "");
    }

    return {
        title: judul.trim(),
        authors: penulis.trim(),
        abstract: abstrakContent.trim(),
        methodology: metodeContent.trim(),
        content: pembahasanContent.trim(),
        references: referencesContent.trim()
    };
}

// 🚀 HANDLER UTAMA API REQ SPLIT
export async function POST(request: Request) {
    try {
        const { rawText, fileType } = await request.json();

        if (!rawText || !rawText.trim()) {
            return NextResponse.json({ error: "Teks mentah kosong" }, { status: 400 });
        }

        // 💡 CEK DI SINI: Kalau tipenya docx, potong manual, bypass AI sepenuhnya!
        if (fileType === "docx") {
            const manualData = parseWordContentManual(rawText);
            return NextResponse.json(manualData);
        }

        // 💡 KALO PDF: Baru gas lempar ke Gemini 2.5 Flash
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

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: promptContents,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        authors: { type: Type.STRING },
                        abstract: { type: Type.STRING },
                        methodology: { type: Type.STRING },
                        content: { type: Type.STRING },
                        references: { type: Type.STRING },
                    },
                    required: ["title", "authors", "abstract", "methodology", "content", "references"],
                },
                temperature: 0.2,
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
        if (error.status === 503 || error.message?.includes("high demand")) {
            return NextResponse.json(
                { error: "Server AI Sedang Padat", details: "Antrean server Gemini penuh. Sila coba beberapa saat lagi!" },
                { status: 503 }
            );
        }
        return NextResponse.json({ error: "Gagal memproses pemisahan teks", details: error.message }, { status: 500 });
    }
}