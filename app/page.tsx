"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Article {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  status: string;
  coverImageUrl: string | null;
  author?: {
    name: string | null;
  };
}

export default function PublicFeedPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userSession, setUserSession] = useState<boolean | null>(null);

  useEffect(() => {
    async function fetchPublicArticles() {
      try {
        const res = await fetch("/api/public-articles");
        if (res.ok) {
          const data: Article[] = await res.json();
          const hanyaPublished = data.filter((art) => art.status === "PUBLISHED");
          setArticles(hanyaPublished);
        }
      } catch (error) {
        console.error("Gagal memuat artikel publik:", error);
      } finally {
        setLoading(false);
      }
    }

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
    <div className="min-h-screen bg-[#F8F7F2] text-stone-900 font-sans antialiased">

      {/* ─── NAVBAR ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/logo unsil.png"
              alt="Logo UNSIL"
              className="h-9 w-auto object-contain"
            />
            <div className="w-px h-5 bg-stone-200" />
            <div>
              <span className="text-sm font-bold text-[#009900] tracking-tight leading-none block">SIDIKA</span>
              <span className="text-[10px] text-stone-400 leading-none tracking-wide">Portal Ilmiah UNSIL</span>
            </div>
          </div>

          {/* Auth CTA */}
          {userSession ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-semibold text-white bg-[#009900] hover:bg-[#007a00] rounded-lg transition-all shadow-sm shadow-green-900/10"
            >
              Dashboard
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          ) : (
            <Link
              href="/api/auth/signin"
              className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-semibold text-[#009900] border border-[#009900]/40 hover:bg-[#009900]/5 rounded-lg transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              Masuk Mahasiswa
            </Link>
          )}
        </div>
      </header>

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#009900]">
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
            backgroundSize: "28px 28px"
          }}
        />

        {/* Yellow accent bar at top */}
        <div className="h-1 w-full bg-[#FFD700]" />

        <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-[10px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
            Ensiklopedia Bebas Mahasiswa
          </div>

          <h2 className="text-3xl md:text-[2.75rem] font-serif font-normal text-white leading-tight mb-5">
            Siliwangi Intelektual Digital<br className="hidden md:block" /> Karya Artikel
          </h2>

          <p className="text-white/70 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
            Wadah publikasi ilmiah mahasiswa Universitas Siliwangi untuk mendorong akselerasi strategis bangsa.
          </p>

          {/* Stats strip */}
          <div className="mt-10 inline-flex items-center gap-6 bg-white/10 border border-white/15 rounded-2xl px-6 py-3">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{articles.length}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Artikel</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-xl font-bold text-white">UNSIL</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Tasikmalaya</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-xl font-bold text-[#FFD700]">Ilmiah</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Kurasi Ketat</p>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="h-8 bg-[#F8F7F2]" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
      </section>

      {/* ─── ARTICLE FEED ────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-12">

        {/* Section header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-6 rounded-full bg-[#009900]" />
          <h3 className="text-lg font-bold text-stone-800">Artikel & Esai Terbaru</h3>
          {!loading && articles.length > 0 && (
            <span className="text-xs font-semibold text-[#009900] bg-green-50 border border-green-100 px-2 py-0.5 rounded-md">
              {articles.length} karya
            </span>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-stone-200 animate-pulse h-52" />
            ))}
          </div>

          /* Empty state */
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white border border-stone-200 rounded-2xl py-20 text-center max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[#009900]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-stone-800">Belum Ada Artikel Publik</h4>
            <p className="text-xs text-stone-400 mt-1 max-w-[18rem] leading-relaxed">
              Jadilah mahasiswa pertama yang mempublikasikan esai brilianmu!
            </p>
            <Link
              href="/dashboard"
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold bg-[#009900] hover:bg-[#007a00] text-white px-4 py-2 rounded-lg transition-all"
            >
              Mulai Menulis →
            </Link>
          </div>

          /* Article grid */
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article) => (
              <article
                key={article.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:border-[#009900]/30 hover:shadow-md hover:shadow-green-900/5 transition-all group flex flex-col"
              >
                {/* Cover image */}
                {article.coverImageUrl ? (
                  <div className="w-full h-44 overflow-hidden bg-stone-100 shrink-0">
                    <img
                      src={article.coverImageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  /* Placeholder cover when no image */
                  <div className="w-full h-24 bg-gradient-to-br from-green-50 to-green-100/60 shrink-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-[#009900]/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#009900]/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Card body */}
                <div className="p-5 flex flex-col flex-1">
                  {/* Status badge */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#009900] bg-green-50 border border-green-100 px-2 py-0.5 rounded-md uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#009900]" />
                      Published
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-serif text-base font-medium text-stone-900 line-clamp-2 group-hover:text-[#009900] transition-colors leading-snug flex-1">
                    {article.title}
                  </h4>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-stone-700 truncate max-w-[140px]">
                        {article.author?.name || "Mahasiswa UNSIL"}
                      </p>
                      <time className="text-[10px] text-stone-400 mt-0.5 block">
                        {new Date(article.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </time>
                    </div>
                    <Link
                      href={`/articles/${article.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#009900] hover:text-[#007a00] shrink-0 group/link"
                    >
                      Baca
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-stone-200 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo unsil.png" alt="Logo UNSIL" className="h-6 w-auto object-contain opacity-70" />
            <span className="text-xs text-stone-400">SIDIKA · Portal Ilmiah Universitas Siliwangi</span>
          </div>
          <p className="text-[11px] text-stone-300">© {new Date().getFullYear()} Universitas Siliwangi · Tasikmalaya</p>
        </div>
        {/* UNSIL color strip */}
        <div className="h-0.5 bg-gradient-to-r from-[#009900] via-[#FFD700] to-[#009900]" />
      </footer>

    </div>
  );
}