"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ShoppingBag, ShoppingCart, Star, Store, Check, Plus } from "lucide-react";

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

export default function MarketClient({ items }: { items: any[] }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);

  const refreshCart = useCallback(() => {
    setCart(getCart());
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) setUserId(JSON.parse(userStr).id);
    refreshCart();

    window.addEventListener("cart-updated", refreshCart);
    return () => window.removeEventListener("cart-updated", refreshCart);
  }, [refreshCart]);

  const filteredItems = items.filter((item: any) => item.userId !== userId);

  const addToCart = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();

    const currentCart = getCart();
    if (currentCart.find((c) => c.id === item.id)) return;

    const newItem: CartItem = {
      id: item.id,
      title: item.title,
      price: item.price,
      imageUrl: item.imageUrl,
      userId: item.userId,
      userName: item.user?.name || "User",
    };
    saveCart([...currentCart, newItem]);
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const isInCart = (id: string) => cart.some((c) => c.id === id);

  return (
    <div className="max-w-7xl mx-auto py-4">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-display font-extrabold text-slate-800 mb-4">Marketplace</h1>
        <p className="text-slate-500 text-lg">Temukan berbagai fashion preloved berkualitas dari komunitas WearWise. Mari wujudkan gaya hidup berkelanjutan!</p>
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-16 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Store size={32} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Belum Ada Barang</h3>
          <p className="text-slate-500 max-w-sm">Saat ini belum ada user lain yang menjual barang di market.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredItems.map((item: any) => {
            const inCart = isInCart(item.id);
            const justAdded = addedId === item.id;

            return (
              <Link href={`/dashboard/market/${item.id}`} key={item.id}>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group cursor-pointer h-full flex flex-col hover:-translate-y-1">
                  <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm border border-white/50 flex items-center gap-1.5">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-slate-700">Preloved</span>
                    </div>

                    {/* Add to Cart overlay button */}
                    <button
                      onClick={(e) => addToCart(e, item)}
                      disabled={inCart}
                      className={`absolute bottom-3 right-3 p-2.5 rounded-xl shadow-lg transition-all duration-300 active:scale-90 ${
                        inCart || justAdded
                          ? "bg-green-500 text-white scale-100"
                          : "bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-green-500 hover:text-white hover:scale-110"
                      }`}
                      title={inCart ? "Sudah di keranjang" : "Tambah ke keranjang"}
                    >
                      {inCart || justAdded ? (
                        <Check size={18} strokeWidth={3} />
                      ) : (
                        <Plus size={18} strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                  <div className="p-4 md:p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-green-600 transition-colors">{item.title}</h3>
                    <p className="text-lg font-display font-extrabold text-green-600 mb-auto">
                      Rp {item.price.toLocaleString("id-ID")}
                    </p>

                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-slate-500 overflow-hidden">
                        <div className="w-6 h-6 shrink-0 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {item.user?.name ? item.user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <span className="text-xs font-medium truncate">
                          {item.user?.name || "User"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <Link
          href="/dashboard/cart"
          className="fixed bottom-6 right-6 z-40 bg-green-500 hover:bg-green-600 text-white p-4 rounded-2xl shadow-2xl shadow-green-500/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 group animate-in slide-in-from-bottom-4 duration-500"
        >
          <ShoppingCart size={24} className="group-hover:rotate-12 transition-transform" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-extrabold">{cart.length} Item</span>
            <span className="text-[10px] font-medium text-green-100">
              Rp {cart.reduce((sum, c) => sum + c.price, 0).toLocaleString("id-ID")}
            </span>
          </div>
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {cart.length}
          </div>
        </Link>
      )}
    </div>
  );
}
