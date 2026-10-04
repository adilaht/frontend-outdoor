'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Wallet, Receipt, ShieldCheck, ExternalLink, Timer, AlertCircle } from 'lucide-react';

interface Step3Props {
  snapToken: string | null;
  totalHarga: number; // 🌟 Daftarkan totalHarga di interface props
  onBack: () => void;
}

declare global {
  interface Window {
    snap: {
      embed: (token: string, options: any) => void;
      pay: (token: string, options: any) => void;
    };
  }
}

export default function StepPayment({ snapToken, totalHarga, onBack }: Step3Props) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState<number>(15 * 60); // 15 Menit dalam detik

  // Dummy nominal contoh, sesuaikan/lempar via props jika ada data aslinya (misal: totalHarga)
  // const totalHarga = 185000; 

  // ⏱️ Timer Countdown 15 Menit
  React.useEffect(() => {
    if (timeLeft <= 0) {
      // Jika waktu habis, langsung tendang ke halaman expired
      router.push(`/checkout/finish?status=expired`);
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, router]);

  // Format ke MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format ke Rupiah murni
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  const handlePayNow = () => {
    if (!snapToken) return;
    setIsProcessing(true);

    window.snap.pay(snapToken, {
      onSuccess: function (result: any) {
        console.log('Payment Success:', result);
        router.push(`/checkout/finish?order_id=${result.order_id || ''}&status=success`);
      },
      onPending: function (result: any) {
        console.log('Payment Pending:', result);
        router.push(`/checkout/finish?order_id=${result.order_id || ''}&status=pending`);
      },
      onError: function (result: any) {
        console.error('Payment Error:', result);
        setIsProcessing(false);
      },
      onClose: function () {
        console.log('Customer closed the popup without finishing the payment');
        setIsProcessing(false);
      }
    });
  };

  return (
    // ✨ FIX BACKGROUND: Bertema putih bersih elegan dengan shadow 2xl
    <div className="bg-white border border-zinc-200/60 rounded-[2rem] shadow-2xl shadow-zinc-200/50 overflow-hidden max-w-md mx-auto animate-fadeIn">
      
      {/* Header Info */}
      <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
        <div>
          <h2 className="text-sm font-black tracking-widest text-brand-dark uppercase">Gerbang Pembayaran</h2>
          <p className="text-xs text-zinc-500 mt-1 font-medium">Satu langkah lagi untuk mengunci perlengkapan petualanganmu.</p>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-zinc-100">
          <CreditCard className="h-5 w-5 text-brand-accent" />
        </div>
      </div>

      <div className="p-8 space-y-6">
        
        {/* ⏳ TIMER HOLD STOCK BOX (15 MENIT) */}
        <div className="bg-amber-50/50 border border-amber-200/60 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-800 font-bold tracking-wide uppercase">
              <Timer className="h-4 w-4 text-amber-500 animate-pulse" />
              <span>Sisa Waktu Bayar:</span>
            </div>
            <span className="font-mono font-black text-amber-600 bg-white border border-amber-100 px-3 py-1 rounded-xl shadow-sm text-sm">
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="flex gap-2.5 text-[11px] text-amber-700/80 leading-relaxed font-medium">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <p>Pada tahap ini stok produk dihold sementara selama 15 menit, mencegah terjadinya <i>double checkout</i>.</p>
          </div>
        </div>

        {/* Info Box Garansi Aman */}
        <div className="flex items-start gap-3 bg-zinc-50/50 border border-zinc-200/60 p-4 rounded-2xl">
          <ShieldCheck className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="text-xs font-black tracking-widest text-brand-dark uppercase">Secured by Midtrans</h4>
            <p className="text-[10px] font-medium text-zinc-500 leading-relaxed">Seluruh proses transaksi Anda dilindungi langsung oleh enkripsi tingkat bank.</p>
          </div>
        </div>

        {/* Panel Ringkasan Metode */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block text-center">Metode Pembayaran Tersedia</label>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white border border-zinc-200/80 p-3 rounded-xl flex flex-col items-center gap-2 shadow-sm transition-transform hover:scale-105">
              <Wallet className="h-4 w-4 text-brand-dark" />
              <span className="text-[10px] font-bold text-zinc-600">QRIS / GoPay</span>
            </div>
            <div className="bg-white border border-zinc-200/80 p-3 rounded-xl flex flex-col items-center gap-2 shadow-sm transition-transform hover:scale-105">
              <Receipt className="h-4 w-4 text-brand-dark" />
              <span className="text-[10px] font-bold text-zinc-600">Virtual Acc</span>
            </div>
            <div className="bg-white border border-zinc-200/80 p-3 rounded-xl flex flex-col items-center gap-2 shadow-sm transition-transform hover:scale-105">
              <CreditCard className="h-4 w-4 text-brand-dark" />
              <span className="text-[10px] font-bold text-zinc-600">Retail Outlet</span>
            </div>
          </div>
        </div>

        {/* Detail Box Aksi Utama */}
        <div className="bg-zinc-50 border border-zinc-200/80 p-6 rounded-2xl text-center space-y-5 shadow-sm">
          <div>
            <span className="text-[10px] font-black tracking-widest text-zinc-400 block uppercase">Total Tagihan Final</span>
            <p className="text-3xl font-black text-brand-dark tracking-tighter mt-1 font-mono">
              {formatRupiah(totalHarga)}
            </p>
          </div>

          {/* Button Tembak Midtrans */}
          <button
            type="button"
            disabled={isProcessing || !snapToken}
            onClick={handlePayNow}
            className="w-full bg-brand-dark hover:bg-brand-accent text-white disabled:bg-zinc-200 disabled:text-zinc-400 font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-xl hover:shadow-brand-accent/20 active:scale-[0.98]"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>MEMBUKA SECURE GATEWAY...</span>
              </>
            ) : (
              <>
                <span>PILIH METODE & BAYAR</span>
                <ExternalLink className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Kembali opsi */}
        <div className="text-center pt-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onBack}
            className="text-xs font-bold text-zinc-400 hover:text-brand-dark transition-colors uppercase tracking-widest underline underline-offset-4 cursor-pointer disabled:opacity-30"
          >
            ← KEMBALI KE DATA BOOKING
          </button>
        </div>

      </div>
    </div>
  );
}