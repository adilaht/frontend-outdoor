// src/app/produk/[id]/page.tsx
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, ShoppingCart, Check, ChevronLeft, Minus, Plus, Info, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { type DateRange } from 'react-day-picker';

import { getProductById } from '@/src/services/productService';
import { addToCart, updateCartDate } from '@/src/services/cartService'; // 🌟 UPDATE: Gunakan updateCartDate agar sinkron global
import { type Product } from '@/src/types';
import { Calendar } from '@/src/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/Popover';
import { useCartGlobal } from '@/src/context/CartContext';
import ConfirmModal from '@/src/components/common/ConfirmModal';
import { getCoverImage, normalizeImages } from '@/src/lib/imageHelper';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { refreshGlobalDate } = useCartGlobal();
  const [product, setProduct] = React.useState<Product | null>(null);
  const [jumlah, setJumlah] = React.useState(1);

  // 🌟 AMBIL DARI CONTEXT GLOBAL: Satukan state memory management
  const { isDateSelected, dateRange, setDateRange, isLoadingCartGlobal, cartItems } = useCartGlobal();

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [confirmModal, setConfirmModal] = React.useState({
    isOpen: false,
    title: 'Informasi',
    message: '',
    type: 'info' as 'danger' | 'warning' | 'info',
    hideCancel: true,
    action: () => { }
  });

  // Load data produk
  React.useEffect(() => {
    if (params.id) {
      const fromStr = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : null;
      const toStr = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : null;
      getProductById(params.id as string, fromStr, toStr).then((data) => {
        setProduct(data);
        setIsLoading(false);
      });
    }
  }, [params.id, dateRange?.from, dateRange?.to]);

  // 🌟 BARU: Handler perubahan kalender internal detail produk untuk ditembak ke server global
  const handleDateChange = async (range: DateRange | undefined) => {
    setDateRange(range); // Simpan langsung ke global state context

    if (range?.from && range?.to) {
      const fromStr = format(range.from, "yyyy-MM-dd");
      const toStr = format(range.to, "yyyy-MM-dd");
      try {
        await updateCartDate(fromStr, toStr);
        console.log(`[Detail] Sukses update tanggal sewa global: ${fromStr} -> ${toStr}`);
      } catch (err) {
        console.error("Gagal sinkronisasi tanggal sewa ke server:", err);
      }
    }
  };

  const handleAction = async () => {
    if (!isDateSelected || !dateRange?.from || !dateRange?.to || !product) {
      setConfirmModal({ isOpen: true, title: 'Perhatian', message: 'Pilih rentang tanggal sewa terlebih dahulu!', type: 'warning', hideCancel: true, action: () => { } });
      return;
    }

    setIsSubmitting(true);

    try {
      // 🌟 OPTIMISASI: Karena tanggal sudah ter-update secara otomatis saat di-klik (handleDateChange),
      // Di sini kita bisa langsung memicu hit API Add to Cart tanpa harus double 'set-date' lagi.
      const cartSuccess = await addToCart(Number(product.id_product), jumlah);

      if (cartSuccess) {
        setIsSuccess(true);
        await refreshGlobalDate(); // 🌟 LANGSUNG REFRESH CART CONTEXT SETELAH NAMBAH BARANG
        // Beri feedback sukses, lalu arahkan ke keranjang setelah 1.5 detik
        setTimeout(() => router.push('/cart'), 1500);
      } else {
        setConfirmModal({ isOpen: true, title: 'Stok Habis', message: 'Gagal menambahkan ke keranjang. Slot stok mungkin tidak mencukupi.', type: 'danger', hideCancel: true, action: () => { } });
      }
    } catch (err) {
      console.error(err);
      setConfirmModal({ isOpen: true, title: 'Gangguan Server', message: 'Terjadi kesalahan jaringan.', type: 'danger', hideCancel: true, action: () => { } });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🌟 LOGIKA BATASAN STOK + KERANJANG
  const currentMaxStock = (isDateSelected && product?.stok_tersedia !== undefined) 
    ? product.stok_tersedia 
    : product?.stok_total || 0;
    
  const cartItem = product ? cartItems?.find((item: any) => item.id_product === product.id_product) : null;
  const qtyInCart = cartItem ? cartItem.jumlah : 0;
  const availableToAdd = Math.max(0, currentMaxStock - qtyInCart);
  const isFullyStockedInCart = availableToAdd <= 0;
  
  // Jika max stok berubah/berkurang dan jumlah form melebihi stok yang ada
  React.useEffect(() => {
    if (jumlah > availableToAdd && availableToAdd > 0) {
      setJumlah(availableToAdd);
    } else if (availableToAdd === 0 && jumlah !== 1) {
      setJumlah(1); // Set to 1 visually, though it will be disabled
    }
  }, [jumlah, availableToAdd]);

  // Loading state blocker bawaan Context
  if (isLoadingCartGlobal || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-3">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
        <p className="text-xs font-mono tracking-widest uppercase text-zinc-400">Loading Equipment Details...</p>
      </div>
    );
  }

  if (!product) return <div className="p-20 text-center uppercase font-black text-zinc-900">Produk Tidak Ditemukan</div>;

  const mainImage = getCoverImage(product.images);

  return (
    <div className="min-h-screen bg-brand-mist pt-32 pb-16 px-4 text-zinc-900">
      <div className="max-w-6xl mx-auto">

        {/* Navigasi Kembali */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-brand-dark mb-8 transition cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> Kembali
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* SISI KIRI: Visual Produk */}
          <div className="space-y-4">
            <div className="aspect-square bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
              <img src={mainImage} alt={product.nama} className="w-full h-full object-cover" />
            </div>
            {/* Gallery Miniatures */}
            {normalizeImages(product.images).length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {normalizeImages(product.images).map((img, i) => (
                  <div key={i} className="aspect-square rounded-xl border border-zinc-200 overflow-hidden bg-white">
                    <img src={img} alt={`${product.nama} gallery ${i}`} className="w-full h-full object-cover opacity-60 hover:opacity-100 transition" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SISI KANAN: Kontrol Sewa */}
          <div className="flex flex-col">
            <span className="text-brand-accent text-xs font-black tracking-widest uppercase mb-2">[ PRODUCT DETAIL ]</span>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-brand-dark mb-4 leading-none">{product.nama}</h1>
            <p className="text-zinc-500 text-sm leading-relaxed mb-8">{product.deskripsi}</p>

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">

              {/* Harga & Status */}
              <div className="flex justify-between items-end pb-6 border-b border-zinc-100">
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Tarif Sewa</p>
                  <p className="text-3xl font-black text-brand-dark font-mono">Rp {product.harga_per_hari.toLocaleString('id-ID')}<span className="text-sm font-normal text-zinc-400">/hari</span></p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full font-black uppercase tracking-tighter">
                    {currentMaxStock} Unit Ready
                  </span>
                </div>
              </div>

              {/* Form: Pilih Tanggal */}
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-2">Periode Sewa</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full flex items-center gap-3 bg-zinc-50 border border-zinc-200 p-4 rounded-xl hover:border-brand-dark transition text-left text-sm font-medium focus:outline-none cursor-pointer">
                      <CalendarIcon className="h-4 w-4 text-brand-accent" />
                      {isDateSelected && dateRange?.from && dateRange?.to ? (
                        <span className="font-bold text-xs">{format(dateRange.from, "dd MMM", { locale: localeId })} - {format(dateRange.to, "dd MMM yyyy", { locale: localeId })}</span>
                      ) : (
                        <span className="text-zinc-400 text-xs">Pilih Tanggal Booking</span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white shadow-2xl rounded-xl border-zinc-200" align="start">
                    {/* 🌟 UPDATE: Ubah target onSelect ke fungsi handleDateChange baru kita */}
                    <Calendar mode="range" selected={dateRange} onSelect={handleDateChange} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Form: Jumlah Unit */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block">Jumlah Unit</label>
                  <p className="text-[10px] text-zinc-300 italic">Maksimal {availableToAdd} unit (Sisa limit)</p>
                </div>
                <div className="flex items-center gap-4 bg-zinc-50 border border-zinc-200 rounded-xl p-1.5">
                  <button type="button" onClick={() => setJumlah(Math.max(1, jumlah - 1))} disabled={jumlah <= 1 || isFullyStockedInCart} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"><Minus className="w-4 h-4" /></button>
                  <span className="font-black font-mono w-6 text-center">{isFullyStockedInCart ? 0 : jumlah}</span>
                  <button type="button" onClick={() => setJumlah(Math.min(availableToAdd, jumlah + 1))} disabled={jumlah >= availableToAdd || isFullyStockedInCart} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"><Plus className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Notice Box */}
              <div className="flex gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <Info className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                <p className="text-[11px] text-zinc-500 leading-relaxed">Penyewaan terhitung per hari. Alat wajib dikembalikan sebelum jam operasional basecamp berakhir pada tanggal selesai sewa.</p>
              </div>

              {/* Tombol Chaining Action Dinamis Berdasarkan IsDateSelected */}
              <button
                onClick={handleAction}
                disabled={isSubmitting || isSuccess || (isDateSelected && currentMaxStock === 0) || isFullyStockedInCart}
                className={`w-full py-4 rounded-xl font-black text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer shadow-lg active:scale-95 ${isSuccess
                    ? "bg-emerald-600 text-white shadow-emerald-600/20"
                    : !isDateSelected
                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20" 
                      : currentMaxStock === 0
                        ? "bg-red-50 text-red-500 shadow-none border border-red-100 cursor-not-allowed opacity-80"
                        : isFullyStockedInCart
                          ? "bg-zinc-100 text-zinc-400 shadow-none border border-zinc-200 cursor-not-allowed opacity-90"
                          : "bg-brand-dark hover:bg-brand-accent text-white shadow-brand-dark/20"
                  }`}
              >
                {isSubmitting ? (
                  <> <Loader2 className="w-4 h-4 animate-spin" /> PROSES DATA... </>
                ) : isSuccess ? (
                  <> <Check className="w-4 h-4" /> BERHASIL DI TAMBAHKAN </>
                ) : !isDateSelected ? (
                  <> <AlertTriangle className="w-4 h-4" /> TENTUKAN TANGGAL SEWA </ >
                ) : currentMaxStock === 0 ? (
                  <> STOK HABIS </>
                ) : isFullyStockedInCart ? (
                  <> <Check className="w-4 h-4" /> MAKSIMAL DI KERANJANG </>
                ) : (
                  <> <ShoppingCart className="w-4 h-4" /> AMBIL ALAT SEKARANG </>
                )}
              </button>

            </div>
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