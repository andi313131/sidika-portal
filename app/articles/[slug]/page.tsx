import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";

const prisma = new PrismaClient();

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function ArticleDetailPage({ params }: PageProps) {
    const { slug } = await params;

    // 🛠️ Panggil kolom abstract dan keywords secara eksplisit dari database
    const article = await prisma.article.findUnique({
        where: { slug: slug },
        select: {
            id: true,
            title: true,
            content: true,
            abstract: true,
            keywords: true,
            coverImageUrl: true,
            createdAt: true,
            slug: true,
            author: {
                select: {
                    name: true,
                    email: true,
                    fullName: true,
                    nim: true,
                    role: true,
                    studyProgram: true
                }
            }
        }
    });

    if (!article) {
        notFound();
    }

    // --- LOGIKA WIKIPEDIA 1: EKSTRAKSI DAFTAR ISI UTAMA (DARI KONTEN UTAMA) ---
    const rawLines = article.content ? article.content.split("\n") : [];
    const tableOfContents: { id: string; text: string; isSub: boolean }[] = [];

    if (article.abstract) {
        tableOfContents.push({ id: "abstract-section", text: "Abstrak", isSub: false });
    }

    rawLines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (
            /^[IVXLCDM]+\.\s+/i.test(trimmed) ||
            /^[A-Z]\.\s+/i.test(trimmed) ||
            trimmed.toUpperCase().startsWith("BAB ")
        ) {
            const id = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "-");
            tableOfContents.push({ id, text: trimmed, isSub: false });
        } else if (/^\d+\.\s+/g.test(trimmed) || trimmed.startsWith("Prinsip") || trimmed.endsWith(":")) {
            const id = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "-");
            tableOfContents.push({ id, text: trimmed, isSub: true });
        }
    });

    if (article.keywords) {
        tableOfContents.push({ id: "references-section", text: "Daftar Pustaka", isSub: false });
    }

    // --- LOGIKA RENDERING KONTEN UTAMA (METODE & PEMBAHASAN + PARSER RICH TEXT SAKTI) ---
    const renderWikipediaContent = () => {
        return rawLines.map((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return null;

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

            if (/^\d+\.\s+/g.test(trimmedLine) || trimmedLine.startsWith("Prinsip") || trimmedLine.endsWith(":")) {
                const id = trimmedLine.toLowerCase().replace(/[^a-z0-9]/g, "-");
                return (
                    <h3 id={id} key={index} className="text-base font-sans font-bold text-gray-900 mt-5 mb-2 scroll-mt-6">
                        {trimmedLine}
                    </h3>
                );
            }

            if (trimmedLine.startsWith("http://") || trimmedLine.startsWith("https://") || trimmedLine.startsWith("/uploads/")) {
                const cleanUrl = trimmedLine.split(" ")[0];
                return (
                    <div key={index} className="my-6 max-w-md mx-auto bg-gray-50 border border-gray-300 p-2 text-center text-xs text-gray-600 shadow-sm rounded-xl">
                        <img src={cleanUrl} alt="Visual Dokumen" className="w-full h-auto max-h-80 object-contain bg-white border border-gray-200 rounded-lg" />
                        <p className="mt-2 italic text-[11px]">
                            Gambar: Sumber visual terintegrated {cleanUrl.startsWith("/") ? "(Penyimpanan Lokal Portal)" : `(${new URL(cleanUrl).hostname})`}
                        </p>
                    </div>
                );
            }

            let parsedLine = trimmedLine
                .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                .replace(/\*([^*]+)\*/g, "<em>$1</em>")
                .replace(/<u>(.*?)<\/u>/gi, "<u>$1</u>");

            return (
                <p
                    key={index}
                    className="text-[15px] font-serif text-gray-950 leading-relaxed mb-4 text-justify tracking-normal select-text"
                    dangerouslySetInnerHTML={{ __html: parsedLine }}
                />
            );
        });
    };

    // --- 🛠️ LOGIKA FIX DAFTAR PUSTAKA: ANGKA ANGKA DIHAPUS MUTLAK ---
    const renderReferences = () => {
        if (!article.keywords) return null;

        const lines = article.keywords.split("\n");
        return lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return null;

            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const parts = trimmed.split(urlRegex);
            const formattedLine = parts.map((part, i) => {
                if (urlRegex.test(part)) {
                    return (
                        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                            {part}
                        </a>
                    );
                }
                return part;
            });

            return (
                // 💡 FIX: Angka [{idx + 1}] dihapus, diganti list-disc (bullet point) atau teks murni rapi
                <li key={idx} className="text-[14px] font-sans text-gray-800 leading-relaxed text-justify mb-3 list-none border-b border-gray-100 pb-2 last:border-0">
                    🔹 {formattedLine}
                </li>
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
                    <span>Status Publikasi Resmi Kampus</span>
                </div>
                <Link href="/dashboard" className="text-blue-600 hover:underline font-medium">
                    ← Kembali ke Dashboard
                </Link>
            </div>

            {/* Layout Utama Berbagi 2 Kolom Khas Wikipedia */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row px-4 md:px-6 py-6 gap-8">

                {/* KOLOM KIRI: DAFTAR ISI STICKY */}
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

                    {/* FOTO COVER UTAMA */}
                    {article.coverImageUrl && (
                        <div className="w-full max-h-[380px] overflow-hidden rounded-2xl mb-6 bg-slate-50 border border-gray-200 shadow-sm shadow-slate-100">
                            <img src={article.coverImageUrl} alt={article.title} className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* STRUCTURE 1: JUDUL UTAMA */}
                    <div id="title-top" className="border-b border-gray-300 pb-3 mb-4">
                        <h1 className="text-2xl md:text-3xl font-serif text-black font-bold tracking-tight uppercase leading-snug">
                            {article.title}
                        </h1>

                        {/* STRUCTURE 2: DATA AUTHOR KECIL PERSIS DI BAWAH JUDUL */}
                        <div className="text-xs text-gray-500 mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl">
                            <span className="font-semibold text-gray-800">✍️ Penulis Kontributor:</span>
                            <span className="font-bold text-slate-900 underline">
                                {article.author?.fullName || article.author?.name || "Mahasiswa"}
                            </span>
                            {article.author?.nim && (
                                <span className="text-gray-400">
                                    ({article.author.role === "lecturer" ? "NIP" : "NIM"}: {article.author.nim})
                                </span>
                            )}
                            {article.author?.studyProgram && (
                                <span className="text-emerald-800 font-medium">• Progdi {article.author.studyProgram}</span>
                            )}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2 italic">Diterbitkan melalui Portal Artikel Ilmiah Universitas Siliwangi, ensiklopedia kebebasan akademik mahasiswa.</p>
                    </div>

                    {/* STRUCTURE 3: KOTAK ABSTRAK */}
                    {article.abstract && (
                        <div id="abstract-section" className="bg-slate-50/60 border border-gray-300 p-5 rounded-2xl mb-6 scroll-mt-6">
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2 text-center">ABSTRAK</h3>
                            <p className="text-[13.5px] font-sans italic text-gray-800 leading-relaxed text-justify px-2 md:px-4">
                                {article.abstract}
                            </p>
                        </div>
                    )}

                    {/* Notifikasi Box Ala Wikipedia */}
                    <div className="bg-gray-50 border-l-4 border-emerald-600 border border-gray-300 p-3 mb-6 text-xs flex items-start gap-3">
                        <span className="text-lg">ℹ️</span>
                        <div>
                            <p className="text-gray-900 font-medium">Artikel gagasan ini telah terikat hak cipta digital milik sivitas akademika Universitas Siliwangi.</p>
                            <p className="text-gray-500 mt-0.5">Struktur teks di bawah divalidasi otomatis oleh sistem penataan logika SIDIKA Portal.</p>
                        </div>
                    </div>

                    {/* STRUCTURE 4: AREA PEMBAHASAN UTAMA & METODE PENELITIAN */}
                    <div className="content-wiki select-text">
                        {renderWikipediaContent()}
                    </div>

                    {/* STRUCTURE 5: DAFTAR PUSTAKA PREMIUM TANPA PENOMORAN ANGKA */}
                    {article.keywords && (
                        <div id="references-section" className="mt-12 border-t-2 border-gray-300 pt-6 scroll-mt-6">
                            <h2 className="text-xl font-serif text-black mb-4 font-normal border-b border-gray-300 pb-1">
                                Daftar Pustaka
                            </h2>
                            <div className="bg-gray-50/40 border border-gray-200 rounded-2xl p-4 md:p-6">
                                {renderReferences()}
                            </div>
                        </div>
                    )}
                </main>

            </div>
        </div>
    );
}