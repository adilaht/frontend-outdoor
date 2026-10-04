'use client';

import * as React from 'react';
import { useCartGlobal } from '@/src/context/CartContext';
import { submitCheckoutStep1 } from '@/src/services/bookingService';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Calendar, UploadCloud, AlertCircle, User, Phone, Mail, MapPin, ArrowRight, ArrowLeft, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { validateFormText, isValidEmail, isValidPhone } from '@/src/utils/validation';

interface Step1Props {
  onSuccess: (bookingId: string, email: string) => void;
}

export default function StepDataPenyewa({ onSuccess }: Step1Props) {
  const { dateRange } = useCartGlobal();
  const router = useRouter();
  
  const [nama, setNama] = React.useState('');
  const [noHp, setNoHp] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [alamat, setAlamat] = React.useState('');
  const [fileIdentitas, setFileIdentitas] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage("Ukuran file terlalu jumbo! Maksimal 2MB ya bro.");
        return;
      }
      setFileIdentitas(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateRange?.from || !dateRange?.to) {
      setErrorMessage("Periode sewa zonk! Silakan set tanggal dulu di keranjang.");
      return;
    }
    if (!fileIdentitas) {
      setErrorMessage("KTP/SIM wajib diunggah untuk verifikasi keamanan unit sewa.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (!(fileIdentitas instanceof File)) {
        setErrorMessage("Berkas KTP tidak valid atau belum terpilih dengan benar.");
        setIsSubmitting(false);
        return;
      }

      // Validasi XSS dan SQLi
      const valNama = validateFormText(nama, "Nama lengkap");
      if (!valNama.isValid) return setErrorMessage(valNama.error);
      
      const valAlamat = validateFormText(alamat, "Alamat");
      if (!valAlamat.isValid) return setErrorMessage(valAlamat.error);
      
      if (!isValidEmail(email)) return setErrorMessage("Format email tidak valid.");
      if (!isValidPhone(noHp)) return setErrorMessage("Format nomor handphone tidak valid (hanya angka, +, spasi, -).");

      const formData = new FormData();
      formData.append('nama_customer', nama);
      formData.append('no_hp', noHp);
      formData.append('email', email);
      formData.append('alamat', alamat);
      formData.append('foto_identitas', fileIdentitas, fileIdentitas.name); 
      formData.append('tanggal_mulai', format(dateRange.from, 'yyyy-MM-dd'));
      formData.append('tanggal_selesai', format(dateRange.to, 'yyyy-MM-dd'));

      const response = await submitCheckoutStep1(formData);
      
      if (response?.success) {
        onSuccess("", email); 
      } else {
        throw new Error(response?.error || "Gagal memproses data checkout.");
      }
    } catch (err: any) {
      setErrorMessage(err?.error || "Terjadi kesalahan saat mendaftarkan booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // ✨ FIX BACKROUND: Diubah ke Putih bersih (bg-white) dengan bayangan mewah (shadow-2xl)
    <div className="bg-white border border-zinc-200/60 rounded-[2rem] shadow-2xl shadow-zinc-200/50 overflow-hidden max-w-2xl mx-auto">
      
      {/* Header Form */}
      <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
        <div>
          <h2 className="text-sm font-black tracking-widest text-brand-dark uppercase">Data Pengenal Penyewa</h2>
          <p className="text-xs text-zinc-500 mt-1 font-medium">Isi data diri Anda dengan benar sesuai kartu identitas fisik.</p>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-zinc-100">
          <FileText className="h-5 w-5 text-brand-accent" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {errorMessage && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 text-xs p-4 rounded-2xl animate-shake">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
            <span className="font-semibold tracking-wide">{errorMessage}</span>
          </div>
        )}

        {/* Lock Tanggal Info Box */}
        <div className="bg-zinc-50 border border-zinc-200/60 p-4 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-zinc-600 font-semibold">
            <Calendar className="h-4 w-4 text-brand-accent" />
            <span>Periode Sewa Pilihan:</span>
          </div>
          {dateRange?.from && dateRange?.to ? (
            <span className="font-sans font-black text-brand-dark bg-white border border-zinc-200/80 px-4 py-1.5 rounded-xl shadow-sm">
              {format(dateRange.from, 'dd MMM')} — {format(dateRange.to, 'dd MMM yyyy', { locale: localeId })}
            </span>
          ) : (
            <span className="text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-xl border border-red-100">Belum Terkunci</span>
          )}
        </div>

        {/* Input Nama */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-wider">
            <User className="h-3.5 w-3.5 text-brand-accent" /> Nama Lengkap Sesuai KTP
          </label>
          <input required type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Misal: Taufik Hidayat" className="w-full bg-zinc-50/50 text-zinc-900 font-semibold border border-zinc-200/80 p-4 rounded-2xl text-sm transition-all focus:outline-none focus:border-brand-dark focus:bg-white focus:ring-4 focus:ring-brand-dark/5 placeholder:text-zinc-400 placeholder:font-normal shadow-sm" />
        </div>

        {/* Row HP & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-wider">
              <Phone className="h-3.5 w-3.5 text-brand-accent" /> No. WhatsApp Aktif
            </label>
            <input required type="tel" value={noHp} onChange={(e) => setNoHp(e.target.value)} placeholder="081234567xxx" className="w-full bg-zinc-50/50 text-zinc-900 font-semibold border border-zinc-200/80 p-4 rounded-2xl text-sm transition-all focus:outline-none focus:border-brand-dark focus:bg-white focus:ring-4 focus:ring-brand-dark/5 placeholder:text-zinc-400 placeholder:font-normal shadow-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-wider">
              <Mail className="h-3.5 w-3.5 text-brand-accent" /> Alamat Email
            </label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="taufik@gmail.com" className="w-full bg-zinc-50/50 text-zinc-900 font-semibold border border-zinc-200/80 p-4 rounded-2xl text-sm transition-all focus:outline-none focus:border-brand-dark focus:bg-white focus:ring-4 focus:ring-brand-dark/5 placeholder:text-zinc-400 placeholder:font-normal shadow-sm" />
          </div>
        </div>

        {/* Input Alamat */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-wider">
            <MapPin className="h-3.5 w-3.5 text-brand-accent" /> Alamat Lengkap Rumah
          </label>
          <textarea required rows={3} value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Tuliskan nama jalan, nomor rumah, RT/RW, kecamatan, dan kota..." className="w-full bg-zinc-50/50 text-zinc-900 font-semibold border border-zinc-200/80 p-4 rounded-2xl text-sm transition-all focus:outline-none focus:border-brand-dark focus:bg-white focus:ring-4 focus:ring-brand-dark/5 placeholder:text-zinc-400 placeholder:font-normal resize-none shadow-sm" />
        </div>

        {/* Upload Identitas Box */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Berkas Foto KTP / SIM</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dropzone */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 hover:border-brand-accent bg-zinc-50 hover:bg-brand-accent/5 p-6 rounded-2xl cursor-pointer transition-all duration-300 text-center group relative min-h-[140px]">
              <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform duration-300">
                <UploadCloud className="h-6 w-6 text-brand-accent" />
              </div>
              <span className="text-xs text-brand-dark font-black uppercase tracking-wider">Pilih Dokumen</span>
              <span className="text-[10px] text-zinc-400 mt-1 font-medium">Format JPG/PNG • Maks 2MB</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            {/* Preview Panel */}
            <div className="h-[140px] bg-zinc-50 border-2 border-zinc-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner p-1">
              {previewUrl ? (
                <img src={previewUrl} alt="KTP Preview" className="w-full h-full object-cover rounded-xl transition-all duration-300" />
              ) : (
                <span className="text-[10px] text-zinc-400 font-black tracking-widest uppercase opacity-50">Belum ada berkas</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => router.push('/cart')}
            className="w-full sm:w-1/3 bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-600 font-bold py-5 rounded-2xl text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </button>
          
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full sm:w-2/3 bg-brand-dark hover:bg-brand-accent text-white disabled:bg-zinc-200 disabled:text-zinc-400 font-black py-5 rounded-2xl text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed shadow-xl hover:shadow-brand-accent/20 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Mendaftarkan Booking...</span>
              </>
            ) : (
              <>
                <span>Kirim & Verifikasi Email</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}