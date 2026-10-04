// src/components/common/ProductSkeletonCard.tsx
import * as React from 'react';

interface ProductSkeletonCardProps {
  isSimpleDisplay?: boolean;
}

export function ProductSkeletonCard({ isSimpleDisplay = false }: ProductSkeletonCardProps) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden flex flex-col h-full relative">
      {/* 1. GAMBAR PRODUK SKELETON */}
      <div className="relative w-full aspect-square bg-zinc-100 animate-pulse border-b border-zinc-100">
        {/* Badge Kategori / Gear */}
        <div className="absolute top-3 left-3 bg-zinc-200 w-16 h-5 rounded-md animate-pulse"></div>
      </div>
      
      {/* 2. DETAIL KONTEN SKELETON */}
      <div className="p-5 flex flex-col flex-grow space-y-3">
        <div>
          {/* Title Skeleton */}
          <div className="bg-zinc-200 h-5 w-3/4 rounded animate-pulse mb-1"></div>
        </div>
        
        {/* Baris Meta Internal Unit */}
        {!isSimpleDisplay && (
          <div className="bg-zinc-100 h-3 w-1/2 rounded animate-pulse"></div>
        )}

        <div className="border-t border-dashed border-zinc-200 my-1" />

        {/* Tarif Sewa */}
        <div className="flex items-baseline justify-between">
          <div className="bg-zinc-100 h-3 w-16 rounded animate-pulse"></div>
          <div className="flex items-center gap-1">
            <div className="bg-zinc-200 h-5 w-24 rounded animate-pulse"></div>
          </div>
        </div>

        {/* ─── BLOK AKSI (Selector Qty & Tombol Tambah) ─── */}
        {!isSimpleDisplay && (
          <div className="pt-2 space-y-2">
            {/* Selector Jumlah Unit */}
            <div className="bg-zinc-100 h-10 w-full rounded-xl animate-pulse"></div>

            {/* Tombol Utama */}
            <div className="bg-zinc-200 h-10 w-full rounded-xl animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
}
