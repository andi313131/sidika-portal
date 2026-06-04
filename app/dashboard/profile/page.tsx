"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const router = useRouter();

    // State Input Form Profil
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [nim, setNim] = useState<string>("");
    const [faculty, setFaculty] = useState<string>("");
    const [major, setMajor] = useState<string>("");
    const [bio, setBio] = useState<string>("");

    const [loading, setLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    // 🛠️ FIX TOTAL: Ambil data mendalam langsung dari API profile database
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch("/api/user/profile"); // 👈 Diubah kesini biar dapet data NIM, Jurusan, dll
                if (res.ok) {
                    const userData = await res.json();
                    if (userData) {
                        setName(userData.name || "");
                        setEmail(userData.email || "");
                        setNim(userData.nim || "");
                        setFaculty(userData.faculty || "");
                        setMajor(userData.major || "");
                        setBio(userData.bio || "");
                    }
                }
            } catch (err) {
                console.error("Gagal memuat data user dari database", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // 2. Fungsi Kirim Data Update ke API Backend
    const handleSaveProfile = async (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, nim, faculty, major, bio }),
            });

            if (res.ok) {
                alert("🎉 Sukses! Data profil kamu berhasil diperbarui.");
                router.refresh();
            } else {
                alert("Gagal memperbarui data profil.");
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-12 text-gray-500 font-medium animate-pulse">
                ⏳ Memuat biodata akademis...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-emerald-50/40 p-4 md:p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-emerald-900/10 p-6 md:p-8">

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">👤 Pengaturan Profil</h1>
                <p className="text-gray-500 text-sm mb-8">Kelola informasi data diri dan identitas akademis lo untuk keperluan publikasi esai ilmiah.</p>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                    {/* Email Box */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Alamat Email (Akun Google)</label>
                        <input
                            type="email"
                            value={email}
                            disabled
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed font-medium text-sm"
                        />
                    </div>

                    {/* Nama Lengkap */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Masukkan nama lengkap lo..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all font-medium text-sm"
                        />
                    </div>

                    {/* NIM */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nomor Induk Mahasiswa (NIM)</label>
                        <input
                            type="text"
                            value={nim}
                            onChange={(e) => setNim(e.target.value)}
                            placeholder="Contoh: 243403001"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all text-sm"
                        />
                    </div>

                    {/* Grid Fakultas & Jurusan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Fakultas</label>
                            <input
                                type="text"
                                value={faculty}
                                onChange={(e) => setFaculty(e.target.value)}
                                placeholder="Misal: Fakultas Ekonomi dan Bisnis"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Program Studi / Jurusan</label>
                            <input
                                type="text"
                                value={major}
                                onChange={(e) => setMajor(e.target.value)}
                                placeholder="Misal: Akuntansi"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all text-sm"
                            />
                        </div>
                    </div>

                    {/* Bio Singkat */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Bio Singkat / Afiliasi Riset</label>
                        <textarea
                            rows={4}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Ceritakan ketertarikan riset ilmiah lo, misal: Fokus pada riset pasar modal Indonesia, akuntansi keuangan, atau makroekonomi..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all text-sm leading-relaxed"
                        />
                    </div>

                    {/* Button Submit */}
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition-all shadow-sm shadow-emerald-700/10 hover:shadow-md cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                    >
                        {isSaving ? "⏳ Menyimpan Perubahan..." : "Simpan Pembaruan Profil"}
                    </button>
                </form>

            </div>
        </div>
    );
}