"use client";

import Link from "next/link";

export default function ErrorPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full mx-4 p-8 bg-white rounded-2xl shadow-sm border border-gray-200 text-center">
                {/* Ikon Batasan */}
                <div className="text-5xl mb-4">🚫</div>

                {/* Judul Pesan */}
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Akses Ditolak
                </h1>

                {/* Deskripsi Singkat */}
                <p className="text-gray-600 mb-6">
                    Maaf, email yang kamu gunakan tidak diizinkan masuk ke portal ini.
                </p>

                {/* Tombol Kembali */}
                <Link
                    href="/auth/signin"
                    className="block w-full text-center py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                    Kembali ke Halaman Login
                </Link>
            </div>
        </div>
    );
}