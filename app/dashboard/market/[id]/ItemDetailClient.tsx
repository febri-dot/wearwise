"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, ShieldCheck, ShoppingCart, Check, Plus } from "lucide-react";

interface ItemDetail {
  id: string;
  title: string;
  description: string | null;
  price: number;
  status: string;
  userId: string;
  imageUrl: string;
  user: {
    id: string;
    name: string;
    phone: string;
    address: string;
  };
}

interface CartItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  userId: string;
  userName: string;
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

export default function ItemDetailClient({ item }: { item: ItemDetail }) {
  const [inCart, setInCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const checkCart = useCallback(() => {
    const cart = getCart();
    setInCart(cart.some((c) => c.id === item.id));
  }, [item.id]);

  useEffect(() => {
    checkCart();
    window.addEventListener("cart-updated", checkCart);
    return () => window.removeEventListener("cart-updated", checkCart);
  }, [checkCart]);

  const handleAddToCart = () => {
    if (inCart) return;
    const cart = getCart();
    const newItem: CartItem = {
      id: item.id,
      title: item.title,
      price: item.price,
      imageUrl: item.imageUrl,
      userId: item.userId,
      userName: item.user.name,
    };
    saveCart([...cart, newItem]);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/dashboard/market" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold mb-8">
        <ArrowLeft size={20} /> Kembali ke Marketplace
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
        {/* Left: Image */}
        <div className="md:w-1/2 bg-slate-50 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-slate-100 min-h-[400px]">
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-sm aspect-[4/5] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Right: Details */}
        <div className="md:w-1/2 p-8 md:p-10 flex flex-col">
          <div className="mb-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">
              {item.status}
            </span>
          </div>
          
          <h1 className="text-3xl font-display font-extrabold text-slate-800 mb-4 leading-tight">{item.title}</h1>
          <p className="text-4xl font-display font-extrabold text-green-600 mb-8">
            Rp {item.price.toLocaleString("id-ID")}
          </p>

          <div className="space-y-6 flex-1">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">Deskripsi Barang</h3>
              <div className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {item.description || "Tidak ada deskripsi."}
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex gap-4 items-center">
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                {item.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  {item.user.name} <ShieldCheck size={16} className="text-blue-500" />
                </h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin size={12} /> {item.user.address || "Alamat tidak tersedia"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={inCart}
              className={`w-full py-4 rounded-2xl font-extrabold text-lg shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-3 ${
                inCart
                  ? "bg-green-100 text-green-700 shadow-green-100 cursor-default"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-500/30"
              }`}
            >
              {inCart ? (
                <>
                  <Check size={24} strokeWidth={3} />
                  {justAdded ? "Berhasil Ditambahkan!" : "Sudah di Keranjang"}
                </>
              ) : (
                <>
                  <ShoppingCart size={24} />
                  Tambah ke Keranjang
                </>
              )}
            </button>

            {inCart && (
              <Link
                href="/dashboard/cart"
                className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} />
                Lihat Keranjang
              </Link>
            )}

            <p className="text-center text-xs text-slate-400 mt-3">Pembayaran dilakukan melalui QRIS penjual saat checkout.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
