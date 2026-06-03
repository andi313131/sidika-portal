// app/articles/[slug]/page.tsx
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";

const prisma = new PrismaClient();

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function ArticleDetailPage({ params }: PageProps) {
    const { slug } = await params;

    const article = await prisma.article.findUnique({
        where: { slug: slug },
        include: { author: true }
    });

    if (!article) {
        notFound();
    }

    // --- LOGIKA WIKIPEDIA 1: EKSTRAKSI DAFTAR ISI OTOMATIS (SINKRON & TOLERAN) ---
    const rawLines = article.content ? article.content.split("\n") : [];
    const tableOfContents: { id: string; text: string; isSub: boolean }[] = [];

    rawLines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Mendeteksi Bab Besar Romawi, Abjad Tunggal (A., B., C.), atau kata "BAB" tanpa sensitif huruf besar-kecil
        if (
            /^[IVXLCDM]+\.\s+/i.test(trimmed) ||
            /^[A-Z]\.\s+/i.test(trimmed) ||
            trimmed.toUpperCase().startsWith("BAB ")
        ) {
            const id = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "-");
            tableOfContents.push({ id, text: trimmed, isSub: false });
        }
        // Deteksi Sub-Bab (Angka numerik biasa atau kondisi khusus)
        else if (/^\d+\.\s+/g.test(trimmed) || trimmed.startsWith("Prinsip") || trimmed.endsWith(":")) {
            const id = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "-");
            tableOfContents.push({ id, text: trimmed, isSub: true });
        }
    });

    // --- LOGIKA WIKIPEDIA 2: RENDERING ISI KONTEN UTAMA ---
    const renderWikipediaContent = () => {
        return rawLines.map((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return null;

            // 1. Render Bab Utama (H2 ala Wikipedia + Garis Pembatas Akurat)
            if (
                /^[IVXLCDM]+\.\s+/i.test(trimmedLine) ||
                /^[A-Z]\.\s+/i.test(trimmedLine) ||
                trimmedLine.toUpperCase().startsWith("BAB ")
            ) {
                const id = trimmedLine.toLowerCase().replace(/[^a-z0-9]/g, "-");
                return (
                    <h2 id={id} key={index} className="text-[22px] font-serif text-black mt-8 mb-3 border-b border-gray-300 pb-1 font-normal scroll-mt-6 tracking-tight">
                        {trimmedLine}
                    </h2>
                );
            }

            // 2. Render Sub-Bab (H3)
            if (/^\d+\.\s+/g.test(trimmedLine) || trimmedLine.startsWith("Prinsip") || trimmedLine.endsWith(":")) {
                const id = trimmedLine.toLowerCase().replace(/[^a-z0-9]/g, "-");
                return (
                    <h3 id={id} key={index} className="text-base font-sans font-bold text-gray-900 mt-5 mb-2 scroll-mt-6">
                        {trimmedLine}
                    </h3>
                );
            }

            // 3. Render Gambar Ilustrasi (Mendukung link internet DAN file upload lokal /uploads/)
            if (trimmedLine.startsWith("http://") || trimmedLine.startsWith("https://") || trimmedLine.startsWith("/uploads/")) {
                const cleanUrl = trimmedLine.split(" ")[0];
                return (
                    <div key={index} className="my-6 max-w-md mx-auto bg-gray-50 border border-gray-300 p-2 text-center text-xs text-gray-600 shadow-sm rounded-xl">
                        <img src={cleanUrl} alt="Visual Dokumen" className="w-full h-auto max-h-80 object-contain bg-white border border-gray-200 rounded-lg" />
                        <p className="mt-2 italic text-[11px]">
                            Gambar: Sumber visual terintegrasi {cleanUrl.startsWith("/") ? "(Penyimpanan Lokal Portal)" : `(${new URL(cleanUrl).hostname})`}
                        </p>
                    </div>
                );
            }

            // 4. Paragraf Utama (Font Serif khas Wikipedia, Spasi Rapat Proporsional, Justify)
            return (
                <p key={index} className="text-[15px] font-serif text-gray-950 leading-relaxed mb-4 text-justify tracking-normal">
                    {trimmedLine}
                </p>
            );
        });
    };

    return (
        <div className="min-h-screen bg-white text-black font-sans antialiased selection:bg-blue-100">
            {/* Top Bar Informasi Minimalis */}
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-2.5 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-800">UNSIL Portal</span>
                    <span>•</span>
                    <span>Diterbitkan oleh: <strong>{article.author?.name || "Mahasiswa"}</strong></span>
                </div>
                <Link href="/dashboard" className="text-blue-600 hover:underline font-medium">
                    ← Kembali ke Dashboard
                </Link>
            </div>

            {/* Layout Utama Berbagi 2 Kolom Khas Wikipedia */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row px-4 md:px-6 py-6 gap-8">

                {/* KOLOM KIRI: DAFTAR ISI (Statis / Sticky pas di-scroll) */}
                <aside className="w-full md:w-56 shrink-0 md:sticky md:top-6 h-fit bg-gray-50/80 border border-gray-200 rounded p-4">
                    <h3 className="text-sm font-bold text-gray-800 border-b border-gray-300 pb-1.5 mb-2 flex items-center justify-between">
                        <span>Daftar isi</span>
                        <span className="text-[11px] text-blue-600 font-normal cursor-pointer hover:underline">sembunyikan</span>
                    </h3>
                    <ul className="space-y-2 text-xs">
                        <li className="font-semibold text-blue-600 hover:underline">
                            <a href="#title-top">Awal</a>
                        </li>
                        {tableOfContents.map((item, idx) => (
                            <li
                                key={idx}
                                className={`${item.isSub ? "pl-4 text-gray-600" : "font-medium text-blue-600"} hover:underline transition-all`}
                            >
                                <a href={`#${item.id}`}>{item.text}</a>
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* KOLOM KANAN: KONTEN ARTIKEL UTAMA */}
                <main className="flex-1 max-w-4xl border-l border-gray-200/60 md:pl-8">

                    {/* FOTO COVER UTAMA ESAL (Mejeng Gagah di Paling Atas) */}
                    {article.coverImageUrl && (
                        <div className="w-full max-h-[380px] overflow-hidden rounded-2xl mb-6 bg-slate-50 border border-gray-200 shadow-sm shadow-slate-100">
                            <img
                                src={article.coverImageUrl}
                                alt={article.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div id="title-top" className="border-b border-gray-300 pb-1 mb-4">
                        <h1 className="text-3xl md:text-4xl font-serif text-black font-normal tracking-tight">
                            {article.title}
                        </h1>
                        <p className="text-xs text-gray-500 mt-2">Dari Portal Artikel Ilmiah Universitas Siliwangi, ensiklopedia bebas mahasiswa.</p>
                    </div>

                    {/* Notifikasi Box Ala Wikipedia */}
                    <div className="bg-gray-50 border-l-4 border-blue-600 border border-gray-300 p-3 mb-6 text-xs flex items-start gap-3">
                        <span className="text-lg">ℹ️</span>
                        <div>
                            <p className="text-gray-900">Artikel gagasan ini sedang dalam tahap <strong>akselerasi strategis</strong>.</p>
                            <p className="text-gray-500 mt-0.5">Mohon bantu kembangkan dengan menambahkan referensi terpercaya dari DJP atau Kemenaker.</p>
                        </div>
                    </div>

                    {/* Area Teks Olahan Wikipedia */}
                    <div className="content-wiki select-text">
                        {renderWikipediaContent()}
                    </div>
                </main>

            </div>
        </div>
    );
}