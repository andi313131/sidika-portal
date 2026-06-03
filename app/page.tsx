"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Article {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  status: string;
  coverImageUrl: string | null; // 🔥 SINKRON: Ditambahkan sesuai skema database Prisma lo
  author?: {
    name: string | null;
  };
}

export default function PublicFeedPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userSession, setUserSession] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Ambil data esai publik dan saring hanya yang sudah lolos kurasi Admin
    async function fetchPublicArticles() {
      try {
        const res = await fetch("/api/public-articles");
        if (res.ok) {
          const data: Article[] = await res.json();

          // FILTER CRUCIAL: Hanya pajang esai yang statusnya murni sudah "PUBLISHED"
          const hanyaPublished = data.filter((art) => art.status === "PUBLISHED");

          setArticles(hanyaPublished);
        }
      } catch (error) {
        console.error("Gagal memuat artikel publik:", error);
      } finally {
        setLoading(false);
      }
    }

    // 2. Cek session murni dari Next-Auth
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const sessionData = await res.json();
          if (sessionData && Object.keys(sessionData).length > 0) {
            setUserSession(true);
          } else {
            setUserSession(null);
          }
        } else {
          setUserSession(null);
        }
      } catch {
        setUserSession(null);
      }
    }

    fetchPublicArticles();
    checkSession();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* TOP NAVIGATION BAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <img
            src="/logo unsil.png"
            alt="Logo UNSIL"
            className="h-8 w-auto object-contain inline-block"
          />         <h1 className="text-lg font-bold text-emerald-800 tracking-tight">SIDIKA</h1>
        </div>
        <div className="flex items-center gap-4">
          {userSession ? (
            <Link href="/dashboard" className="text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 px-4 py-2 rounded-xl transition-all shadow-sm">
              Masuk ke Dashboard →
            </Link>
          ) : (
            <Link href="/api/auth/signin" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 border border-emerald-600 px-4 py-2 rounded-xl transition-all">
              Sign In / Login Mahasiswa
            </Link>
          )}
        </div>
      </header>

      {/* HERO SECTION PANEL */}
      <section className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white px-6 py-16 md:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="bg-emerald-700/50 text-emerald-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/30">
            Ensiklopedia Bebas Mahasiswa
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-normal mt-4 mb-6 leading-tight">
            Siliwangi Intelektual Digital Karya Artikel
          </h2>
          <p className="text-emerald-100/80 text-sm md:text-base max-w-xl mx-auto font-light leading-relaxed">
            Wadah publikasi ilmiah mahasiswa Universitas Siliwangi untuk mendorong akselerasi strategis bangsa.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT GRID AREA */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
          <span>📰</span> Artikel & Esai Terbaru
        </h3>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-48" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-3xl p-8 max-w-md mx-auto shadow-sm">
            <span className="text-4xl">📂</span>
            <h4 className="text-base font-bold text-slate-700 mt-4">Belum Ada Artikel Publik</h4>
            <p className="text-xs text-slate-400 mt-1">Jadilah mahasiswa pertama yang mempublikasikan esai brilianmu!</p>
            <Link href="/dashboard" className="mt-5 inline-block bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-emerald-800 transition-all shadow-sm">
              Mulai Menulis
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <article key={article.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-600/30 transition-all flex flex-col justify-between group">
                <div>

                  {/* 🔥 SEKARANG TAMPIL: Foto Cover Esai jika ada datanya di Database MySQL */}
                  {article.coverImageUrl && (
                    <div className="w-full h-44 overflow-hidden rounded-2xl mb-4 bg-slate-100 border border-slate-200/60 relative">
                      <img
                        src={article.coverImageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        onError={(e) => {
                          // Proteksi aman: Sembunyikan boks gambar jika file fisiknya terhapus/korup
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                    Published
                  </span>
                  <h4 className="text-lg font-serif font-medium text-slate-900 mt-3 mb-2 line-clamp-2 group-hover:text-emerald-800 transition-colors">
                    {article.title}
                  </h4>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between text-xs text-slate-500">
                  <div>
                    <p className="font-semibold text-slate-700 line-clamp-1">
                      👤 {article.author?.name || "Mahasiswa UNSIL"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(article.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                  <Link href={`/articles/${article.slug}`} className="text-blue-600 font-semibold hover:underline shrink-0 group-hover:translate-x-0.5 transition-transform">
                    Baca →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}