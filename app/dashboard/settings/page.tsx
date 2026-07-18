"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  QrCode,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Settings,
  Camera,
  Trash2,
} from "lucide-react";

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");

  // QRIS state
  const [currentQris, setCurrentQris] = useState<string | null>(null);
  const [qrisFile, setQrisFile] = useState<File | null>(null);
  const [qrisPreview, setQrisPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [loadingQris, setLoadingQris] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      setUserId(u.id);
      setUserName(u.name);
      fetchQris(u.id);
    } else {
      setLoadingQris(false);
    }
  }, []);

  const fetchQris = async (uid: string) => {
    setLoadingQris(true);
    try {
      const res = await fetch(`/api/user/qris?userId=${uid}`);
      const data = await res.json();
      if (data.success && data.qrisImageUrl) {
        setCurrentQris(data.qrisImageUrl);
      }
    } catch {
      // ignore
    }
    setLoadingQris(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrisFile(file);
    setQrisPreview(URL.createObjectURL(file));
    setUploadSuccess(false);
    setUploadError("");
  };

  const handleUpload = async () => {
    if (!qrisFile || !userId) return;

    setUploading(true);
    setUploadError("");
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("qris", qrisFile);

    try {
      const res = await fetch("/api/user/qris", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setCurrentQris(data.qrisImageUrl);
        setQrisFile(null);
        setQrisPreview(null);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setUploadError(data.error || "Gagal mengupload QRIS.");
      }
    } catch {
      setUploadError("Terjadi kesalahan jaringan.");
    }
    setUploading(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold mb-8"
      >
        <ArrowLeft size={20} /> Kembali ke Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-500/20">
          <Settings size={26} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-extrabold text-slate-800">Pengaturan</h1>
          <p className="text-slate-500">Kelola profil dan metode pembayaranmu</p>
        </div>
      </div>

      {/* QRIS Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center shadow-md shadow-violet-200">
              <QrCode size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-display font-extrabold text-slate-800">QRIS Pembayaran</h2>
              <p className="text-xs text-slate-500 font-medium">Upload gambar QRIS untuk menerima pembayaran dari buyer</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Current QRIS */}
          {loadingQris ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-violet-500" size={32} />
            </div>
          ) : currentQris ? (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">QRIS Saat Ini</p>
              <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 flex flex-col items-center">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-inner mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={currentQris} alt="QRIS Kamu" className="max-h-72 object-contain rounded-xl" />
                </div>
                <div className="flex items-center gap-2 text-green-600 text-sm font-bold">
                  <CheckCircle size={16} />
                  QRIS aktif — Buyer dapat membayar menggunakan kode ini
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 rounded-3xl border border-amber-100 p-8 text-center">
              <AlertTriangle size={32} className="text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-amber-800 mb-2">Belum ada QRIS</h3>
              <p className="text-sm text-amber-600 max-w-sm mx-auto leading-relaxed">
                Upload gambar QRIS milikmu agar buyer dapat melakukan pembayaran saat membeli barangmu di marketplace.
              </p>
            </div>
          )}

          {/* Upload new QRIS */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              {currentQris ? "Ganti QRIS" : "Upload QRIS"}
            </p>

            <label className="block w-full cursor-pointer group">
              <div className={`border-2 border-dashed rounded-3xl transition-all text-center overflow-hidden flex items-center justify-center ${
                qrisPreview 
                  ? "border-violet-200 bg-violet-50/30 h-64" 
                  : "border-slate-200 bg-slate-50 group-hover:border-violet-300 group-hover:bg-violet-50/30 h-44"
              }`}>
                {qrisPreview ? (
                  <div className="p-4 flex flex-col items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrisPreview} alt="Preview QRIS" className="max-h-44 object-contain rounded-xl" />
                    <p className="text-xs text-violet-500 font-bold">Klik untuk mengganti</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      <Camera size={28} className="text-slate-300 group-hover:text-violet-400 transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-600">Pilih gambar QRIS</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">JPG, PNG, atau WebP</p>
                    </div>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {/* Upload error */}
          {uploadError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm font-semibold">
              <AlertTriangle size={16} /> {uploadError}
            </div>
          )}

          {/* Upload success */}
          {uploadSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-700 text-sm font-semibold animate-in fade-in duration-300">
              <CheckCircle size={16} /> QRIS berhasil diupdate!
            </div>
          )}

          {/* Save button */}
          {qrisFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-extrabold text-lg shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {uploading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <Upload size={24} />
              )}
              {currentQris ? "Update QRIS" : "Simpan QRIS"}
            </button>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <QrCode size={60} />
        </div>
        <div className="flex gap-6 items-center relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">💡</div>
          <div>
            <h5 className="font-bold mb-1">Tips QRIS</h5>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Pastikan gambar QRIS yang kamu upload jelas dan mudah di-scan. Kamu bisa screenshot QRIS dari aplikasi e-wallet 
              (GoPay, OVO, Dana, ShopeePay) atau mobile banking kamu. QRIS yang sama bisa digunakan untuk semua transaksi di marketplace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
