'use client';

import * as React from 'react';
import { verifyOTP, resendOTP } from '@/src/services/otpServices';
import { Mail, ShieldCheck, Timer, RefreshCw, AlertCircle } from 'lucide-react';

interface Step2Props {
  email: string;
  bookingId: string | null;
  onSuccess: (snapToken: string, totalHarga: number) => void;
  onBack: () => void;
}

export default function StepOTP({ email, bookingId, onSuccess, onBack }: Step2Props) {
  const [otp, setOtp] = React.useState<string[]>(new Array(6).fill(""));
  const [timeLeft, setTimeLeft] = React.useState<number>(5 * 60); // 5 Menit dalam detik
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  
  const inputRefs = React.useRef<HTMLInputElement[]>([]);

  // ⏱️ Hitung Mundur Efek 5 Menit
  React.useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format detik menjadi MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 📝 Handling ketikan di tiap kotak input OTP
  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, ""); // Hanya boleh angka
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // Ambil angka terakhir
    setOtp(newOtp);

    // Otomatis pindah ke kotak kanan jika sudah terisi
    if (index < 5 && element.value) {
      inputRefs.current[index + 1].focus();
    }
  };

  // 🔙 Handling tombol Backspace / Delete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      
      if (!otp[index] && index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      } else {
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  // 🚀 Eksekusi Verifikasi Kode OTP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalOtp = otp.join("");
    
    if (finalOtp.length < 6) {
      setErrorMessage("Lengkapi 6 digit kode OTP Anda, bro!");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await verifyOTP(email, finalOtp);
      
      if (response?.success && response?.snapToken) {
        // 🌟 Pastikan melempar respon totalHarga yang baru saja kita tambahkan di backend!
        onSuccess(response.snapToken, response.totalHarga || 0);
      } else {
        throw new Error("Gagal mendapatkan token pembayaran dari server.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Kode OTP salah atau sudah expired!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔄 Minta Kirim Ulang OTP Baru
  const handleResend = async () => {
    if (timeLeft > 0) return;

    setIsResending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await resendOTP(email);
      setSuccessMessage("Kode OTP baru berhasil meluncur ke email!");
      setTimeLeft(5 * 60); // Reset timer ke 5 menit lagi
      setOtp(new Array(6).fill("")); // Kosongkan kotak
      inputRefs.current[0].focus();
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal mengirim ulang OTP.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    // ✨ FIX BACKGROUND: Bersih tanpa pembungkus gelap bawaan, dengan shadow 2xl
    <div className="bg-white border border-zinc-200/60 rounded-[2rem] shadow-2xl shadow-zinc-200/50 overflow-hidden max-w-md mx-auto">
      
      {/* Header Info */}
      <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
        <div>
          <h2 className="text-sm font-black tracking-widest text-brand-dark uppercase">Verifikasi Keamanan</h2>
          <p className="text-xs text-zinc-500 mt-1 font-medium">Kami telah mengirimkan 6 digit kode unik ke email Anda.</p>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-zinc-100">
          <ShieldCheck className="h-5 w-5 text-brand-accent" />
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Notifikasi Alert */}
        {errorMessage && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 text-xs p-4 rounded-2xl">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
            <span className="font-semibold tracking-wide">{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-4 rounded-2xl">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 text-emerald-600 mt-0.5" />
            <span className="font-semibold tracking-wide">{successMessage}</span>
          </div>
        )}

        {/* Info Email Tujuan */}
        <div className="bg-zinc-50 border border-zinc-200/60 p-4 rounded-2xl flex items-center gap-4 text-xs">
          <div className="bg-white p-3 rounded-xl border border-zinc-100 shadow-sm">
            <Mail className="h-5 w-5 text-brand-accent" />
          </div>
          <div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Email Tujuan Verifikasi</p>
            <p className="text-brand-dark font-black tracking-wide mt-1 text-sm">{email}</p>
          </div>
        </div>

        {/* 🌟 6 KOTAK INPUT OTP MINIMALIS PREMIUM */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-center items-center gap-3 mx-auto">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                ref={(el) => { if (el) inputRefs.current[index] = el; }}
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-16 bg-zinc-50/50 text-center text-2xl font-mono font-black text-brand-dark border border-zinc-200/80 rounded-2xl transition-all focus:outline-none focus:border-brand-dark focus:bg-white focus:ring-4 focus:ring-brand-dark/5 shadow-sm"
              />
            ))}
          </div>

          {/* 🌟 COUNTDOWN TIMER */}
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div className="flex items-center gap-2 text-xs font-sans">
              <Timer className={`h-4 w-4 ${timeLeft < 60 ? 'text-brand-accent animate-pulse' : 'text-zinc-500'}`} />
              <span className={`font-black tracking-widest text-sm ${timeLeft < 60 ? 'text-brand-accent' : 'text-brand-dark'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>

            {timeLeft > 0 ? (
              <p className="text-[11px] text-zinc-500 font-medium">Mohon tunggu sebelum meminta kode baru.</p>
            ) : (
              <button
                type="button"
                disabled={isResending}
                onClick={handleResend}
                className="text-xs text-brand-dark hover:text-brand-accent font-black uppercase tracking-widest flex items-center gap-1.5 underline underline-offset-4 cursor-pointer disabled:opacity-40 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`} />
                {isResending ? "Mengirim Ulang..." : "Kirim Ulang OTP Baru"}
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-500 font-bold text-xs py-4 rounded-2xl transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              KEMBALI
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || otp.join("").length < 6}
              className="col-span-2 bg-brand-dark hover:bg-brand-accent text-white disabled:bg-zinc-200 disabled:text-zinc-400 font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-xl hover:shadow-brand-accent/20 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>MEMVERIFIKASI...</span>
                </>
              ) : (
                <span>KONFIRMASI OTP</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}