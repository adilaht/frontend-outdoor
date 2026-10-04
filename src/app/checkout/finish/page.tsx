'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCartGlobal } from '@/src/context/CartContext';
import { CheckCircle2, XCircle, ArrowRight, ShoppingBag, AlertTriangle, Calendar, Copy, Check } from 'lucide-react';

export default function FinishPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-950"><span className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" /></div>}>
      <FinishPaymentContent />
    </Suspense>
  );
}

function FinishPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshGlobalDate } = useCartGlobal();

  // Ambil status dan order_id dari URL query params
  const status = searchParams.get('status');
  const orderId = searchParams.get('order_id') || 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();

  const [copied, setCopied] = React.useState(false);

  // Paksa refresh context cart (supaya badge keranjang 0 dan date global reset)
  React.useEffect(() => {
    refreshGlobalDate();
  }, [refreshGlobalDate]);

  const isSuccess = status === 'success';
  const isPending = status === 'pending';
  const isExpired = status === 'expired' || status === 'failed';

  // Format tanggal hari ini sebagai manifes transaksi
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(new Date());

  const handleCopyCode = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset ikon setelah 2 detik
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800 flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      {/* 🌟 LEBAR DIUBAH KE max-w-xl DAN PADDING DIPERLUAS AGAR LAYOUT LEBIH GAGAH */}
      <div className="max-w-xl w-full bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs animate-fadeIn space-y-8 p-6 sm:p-10">

        {/* 🌟 1. ICON STATE INDICATOR */}
        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          {isSuccess && (
            <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center justify-center shadow-3xs">
              <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
            </div>
          )}
          {isPending && (
            <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 flex items-center justify-center shadow-3xs">
              <AlertTriangle className="h-8 w-8 stroke-[2.5] animate-pulse" />
            </div>
          )}
          {isExpired && (
            <div className="h-16 w-16 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-center justify-center shadow-3xs">
              <XCircle className="h-8 w-8 stroke-[2.5]" />
            </div>
          )}

          {/* Title & Subtitle */}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
              {isSuccess && "Pembayaran Berhasil!"}
              {isPending && "Menunggu Pembayaran"}
              {isExpired && "Sesi Selesai / Expired"}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              {isSuccess && "Item petualanganmu resmi terkunci. Siap-siap meluncur ke basecamp!"}
              {isPending && "Selesaikan pembayaranmu di aplikasi atau e-wallet terkait sebelum stok dilepas."}
              {isExpired && "Waktu hold stok 15 menit telah habis atau transaksi dibatalkan."}
            </p>
          </div>
        </div>

        {/* 🌟 2. TRANSACTION MANIFEST (INFO BOX LAYOUT BARU, LUAS & PREMIUM) */}
        <div className="bg-zinc-50/60 border border-zinc-200/60 rounded-xl p-5 sm:p-6 space-y-4">

          {/* SEKSI KODE BOOKING HORIZONTAL DENGAN TOMBOL COPY INTERAKTIF */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-zinc-200 p-4 rounded-xl shadow-3xs">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Kode Booking Anda</span>
              <p className="text-xs text-zinc-500 mt-0.5">Gunakan kode ini untuk cek status di website</p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center w-full sm:w-auto justify-between sm:justify-end">
              {/* Box penampung order_id panjang */}
              <span className="font-mono font-bold text-base sm:text-lg text-zinc-900 tracking-wider bg-zinc-50 border border-zinc-200 px-3.5 py-1.5 rounded-lg break-all">
                {orderId}
              </span>

              {/* Tombol Copy Kotak Minimalis */}
              <button
                onClick={handleCopyCode}
                className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition shadow-xs flex items-center justify-center flex-shrink-0 cursor-pointer"
                title="Salin Kode"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="h-[1px] bg-zinc-200/60 w-full" />

          {/* BARIS WAKTU TRANSAKSI */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-zinc-400 font-medium">Waktu Transaksi</span>
            <div className="flex items-center gap-2 text-zinc-700 font-semibold">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>{todayFormatted}</span>
            </div>
          </div>

        </div>

        {/* 🌟 3. NOTICE MESSAGE */}
        {isSuccess && (
          <div className="bg-emerald-50/50 border border-emerald-100 text-[11px] sm:text-xs text-emerald-800 p-4 rounded-xl text-center leading-relaxed font-medium">
            Invoice resmi telah dikirim otomatis ke email Anda. Gunakan invoice tersebut untuk pengambilan alat di lokasi.
          </div>
        )}
        {isExpired && (
          <div className="bg-rose-50/50 border border-rose-100 text-[11px] sm:text-xs text-rose-800 p-4 rounded-xl text-center leading-relaxed font-medium">
            Jangan khawatir, bro! Jika ini ketidaksengajaan, silakan lakukan booking ulang dari awal untuk mengamankan slot produk kembali.
          </div>
        )}

        {/* 🌟 4. BUTTON ACTIONS (2 KOLOM PADA LAYAR DESKTOP AGAR PROPORSIONAL) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => router.push('/')}
            className="w-full bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-600 font-medium text-xs sm:text-sm py-3.5 rounded-xl transition cursor-pointer text-center order-2 sm:order-1 shadow-3xs"
          >
            Kembali ke Beranda
          </button>

          {isExpired ? (
            <button
              onClick={() => router.push('/')}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition duration-200 flex items-center justify-center gap-2 cursor-pointer order-1 sm:order-2 shadow-sm"
            >
              <span>Booking Ulang Produk</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => router.push('/cek-booking')}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition duration-200 flex items-center justify-center gap-2 cursor-pointer order-1 sm:order-2 shadow-sm"
            >
              <span>Lihat Status Pesanan</span>
              <ShoppingBag className="h-4 w-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}