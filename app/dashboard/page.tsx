"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

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

    const getCleanPreview = (text: string) => {
        if (!text) return "";
        const base64Regex = /data:image\/[a-zA-Z]+;base64,[^ \n\r\t]+/g;
        return text.replace(base64Regex, "[📸 Gambar/Grafik Terlampir]");
    };

    const fetchDashboardData = async () => {
        try {
            setIsAdmin(false);

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

                if (currentEmail && currentEmail === adminEmail.toLowerCase()) {
                    setIsAdmin(true);

                    const publicRes = await fetch("/api/public-articles");
                    if (publicRes.ok) {
                        const allArticles: Article[] = await publicRes.json();
                        const pendingData = allArticles.filter(art => art.status === "PENDING");
                        setPendingArticles(pendingData);
                    }
                } else {
                    setIsAdmin(false);
                }
            }
        } catch (err) {
            console.error("Gagal membuat data dashboard", err);
            setIsAdmin(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleLogout = async () => {
        const yakin = confirm("Apakah kamu yakin ingin keluar dari sistem SIDIKA Portal?");
        if (!yakin) return;

        try {
            await signOut({ redirect: false });

            document.cookie = "authjs.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "__Secure-authjs.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;";
            document.cookie = "__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;";

            window.location.href = "/auth/signin";
        } catch (error) {
            console.error("Logout_Error:", error);
            window.location.href = "/auth/signin";
        }
    };

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
        <div className="min-h-screen bg-[#F7F6F3]">

            {/* ─── TOP NAV BAR ─────────────────────────────────────────────── */}
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-stone-200/70">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

                    {/* Logo / Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-stone-800 flex items-center justify-center">
                            <span className="text-white text-xs font-bold tracking-tight">SD</span>
                        </div>
                        <span className="font-semibold text-stone-800 text-sm tracking-tight">SIDIKA Portal</span>
                    </div>

                    {/* Nav Actions */}
                    <nav className="flex items-center gap-2">
                        <Link
                            href="/dashboard/profile"
                            className="h-9 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                            Profil
                        </Link>

                        <Link
                            href="/write"
                            className="h-9 px-4 inline-flex items-center gap-1.5 text-sm font-medium bg-stone-800 hover:bg-stone-900 text-white rounded-lg transition-all shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                            </svg>
                            Tulis Karya
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="h-9 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                            </svg>
                            Keluar
                        </button>
                    </nav>
                </div>
            </header>

            {/* ─── PAGE BODY ────────────────────────────────────────────────── */}
            <main className="max-w-6xl mx-auto px-6 py-10">

                {/* Page Header */}
                <div className="mb-8">
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">
                        {isAdmin ? "Ruang Kendali Editor" : "Dashboard"}
                    </p>
                    <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
                        {isAdmin ? "Kurasi & Manajemen Konten" : "Tulisan Saya"}
                    </h1>
                    <p className="text-stone-500 text-sm mt-1">
                        {isAdmin
                            ? "Sistem kurasi esai terintegrasi Universitas Siliwangi."
                            : "Kelola dan lihat semua hasil publikasi karyamu di sini."
                        }
                    </p>
                </div>

                {/* ─── TAB NAVIGATION (Admin only) ─── */}
                {isAdmin && (
                    <div className="flex gap-1 mb-8 bg-stone-100 p-1 rounded-xl w-fit">
                        <button
                            onClick={() => setActiveTab("my-articles")}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === "my-articles"
                                    ? "bg-white text-stone-900 shadow-sm"
                                    : "text-stone-500 hover:text-stone-700"
                                }`}
                        >
                            Tulisanku
                            <span className={`ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-md ${activeTab === "my-articles" ? "bg-stone-100 text-stone-600" : "bg-stone-200 text-stone-500"
                                }`}>
                                {articles.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab("review-panel")}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 cursor-pointer ${activeTab === "review-panel"
                                    ? "bg-white text-stone-900 shadow-sm"
                                    : "text-stone-500 hover:text-stone-700"
                                }`}
                        >
                            Antrean Review
                            {pendingArticles.length > 0 && (
                                <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                    {pendingArticles.length}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* ─── CONTENT ──────────────────────────────────────────────── */}

                {loading ? (
                    /* Skeleton Loader */
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="bg-white border border-stone-200 rounded-2xl p-6 animate-pulse">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="h-4 w-16 bg-stone-100 rounded-md" />
                                    <div className="h-3 w-20 bg-stone-100 rounded-md" />
                                </div>
                                <div className="space-y-2 mb-5">
                                    <div className="h-4 w-full bg-stone-100 rounded-md" />
                                    <div className="h-4 w-4/5 bg-stone-100 rounded-md" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="h-3 w-full bg-stone-50 rounded" />
                                    <div className="h-3 w-full bg-stone-50 rounded" />
                                    <div className="h-3 w-3/4 bg-stone-50 rounded" />
                                </div>
                                <div className="mt-6 pt-4 border-t border-stone-100 flex justify-between">
                                    <div className="h-3 w-12 bg-stone-100 rounded" />
                                    <div className="h-3 w-14 bg-stone-100 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>

                ) : isAdmin && activeTab === "review-panel" ? (
                    /* ─── REVIEW PANEL ─── */
                    pendingArticles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center bg-white border border-stone-200 rounded-2xl py-20 text-center">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-stone-800">Semua bersih</h3>
                            <p className="text-stone-400 text-xs mt-1 max-w-xs">
                                Semua draf esai mahasiswa UNSIL sudah selesai anda review, Ndik.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {pendingArticles.map((article) => (
                                <div key={article.id} className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col justify-between hover:border-amber-300 hover:shadow-sm transition-all group">
                                    <div>
                                        {/* Meta row */}
                                        <div className="flex items-center justify-between gap-2 mb-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                                Pending
                                            </span>
                                            <span className="text-[11px] text-stone-400 truncate max-w-[130px]">
                                                {article.author?.name || "Mahasiswa"}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="font-semibold text-stone-900 line-clamp-2 text-sm leading-snug mb-3">
                                            {article.title}
                                        </h3>

                                        {/* Preview */}
                                        <p className="text-stone-400 text-xs line-clamp-4 leading-relaxed whitespace-pre-line">
                                            {getCleanPreview(article.content)}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-6 pt-4 border-t border-stone-100 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Link
                                                href={`/articles/${article.slug}`}
                                                className="text-xs font-medium text-stone-400 hover:text-stone-700 transition-colors"
                                            >
                                                Baca lengkap →
                                            </Link>
                                            <button
                                                onClick={() => handleApprove(article.id)}
                                                className="inline-flex items-center gap-1 bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                                            >
                                                Setujui
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(article.id)}
                                            className="w-full text-center text-[11px] font-medium text-red-400 hover:text-red-600 hover:bg-red-50 py-1.5 rounded-lg border border-transparent hover:border-red-100 transition-all cursor-pointer"
                                        >
                                            Tolak & hapus permanen
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )

                ) : (
                    /* ─── MY ARTICLES ─── */
                    articles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center bg-white border border-stone-200 rounded-2xl py-20 text-center">
                            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-stone-800">Belum ada artikel</h3>
                            <p className="text-stone-400 text-xs mt-1">Mulai dengan menulis karya pertamamu.</p>
                            <Link
                                href="/write"
                                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold bg-stone-800 hover:bg-stone-900 text-white px-4 py-2 rounded-lg transition-all"
                            >
                                Tulis sekarang →
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {articles.map((article) => (
                                <div key={article.id} className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col justify-between hover:border-stone-300 hover:shadow-sm transition-all group">
                                    <div>
                                        {/* Meta row */}
                                        <div className="flex items-center justify-between gap-2 mb-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider border ${article.status === "PENDING"
                                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${article.status === "PENDING" ? "bg-amber-400" : "bg-emerald-500"
                                                    }`} />
                                                {article.status === "PENDING" ? "Menunggu" : "Tayang"}
                                            </span>
                                            <time className="text-[11px] text-stone-400">
                                                {new Date(article.createdAt).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric"
                                                })}
                                            </time>
                                        </div>

                                        {/* Title */}
                                        <h3 className="font-semibold text-stone-900 line-clamp-2 text-sm leading-snug mb-3">
                                            {article.title}
                                        </h3>

                                        {/* Preview */}
                                        <p className="text-stone-400 text-xs line-clamp-4 leading-relaxed whitespace-pre-line">
                                            {getCleanPreview(article.content)}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                                        <button
                                            onClick={() => handleDelete(article.id)}
                                            className="text-xs font-medium text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                                        >
                                            Hapus
                                        </button>
                                        <Link
                                            href={`/articles/${article.slug}`}
                                            className="inline-flex items-center gap-0.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors group/link"
                                        >
                                            <span>Baca</span>
                                            <span className="transition-transform group-hover/link:translate-x-0.5">→</span>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

            </main>
        </div>
    );
}