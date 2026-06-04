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

    // State Lock Pengunci Data Bawaan DB
    const [hasSavedName, setHasSavedName] = useState(false);
    const [hasSavedIdentity, setHasSavedIdentity] = useState(false);

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

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

                        // Kunci field jika sudah terisi di database
                        if (userData.fullName) setHasSavedName(true);
                        if (userData.nim) setHasSavedIdentity(true);
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

        // Peringatan konfirmasi akhir sebelum submit permanen
        const confirmSave = confirm("⚠️ PERINGATAN: Nama Lengkap dan NIM/NIP yang lo masukkan akan DIKUNCI PERMANEN di database dan tidak akan bisa diubah lagi. Apakah data sudah benar?");
        if (!confirmSave) return;

        setIsSaving(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, identityNumber, userType, faculty, studyProgram }),
            });

            const data = await res.json();

            if (res.ok) {
                alert("🔒 Sukses! Data identitas permanen lo resmi dikunci ke sistem.");
                setHasSavedName(true);
                setHasSavedIdentity(true);
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
                <p className="text-gray-500 text-sm mb-6">Isi data diri lo dengan benar untuk keperluan penguncian identitas publikasi ilmiah resmi.</p>

                {/* ⚠️ BANNER PERINGATAN STRATEGIS */}
                {(!hasSavedName || !hasSavedIdentity) ? (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-900 mb-6 flex items-start gap-3">
                        <span className="text-base">⚠️</span>
                        <div>
                            <p className="font-bold uppercase tracking-wider mb-0.5">Peringatan Penguncian Data Identitas</p>
                            <p className="leading-relaxed text-amber-800">
                                Demi keaslian sitasi karya ilmiah UNSIL Portal, demi menghindari pemalsuan akun,
                                <strong> Nama Lengkap</strong> dan <strong>Nomor Induk (NIM/NIP)</strong> hanya bisa diisi
                                <span className="underline font-bold mx-1">SATU KALI saja</span>.
                                Setelah lo menekan tombol simpan, kolom input tersebut akan otomatis dikunci permanen oleh database sistem.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 mb-6 flex items-start gap-3">
                        <span className="text-base">🔒</span>
                        <div>
                            <p className="font-bold uppercase tracking-wider mb-0.5">Identitas Terverifikasi & Dikunci</p>
                            <p className="leading-relaxed text-emerald-700">
                                Akun lo sudah terikat secara legal dengan database kampus Universitas Siliwangi. Nama Lengkap dan NIM/NIP tidak dapat diubah kembali untuk menjaga validitas hak cipta esai.
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-6">

                    {/* PILIHAN STATUS KEANGGOTAAN KAMPUS */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Status Keanggotaan Kampus</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                disabled={hasSavedIdentity}
                                onClick={() => setUserType("Mahasiswa")}
                                className={`py-3 rounded-xl border font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${userType === "Mahasiswa" ? "bg-emerald-50 border-emerald-600 text-emerald-800 ring-2 ring-emerald-600/10" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                            >
                                👨‍🎓 Mahasiswa
                            </button>
                            <button
                                type="button"
                                disabled={hasSavedIdentity}
                                onClick={() => setUserType("Dosen")}
                                className={`py-3 rounded-xl border font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${userType === "Dosen" ? "bg-emerald-50 border-emerald-600 text-emerald-800 ring-2 ring-emerald-600/10" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
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
                            disabled={hasSavedName} // Otomatis mengunci jika sudah tersimpan
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Masukkan nama lengkap lo..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all text-sm font-medium disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-200"
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
                            disabled={hasSavedIdentity} // Otomatis mengunci jika sudah tersimpan
                            onChange={(e) => setIdentityNumber(e.target.value)}
                            placeholder={userType === "Mahasiswa" ? "Contoh: 243403001" : "Contoh: 0412038901"}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-200"
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
                    {(!hasSavedName || !hasSavedIdentity) && (
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                        >
                            {isSaving ? "⏳ Mengunci Identitas Akun..." : "Kunci & Simpan Profil Permanen"}
                        </button>
                    )}
                </form>

            </div>
        </div>
    );
}