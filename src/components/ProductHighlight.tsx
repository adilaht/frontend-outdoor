// src/components/ProductHighlight.tsx
'use client';

import * as React from "react";
import { getHighlightedProducts } from "@/src/services/productService";
import { type Product } from "@/src/types";
import { ProductCard } from "@/src/components/common/ProductCard"; 
import { ProductSkeletonCard } from "@/src/components/common/ProductSkeletonCard";

interface ProductHighlightProps {
  isDateSelected?: boolean;  // Kita bikin opsional (?) biar ga error di beranda
  isSimpleDisplay?: boolean; // 👈 Tambah prop baru untuk mode display pasif
}

export function ProductHighlight({ 
  isDateSelected = false, 
  isSimpleDisplay = false 
}: ProductHighlightProps) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    // Kita ubah dari 5 jadi 4 produk agar pas mengisi grid layout (4 kolom)
    getHighlightedProducts().then((data) => {
      setProducts(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductSkeletonCard key={i} isSimpleDisplay={isSimpleDisplay} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="w-full text-center py-16 border border-dashed border-zinc-300 rounded-xl bg-white">
        <p className="text-sm text-zinc-500 font-medium">Tidak ada produk aktif yang ditemukan saat ini.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard 
          key={product.id_product} 
          product={product} 
          isDateSelected={isSimpleDisplay ? false : isDateSelected} // Jika mode simple, paksa false agar tombol terkunci
          isSimpleDisplay={isSimpleDisplay} // 👈 Kita lempar prop ini ke ProductCard biar dia nyesuaiin dalemannya
        />
      ))}
    </div>
  );
}