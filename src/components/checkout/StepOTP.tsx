'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { verifyOTP, resendOTP, changeEmailOTP } from '@/src/services/otpServices';
import { Mail, ShieldCheck, Timer, RefreshCw, AlertCircle, Pencil, X } from 'lucide-react';
import ConfirmModal from '@/src/components/common/ConfirmModal';
import { isValidEmail, suggestEmailCorrection, getEmailDomainSuggestions } from '@/src/utils/validation';

interface Step2Props {
  email: string;
  bookingId: string | null;
  onEmailUpdated?: (newEmail: string) => void;
  onSuccess: (snapToken: string, totalHarga: number, kodeBooking?: string) => void;
  onBack: () => void;
}

export default function StepOTP({ email, bookingId, onEmailUpdated, onSuccess, onBack }: Step2Props) {
  const [otp, setOtp] = React.useState<string[]>(new Array(6).fill(""));
  const [timeLeft, setTimeLeft] = React.useState<number>(5 * 60); // 5 Menit dalam detik
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  // 🛡️ State untuk ConfirmModal (Race Condition / Conflict Error)
  const [conflictModal, setConflictModal] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });

  // ✉️ State untuk Modal Koreksi / Ubah Email
  const [isChangeModalOpen, setIsChangeModalOpen] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState('');
  const [isChangingEmail, setIsChangingEmail] = React.useState(false);
  const [changeEmailError, setChangeEmailError] = React.useState('');
  const [hasChangedEmail, setHasChangedEmail] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  
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
        // 🌟 Lempar snapToken, totalHarga, dan kode_booking ke step berikutnya
        onSuccess(
          response.snapToken,
          response.totalHarga || 0,
          response.data?.kode_booking || ''
        );
      } else {
        throw new Error("Gagal mendapatkan token pembayaran dari server.");
      }
    } catch (err: any) {
      // Ambil pesan error dari objek respons backend ({ error: "..." })
      const rawMessage = err?.error || err?.message || "Kode OTP salah atau sudah expired!";

      // 🛡️ Cek apakah error ini dari race condition (409 Conflict)
      const isConflict = rawMessage.includes("stok produk") || rawMessage.includes("OTP sudah digunakan");

      if (isConflict) {
        // Tampilkan modal peringatan yang jelas untuk race condition
        const isStockError = rawMessage.includes("stok produk");
        setConflictModal({
          isOpen: true,
          title: isStockError ? "Stok Habis Diambil Orang Lain!" : "Permintaan Duplikat Terdeteksi",
          message: isStockError
            ? rawMessage + " Silakan kembali ke keranjang dan periksa ketersediaan barang lainnya."
            : "OTP ini sudah diproses. Jika pembayaran sudah muncul, silakan lanjutkan. Jika belum, coba ulangi dari awal.",
        });
      } else {
        setErrorMessage(rawMessage);
      }
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
      setErrorMessage(err?.error || err?.message || "Gagal mengirim ulang OTP.");
    } finally {
      setIsResending(false);
    }
  };

  // ✉️ Eksekusi Ganti Email & Minta OTP Baru
  const handleSaveNewEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeEmailError('');

    const clean = newEmail.trim().toLowerCase();
    if (!clean) {
      setChangeEmailError("Masukkan alamat email baru.");
      return;
    }
    if (!isValidEmail(clean)) {
      setChangeEmailError("Format email tidak valid.");
      return;
    }
    if (clean === email.toLowerCase()) {
      setChangeEmailError("Email baru sama dengan email saat ini.");
      return;
    }

    setIsChangingEmail(true);
    try {
      const res = await changeEmailOTP(clean);
      if (res?.success) {
        setHasChangedEmail(true);
        if (onEmailUpdated) {
          onEmailUpdated(clean);
        }
        setSuccessMessage(`Email tujuan diperbarui ke ${clean}. Kode OTP baru telah dikirim!`);
        setErrorMessage('');
        setTimeLeft(5 * 60); // Reset timer 5 menit
        setOtp(new Array(6).fill("")); // Kosongkan digit OTP
        setIsChangeModalOpen(false);
        inputRefs.current[0]?.focus();
      } else {
        throw new Error(res?.error || "Gagal mengubah email verifikasi.");
      }
    } catch (err: any) {
      setChangeEmailError(err?.error || err?.message || "Terjadi kesalahan saat mengubah email.");
    } finally {
      setIsChangingEmail(false);
    }
  };

  return (
    <>
    {/* ✨ FIX BACKGROUND: Bersih tanpa pembungkus gelap bawaan, dengan shadow 2xl */}
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
        <div className="bg-zinc-50 border border-zinc-200/60 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="bg-white p-3 rounded-xl border border-zinc-100 shadow-sm flex-shrink-0">
              <Mail className="h-5 w-5 text-brand-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-wider">Email Tujuan Verifikasi</p>
              <p className="text-brand-dark font-black tracking-tight mt-0.5 text-sm truncate">{email}</p>
            </div>
          </div>

          {hasChangedEmail ? (
            <span className="flex-shrink-0 text-[10px] font-bold text-zinc-400 bg-zinc-100 border border-zinc-200/80 px-2.5 py-1.5 rounded-xl">
              Sudah Diubah (Maks 1x)
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNewEmail(email);
                setChangeEmailError('');
                setIsChangeModalOpen(true);
              }}
              className="flex-shrink-0 text-[11px] font-black uppercase tracking-wider text-brand-accent hover:text-brand-dark bg-white hover:bg-zinc-100 px-3 py-2 rounded-xl border border-zinc-200/80 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Ubah (1x)</span>
            </button>
          )}
        </div>

        {/* 🌟 6 KOTAK INPUT OTP MINIMALIS PREMIUM */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-center items-center gap-3 mx-auto">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
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

            <p className="text-[11px] text-zinc-400 font-medium">
              Tidak menerima kode atau salah email?{' '}
              {!hasChangedEmail ? (
                <>
                  Klik{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setNewEmail(email);
                      setChangeEmailError('');
                      setIsChangeModalOpen(true);
                    }}
                    className="text-brand-accent hover:underline font-bold cursor-pointer"
                  >
                    Ubah Email (1x)
                  </button>
                  {' '}atau tombol <span className="font-bold text-zinc-600">KEMBALI</span>.
                </>
              ) : (
                <>
                  Email sudah diubah 1x. Jika ingin mengganti data lagi, silakan klik tombol{' '}
                  <button
                    type="button"
                    onClick={onBack}
                    className="text-brand-accent hover:underline font-bold cursor-pointer"
                  >
                    KEMBALI
                  </button>.
                </>
              )}
            </p>
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

    {/* 🛡️ Modal Peringatan Race Condition */}
    <ConfirmModal
      isOpen={conflictModal.isOpen}
      title={conflictModal.title}
      message={conflictModal.message}
      type="warning"
      confirmText="Kembali ke Keranjang"
      hideCancel={true}
      onConfirm={() => {
        setConflictModal({ isOpen: false, title: '', message: '' });
        onBack();
      }}
      onCancel={() => setConflictModal({ isOpen: false, title: '', message: '' })}
    />

    {/* ✉️ Modal Ubah Email (Teleportasi ke document.body agar Full Screen tanpa bayangan kotak) */}
    {isMounted && isChangeModalOpen && createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop Full Screen */}
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
          onClick={() => setIsChangeModalOpen(false)}
        />

        {/* Modal Content */}
        <div className="relative bg-white border border-zinc-100 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 z-10 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-brand-accent/10 p-3 rounded-2xl text-brand-accent">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-brand-dark">Koreksi Alamat Email</h3>
                <p className="text-xs text-zinc-500 font-medium">Kode OTP baru 6 digit akan dikirim ke email ini.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsChangeModalOpen(false)}
              className="p-2 text-zinc-400 hover:text-zinc-600 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {changeEmailError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 text-xs p-3.5 rounded-2xl">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
              <span className="font-semibold">{changeEmailError}</span>
            </div>
          )}

          <form onSubmit={handleSaveNewEmail} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Alamat Email Baru
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setChangeEmailError('');
                }}
                placeholder="contoh: budi@gmail.com"
                className="w-full bg-zinc-50/70 text-zinc-900 font-semibold border border-zinc-200/80 p-4 rounded-2xl text-sm transition-all focus:outline-none focus:border-brand-dark focus:bg-white focus:ring-4 focus:ring-brand-dark/5 placeholder:text-zinc-400 shadow-sm"
                autoFocus
              />

              {/* 💡 Autocomplete Domain Chips saat mengetik @ */}
              {newEmail.includes('@') && getEmailDomainSuggestions(newEmail).length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Pilih cepat:</span>
                  {getEmailDomainSuggestions(newEmail).map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setNewEmail(sugg)}
                      className="text-[11px] font-bold bg-white hover:bg-brand-dark hover:text-white text-zinc-600 px-2.5 py-1 rounded-xl border border-zinc-200 shadow-sm transition-all cursor-pointer active:scale-95"
                    >
                      @{sugg.split('@')[1]}
                    </button>
                  ))}
                </div>
              )}

              {/* 💡 Typo Suggestion Helper */}
              {suggestEmailCorrection(newEmail) && (
                <div className="flex items-center justify-between text-xs bg-amber-50 border border-amber-200/70 text-amber-800 px-3.5 py-2.5 rounded-2xl shadow-sm animate-fadeIn">
                  <span>Maksud Anda <strong>{suggestEmailCorrection(newEmail)}</strong>?</span>
                  <button
                    type="button"
                    onClick={() => setNewEmail(suggestEmailCorrection(newEmail)!)}
                    className="text-amber-900 font-black underline cursor-pointer hover:text-amber-950 text-[11px] uppercase tracking-wide bg-amber-100/80 hover:bg-amber-200/80 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Gunakan Ini
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsChangeModalOpen(false)}
                className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-600 font-bold text-xs py-3.5 rounded-2xl transition-all cursor-pointer shadow-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isChangingEmail || !newEmail.trim()}
                className="bg-brand-dark hover:bg-brand-accent text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl transition-all shadow-md hover:shadow-brand-accent/20 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isChangingEmail ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <span>Kirim OTP Baru</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}