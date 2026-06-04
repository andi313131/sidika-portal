"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const router = useRouter();

    // State Form
    const [userType, setUserType] = useState<"Mahasiswa" | "Dosen">("Mahasiswa");
    const [fullName, setFullName] = useState("");
    const [identityNumber, setIdentityNumber] = useState("");
    const [faculty, setFaculty] = useState("");
    const [studyProgram, setStudyProgram] = useState("");

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Ambil data permanen dari database saat pertama kali halaman dibuka
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch("/api/user/profile");
                if (res.ok) {
                    const userData = await res.json();
                    if (userData) {
                        setFullName(userData.fullName || "");
                        setIdentityNumber(userData.nim || "");
                        setFaculty(userData.faculty || "");
                        setStudyProgram(userData.studyProgram || "");
                        setUserType(userData.role === "lecturer" ? "Dosen" : "Mahasiswa");
                    }
                }
            } catch (err) {
                console.error("Gagal memuat data profil", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const handleSaveProfile = async (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, identityNumber, userType, faculty, studyProgram }),
            });

            const data = await res.json();

            if (res.ok) {
                alert("🔒 Sukses! Data profil permanen kamu berhasil dikunci ke sistem.");
                router.refresh();
            } else {
                alert(`❌ Gagal: ${data.error || "Terjadi kesalahan"}`);
            }
        } catch (error) {
            console.error(error);
            alert("💥 Terjadi kesalahan jaringan.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-12 text-gray-500 font-medium animate-pulse">
                ⏳ Memuat data identitas permanen...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/40 p-4 md:p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8">

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">👤 Pengaturan Profil Akun</h1>
                <p className="text-gray-500 text-sm mb-8">Isi data diri lo dengan benar untuk keperluan penguncian identitas publikasi ilmiah resmi.</p>

                <form onSubmit={handleSaveProfile} className="space-y-6">

                    {/* PILIHAN STATUS KEANGGOTAAN KAMPUS */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Status Keanggotaan Kampus</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setUserType("Mahasiswa")}
                                className={`py-3 rounded-xl border font-semibold text-sm transition-all cursor-pointer ${userType === "Mahasiswa" ? "bg-emerald-50 border-emerald-600 text-emerald-800 ring-2 ring-emerald-600/10" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                            >
                                👨‍🎓 Mahasiswa
                            </button>
                            <button
                                type="button"
                                onClick={() => setUserType("Dosen")}
                                className={`py-3 rounded-xl border font-semibold text-sm transition-all cursor-pointer ${userType === "Dosen" ? "bg-emerald-50 border-emerald-600 text-emerald-800 ring-2 ring-emerald-600/10" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                            >
                                👨‍🏫 Dosen / Staf Pengajar
                            </button>
                        </div>
                    </div>

                    {/* NAMA LENGKAP */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Masukkan nama lengkap lo..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all text-sm font-medium"
                        />
                    </div>

                    {/* NOMOR INDUK (DINAMIS SESUAI STATUS) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            {userType === "Mahasiswa" ? "Nomor Induk Mahasiswa (NIM)" : "Nomor Induk Dosen / Pegawai (NIDN/NIP)"}
                        </label>
                        <input
                            type="text"
                            value={identityNumber}
                            onChange={(e) => setIdentityNumber(e.target.value)}
                            placeholder={userType === "Mahasiswa" ? "Contoh: 243403001" : "Contoh: 0412038901"}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all text-sm"
                        />
                    </div>

                    {/* GRID FAKULTAS & JURUSAN */}
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
                                value={studyProgram}
                                onChange={(e) => setStudyProgram(e.target.value)}
                                placeholder="Misal: Akuntansi"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all text-sm"
                            />
                        </div>
                    </div>

                    {/* BUTTON SUBMIT PERMANEN */}
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all shadow-sm shadow-emerald-700/10 hover:shadow-md cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                    >
                        {isSaving ? "⏳ Mengunci Identitas Akun..." : "Simpan Pembaruan Profil"}
                    </button>
                </form>

            </div>
        </div>
    );
}