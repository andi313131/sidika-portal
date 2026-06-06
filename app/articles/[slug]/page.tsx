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

    const cleanHeadingText = (text: string) => {
        return text
            .replace(/^BAB\s+[IVXLCDM]+\.?\s*/i, "")
            .replace(/^[IVXLCDM]+\.\s+/i, "")
            .replace(/^[A-Z]\.\s+/i, "")
            .replace(/崩溃|^\d+\.\s+/g, "")
            .trim();
    };

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
            const cleanText = cleanHeadingText(trimmed);
            const id = cleanText.toLowerCase().replace(/[^a-z0-9]/g, "-");
            tableOfContents.push({ id, text: cleanText, isSub: false });
        } else if (/^\d+\.\s+/g.test(trimmed) || trimmed.startsWith("Prinsip") || trimmed.endsWith(":")) {
            const cleanText = cleanHeadingText(trimmed);
            const id = cleanText.toLowerCase().replace(/[^a-z0-9]/g, "-");
            tableOfContents.push({ id, text: cleanText, isSub: true });
        }
    });

    if (article.keywords) {
        tableOfContents.push({ id: "references-section", text: "Daftar Pustaka", isSub: false });
    }

    // --- LOGIKA RENDERING KONTEN UTAMA ---
    const renderWikipediaContent = () => {
        return rawLines.map((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return null;

            if (
                /^[IVXLCDM]+\.\s+/i.test(trimmedLine) ||
                /^[A-Z]\.\s+/i.test(trimmedLine) ||
                trimmedLine.toUpperCase().startsWith("BAB ")
            ) {
                const cleanText = cleanHeadingText(trimmedLine);
                const id = cleanText.toLowerCase().replace(/[^a-z0-9]/g, "-");
                return (
                    <h2
                        id={id}
                        key={index}
                        className="text-xl font-serif text-stone-900 mt-10 mb-3 pb-2 border-b border-stone-200 font-semibold scroll-mt-20 tracking-tight"
                    >
                        {cleanText}
                    </h2>
                );
            }

            if (/^\d+\.\s+/g.test(trimmedLine) || trimmedLine.startsWith("Prinsip") || trimmedLine.endsWith(":")) {
                const cleanText = cleanHeadingText(trimmedLine);
                const id = cleanText.toLowerCase().replace(/[^a-z0-9]/g, "-");
                return (
                    <h3
                        id={id}
                        key={index}
                        className="text-base font-sans font-semibold text-stone-800 mt-6 mb-2 scroll-mt-20"
                    >
                        {cleanText}
                    </h3>
                );
            }

            if (trimmedLine.startsWith("http://") || trimmedLine.startsWith("https://") || trimmedLine.startsWith("/uploads/")) {
                const cleanUrl = trimmedLine.split(" ")[0];
                return (
                    <figure key={index} className="my-8 max-w-lg mx-auto">
                        <div className="bg-stone-50 border border-stone-200 rounded-xl overflow-hidden">
                            <img
                                src={cleanUrl}
                                alt="Visual Dokumen"
                                className="w-full h-auto max-h-80 object-contain bg-white"
                            />
                        </div>
                        <figcaption className="mt-2 text-center text-[11px] text-stone-400 italic">
                            Gambar: Sumber visual terintegrated {cleanUrl.startsWith("/") ? "(Penyimpanan Lokal Portal)" : `(${new URL(cleanUrl).hostname})`}
                        </figcaption>
                    </figure>
                );
            }

            let parsedLine = trimmedLine
                .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                .replace(/\*([^*]+)\*/g, "<em>$1</em>")
                .replace(/<u>(.*?)<\/u>/gi, "<u>$1</u>");

            return (
                <p
                    key={index}
                    className="text-[15px] font-serif text-stone-800 leading-[1.9] mb-4 text-justify select-text"
                    dangerouslySetInnerHTML={{ __html: parsedLine }}
                />
            );
        });
    };

    // --- LOGIKA DAFTAR PUSTAKA ---
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
                        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[#009900] hover:underline break-all">
                            {part}
                        </a>
                    );
                }
                return part;
            });

            return (
                <li
                    key={idx}
                    className="text-[13.5px] font-sans text-stone-700 leading-relaxed mb-3 pb-3 border-b border-stone-100 last:border-0 last:mb-0 last:pb-0 flex gap-2"
                >
                    <span className="text-[#009900] mt-0.5 shrink-0">▸</span>
                    <span>{formattedLine}</span>
                </li>
            );
        });
    };

    const publishDate = new Date(article.createdAt).toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric"
    });

    return (
        <div className="min-h-screen bg-[#F8F7F2] text-stone-900 font-sans antialiased">

            {/* ─── TOP BAR ─────────────────────────────────────────────────── */}
            <div className="bg-[#009900] h-0.5 w-full" />
            <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200/80">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="flex items-center gap-2 group"
                        >
                            <div className="w-6 h-6 rounded bg-[#009900] flex items-center justify-center shrink-0">
                                <span className="text-white text-[9px] font-bold">SD</span>
                            </div>
                            <span className="text-sm font-bold text-stone-800 group-hover:text-[#009900] transition-colors">SIDIKA</span>
                        </Link>
                        <span className="text-stone-300 text-sm">/</span>
                        <span className="text-xs text-stone-400 truncate max-w-[220px] hidden sm:block">{article.title}</span>
                    </div>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        Dashboard
                    </Link>
                </div>
            </header>

            {/* ─── MAIN LAYOUT ─────────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row px-4 md:px-6 py-8 gap-8">

                {/* ── LEFT SIDEBAR: TABLE OF CONTENTS ── */}
                <aside className="w-full lg:w-60 shrink-0 lg:sticky lg:top-20 h-fit">
                    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                        {/* TOC header */}
                        <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
                            <div className="w-1 h-4 rounded-full bg-[#009900]" />
                            <span className="text-xs font-bold text-stone-700 uppercase tracking-widest">Daftar Isi</span>
                        </div>

                        {/* TOC list */}
                        <nav className="p-3">
                            <ul className="space-y-0.5">
                                <li>
                                    <a
                                        href="#title-top"
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-[#009900] hover:bg-green-50 transition-colors"
                                    >
                                        <span className="w-1 h-1 rounded-full bg-[#009900] shrink-0" />
                                        Awal
                                    </a>
                                </li>
                                {tableOfContents.map((item, idx) => (
                                    <li key={idx}>
                                        <a
                                            href={`#${item.id}`}
                                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-stone-50 transition-colors ${item.isSub
                                                    ? "pl-5 text-stone-400 hover:text-stone-600"
                                                    : "text-stone-600 font-medium hover:text-stone-900"
                                                }`}
                                        >
                                            {!item.isSub && (
                                                <span className="w-1 h-1 rounded-full bg-stone-300 shrink-0" />
                                            )}
                                            {item.isSub && (
                                                <span className="w-px h-3 bg-stone-200 shrink-0 ml-1" />
                                            )}
                                            <span className="line-clamp-2">{item.text}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>

                    {/* Publication info card */}
                    <div className="mt-3 bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Info Publikasi</p>
                        <div className="space-y-2">
                            <div>
                                <p className="text-[10px] text-stone-400">Diterbitkan</p>
                                <p className="text-xs font-semibold text-stone-700">{publishDate}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-stone-400">Portal</p>
                                <p className="text-xs font-semibold text-[#009900]">Universitas Siliwangi</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ── RIGHT: MAIN ARTICLE ── */}
                <main className="flex-1 min-w-0">
                    <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">

                        {/* Cover image */}
                        {article.coverImageUrl && (
                            <div className="w-full h-72 md:h-[400px] overflow-hidden bg-stone-100">
                                <img
                                    src={article.coverImageUrl}
                                    alt={article.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        <div className="px-6 md:px-10 py-8">

                            {/* ── ARTICLE HEADER ── */}
                            <div id="title-top" className="mb-6 pb-6 border-b border-stone-200">
                                {/* UNSIL badge */}
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#009900] bg-green-50 border border-green-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#009900]" />
                                        Artikel Ilmiah · UNSIL
                                    </span>
                                    <span className="text-[10px] text-stone-300">{publishDate}</span>
                                </div>

                                {/* Title */}
                                <h1 className="text-2xl md:text-[1.85rem] font-serif text-stone-900 font-bold tracking-tight leading-snug mb-5">
                                    {article.title}
                                </h1>

                                {/* Author info */}
                                <div className="flex flex-wrap items-start gap-3">
                                    <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                                        <div className="w-9 h-9 rounded-full bg-[#009900]/10 flex items-center justify-center shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#009900]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-stone-900">
                                                {article.author?.fullName || article.author?.name || "Mahasiswa"}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                {article.author?.nim && (
                                                    <span className="text-[10px] text-stone-400">
                                                        {article.author.role === "lecturer" ? "NIP" : "NIM"}: {article.author.nim}
                                                    </span>
                                                )}
                                                {article.author?.studyProgram && (
                                                    <>
                                                        <span className="text-stone-300 text-[10px]">·</span>
                                                        <span className="text-[10px] text-[#009900] font-medium">{article.author.studyProgram}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[11px] text-stone-400 mt-3 italic">
                                    Diterbitkan melalui Portal Artikel Ilmiah Universitas Siliwangi, ensiklopedia kebebasan akademik mahasiswa.
                                </p>
                            </div>

                            {/* ── ABSTRACT BOX ── */}
                            {article.abstract && (
                                <div id="abstract-section" className="scroll-mt-20 mb-8">
                                    <div className="border border-stone-200 rounded-xl overflow-hidden">
                                        <div className="bg-stone-50 border-b border-stone-200 px-5 py-2.5 flex items-center gap-2">
                                            <div className="w-1 h-3.5 rounded-full bg-[#009900]" />
                                            <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Abstrak</span>
                                        </div>
                                        <div className="px-5 py-4 bg-white">
                                            <p className="text-[14px] font-serif italic text-stone-600 leading-[1.9] text-justify">
                                                {article.abstract}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── INFO NOTICE ── */}
                            <div className="flex gap-3 bg-amber-50 border border-amber-200/60 rounded-xl p-4 mb-8">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                </svg>
                                <div>
                                    <p className="text-xs font-semibold text-amber-800">Hak Cipta Digital</p>
                                    <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                                        Artikel ini telah terikat hak cipta digital milik sivitas akademika Universitas Siliwangi. Struktur teks divalidasi otomatis oleh sistem SIDIKA Portal.
                                    </p>
                                </div>
                            </div>

                            {/* ── MAIN CONTENT ── */}
                            <div className="content-wiki">
                                {renderWikipediaContent()}
                            </div>

                            {/* ── DAFTAR PUSTAKA ── */}
                            {article.keywords && (
                                <div id="references-section" className="mt-12 scroll-mt-20">
                                    <div className="border-t border-stone-200 pt-8">
                                        <div className="flex items-center gap-2 mb-5">
                                            <div className="w-1 h-5 rounded-full bg-[#009900]" />
                                            <h2 className="text-lg font-serif text-stone-900 font-semibold">
                                                Daftar Pustaka
                                            </h2>
                                        </div>
                                        <ul className="bg-stone-50 border border-stone-200 rounded-xl px-5 py-4">
                                            {renderReferences()}
                                        </ul>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* ── ARTICLE FOOTER ── */}
                        <div className="border-t border-stone-100 px-6 md:px-10 py-5 bg-stone-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded bg-[#009900] flex items-center justify-center shrink-0">
                                    <span className="text-white text-[8px] font-bold">SD</span>
                                </div>
                                <span className="text-[11px] text-stone-400">SIDIKA · Portal Ilmiah Universitas Siliwangi</span>
                            </div>
                            <Link
                                href="/"
                                className="text-[11px] font-medium text-[#009900] hover:underline"
                            >
                                ← Artikel Lainnya
                            </Link>
                        </div>

                    </div>
                </main>

            </div>
        </div>
    );
}