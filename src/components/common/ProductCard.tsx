// src/components/common/ProductCard.tsx
'use client';

import * as React from 'react';
import { ShoppingCart, Eye, Plus, Minus, Check, Layers } from 'lucide-react';
import { type Product } from '@/src/types';
import { addToCart } from '@/src/services/cartService';
import { useRouter } from 'next/navigation';
import { getCoverImage } from '@/src/lib/imageHelper';
import { useCartGlobal } from '@/src/context/CartContext';

interface ProductCardProps {
  product: Product;
  isDateSelected: boolean;
  isSimpleDisplay?: boolean; // Prop baru opsional untuk mode display pasif di Beranda
  onCartUpdated?: () => void; 
}

export function ProductCard({ 
  product, 
  isDateSelected, 
  isSimpleDisplay = false, 
  onCartUpdated 
}: ProductCardProps) {
  const router = useRouter(); 
  const { refreshGlobalDate, cartItems } = useCartGlobal();
  const [jumlah, setJumlah] = React.useState<number>(1);
  const [isAdding, setIsAdding] = React.useState<boolean>(false);
  const [isSuccess, setIsSuccess] = React.useState<boolean>(false);

  const isOutOfStock = (isDateSelected && product.stok_tersedia !== undefined) 
    ? product.stok_tersedia === 0 
    : product.stok_total === 0;
  
  const currentMaxStock = (isDateSelected && product.stok_tersedia !== undefined) 
    ? product.stok_tersedia 
    : product.stok_total;
    
  // 🌟 NEW: Calculate how many of this product are already in the cart
  const cartItem = cartItems?.find((item: any) => item.id_product === product.id_product);
  const qtyInCart = cartItem ? cartItem.jumlah : 0;
  
  // Available to add equals max stock minus what's already in the cart
  const availableToAdd = Math.max(0, currentMaxStock - qtyInCart);
  
  // Disables the entire card action if they can't add any more
  const isFullyStockedInCart = availableToAdd <= 0;
  
  const productCover = getCoverImage(product.images);

  const increment = (e: React.MouseEvent) => {
    e.stopPropagation(); // Biar ga ke-trigger klik navigasi card
    if (jumlah < availableToAdd) setJumlah(prev => prev + 1);
  };

  const decrement = (e: React.MouseEvent) => {
    e.stopPropagation(); // Biar ga ke-trigger klik navigasi card
    if (jumlah > 1) setJumlah(prev => prev - 1);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Menahan agar navigasi router.push halaman detail tidak jalan
    if (isFullyStockedInCart) return; // Guard
    
    setIsAdding(true);
    const success = await addToCart(product.id_product, jumlah);
    
    if (success) {
      setIsSuccess(true);
      if (onCartUpdated) onCartUpdated();
      await refreshGlobalDate(); // 🌟 LANGSUNG REFRESH CART CONTEXT SETELAH NAMBAH BARANG
      
      // Reset jumlah back to 1 for the next add action, or max available
      setJumlah(1);

      setTimeout(() => {
        setIsSuccess(false);
        setJumlah(1); 
      }, 2000);
    }
    setIsAdding(false);
  };

  // Navigasi utama ketika card di-klik
  const handleCardClick = () => {
    router.push(`/produk/${product.id_product}`);
  };
  

  return (
    <div 
      onClick={handleCardClick}
      className="group bg-white border border-zinc-200/80 rounded-2xl overflow-hidden flex flex-col hover:shadow-xl hover:border-zinc-300 transition-all duration-300 h-full cursor-pointer relative"
    >
      {/* 1. GAMBAR PRODUK DENGAN HOVER EFFECT */}
      <div className="relative w-full aspect-square bg-zinc-50 overflow-hidden border-b border-zinc-100">
        <img 
          src={productCover} 
          alt={product.nama} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
        />
        
        {/* Badge Kategori / Gear */}
        <span className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md z-10">
          {product.category?.nama || 'GEAR'}
        </span>

        {/* Badge Ketersediaan Stok Pojok Kanan Atas */}
        {isDateSelected && !isSimpleDisplay && (
          <div className="absolute top-3 right-3 z-10">
            {isOutOfStock ? (
              <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">Habis</span>
            ) : (
              <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">Ready</span>
            )}
          </div>
        )}

        {/* Overlay Eye Icon saat di-hover */}
        <div className="absolute inset-0 bg-brand-dark/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-white text-zinc-900 p-2.5 rounded-full shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <Eye className="w-4 h-4" />
          </div>
        </div>
      </div>
      
      {/* 2. DETAIL KONTEN */}
      <div className="p-5 flex flex-col flex-grow space-y-3">
        <div>
          <h3 className="font-black text-sm sm:text-base text-zinc-900 uppercase tracking-tight line-clamp-1 group-hover:text-brand-accent transition-colors duration-200">
            {product.nama}
          </h3>
          {/* <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed h-8">
            {product.deskripsi}
          </p> */}
        </div>
        
        {/* Baris Meta Internal Unit */}
        {!isSimpleDisplay && (
          <div className={`flex items-center gap-1.5 text-[11px] font-medium ${isOutOfStock ? 'text-red-500' : 'text-zinc-400'}`}>
            <Layers className={`w-3.5 h-3.5 ${isOutOfStock ? 'text-red-400' : 'text-zinc-300'}`} /> Kapasitas: {currentMaxStock} Unit Ready
          </div>
        )}

        <div className="border-t border-dashed border-zinc-200 my-1" />

        {/* Tarif Sewa (Paling Menonjol) */}
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Tarif Sewa</span>
          <div className="text-right">
            <span className="font-mono text-base font-black text-zinc-950">
              Rp {product.harga_per_hari.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight ml-0.5">/Hari</span>
          </div>
        </div>

        {/* ─── STATUS KALENDER LOCK ─── */}
        {!isSimpleDisplay && !isDateSelected && (
          <div className="text-center bg-zinc-50 border border-zinc-150 text-zinc-400 text-[10px] font-bold py-2 rounded-xl uppercase tracking-wider">
            🔒 Masukkan tanggal untuk cek stok
          </div>
        )}

        {/* ─── BLOK AKSI (Selector Qty & Tombol Tambah) ─── */}
        {!isSimpleDisplay && isDateSelected && (
          <div className="pt-2 space-y-2">
            
            {/* Selector Jumlah Unit */}
            {!isOutOfStock && !isFullyStockedInCart && (
              <div className="flex items-center justify-between border border-zinc-200 bg-zinc-50 rounded-xl h-10 px-3">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Jumlah:</span>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={decrement} 
                    disabled={jumlah <= 1 || isSuccess} 
                    className="p-1 text-zinc-400 hover:text-brand-dark disabled:opacity-30 cursor-pointer transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-black font-mono text-brand-dark select-none">{jumlah}</span>
                  <button 
                    type="button"
                    onClick={increment} 
                    disabled={jumlah >= availableToAdd || isSuccess} 
                    className="p-1 text-zinc-400 hover:text-brand-dark disabled:opacity-30 cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Tombol Utama */}
            {isOutOfStock ? (
              <button disabled className="w-full bg-red-50 text-red-500 text-xs font-black py-3 rounded-xl uppercase tracking-wider cursor-not-allowed border border-red-100 opacity-80">
                Stok Habis
              </button>
            ) : isFullyStockedInCart ? (
              <button disabled className="w-full bg-zinc-100 text-zinc-400 text-[10px] font-black py-3 rounded-xl uppercase tracking-wider cursor-not-allowed border border-zinc-200 flex items-center justify-center gap-1.5 opacity-90">
                <Check className="w-3.5 h-3.5" /> Maksimal Di Keranjang
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAdding || isSuccess}
                className={`w-full text-white text-xs font-black py-3 rounded-xl uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md ${
                  isSuccess 
                    ? "bg-emerald-600 shadow-emerald-600/10" 
                    : "bg-brand-accent hover:bg-red-600 shadow-brand-accent/5"
                }`}
              >
                {isAdding ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Berhasil Diambil
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5" /> Ambil Alat
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}