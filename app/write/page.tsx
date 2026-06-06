"use client";

import { useState, ChangeEvent, FormEvent, ClipboardEvent, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function WriteArticlePage() {
    const router = useRouter();
    const mainContentRef = useRef<HTMLTextAreaElement>(null);

    const [title, setTitle] = useState<string>("");
    const [authors, setAuthors] = useState<string>("");
    const [abstract, setAbstract] = useState<string>("");
    const [methodology, setMethodology] = useState<string>("");
    const [mainContent, setMainContent] = useState<string>("");
    const [dapus, setDapus] = useState<string>("");

    const [coverUrl, setCoverUrl] = useState<string>("");
    const [uploadingImage, setUploadingImage] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(false);
    const [ocrProgress, setOcrProgress] = useState<string>("");
    const [isPublishing, setIsPublishing] = useState<boolean>(false);

    const applyFormatting = (formatType: "bold" | "italic" | "underline") => {
        const textarea = mainContentRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = mainContent.substring(start, end);

        let formattedText = "";
        let cursorOffset = 0;

        switch (formatType) {
            case "bold":
                formattedText = `**${selectedText || "teks_tebal"}**`;
                cursorOffset = selectedText ? formattedText.length : 2;
                break;
            case "italic":
                formattedText = `*${selectedText || "teks_miring"}*`;
                cursorOffset = selectedText ? formattedText.length : 1;
                break;
            case "underline":
                formattedText = `<u>${selectedText || "teks_garis_bawah"}</u>`;
                cursorOffset = selectedText ? formattedText.length : 3;
                break;
        }

        const newContent = mainContent.substring(0, start) + formattedText + mainContent.substring(end);
        setMainContent(newContent);

        setTimeout(() => {
            textarea.focus();
            if (selectedText) {
                textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
            } else {
                const newStart = start + cursorOffset;
                const newEnd = newStart + (formatType === "bold" ? 10 : formatType === "italic" ? 11 : 16);
                textarea.setSelectionRange(newStart, newEnd);
            }
        }, 50);
    };

    const handleImageUpload = async (file: File, isCover: boolean) => {
        const formData = new FormData();
        formData.append("file", file);

        if (isCover) setUploadingImage(true);
        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                const secureUrl = data.imageUrl || data.url;

                if (isCover) {
                    setCoverUrl(secureUrl);
                    alert("📸 Gambar cover berhasil diproses!");
                }
                return secureUrl as string;
            } else {
                const errData = await res.json();
                alert(`Gagal memproses gambar: ${errData.error || errData.message || "Terjadi kesalahan"}`);
                return null;
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan jaringan saat mengunggah gambar.");
            return null;
        } finally {
            if (isCover) setUploadingImage(false);
        }
    };

    const handleContentPaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                e.preventDefault();

                const file = items[i].getAsFile();
                if (!file) continue;

                const targetTextarea = e.currentTarget;
                const selectionStart = targetTextarea.selectionStart;
                const selectionEnd = targetTextarea.selectionEnd;

                const textSebelumnya = mainContent.substring(0, selectionStart);
                const textSesudahnya = mainContent.substring(selectionEnd);

                const uploadedUrl = await handleImageUpload(file, false);

                if (uploadedUrl) {
                    const templateGambar = `\n\n${uploadedUrl}\n\n`;
                    setMainContent(textSebelumnya + templateGambar + textSesudahnya);

                    setTimeout(() => {
                        targetTextarea.focus();
                        const newCursorPos = selectionStart + templateGambar.length;
                        targetTextarea.setSelectionRange(newCursorPos, newCursorPos);
                    }, 50);
                }
                break;
            }
        }
    };

    const handleFileImport = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setOcrProgress("⏳ Mengekstrak teks mentah dari file...");

        try {
            let extractedRawText = "";
            let currentFileType: "pdf" | "docx" = "pdf";

            if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                currentFileType = "docx";
                const mammoth = await import("mammoth");
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                extractedRawText = result.value;
            }
            else if (file.type === "application/pdf") {
                currentFileType = "pdf";
                const pdfjsModule = await import("pdfjs-dist");
                const pdfjsLib = pdfjsModule.default || pdfjsModule;
                pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

                const arrayBuffer = await file.arrayBuffer();
                const typedarray = new Uint8Array(arrayBuffer);
                const loadingTask = pdfjsLib.getDocument({ data: typedarray });
                const pdf = await loadingTask.promise;

                let fullText = "";
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
                }
                extractedRawText = fullText;
            } else {
                alert("Format file tidak didukung!");
                setLoading(false);
                return;
            }

            if (!extractedRawText.trim()) {
                alert("File kosong atau tidak terbaca!");
                setLoading(false);
                return;
            }

            const base64CleanRegex = /data:image\/[a-zA-Z]+;base64,[^ \n\r\t]+/g;
            extractedRawText = extractedRawText.replace(base64CleanRegex, "[📸 Gambar Terlampir]");

            setOcrProgress(
                currentFileType === "docx"
                    ? "⚡ Menjalankan algoritma pemotongan manual..."
                    : "🧠 AI sedang membedah struktur esai..."
            );

            const aiRes = await fetch("/api/ai/split", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rawText: extractedRawText,
                    fileType: currentFileType
                })
            });

            if (aiRes.ok) {
                const parsedResult = await aiRes.json();
                setTitle(parsedResult.title || "");
                setAuthors(parsedResult.authors || "");
                setAbstract(parsedResult.abstract || "");
                setMethodology(parsedResult.methodology || "");
                setMainContent(parsedResult.content || "");
                setDapus(parsedResult.references || "");
            } else {
                alert("Gagal memilah dokumen secara otomatis. Teks mentah dimasukkan langsung ke kolom isi.");
                setMainContent(extractedRawText);
            }

        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat memproses file.");
        } finally {
            setLoading(false);
            setOcrProgress("");
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !mainContent.trim()) {
            alert("Judul dan Isi Utama artikel tidak boleh kosong!");
            return;
        }

        setIsPublishing(true);

        let unifiedBodyContent = "";
        if (methodology.trim()) {
            unifiedBodyContent += `${methodology.trim()}\n\n`;
        }
        unifiedBodyContent += mainContent.trim();

        try {
            const response = await fetch("/api/articles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    abstract: abstract.trim() || null,
                    content: unifiedBodyContent,
                    keywords: dapus.trim() || null,
                    coverImageUrl: coverUrl || null
                }),
            });

            if (response.ok) {
                alert("🎉 Artikel sukses dikirim ke Antrean Review Admin!");
                router.push("/dashboard");
                router.refresh();
            } else {
                alert("Gagal menerbitkan artikel.");
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsPublishing(false);
        }
    };

    /* ─── shared input classes ─── */
    const inputBase =
        "w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900/5 transition-all text-sm leading-relaxed disabled:opacity-50";

    return (
        <div className="min-h-screen bg-[#F7F6F3]">

            {/* ─── STICKY HEADER ──────────────────────────────────────────── */}
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-stone-200/70">
                <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        Dashboard
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md bg-stone-800 flex items-center justify-center">
                            <span className="text-white text-[9px] font-bold tracking-tight">SD</span>
                        </div>
                        <span className="font-semibold text-stone-800 text-sm tracking-tight">SIDIKA Portal</span>
                    </div>
                </div>
            </header>

            {/* ─── BODY ───────────────────────────────────────────────────── */}
            <main className="max-w-3xl mx-auto px-6 py-10">

                {/* Page Title */}
                <div className="mb-8">
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">Penulisan Baru</p>
                    <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Tulis Artikel</h1>
                    <p className="text-stone-400 text-sm mt-1">
                        Impor file otomatis atau ketik manual — struktur dokumen terpilah cerdas.
                    </p>
                </div>

                {/* ─── IMPORT BOX ─── */}
                <div className="mb-8 rounded-2xl border border-dashed border-stone-300 bg-white p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-stone-100 flex items-center justify-center mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-stone-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-stone-800 mb-0.5">Unggah Draft (.docx / .pdf)</p>
                            <p className="text-xs text-stone-400 mb-4 leading-relaxed">
                                Sistem otomatis memisahkan judul, penulis, abstrak, metode, pembahasan, dan daftar pustaka. File Word diproses lokal; PDF dipilah oleh AI.
                            </p>
                            <input
                                type="file"
                                accept=".docx, .pdf"
                                disabled={loading || isPublishing}
                                onChange={handleFileImport}
                                className="block w-full text-sm text-stone-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-800 file:text-white hover:file:bg-stone-900 file:cursor-pointer transition-all disabled:opacity-40"
                            />
                            {loading && (
                                <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-stone-500 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-lg">
                                    <span className="w-3 h-3 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                                    {ocrProgress}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── FORM ─── */}
                <form className="space-y-6" onSubmit={handleSubmit}>

                    {/* Cover Image */}
                    <div className="bg-white rounded-2xl border border-stone-200 p-6">
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">
                            Foto Cover <span className="normal-case font-normal text-stone-300">(opsional)</span>
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            disabled={isPublishing}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, true);
                            }}
                            className="block w-full text-sm text-stone-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 file:cursor-pointer transition-all"
                        />
                        {uploadingImage && (
                            <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-amber-600">
                                <span className="w-3 h-3 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                                Menyimpan gambar...
                            </div>
                        )}
                        {coverUrl && (
                            <div className="mt-4 rounded-xl overflow-hidden border border-stone-200 max-h-52 max-w-sm">
                                <img src={coverUrl} alt="Preview Cover" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>

                    {/* Divider label */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-stone-200" />
                        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Isi Artikel</span>
                        <div className="flex-1 h-px bg-stone-200" />
                    </div>

                    {/* 1. Judul */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Judul Artikel</label>
                        <input
                            type="text"
                            value={title}
                            disabled={isPublishing}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Judul utama gagasan..."
                            className={`${inputBase} font-semibold text-base`}
                        />
                    </div>

                    {/* 2. Author */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Susunan Penulis</label>
                        <input
                            type="text"
                            value={authors}
                            disabled={isPublishing}
                            onChange={(e) => setAuthors(e.target.value)}
                            placeholder="Nama Anggota Tim, NIM, Nama Universitas..."
                            className={inputBase}
                        />
                    </div>

                    {/* 3. Abstrak */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Abstrak</label>
                        <textarea
                            rows={4}
                            value={abstract}
                            disabled={isPublishing}
                            onChange={(e) => setAbstract(e.target.value)}
                            placeholder="Ringkasan intisari artikel (Bahasa Indonesia / English)..."
                            className={inputBase}
                        />
                    </div>

                    {/* 4. Metode */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Metode Penelitian</label>
                        <textarea
                            rows={4}
                            value={methodology}
                            disabled={isPublishing}
                            onChange={(e) => setMethodology(e.target.value)}
                            placeholder="Pendekatan, jenis data, lokasi, dan metode analisis..."
                            className={inputBase}
                        />
                    </div>

                    {/* 5. Pembahasan Utama + Toolbar */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
                                Pembahasan Utama
                            </label>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-500 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                </svg>
                                Bisa paste gambar langsung
                            </span>
                        </div>

                        {/* Toolbar */}
                        <div className="flex items-center gap-0.5 bg-stone-50 border border-stone-200 border-b-0 rounded-t-xl px-2 py-1.5">
                            <button
                                type="button"
                                onClick={() => applyFormatting("bold")}
                                title="Tebal (Bold)"
                                className="w-8 h-8 flex items-center justify-center text-sm font-bold text-stone-600 hover:bg-stone-200 hover:text-stone-900 rounded-lg transition-all cursor-pointer"
                            >
                                B
                            </button>
                            <button
                                type="button"
                                onClick={() => applyFormatting("italic")}
                                title="Miring (Italic)"
                                className="w-8 h-8 flex items-center justify-center text-sm italic font-serif text-stone-600 hover:bg-stone-200 hover:text-stone-900 rounded-lg transition-all cursor-pointer"
                            >
                                I
                            </button>
                            <button
                                type="button"
                                onClick={() => applyFormatting("underline")}
                                title="Garis Bawah (Underline)"
                                className="w-8 h-8 flex items-center justify-center text-sm underline text-stone-600 hover:bg-stone-200 hover:text-stone-900 rounded-lg transition-all cursor-pointer"
                            >
                                U
                            </button>
                        </div>

                        {/* Main Textarea */}
                        <textarea
                            ref={mainContentRef}
                            rows={12}
                            value={mainContent}
                            disabled={isPublishing}
                            onPaste={handleContentPaste}
                            onChange={(e) => setMainContent(e.target.value)}
                            placeholder="Tuliskan isi pembahasan esai / jurnal utama di sini..."
                            className="w-full px-4 py-3 rounded-b-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900/5 transition-all text-sm leading-relaxed disabled:opacity-50"
                        />
                    </div>

                    {/* 6. Daftar Pustaka */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Daftar Pustaka</label>
                        <textarea
                            rows={4}
                            value={dapus}
                            disabled={isPublishing}
                            onChange={(e) => setDapus(e.target.value)}
                            placeholder="Referensi buku, jurnal, atau data BPS..."
                            className={inputBase}
                        />
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-stone-200" />

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isPublishing || loading || uploadingImage}
                        className="w-full py-3.5 bg-stone-800 hover:bg-stone-900 text-white font-semibold rounded-xl transition-all shadow-sm text-sm cursor-pointer disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isPublishing ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Memproses Publikasi...
                            </>
                        ) : (
                            <>
                                Kirim ke Review Admin
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                </svg>
                            </>
                        )}
                    </button>

                </form>
            </main>
        </div>
    );
}