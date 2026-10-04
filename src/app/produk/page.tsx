// src/app/produk/page.tsx
'use client';

import * as React from 'react';
import { ProductCard } from '@/src/components/common/ProductCard';
import { ProductSkeletonCard } from '@/src/components/common/ProductSkeletonCard';
import { getProducts, getCategories, getCategoryById } from '@/src/services/productService';
import { updateCartDate } from '@/src/services/cartService'; 
import { type Product, type Category } from '@/src/types';
import { Loader2, ChevronLeft, ChevronRight, SlidersHorizontal, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/Popover';
import { Calendar } from '@/src/components/ui/Calendar';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useSearchParams, useRouter } from 'next/navigation';
import { type DateRange } from 'react-day-picker';
import { Suspense } from 'react';
// 🌟 BARU: Import Hook Global Context
import { useCartGlobal } from '@/src/context/CartContext';
import ConfirmModal from '@/src/components/common/ConfirmModal';

function CatalogPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 🌟 AMBIL DARI CONTEXT GLOBAL: Tidak perlu state dateRange lokal lagi
  const { dateRange, setDateRange, isDateSelected, isLoadingCartGlobal } = useCartGlobal();

  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<number | string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isUpdatingDate, setIsUpdatingDate] = React.useState(false); 
  const [isLoading, setIsLoading] = React.useState(true);
  const [confirmModal, setConfirmModal] = React.useState({
    isOpen: false,
    title: 'Informasi',
    message: '',
    type: 'info' as 'danger' | 'warning' | 'info',
    hideCancel: true,
    action: () => {}
  });

  const LIMIT = 9;

  // 1. 🌟 SYNC STATE KE URL: Mengikuti perubahan data global dateRange
  React.useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = format(dateRange.to, 'yyyy-MM-dd');
      router.replace(`/produk?from=${fromStr}&to=${toStr}`, { scroll: false });
    }
  }, [dateRange, router]);

  // 2. FETCH LIST KATEGORI SIDEBAR
  React.useEffect(() => {
    getCategories().then((data) => setCategories(data));
  }, []);

  // 3. FETCHING DATA PRODUK
  React.useEffect(() => {
    setIsLoading(true);

    const fromStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null;
    const toStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null;

    getProducts(currentPage, LIMIT, selectedCategory, fromStr, toStr).then((res) => {
      if (res) {
        setProducts(res.data || []);
        setTotalPages(res.totalPages || 1);
      } else {
        setProducts([]);
        setTotalPages(1);
      }
      setIsLoading(false);
    });
  }, [currentPage, selectedCategory, dateRange]); // 🌟 dateRange tetap di sini agar grid nge-refresh pas tanggal ter-restore

  // 4. HANDLER PERUBAHAN TANGGAL BARU
  const handleDateChange = async (range: DateRange | undefined) => {
    setDateRange(range); // Simpan ke Context Global

    if (range?.from && range?.to) {
      setIsUpdatingDate(true);
      
      const fromStr = format(range.from, 'yyyy-MM-dd');
      const toStr = format(range.to, 'yyyy-MM-dd');

      try {
        const success = await updateCartDate(fromStr, toStr);
        if (success) {
          console.log(`Tanggal sewa cart global sukses diubah: ${fromStr} -> ${toStr}`);
        } else {
          setConfirmModal({ isOpen: true, title: 'Gagal', message: 'Gagal menyinkronkan perubahan tanggal ke server.', type: 'danger', hideCancel: true, action: () => {} });
        }
      } catch (error) {
        console.error("Kesalahan jaringan saat update-date:", error);
      } finally {
        setIsUpdatingDate(false);
      }
    }
  };

  const handleCategoryChange = (id: number | string | null) => {
    setSelectedCategory(id);
    setCurrentPage(1);
  };

  // 🌟 LOADING BLOCKER UTAMA: Cegah fluktuasi layout selagi Context me-restore data dari server
  if (isLoadingCartGlobal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-white">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
        <p className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">Menghubungkan Sesi...</p>
      </div>
    );
  }

  // State loading internal grid
  const isGridLoading = products.length === 0 && !dateRange;

  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-4 text-zinc-900">
      <div className="max-w-7xl mx-auto">
        
        {/* ─── HEADER SECTION ─── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 mb-10 border-b border-zinc-100">
          <div>
            <div className="inline-flex items-center gap-2 bg-zinc-900 rounded-full px-3 py-1 mb-3">
              <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-zinc-400 tracking-[0.2em] uppercase">Katalog Peralatan</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-brand-dark leading-none">Pilih Gear Petualanganmu</h1>
            <p className="text-zinc-400 text-sm mt-2">Alat premium siap pakai untuk kenyamanan camping & hiking maksimal.</p>
          </div>

          <div className="w-full lg:w-80 shrink-0 bg-zinc-50 border border-zinc-200 p-2 rounded-xl">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-1.5 pl-1">
              Periode Sewa Global {isUpdatingDate && <span className="text-brand-accent text-[9px] lowercase animate-pulse font-mono">(syncing...)</span>}
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" disabled={isUpdatingDate} className="w-full flex items-center gap-3 bg-white text-brand-dark border border-zinc-200 p-3 rounded-lg transition text-left text-sm font-medium focus:outline-none cursor-pointer hover:border-brand-dark disabled:opacity-60 disabled:cursor-not-allowed">
                  <CalendarIcon className="h-4 w-4 text-brand-accent flex-shrink-0" />
                  {isDateSelected ? (
                    <span className="font-bold text-xs">{format(dateRange!.from!, "dd MMM", { locale: localeId })} → {format(dateRange!.to!, "dd MMM yyyy", { locale: localeId })}</span>
                  ) : (
                    <span className="text-zinc-400 text-xs">Pilih Tanggal Booking</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border-zinc-200 text-zinc-900 shadow-2xl rounded-xl" align="end">
                <Calendar mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={handleDateChange} numberOfMonths={1} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* ─── MAIN CATALOG CONTENT ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* SIDEBAR: Filter Kategori */}
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl lg:sticky lg:top-28 shadow-lg shadow-zinc-100/60">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-zinc-100">
              <SlidersHorizontal className="w-4 h-4 text-brand-accent" />
              <h2 className="text-[10px] font-black tracking-[0.15em] uppercase text-brand-dark">Kategori Alat</h2>
            </div>
            
            <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 scrollbar-none">
              <button
                onClick={() => handleCategoryChange(null)}
                className={`whitespace-nowrap text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer w-full ${
                  selectedCategory === null ? 'bg-brand-dark text-white shadow-md' : 'text-zinc-500 hover:text-brand-dark hover:bg-zinc-150'
                }`}
              >
                Semua Alat
              </button>

              {categories.map((cat) => {
                const isCurrent = selectedCategory === cat.id_category;
                return (
                  <button
                    key={cat.id_category}
                    onClick={() => handleCategoryChange(cat.id_category)}
                    className={`whitespace-nowrap text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer w-full flex justify-between items-center ${
                      isCurrent ? 'bg-brand-dark text-white shadow-md' : 'text-zinc-500 hover:text-brand-dark hover:bg-zinc-150'
                    }`}
                  >
                    <span>{cat.nama}</span>
                    {cat._count && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isCurrent ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-600'}`}>
                        {cat._count.products}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN GRID & PAGINATION */}
          <div className="lg:col-span-3 space-y-10">
            {isGridLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductSkeletonCard key={i} isSimpleDisplay={!isDateSelected} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="min-h-[400px] flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-2xl bg-zinc-50 p-8">
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Belum Ada Alat di Kategori Ini</p>
              </div>
            ) : (
              <>
                {/* Grid Item */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard 
                      key={product.id_product} 
                      product={product} 
                      isDateSelected={isDateSelected}
                      isSimpleDisplay={!isDateSelected}
                    />
                  ))}
                </div>

                {/* CONTROLLER PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6 border-t border-zinc-100">
                    <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition disabled:opacity-30 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-10 h-10 rounded-xl font-mono text-xs font-black transition cursor-pointer ${currentPage === pageNum ? 'bg-brand-accent text-white' : 'border border-zinc-200 text-zinc-500 hover:bg-zinc-50'}`}>{pageNum}</button>
                        );
                      })}
                    </div>
                    <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition disabled:opacity-30 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
      
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        type={confirmModal.type}
        hideCancel={confirmModal.hideCancel}
        confirmText="OK"
      />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-accent" /></div>}>
      <CatalogPageContent />
    </Suspense>
  );
}