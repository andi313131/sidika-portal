"use client";

import { useState, ChangeEvent, FormEvent, ClipboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function WriteArticlePage() {
    const router = useRouter();

    // State Form Terpisah
    const [title, setTitle] = useState<string>("");
    const [authors, setAuthors] = useState<string>("");
    const [mainContent, setMainContent] = useState<string>("");
    const [dapus, setDapus] = useState<string>("");

    // State Gambar Cover
    const [coverUrl, setCoverUrl] = useState<string>("");
    const [uploadingImage, setUploadingImage] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(false);
    const [ocrProgress, setOcrProgress] = useState<string>("");
    const [isPublishing, setIsPublishing] = useState<boolean>(false);

    // --- FUNGSI UNGGAH GAMBAR COVER INSTAN ---
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
                if (isCover) {
                    setCoverUrl(data.url);
                    alert("📸 Gambar cover berhasil diunggah!");
                }
                return data.url as string;
            } else {
                const errData = await res.json();
                alert(`Gagal mengunggah gambar: ${errData.message || "Terjadi kesalahan"}`);
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

    // --- 🔥 FUNGSI SAKTI: INTERCEPT PASTE GAMBAR DI ISI UTAMA ---
    const handleContentPaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                // Cegah aksi paste teks default agar tidak nge-blank/dobel
                e.preventDefault();

                const file = items[i].getAsFile();
                if (!file) continue;

                // Tampilkan indikator loading sementara di posisi kursor
                const targetTextarea = e.currentTarget;
                const selectionStart = targetTextarea.selectionStart;
                const selectionEnd = targetTextarea.selectionEnd;

                const textSebelumnya = mainContent.substring(0, selectionStart);
                const textSesudahnya = mainContent.substring(selectionEnd);

                // Jalankan proses upload background via API upload kita yang kemarin
                const uploadedUrl = await handleImageUpload(file, false);

                if (uploadedUrl) {
                    // Masukkan baris baru berisi path gambar otomatis di sela-sela teks paragraf lo
                    const templateGambar = `\n\n${uploadedUrl}\n\n`;
                    setMainContent(textSebelumnya + templateGambar + textSesudahnya);

                    // Posisikan kursor tepat setelah link gambar yang di-paste tadi
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

    // --- FUNGSI IMPOR FILE (.DOCX / .PDF) BIASA ---
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
                setMainContent(parsedResult.content || "");
                setDapus(parsedResult.references || "");
            } else {
                alert("AI gagal memilah dokumen, teks mentah dimasukkan ke isi.");
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

        let finalMergedContent = "";
        if (authors.trim()) finalMergedContent += `Disusun oleh: ${authors.trim()}\n\n`;
        finalMergedContent += `${mainContent.trim()}`;
        if (dapus.trim()) finalMergedContent += `\n\nDAFTAR PUSTAKA\n${dapus.trim()}`;

        try {
            const response = await fetch("/api/articles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    content: finalMergedContent,
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

                <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-emerald-700 mb-6 transition-colors group cursor-pointer">
                    <span className="transition-transform group-hover:-translate-x-1">←</span>
                    <span>Kembali ke Dashboard</span>
                </Link>

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">✏️ Tulis Artikel Baru</h1>
                <p className="text-gray-500 text-sm mb-8">impor file otomatis dengan integrasi AI sebagai pemisah atau ketik manual.</p>

                {/* BOX IMPOR JURNAL */}
                <div className="mb-8 p-5 bg-emerald-50/50 border border-dashed border-emerald-300 rounded-2xl">
                    <label className="block text-sm font-semibold text-emerald-900 mb-2">
                        Unggah Draft (.docx / .pdf)
                    </label>
                    <p className="text-xs text-emerald-700 mb-4">
                        AI akan membaca dokumen secara utuh, lalu memilah judul, penulis, isi, dan dapus ke kolomnya masing-masing.
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

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Isi Artikel Utama (Bab I - V)
                            <span className="text-[10px] text-blue-600 font-bold lowercase normal-case bg-blue-50 px-2 py-0.5 rounded ml-2 border border-blue-100">💡 Bisa Langsung Paste (Ctrl+V) Gambar PDF</span>
                        </label>
                        <textarea
                            rows={12}
                            value={mainContent}
                            disabled={isPublishing}
                            onPaste={handleContentPaste} // 🔥 SUNTIKAN EVENT PASTE SAKTI
                            onChange={(e) => setMainContent(e.target.value)}
                            placeholder="Tuliskan isi esai... Taruh kursor di sini lalu tekan Ctrl + V jika ingin menyisipkan gambar hasil screenshot PDF secara instan!"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all text-base leading-relaxed"
                        />
                    </div>

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
                        className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition-all shadow-sm shadow-emerald-700/10 hover:shadow-md cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isPublishing ? "Memproses Publikasi..." : "Publish Artikel Resmi"}
                    </button>
                </form>

            </div>
        </div>
    );
}