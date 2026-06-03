"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Article {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    status: string;
    slug: string;
    author?: {
        name: string | null;
        email: string | null;
    };
}

export default function DashboardPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [pendingArticles, setPendingArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"my-articles" | "review-panel">("my-articles");

    // 🛡️ FUNGSI SAKTI: Bersihkan string Base64 panjang agar kartu dashboard tidak freeze & rusak
    const getCleanPreview = (text: string) => {
        if (!text) return "";
        // Regex untuk menangkap pola string base64 gambar
        const base64Regex = /data:image\/[a-zA-Z]+;base64,[^ \n\r\t]+/g;
        // Ganti teks base64 yang sepanjang jutaan karakter dengan penanda ringkas
        return text.replace(base64Regex, "[📸 Gambar/Grafik Terlampir]");
    };

    const fetchDashboardData = async () => {
        try {
            const res = await fetch("/api/articles");
            if (res.ok) {
                const data = await res.json();
                setArticles(data);
            }

            const sessionRes = await fetch("/api/auth/session");
            if (sessionRes.ok) {
                const sessionData = await sessionRes.json();
                const currentEmail = sessionData?.user?.email?.toLowerCase() || "";
                const adminEmail = "253403111123@student.unsil.ac.id";

                if (currentEmail === adminEmail.toLowerCase()) {
                    setIsAdmin(true);

                    const publicRes = await fetch("/api/public-articles");
                    if (publicRes.ok) {
                        const allArticles: Article[] = await publicRes.json();
                        const pendingData = allArticles.filter(art => art.status === "PENDING");
                        setPendingArticles(pendingData);
                    }
                }
            }
        } catch (err) {
            console.error("Gagal membuat data dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleApprove = async (articleId: string) => {
        const setuju = confirm("Apakah esai ilmiah ini sudah layak dan sesuai dengan standar kurasi publikasi?");
        if (!setuju) return;

        try {
            const res = await fetch("/api/articles/approve", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ articleId })
            });

            if (res.ok) {
                alert("🎉 Sukses! Artikel resmi tayang di Halaman Utama.");
                setPendingArticles(prev => prev.filter(art => art.id !== articleId));
            } else {
                alert("Gagal menyetujui artikel.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (articleId: string) => {
        const yakin = confirm("⚠️ PERINGATAN: Apakah kamu yakin ingin menghapus artikel ini secara permanen dari database?");
        if (!yakin) return;

        try {
            const res = await fetch("/api/articles/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ articleId })
            });

            if (res.ok) {
                alert("🗑️ Artikel berhasil dihapus!");
                setArticles(prev => prev.filter(art => art.id !== articleId));
                setPendingArticles(prev => prev.filter(art => art.id !== articleId));
            } else {
                const errorData = await res.json();
                alert(`Gagal menghapus: ${errorData.message || "Eror sistem"}`);
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat menghapus data.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">

                {/* Header Dashboard */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                            {isAdmin ? "👑 Ruang Kendali Editor" : "📚 Dashboard Artikel"}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {isAdmin ? "Sistem kurasi esai terintegrasi Universitas Siliwangi." : "Kelola dan lihat semua hasil publikasi karyamu di sini."}
                        </p>
                    </div>
                    <Link
                        href="/write"
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition-all shadow-sm shadow-emerald-700/10 cursor-pointer text-sm shrink-0"
                    >
                        ✏️ Tulis Artikel Baru
                    </Link>
                </div>

                {/* TAB NAVIGATION PANEL */}
                {isAdmin && (
                    <div className="flex border-b border-gray-200 mb-6 gap-2">
                        <button
                            onClick={() => setActiveTab("my-articles")}
                            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${activeTab === "my-articles" ? "border-emerald-700 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                        >
                            📝 Tulisanku ({articles.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("review-panel")}
                            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === "review-panel" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                        >
                            <span>🔍 Antrean Review</span>
                            {pendingArticles.length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {pendingArticles.length}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* KONTEN UTAMA */}
                {loading ? (
                    <div className="text-center py-12 text-gray-500 font-medium animate-pulse">
                        ⏳ Memuat data portal...
                    </div>
                ) : activeTab === "review-panel" ? (
                    /* --- 1. TAMPILAN GUDANG REVIEW ADMIN --- */
                    pendingArticles.length === 0 ? (
                        <div className="text-center bg-white border border-gray-200 rounded-2xl p-12 shadow-sm">
                            <span className="text-4xl block mb-3">✅</span>
                            <h3 className="text-base font-semibold text-gray-900">Gudang Antrean Bersih</h3>
                            <p className="text-gray-500 text-sm max-w-sm mx-auto mt-1">
                                Semua draf esai mahasiswa UNSIL sudah selesai lo review, Ndik.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {pendingArticles.map((article) => (
                                <div key={article.id} className="bg-white border-2 border-blue-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                                                PENDING
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-semibold line-clamp-1">
                                                👤 {article.author?.name || "Mahasiswa"}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 line-clamp-2 text-base mb-2">
                                            {article.title}
                                        </h3>
                                        {/* 🛠️ FIX: Bungkus dengan getCleanPreview */}
                                        <p className="text-gray-500 text-xs line-clamp-4 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-line">
                                            {getCleanPreview(article.content)}
                                        </p>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <Link href={`/articles/${article.slug}`} className="text-xs font-semibold text-slate-500 hover:underline">
                                                Intip Teks →
                                            </Link>
                                            <button
                                                onClick={() => handleApprove(article.id)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
                                            >
                                                Approve
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(article.id)}
                                            className="w-full text-center text-[11px] font-semibold text-red-500 hover:bg-red-50 py-1.5 rounded-lg border border-transparent hover:border-red-100 transition-all cursor-pointer"
                                        >
                                            🗑️ Tolak & Hapus Selamanya
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    /* --- 2. TAMPILAN DAFTAR TULISAN AKUN SENDIRI --- */
                    articles.length === 0 ? (
                        <div className="text-center bg-white border border-gray-200 rounded-2xl p-12 shadow-sm">
                            <span className="text-4xl block mb-3">📁</span>
                            <h3 className="text-base font-semibold text-gray-900">Belum ada artikel</h3>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {articles.map((article) => (
                                <div key={article.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-600/30 transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-md uppercase tracking-wider ${article.status === "PENDING" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-700"}`}>
                                                {article.status}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(article.createdAt).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric"
                                                })}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 line-clamp-2 text-base mb-2">
                                            {article.title}
                                        </h3>
                                        {/* 🛠️ FIX: Bungkus dengan getCleanPreview */}
                                        <p className="text-gray-500 text-xs line-clamp-4 leading-relaxed whitespace-pre-line">
                                            {getCleanPreview(article.content)}
                                        </p>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <button
                                            onClick={() => handleDelete(article.id)}
                                            className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                                        >
                                            Hapus
                                        </button>
                                        <Link href={`/articles/${article.slug}`} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer inline-flex items-center gap-0.5 group">
                                            <span>Baca</span>
                                            <span className="transition-transform group-hover:translate-x-0.5">→</span>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

            </div>
        </div>
    );
}