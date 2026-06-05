"use client";

import { useState, ChangeEvent, FormEvent, ClipboardEvent, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function WriteArticlePage() {
    const router = useRouter();
    const mainContentRef = useRef<HTMLTextAreaElement>(null);

    // State Form Terpisah Sesuai Standar Jurnal Ilmiah
    const [title, setTitle] = useState<string>("");
    const [authors, setAuthors] = useState<string>("");
    const [abstract, setAbstract] = useState<string>("");
    const [methodology, setMethodology] = useState<string>("");
    const [mainContent, setMainContent] = useState<string>("");
    const [dapus, setDapus] = useState<string>("");

    // State Gambar Cover
    const [coverUrl, setCoverUrl] = useState<string>("");
    const [uploadingImage, setUploadingImage] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(false);
    const [ocrProgress, setOcrProgress] = useState<string>("");
    const [isPublishing, setIsPublishing] = useState<boolean>(false);

    // --- FUNGSI FORMAT TEXT INJECTION ---
    const applyFormatting = (formatType: "bold" | "italic" | "underline") => {
        const textarea = mainContentRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = mainContent.substring(start, end);

        let formattedText = "";
        let cursorOffset = 0;

        switch (formatType) {
            case "bold":
                formattedText = `**${selectedText || "teks_tebal"}**`;
                cursorOffset = selectedText ? formattedText.length : 2;
                break;
            case "italic":
                formattedText = `*${selectedText || "teks_miring"}*`;
                cursorOffset = selectedText ? formattedText.length : 1;
                break;
            case "underline":
                formattedText = `<u>${selectedText || "teks_garis_bawah"}</u>`;
                cursorOffset = selectedText ? formattedText.length : 3;
                break;
        }

        const newContent = mainContent.substring(0, start) + formattedText + mainContent.substring(end);
        setMainContent(newContent);

        setTimeout(() => {
            textarea.focus();
            if (selectedText) {
                textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
            } else {
                const newStart = start + cursorOffset;
                const newEnd = newStart + (formatType === "bold" ? 10 : formatType === "italic" ? 11 : 16);
                textarea.setSelectionRange(newStart, newEnd);
            }
        }, 50);
    };

    // --- FUNGSI UNGGAH GAMBAR ---
    const handleImageUpload = async (file: File, isCover: boolean) => {
        const formData = new FormData();
        formData.append("file", file);

        if (isCover) setUploadingImage(true);
        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                const secureUrl = data.imageUrl || data.url;

                if (isCover) {
                    setCoverUrl(secureUrl);
                    alert("📸 Gambar cover berhasil diproses!");
                }
                return secureUrl as string;
            } else {
                const errData = await res.json();
                alert(`Gagal memproses gambar: ${errData.error || errData.message || "Terjadi kesalahan"}`);
                return null;
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan jaringan saat mengunggah gambar.");
            return null;
        } finally {
            if (isCover) setUploadingImage(false);
        }
    };

    // --- FUNGSI INTERCEPT PASTE GAMBAR ---
    const handleContentPaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                e.preventDefault();

                const file = items[i].getAsFile();
                if (!file) continue;

                const targetTextarea = e.currentTarget;
                const selectionStart = targetTextarea.selectionStart;
                const selectionEnd = targetTextarea.selectionEnd;

                const textSebelumnya = mainContent.substring(0, selectionStart);
                const textSesudahnya = mainContent.substring(selectionEnd);

                const uploadedUrl = await handleImageUpload(file, false);

                if (uploadedUrl) {
                    const templateGambar = `\n\n${uploadedUrl}\n\n`;
                    setMainContent(textSebelumnya + templateGambar + textSesudahnya);

                    setTimeout(() => {
                        targetTextarea.focus();
                        const newCursorPos = selectionStart + templateGambar.length;
                        targetTextarea.setSelectionRange(newCursorPos, newCursorPos);
                    }, 50);
                }
                break;
            }
        }
    };

    // --- FUNGSI IMPOR FILE VIA HYBRID ROUTE API ---
    const handleFileImport = async (e: ChangeEvent<HTML