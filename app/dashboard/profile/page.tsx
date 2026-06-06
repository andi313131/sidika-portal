"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const router = useRouter();

    const [userType, setUserType] = useState<"Mahasiswa" | "Dosen">("Mahasiswa");
    const [fullName, setFullName] = useState("");
    const [identityNumber, setIdentityNumber] = useState("");
    const [faculty, setFaculty] = useState("");
    const [studyProgram, setStudyProgram] = useState("");

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

        const confirmSave = confirm("⚠️ PERINGATAN: Nama Lengkap dan NIM/NIP yang anda masukkan akan DIKUNCI PERMANEN di database dan tidak akan bisa diubah lagi. Apakah data sudah benar?");
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
                alert("🔒 Sukses! Data identitas permanen anda resmi dikunci ke sistem.");
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

    /* ─── shared input classes ─── */
    const inputBase =
        "w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900/5 transition-all text-sm disabled:bg-stone-100 disabled:text-stone-400 disabled:border-stone-100 disabled:cursor-not-allowed";

    /* ─── loading state ─── */
    if (loading) {
        return (
            <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin" />
                    <p className="text-sm text-stone-400 font-medium">Memuat data identitas...</p>
                </div>
            </div>
        );
    }

    const isLocked = hasSavedName && hasSavedIdentity;

    return (
        <div className="min-h-screen bg-[#F7F6F3]">

            {/* ─── STICKY HEADER ────────────────────────────────────────────── */}
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-stone-200/70">
                <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
                    <a href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        Dashboard
                    </a>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-stone-800 flex items-center justify-center">
                            <span className="text-white text-[9px] font-bold">SD</span>
                        </div>
                        <span className="text-sm font-semibold text-stone-800 tracking-tight">SIDIKA Portal</span>
                    </div>
                </div>
            </header>

            {/* ─── BODY ─────────────────────────────────────────────────────── */}
            <main className="max-w-2xl mx-auto px-6 py-10">

                {/* Page title */}
                <div className="mb-8">
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">Akun</p>
                    <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Pengaturan Profil</h1>
                    <p className="text-stone-400 text-sm mt-1">
                        Isi data diri dengan benar untuk penguncian identitas publikasi ilmiah resmi.
                    </p>
                </div>

                {/* ─── STATUS BANNER ─── */}
                {!isLocked ? (
                    <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-amber-800 mb-1">Peringatan Penguncian Data Identitas</p>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                Demi keaslian sitasi karya ilmiah UNSIL Portal, <strong>Nama Lengkap</strong> dan <strong>Nomor Induk (NIM/NIP)</strong> hanya bisa diisi{" "}
                                <span className="underline font-bold">satu kali saja</span>. Setelah disimpan, kolom tersebut akan dikunci permanen oleh sistem.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-8">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-800 mb-1">Identitas Terverifikasi & Dikunci</p>
                            <p className="text-xs text-emerald-700 leading-relaxed">
                                Akun anda sudah terikat secara legal dengan database kampus Universitas Siliwangi. Nama Lengkap dan NIM/NIP tidak dapat diubah kembali untuk menjaga validitas hak cipta esai.
                            </p>
                        </div>
                    </div>
                )}

                {/* ─── FORM ─────────────────────────────────────────────────── */}
                <form onSubmit={handleSaveProfile} className="space-y-6">

                    {/* Status Keanggotaan */}
                    <div className="bg-white rounded-2xl border border-stone-200 p-5">
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">
                            Status Keanggotaan Kampus
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                disabled={hasSavedIdentity}
                                onClick={() => setUserType("Mahasiswa")}
                                className={`py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${userType === "Mahasiswa"
                                        ? "bg-stone-900 border-stone-900 text-white shadow-sm"
                                        : "bg-white border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700"
                                    }`}
                            >
                                Mahasiswa
                            </button>
                            <button
                                type="button"
                                disabled={hasSavedIdentity}
                                onClick={() => setUserType("Dosen")}
                                className={`py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${userType === "Dosen"
                                        ? "bg-stone-900 border-stone-900 text-white shadow-sm"
                                        : "bg-white border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700"
                                    }`}
                            >
                                Dosen / Staf Pengajar
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-stone-200" />
                        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Data Identitas</span>
                        <div className="flex-1 h-px bg-stone-200" />
                    </div>

                    {/* Nama Lengkap */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-stone-500 uppercase tracking-widest">Nama Lengkap</label>
                            {hasSavedName && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                    </svg>
                                    Terkunci
                                </span>
                            )}
                        </div>
                        <input
                            type="text"
                            value={fullName}
                            disabled={hasSavedName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Masukkan nama lengkap anda..."
                            className={`${inputBase} font-medium`}
                        />
                    </div>

                    {/* NIM / NIP */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
                                {userType === "Mahasiswa" ? "Nomor Induk Mahasiswa (NIM)" : "Nomor Induk Dosen / Pegawai (NIDN/NIP)"}
                            </label>
                            {hasSavedIdentity && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                    </svg>
                                    Terkunci
                                </span>
                            )}
                        </div>
                        <input
                            type="text"
                            value={identityNumber}
                            disabled={hasSavedIdentity}
                            onChange={(e) => setIdentityNumber(e.target.value)}
                            placeholder={userType === "Mahasiswa" ? "Contoh: 243403001" : "Contoh: 0412038901"}
                            className={inputBase}
                        />
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-stone-200" />
                        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Afiliasi Akademik</span>
                        <div className="flex-1 h-px bg-stone-200" />
                    </div>

                    {/* Fakultas & Prodi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Fakultas</label>
                            <input
                                type="text"
                                value={faculty}
                                onChange={(e) => setFaculty(e.target.value)}
                                placeholder="Misal: Fakultas Ekonomi dan Bisnis"
                                className={inputBase}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Program Studi</label>
                            <input
                                type="text"
                                value={studyProgram}
                                onChange={(e) => setStudyProgram(e.target.value)}
                                placeholder="Misal: Akuntansi"
                                className={inputBase}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    {!isLocked && (
                        <>
                            <div className="h-px bg-stone-200" />
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all shadow-sm text-sm cursor-pointer disabled:bg-stone-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Mengunci Identitas Akun...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                        </svg>
                                        Kunci & Simpan Profil Permanen
                                    </>
                                )}
                            </button>
                            <p className="text-center text-[11px] text-stone-400">
                                Data nama dan NIM/NIP tidak dapat diubah setelah dikunci.
                            </p>
                        </>
                    )}

                </form>
            </main>
        </div>
    );
}