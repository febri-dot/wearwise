"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Upload,
  Store,
  QrCode,
  ShoppingBag,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

interface CartItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  userId: string;
  userName: string;
}

interface SellerGroup {
  sellerId: string;
  sellerName: string;
  items: CartItem[];
  total: number;
}

function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("wearwise_cart") || "[]");
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem("wearwise_cart", JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Checkout modal state
  const [checkoutGroup, setCheckoutGroup] = useState<SellerGroup | null>(null);
  const [qrisUrl, setQrisUrl] = useState<string | null>(null);
  const [qrisLoading, setQrisLoading] = useState(false);
  const [qrisError, setQrisError] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const refreshCart = useCallback(() => {
    setCart(getCart());
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) setUserId(JSON.parse(userStr).id);
    refreshCart();
    setLoading(false);

    window.addEventListener("cart-updated", refreshCart);
    return () => window.removeEventListener("cart-updated", refreshCart);
  }, [refreshCart]);

  const removeFromCart = (itemId: string) => {
    const updated = cart.filter((c) => c.id !== itemId);
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  // Group items by seller
  const sellerGroups: SellerGroup[] = [];
  cart.forEach((item) => {
    const existing = sellerGroups.find((g) => g.sellerId === item.userId);
    if (existing) {
      existing.items.push(item);
      existing.total += item.price;
    } else {
      sellerGroups.push({
        sellerId: item.userId,
        sellerName: item.userName,
        items: [item],
        total: item.price,
      });
    }
  });

  const grandTotal = cart.reduce((sum, c) => sum + c.price, 0);

  // Open checkout for a seller group
  const openCheckout = async (group: SellerGroup) => {
    setCheckoutGroup(group);
    setProofFile(null);
    setProofPreview(null);
    setSubmitError("");
    setSubmitSuccess(false);
    setQrisUrl(null);
    setQrisError(null);
    setQrisLoading(true);

    try {
      const res = await fetch(`/api/user/qris?userId=${group.sellerId}`);
      const data = await res.json();
      if (data.success && data.qrisImageUrl) {
        setQrisUrl(data.qrisImageUrl);
      } else {
        setQrisError("Penjual belum mengatur QRIS. Hubungi penjual langsung.");
      }
    } catch {
      setQrisError("Gagal memuat QRIS penjual.");
    }
    setQrisLoading(false);
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const handleSubmitCheckout = async () => {
    if (!checkoutGroup || !proofFile || !userId) {
      setSubmitError("Upload bukti pembayaran terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const formData = new FormData();
    formData.append("itemIds", JSON.stringify(checkoutGroup.items.map((i) => i.id)));
    formData.append("sellerId", checkoutGroup.sellerId);
    formData.append("buyerId", userId);
    formData.append("proof", proofFile);

    try {
      const res = await fetch("/api/sale-transactions", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setSubmitSuccess(true);
        // Remove these items from cart
        const itemIds = checkoutGroup.items.map((i) => i.id);
        const updatedCart = cart.filter((c) => !itemIds.includes(c.id));
        saveCart(updatedCart);
      } else {
        setSubmitError(data.error || "Gagal memproses pembayaran.");
      }
    } catch {
      setSubmitError("Terjadi kesalahan jaringan.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-green-500 mb-4" size={40} />
        <p className="text-slate-500 font-bold">Memuat keranjang...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link
        href="/dashboard/market"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold mb-8"
      >
        <ArrowLeft size={20} /> Kembali ke Marketplace
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
            <ShoppingCart size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-extrabold text-slate-800">Keranjang</h1>
            <p className="text-slate-500">
              {cart.length} item{cart.length !== 1 ? "" : ""} dari {sellerGroups.length} penjual
            </p>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} /> Kosongkan
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center flex flex-col items-center shadow-sm">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag size={40} className="text-slate-200" />
          </div>
          <h3 className="text-2xl font-bold text-slate-700 mb-3">Keranjang Kosong</h3>
          <p className="text-slate-500 mb-8 max-w-sm">Jelajahi marketplace untuk menemukan fashion preloved berkualitas!</p>
          <Link
            href="/dashboard/market"
            className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-extrabold rounded-2xl shadow-lg shadow-green-500/20 transition-all hover:-translate-y-0.5"
          >
            Jelajahi Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {sellerGroups.map((group) => (
            <div key={group.sellerId} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Seller header */}
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-sm text-sm">
                  {group.sellerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm">{group.sellerName}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{group.items.length} item</p>
                </div>
                <Store size={18} className="text-slate-300" />
              </div>

              {/* Items */}
              <div className="divide-y divide-slate-50">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-5 hover:bg-slate-50/50 transition-colors">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{item.title}</h4>
                      <p className="text-green-600 font-extrabold font-display text-sm">
                        Rp {item.price.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Hapus dari keranjang"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Seller subtotal + checkout */}
              <div className="px-6 py-5 bg-gradient-to-r from-green-50/80 to-emerald-50/80 border-t border-green-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subtotal</p>
                  <p className="text-xl font-display font-extrabold text-green-600">
                    Rp {group.total.toLocaleString("id-ID")}
                  </p>
                </div>
                <button
                  onClick={() => openCheckout(group)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-green-500/20 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 text-sm"
                >
                  <CreditCard size={18} /> Bayar Sekarang
                </button>
              </div>
            </div>
          ))}

          {/* Grand Total */}
          <div className="bg-slate-900 rounded-3xl p-8 text-white flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Keseluruhan</p>
              <p className="text-3xl font-display font-extrabold">
                Rp {grandTotal.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium">{cart.length} item</p>
              <p className="text-xs text-slate-400 font-medium">{sellerGroups.length} penjual</p>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutGroup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-300 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-display font-extrabold text-slate-900">Pembayaran</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                  Bayar ke {checkoutGroup.sellerName}
                </p>
              </div>
              <button
                onClick={() => setCheckoutGroup(null)}
                className="p-3 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
              >
                <XCircle size={28} />
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-12 text-center">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="text-green-500" size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Pembayaran Terkirim!</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
                  Bukti pembayaranmu telah dikirim ke penjual <span className="font-bold text-slate-700">{checkoutGroup.sellerName}</span>. 
                  Penjual akan memverifikasi pembayaranmu. Kamu bisa memantau status di halaman notifikasi.
                </p>
                <button
                  onClick={() => setCheckoutGroup(null)}
                  className="mt-8 px-10 py-4 bg-slate-900 text-white font-extrabold rounded-2xl shadow-xl transition-all active:scale-95"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <div className="p-8 space-y-8">
                {/* Items summary */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Item yang Dibeli</p>
                  <div className="space-y-2">
                    {checkoutGroup.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-white overflow-hidden shrink-0 border border-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <p className="flex-1 text-sm font-medium text-slate-700 truncate">{item.title}</p>
                        <p className="text-sm font-bold text-green-600">Rp {item.price.toLocaleString("id-ID")}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between px-3 py-3 bg-green-50 rounded-2xl border border-green-100">
                    <span className="text-sm font-bold text-slate-700">Total Bayar</span>
                    <span className="text-xl font-display font-extrabold text-green-600">
                      Rp {checkoutGroup.total.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* QRIS Section */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <QrCode size={14} /> QRIS Penjual
                  </p>
                  
                  {qrisLoading ? (
                    <div className="flex items-center justify-center py-12 bg-slate-50 rounded-3xl border border-slate-100">
                      <Loader2 className="animate-spin text-green-500" size={32} />
                    </div>
                  ) : qrisError ? (
                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 text-center">
                      <AlertTriangle size={32} className="text-amber-500 mx-auto mb-3" />
                      <p className="text-sm font-bold text-amber-700 mb-1">{qrisError}</p>
                      <p className="text-xs text-amber-500">Kamu masih bisa upload bukti transfer manual.</p>
                    </div>
                  ) : qrisUrl ? (
                    <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 flex flex-col items-center">
                      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-inner mb-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrisUrl} alt="QRIS Penjual" className="max-h-64 object-contain rounded-xl" />
                      </div>
                      <p className="text-xs text-slate-500 font-medium text-center leading-relaxed">
                        Scan QRIS di atas menggunakan aplikasi e-wallet atau mobile banking kamu. 
                        Pastikan total pembayaran sesuai.
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Upload Proof */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Upload Bukti Pembayaran</p>
                  <label className="block w-full cursor-pointer group">
                    <div className={`border-2 border-dashed rounded-3xl transition-all text-center overflow-hidden h-44 flex items-center justify-center ${
                      proofPreview ? "border-green-200 bg-green-50/30" : "border-slate-100 bg-slate-50 group-hover:border-green-300"
                    }`}>
                      {proofPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={proofPreview} alt="Bukti" className="w-full h-full object-contain p-4" />
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Upload size={32} className="text-slate-300 group-hover:text-green-400 transition-colors" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Screenshot bukti transfer/pembayaran</p>
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleProofChange} />
                  </label>
                </div>

                {/* Error */}
                {submitError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm font-semibold">
                    <AlertTriangle size={16} /> {submitError}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmitCheckout}
                  disabled={submitting || !proofFile}
                  className="w-full py-5 rounded-[1.5rem] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-extrabold text-lg shadow-xl shadow-green-200 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-3 hover:-translate-y-0.5"
                >
                  {submitting ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <CheckCircle size={24} />
                  )}
                  Kirim Bukti Pembayaran
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
