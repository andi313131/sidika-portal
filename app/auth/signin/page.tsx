"use client";
import { signIn } from "next-auth/react";

export default function SignInPage() {
    return (
        /* Mengubah bg-gray-50 menjadi warna hijau khas UNSIL yang solid */
        <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-800">

            {/* Wadah Login: Tetap putih bersih agar kontras tinggi */}
            <div className="max-w-md w-full mx-4 p-8 bg-white rounded-3xl shadow-xl border border-emerald-900/10 text-center">

                {/* Logo UNSIL Ukuran Menengah di Atas Judul */}
                <div className="flex justify-center mb-4">
                    <img
                        src="/logo unsil.png"
                        alt="Logo UNSIL"
                        className="w-20 h-20 object-contain drop-shadow-sm"
                    />
                </div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Portal Artikel UNSIL
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Login menggunakan akun Google Student UNSIL
                    </p>
                </div>

                {/* Tombol Login: Diberikan sentuhan border emerald tipis saat di-hover */}
                <button
                    onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                    className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-gray-300 rounded-xl hover:bg-emerald-50/50 hover:border-emerald-500 transition-all font-semibold text-gray-700 shadow-sm cursor-pointer"
                >
                    <img src="/logo unsil.png" alt="UNSIL" className="w-5 h-5 object-contain" />
                    <span>Login dengan Google UNSIL</span>
                </button>

                <div className="mt-8 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 font-medium">
                        Khusus Domain Resmi Universitas Siliwangi
                    </p>
                    <p className="text-xs font-mono text-emerald-600 font-bold mt-1">
                        @student.unsil.ac.id
                    </p>
                </div>
            </div>

            {/* Footer Hak Cipta Sederhana di luar kotak */}
            <p className="text-xs text-emerald-200/60 mt-6 font-medium">
                &copy; {new Date().getFullYear()} Portal Artikel UNSIL. All rights reserved.
            </p>
        </div>
    );
}