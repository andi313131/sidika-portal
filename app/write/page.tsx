"use client";

import { useState, ChangeEvent, FormEvent, ClipboardEvent, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function WriteArticlePage() {
    const router = useRouter();
    const mainContentRef = useRef<HTMLTextAreaElement>(null); // 💡 Ref untuk mendeteksi posisi kursor isi utama

    // State Form Terpisah Sesuai Standar Jurnal Ilmiah
    const [title, setTitle] = useState<string>("");
    const [authors, setAuthors] = useState<string>("");
    const [abstract, setAbstract] = useState<string>("");
    const [methodology, setMethodology] = useState<string>("");
    const [mainContent, setMainContent] = useState<string>("");
    const [dapus, setDapus] = useState<string>("");

    // State Gambar Cover
    const [coverUrl, setCoverUrl] = useState<string>("");
    const [uploadingImage, setUploadingImage] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(false);
    const [ocrProgress, setOcrProgress] = useState<string>("");
    const [isPublishing, setIsPublishing] = useState<boolean>(false);

    // --- 🛠️ FUNGSI SAKTI: FORMAT TEXT INJECTION (Bold, Italic, Underline) ---
    const applyFormatting = (formatType: "bold" | "italic" | "underline") => {
        const textarea = mainContentRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = mainContent.substring(start, end);

        let formattedText = "";
        let cursorOffset = 0;

        // Taktik pembungkusan teks berdasarkan tipe format
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

        // Kembalikan fokus kursor secara anggun ke textarea setelah tombol diklik
        setTimeout(() => {
            textarea.focus();
            if (selectedText) {
                // Jika memblok teks, kursor ditaruh di akhir hasil format
                textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
            } else {
                // Jika tidak memblok, kursor otomatis memblok kata penampung (placeholder) di dalam tag
                const newStart = start + cursorOffset;
                const newEnd = newStart + (formatType === "bold" ? 10 : formatType === "italic" ? 11 : 16);
                textarea.setSelectionRange(newStart, newEnd);
            }
        }, 50);
    };

    // --- FUNGSI UNGGAH GAMBAR (BASE64 INTEGRATION) ---
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

    // --- FUNGSI INTERCEPT PASTE GAMBAR DI ISI UTAMA ---
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

    // --- FUNGSI IMPOR FILE DENGAN PEMISAHAN SKEMA BARU VIA AI ---
    const handleFileImport = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setOcrProgress("⏳ Mengekstrak teks mentah dari file...");

        try {
            let extractedRawText = "";

            if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                const mammoth = await import("mammoth");
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                extractedRawText = result.value;
            }
            else if (file.type === "application/pdf") {
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

            setOcrProgress("🧠 AI sedang membedah struktur esai...");

            const aiRes = await fetch("/api/ai/split", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rawText: extractedRawText })
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
                alert("AI gagal memilah dokumen secara otomatis. Teks bersih dimasukkan langsung ke kolom isi.");
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

    // --- FUNGSI SUBMIT DATA ARTIKEL ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !mainContent.trim()) {
            alert("Judul dan Isi Utama artikel tidak boleh kosong!");
            return;
        }

        setIsPublishing(true);

        let unifiedBodyContent = "";
        if (methodology.trim()) {
            unifiedBodyContent += `BAB II. METODE PENELITIAN\n${methodology.trim()}\n\nBAB III. PEMBAHASAN UTAMA\n`;
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

    return (
        <div className="min-h-screen bg-emerald-50/40 p-4 md:p-8">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-emerald-900/10 p-6 md:p-8">

                <div className="mb-6">
                    <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-emerald-700 transition-colors group cursor-pointer">
                        <span className="transition-transform group-hover:-translate-x-1">←</span>
                        <span>Kembali ke Dashboard</span>
                    </Link>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">✏️ Tulis Artikel Baru</h1>
                <p className="text-gray-500 text-sm mb-8">impor file otomatis dengan integrasi AI sebagai pemisah struktur jurnal ilmiah atau ketik manual.</p>

                {/* BOX IMPOR JURNAL */}
                <div className="mb-8 p-5 bg-emerald-50/50 border border-dashed border-emerald-300 rounded-2xl">
                    <label className="block text-sm font-semibold text-emerald-900 mb-2">
                        Unggah Draft (.docx / .pdf)
                    </label>
                    <p className="text-xs text-emerald-700 mb-4">
                        AI akan membaca dokumen secara utuh, lalu memilah judul, penulis, abstrak, metode, pembahasan utama, dan daftar pustaka secara otomatis.
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <input
                            type="file"
                            accept=".docx, .pdf"
                            disabled={loading || isPublishing}
                            onChange={handleFileImport}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 file:cursor-pointer transition-all disabled:opacity-50"
                        />
                        {loading && (
                            <span className="text-xs font-semibold text-emerald-700 animate-pulse shrink-0 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
                                {ocrProgress}
                            </span>
                        )}
                    </div>
                </div>

                {/* FORM INPUT TERPISAH */}
                <form className="space-y-5" onSubmit={handleSubmit}>

                    {/* BOX INPUT GAMBAR COVER */}
                    <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2"> Foto Cover Artikel (Opsional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            disabled={isPublishing}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, true);
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer transition-all"
                        />
                        {uploadingImage && <p className="text-xs text-amber-600 mt-2 animate-pulse">⏳ Sedang memproses & menyimpan gambar...</p>}

                        {coverUrl && (
                            <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 max-h-48 max-w-sm shadow-sm relative">
                                <img src={coverUrl} alt="Preview Cover" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>

                    {/* 1. JUDUL */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Judul Artikel</label>
                        <input
                            type="text"
                            value={title}
                            disabled={isPublishing}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Judul utama gagasan..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all font-medium"
                        />
                    </div>

                    {/* 2. AUTHOR */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Susunan Penulis / Author</label>
                        <input
                            type="text"
                            value={authors}
                            disabled={isPublishing}
                            onChange={(e) => setAuthors(e.target.value)}
                            placeholder="Nama Anggota Tim, NIM, Nama Universitas..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all text-sm"
                        />
                    </div>

                    {/* 3. ABSTRAK */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Abstrak / Abstract</label>
                        <textarea
                            rows={4}
                            value={abstract}
                            disabled={isPublishing}
                            onChange={(e) => setAbstract(e.target.value)}
                            placeholder="Tuliskan ringkasan intisari artikel (Bahasa Indonesia / English)..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all text-sm leading-relaxed"
                        />
                    </div>

                    {/* 4. METODE PENELITIAN */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Metode Penelitian</label>
                        <textarea
                            rows={4}
                            value={methodology}
                            disabled={isPublishing}
                            onChange={(e) => setMethodology(e.target.value)}
                            placeholder="Jelaskan pendekatan, jenis data, lokasi, dan metode analisis yang lo gunakan..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all text-sm leading-relaxed"
                        />
                    </div>

                    {/* 5. ISI UTAMA + TOOLBAR EDITING RICH TEXT */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Pembahasan Utama Artikel
                            </label>
                            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">💡 Bisa Langsung Paste Gambar PDF</span>
                        </div>

                        {/* 🛠️ TOOLBAR FORMATTING BARU */}
                        <div className="flex items-center gap-1 bg-gray-50 border border-b-0 border-gray-300 rounded-t-xl p-1.5">
                            <button
                                type="button"
                                onClick={() => applyFormatting("bold")}
                                className="px-3 py-1 text-sm font-bold text-gray-700 hover:bg-gray-200 rounded transition-all cursor-pointer"
                                title="Tebal (Bold)"
                            >
                                B
                            </button>
                            <button
                                type="button"
                                onClick={() => applyFormatting("italic")}
                                className="px-3 py-1 text-sm italic font-serif text-gray-700 hover:bg-gray-200 rounded transition-all cursor-pointer"
                                title="Miring (Italic)"
                            >
                                I
                            </button>
                            <button
                                type="button"
                                onClick={() => applyFormatting("underline")}
                                className="px-3 py-1 text-sm underline text-gray-700 hover:bg-gray-200 rounded transition-all cursor-pointer"
                                title="Garis Bawah (Underline)"
                            >
                                U
                            </button>
                        </div>

                        {/* TEXTAREA UTAMA */}
                        <textarea
                            ref={mainContentRef} // Pasang ref di sini
                            rows={12}
                            value={mainContent}
                            disabled={isPublishing}
                            onPaste={handleContentPaste}
                            onChange={(e) => setMainContent(e.target.value)}
                            placeholder="Tuliskan isi pembahasan esai/jurnal utama di sini..."
                            className="w-full px-4 py-3 rounded-b-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all text-base leading-relaxed"
                        />
                    </div>

                    {/* 6. DAFTAR PUSTAKA */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Daftar Pustaka / Rujukan</label>
                        <textarea
                            rows={4}
                            value={dapus}
                            disabled={isPublishing}
                            onChange={(e) => setDapus(e.target.value)}
                            placeholder="Tuliskan referensi buku, jurnal, atau data BPS di sini..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPublishing || loading || uploadingImage}
                        className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition-all shadow-sm shadow-emerald-700/10 hover:shadow-md cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                        {isPublishing ? "Memproses Publikasi..." : "Publish Artikel Resmi"}
                    </button>
                </form>

            </div>
        </div>
    );
}