// src/app/cart/page.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowLeft, ShieldAlert, Calendar as CalendarIcon, ShoppingBag, Plus, Minus, Loader2 } from 'lucide-react';
import { getCartItems, removeFromCart, updateCartDate, type CartSummary } from '@/src/services/cartService';
import { updateItemQuantity, getCart } from '@/src/services/cartService';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/Popover';
import { Calendar } from '@/src/components/ui/Calendar';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { type DateRange } from 'react-day-picker';
// 🌟 BARU: Import hook global context
import { useCartGlobal } from '@/src/context/CartContext';
import { getCoverImage } from '@/src/lib/imageHelper';
import ConfirmModal from '@/src/components/common/ConfirmModal';

export default function CartPage() {
  const router = useRouter();
  const [cartData, setCartData] = React.useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdatingDate, setIsUpdatingDate] = React.useState(false);
  const [updatingItemId, setUpdatingItemId] = React.useState<number | null>(null);
  const [confirmModal, setConfirmModal] = React.useState({
    isOpen: false,
    title: 'Informasi',
    message: '',
    type: 'info' as 'danger' | 'warning' | 'info',
    hideCancel: true,
    action: () => { }
  });

  // 🌟 PERBAIKAN: Gunakan state tanggal, setter, dan status validasi langsung dari Global Context
  const { dateRange, setDateRange, isDateSelected, isLoadingCartGlobal, refreshGlobalDate } = useCartGlobal();
  // 🌟 BARU: State khusus untuk nampilin Session ID pas development
  const [sessionId, setSessionId] = React.useState<string>("");

  // Fungsi sinkronisasi mengambil data terbaru dari backend Express
  const fetchCart = React.useCallback(async () => {
    try {
      const res = await getCartItems();
      //console.log("data mentah backend:" , res);

      if (res) {
        // 1. Set data summary utama (items, totalan, durasi) untuk list produk
        setCartData(res);

        // 2. Set Session ID langsung dari return value service terbaru
        if (res.session_id) {
          setSessionId(res.session_id);
        }


        // 3. (Opsional) Jika lu punya state untuk expired_at atau tanggal booking, 
        // lu tinggal set di sini, contoh:
        // if (res.expired_at) { setExpiredTime(res.expired_at); }
      }
    } catch (err) {
      console.error("Gagal sinkronisasi keranjang:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Ambil data keranjang saat pertama kali masuk halaman
  React.useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Handler ketika user mengubah tanggal booking langsung di dalam halaman keranjang
  const handleDateChange = async (range: DateRange | undefined) => {
    // 🌟 Sinkronkan ke memory global context terlebih dahulu
    setDateRange(range);

    if (range?.from && range?.to) {
      setIsUpdatingDate(true);
      const fromStr = format(range.from, 'yyyy-MM-dd');
      const toStr = format(range.to, 'yyyy-MM-dd');

      try {
        const success = await updateCartDate(fromStr, toStr);
        if (success) {
          console.log("Tanggal sewa berhasil diperbarui dari halaman cart global.");
          // Refresh isi item & hitungan grand total harga berdasarkan durasi baru dari server
          await fetchCart();
        } else {
          setConfirmModal({ isOpen: true, title: 'Gagal', message: 'Gagal memperbarui periode sewa.', type: 'danger', hideCancel: true, action: () => { } });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsUpdatingDate(false);
      }
    }
  };

  // Handler untuk update kuantitas (Tambah / Kurang) dengan validasi stok dari backend
  const handleQuantityUpdate = async (id_item: number, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;

    if (newQty <= 0) {
      handleDelete(id_item);
      return;
    }

    setUpdatingItemId(id_item);
    try {
      const success = await updateItemQuantity(id_item, newQty);
      if (success) {
        await fetchCart();
        await refreshGlobalDate(); // 🌟 Sinkronisasi ulang data di navbar
      } else {
        setConfirmModal({ isOpen: true, title: 'Gagal', message: 'Gagal memperbarui jumlah item.', type: 'danger', hideCancel: true, action: () => { } });
      }
    } catch (error: any) {
      console.error("Error update quantity:", error);
      const errorMessage = error.response?.data?.error || "Gagal memperbarui jumlah item.";
      setConfirmModal({ isOpen: true, title: 'Gagal', message: errorMessage, type: 'danger', hideCancel: true, action: () => { } });
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Handler hapus item menggunakan DEL /api/cart/item/:id
  const handleDelete = async (id_item: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Item',
      message: 'Apakah Anda yakin ingin menghapus alat ini dari keranjang?',
      type: 'danger',
      hideCancel: false,
      action: async () => {
        setUpdatingItemId(id_item);
        const success = await removeFromCart(id_item);
        if (success) {
          await fetchCart();
          await refreshGlobalDate(); // 🌟 Sinkronisasi ulang data di navbar
        } else {
          setUpdatingItemId(null);
        }
      }
    });
  };

  // 🌟 Sertakan pelindung loading global agar data tanggal selesai di-restore seutuhnya
  // Cek apakah data benar-benar "Belum Siap" sama sekali
  const isDataNotReady = isLoadingCartGlobal || isLoading || cartData === null;

  if (isDataNotReady) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-white gap-3">
        <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono tracking-widest uppercase text-zinc-400">Sinkronisasi Keranjang...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-mist pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-zinc-900">
      <div className="max-w-5xl mx-auto">

        {/* Tombol Kembali */}
        <button onClick={() => router.push('/produk')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-brand-dark mb-8 transition cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Kembali Berbelanja
        </button>

        <h1 className="text-3xl font-black uppercase tracking-tight text-brand-dark mb-8">Keranjang Sewa Anda</h1>

        {/* 🌟 BARU: DEV PANEL BADGE FOR SESSION ID */}
        {sessionId && (
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono px-3 py-1.5 rounded-lg mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="font-bold uppercase">[DEV MODE] Session ID:</span>
            <span className="select-all tracking-wider font-semibold">{sessionId}</span>
          </div>
        )}

        {cartData.items.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center shadow-sm">
            <ShoppingBag className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-brand-dark uppercase mb-1">Keranjang Masih Kosong</h2>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-6">Anda belum menentukan alat tempur untuk petualangan gunung Anda selanjutnya.</p>
            <button onClick={() => router.push('/produk')} className="bg-brand-dark hover:bg-brand-accent text-white font-black px-6 py-3 rounded-xl transition text-xs tracking-widest uppercase cursor-pointer">Cari Alat Gunung</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Sisi Kiri: Daftar Alat */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {cartData.items.map((item) => {
                const coverImg = getCoverImage(item.product.images);

                const isItemUpdating = updatingItemId === item.id_item;
                const subtotalItem = item.product.harga_per_hari * cartData.durasiHari * item.jumlah;

                return (
                  <div key={item.id_item} className={`bg-white border border-zinc-200 p-5 rounded-2xl flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between hover:shadow-md transition-all relative ${isItemUpdating ? 'opacity-60 pointer-events-none' : ''}`}>

                    {/* Detail Produk & Image */}
                    <div className="flex gap-4 items-center w-full sm:w-auto min-w-0">
                      <img src={coverImg} alt={item.product.nama} className="w-20 h-20 object-cover bg-zinc-100 border border-zinc-150 rounded-xl flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="font-black text-sm sm:text-base text-brand-dark uppercase tracking-tight truncate">{item.product.nama}</h3>

                        {/* Detail Harga Per Hari */}
                        <p className="text-xs font-mono text-zinc-400 mt-0.5">
                          Rp {item.product.harga_per_hari.toLocaleString('id-ID')} <span className="text-[10px] uppercase font-sans">/ Hari</span>
                        </p>

                        {/* Info Durasi Hari */}
                        <div className="flex items-center gap-1 font-bold text-brand-accent text-xs mt-2">
                          <CalendarIcon className="w-3.5 h-3.5" /> {cartData.durasiHari} Hari Sewa
                        </div>
                      </div>
                    </div>

                    {/* Controller Kuantitas & Info Subtotal */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-zinc-100">

                      {/* KONTROLLER KUANTITAS (Plus Minus) */}
                      <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-xl p-1 gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuantityUpdate(item.id_item, item.jumlah, -1)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-brand-dark hover:bg-zinc-200 transition cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span className="w-8 text-center font-mono text-xs font-bold text-brand-dark">
                          {item.jumlah}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleQuantityUpdate(item.id_item, item.jumlah, 1)}
                          disabled={isItemUpdating || (item.product.stok_total !== undefined && item.jumlah >= item.product.stok_total)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-brand-dark hover:bg-zinc-200 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* DETAIL SUBTOTAL ITEM */}
                      <div className="text-right min-w-[100px]">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Subtotal</span>
                        <span className="font-mono text-sm font-black text-brand-dark">
                          Rp {subtotalItem.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Tombol Hapus */}
                      <button
                        onClick={() => handleDelete(item.id_item)}
                        className="p-2.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition cursor-pointer"
                        title="Hapus Alat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Mini loading overlay per item */}
                    {isItemUpdating && (
                      <div className="absolute inset-0 bg-white/40 rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-brand-accent animate-spin" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sisi Kanan: Ringkasan Pembayaran */}
            <div className="bg-brand-dark text-white p-6 rounded-2xl border border-zinc-800 shadow-xl lg:sticky lg:top-24 space-y-5">

              {/* Kalender Edit Periode Sewa Global */}
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-2">
                  Durasi & Tanggal Booking {isUpdatingDate && <span className="text-brand-accent text-[9px] lowercase animate-pulse font-mono">(updating...)</span>}
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" disabled={isUpdatingDate} className="w-full flex items-center gap-3 bg-zinc-950/40 hover:bg-zinc-950/80 text-white border border-white/10 p-3 rounded-lg transition text-left text-xs font-semibold focus:outline-none cursor-pointer disabled:opacity-50">
                      <CalendarIcon className="h-4 w-4 text-brand-accent flex-shrink-0" />
                      {isDateSelected && dateRange?.from && dateRange?.to ? (
                        <span className="tracking-wide">{format(dateRange.from, "dd MMM", { locale: localeId })} → {format(dateRange.to, "dd MMM yyyy", { locale: localeId })}</span>
                      ) : (
                        <span className="text-zinc-500">Pilih Periode Sewa</span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white border-zinc-200 text-zinc-900 shadow-2xl rounded-xl" align="end">
                    <Calendar mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={handleDateChange} numberOfMonths={1} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <h2 className="font-black uppercase tracking-widest text-xs text-brand-accent mb-2">[ RINGKASAN SEWA ]</h2>

                <div className="flex justify-between items-center py-3 border-b border-white/10 text-sm">
                  <span className="text-zinc-400">Total Unit Alat</span>
                  <span className="font-bold">
                    {cartData.items.reduce((acc, item) => acc + item.jumlah, 0)} Items
                  </span>
                </div>

                <div className="flex justify-between items-center py-4 border-b border-white/10">
                  <span className="text-sm text-zinc-400">Estimasi Total</span>
                  <span className="text-lg font-black font-mono text-brand-accent">
                    Rp {cartData.grandTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Notice Box */}
              <div className="flex gap-2 bg-white/5 border border-white/10 p-3 rounded-xl text-[11px] text-zinc-400 leading-relaxed">
                <ShieldAlert className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                <span>Mekanisme Guest Checkout aktif. Data pesanan diikat sementara pada penanda session ID browser Anda.</span>
              </div>

              <button onClick={() => router.push('/checkout')} className="w-full bg-brand-accent hover:bg-red-600 text-white font-black py-4 rounded-xl transition-all duration-200 text-xs tracking-widest uppercase cursor-pointer shadow-lg shadow-brand-accent/20 active:scale-95">
                LANJUT ISI DATA DIRI
              </button>
            </div>

          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        type={confirmModal.type}
        hideCancel={confirmModal.hideCancel}
        confirmText={confirmModal.hideCancel ? "OK" : "Yakin"}
      />
    </div>
  );
}