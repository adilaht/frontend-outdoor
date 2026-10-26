'use client';

import * as React from 'react';
import { useCartGlobal } from '@/src/context/CartContext';
import { submitCheckoutStep1 } from '@/src/services/bookingService';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Calendar, UploadCloud, AlertCircle, User, Phone, Mail, MapPin, ArrowRight, ArrowLeft, FileText, CheckCircle2, Trash2, RefreshCw, Sparkles } from 'lucide-react';
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
  const [fileIdentitas, setFileIdentitas] = React.useState<File | Blob | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCompressing, setIsCompressing] = React.useState(false);
  const [compressStatus, setCompressStatus] = React.useState('Mengompresi foto...');
  const [fileStats, setFileStats] = React.useState<{
    originalSize: string;
    compressedSize: string;
    savedPercent: number;
    name: string;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);
  const [errorMessage, setErrorMessage] = React.useState('');

  // 🌟 HELPER FORMAT BYTES UNTUK DISPLAY STATISTIK
  const formatBytes = (bytes: number, decimals = 1): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  // 🌟 HELPER HAPUS FOTO
  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFileIdentitas(null);
    setPreviewUrl(null);
    setFileStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 🌟 HELPER KOMPRESI CLIENT-SIDE DENGAN TIMEOUT & ERROR GUARD
  const compressImage = (file: File): Promise<File | Blob> => {
    return new Promise((resolve, reject) => {
      const isValidFormat = file.type.startsWith('image/') || /\.(jpe?g|png|webp|heic)$/i.test(file.name);
      if (!isValidFormat) {
        return reject(new Error("Format berkas tidak didukung! Wajib berupa gambar JPG, PNG, atau WEBP."));
      }

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      // Guard timeout 6 detik jika browser gagal decode gambar besar / corrupt
      const timer = setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        if (file.size <= 2 * 1024 * 1024) {
          resolve(file);
        } else {
          reject(new Error("Waktu kompresi habis. Silakan gunakan foto lain dengan format JPG standar."));
        }
      }, 6000);

      img.onload = () => {
        clearTimeout(timer);
        URL.revokeObjectURL(objectUrl);

        try {
          const maxWidth = 1000;
          const maxHeight = 1000;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(file);

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'medium';
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              resolve(blob);
            },
            'image/jpeg',
            0.65
          );
        } catch (canvasErr) {
          console.error("Canvas draw error:", canvasErr);
          resolve(file);
        }
      };

      img.onerror = () => {
        clearTimeout(timer);
        URL.revokeObjectURL(objectUrl);
        if (/\.heic$/i.test(file.name)) {
          reject(new Error("Format foto HEIC iPhone belum didukung langsung oleh browser. Silakan ganti ke foto JPG/PNG."));
        } else {
          reject(new Error("Berkas gambar tidak dapat dibaca atau rusak. Silakan pilih foto lain."));
        }
      };

      img.src = objectUrl;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      setErrorMessage('');

      // 1. Guard ukuran file awal (maks 15MB)
      if (originalFile.size > 15 * 1024 * 1024) {
        setErrorMessage("Ukuran foto melebihi batas 15MB! Silakan pilih foto yang lebih ringkas.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // 2. Guard format ekstensi
      const isFormatOk = originalFile.type.startsWith('image/') || /\.(jpe?g|png|webp|heic)$/i.test(originalFile.name);
      if (!isFormatOk) {
        setErrorMessage("Format berkas tidak didukung! Wajib berupa gambar JPG, PNG, atau WEBP.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setIsCompressing(true);
      setCompressStatus('Mengompresi & merampingkan foto...');

      try {
        const compressed = await compressImage(originalFile);

        // 3. Guard hasil kompresi (maks 4MB)
        if (compressed.size > 4 * 1024 * 1024) {
          throw new Error("Hasil kompresi masih terlalu besar (> 4MB). Silakan gunakan foto dokumen yang lebih sederhana.");
        }

        const originalBytes = originalFile.size;
        const compressedBytes = compressed.size;
        const savedPercent = Math.max(0, Math.round(((originalBytes - compressedBytes) / originalBytes) * 100));

        setFileStats({
          originalSize: formatBytes(originalBytes),
          compressedSize: formatBytes(compressedBytes),
          savedPercent,
          name: originalFile.name,
        });

        setFileIdentitas(compressed);
        setPreviewUrl(URL.createObjectURL(compressed));
      } catch (err: any) {
        console.error("Gagal kompresi file:", err);
        setErrorMessage(err?.message || "Gagal mengompresi gambar. Silakan gunakan foto lain.");
        handleRemoveFile();
      } finally {
        setIsCompressing(false);
      }
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
      if (!fileIdentitas || (!(fileIdentitas instanceof File) && !(fileIdentitas instanceof Blob))) {
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

      const filename = (fileIdentitas as any).name || fileStats?.name || 'identitas.jpg';
      const formData = new FormData();
      formData.append('nama_customer', nama);
      formData.append('no_hp', noHp);
      formData.append('email', email);
      formData.append('alamat', alamat);
      formData.append('foto_identitas', fileIdentitas, filename);
      formData.append('tanggal_mulai', format(dateRange.from, 'yyyy-MM-dd'));
      formData.append('tanggal_selesai', format(dateRange.to, 'yyyy-MM-dd'));

      setUploadProgress(0);
      const response = await submitCheckoutStep1(formData, (percent) => {
        setUploadProgress(percent);
      });

      if (response?.success) {
        onSuccess("", email);
      } else {
        throw new Error(response?.error || response?.message || "Gagal memproses data checkout.");
      }
    } catch (err: any) {
      console.error("💥 Error checkout step 1:", err);
      let message = "Terjadi kesalahan saat mendaftarkan booking.";
      if (err?.isTimeout) {
        message = "Koneksi ke server timeout. Pengunggahan berkas membutuhkan waktu terlalu lama atau koneksi seluler terputus. Silakan coba lagi.";
      } else if (err?.isPayloadTooLarge) {
        message = "Ukuran berkas identitas terlalu besar untuk diterima oleh server. Silakan coba unggah foto yang lebih ringan.";
      } else if (err?.error) {
        message = err.error;
      } else if (err?.message) {
        message = err.message;
      }
      setErrorMessage(message);
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
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Berkas Foto KTP / SIM
            </label>
            <span className="text-[10px] text-zinc-400 font-medium">Maksimal 15MB • JPG, PNG, WEBP</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {isCompressing ? (
            /* 1. ANIMASI SAAT SEDANG MENGOMPRESI */
            <div className="border-2 border-dashed border-brand-accent/50 bg-brand-accent/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 animate-pulse text-center min-h-[140px]">
              <div className="relative">
                <div className="w-10 h-10 border-3 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
                <Sparkles className="h-4 w-4 text-brand-accent absolute -top-1 -right-1 animate-bounce" />
              </div>
              <div>
                <p className="text-xs font-black text-brand-dark uppercase tracking-wider">
                  Sedang Mengompresi Berkas...
                </p>
                <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                  {compressStatus}
                </p>
              </div>
            </div>
          ) : fileIdentitas && previewUrl && fileStats ? (
            /* 2. KARTU HASIL KOMPRESI & PRATINJAU */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>Foto Siap Diunggah</span>
                  </div>
                  <p className="text-xs font-bold text-zinc-800 mt-2 truncate" title={fileStats.name}>
                    {fileStats.name}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[11px] text-zinc-400 line-through font-medium">
                      {fileStats.originalSize}
                    </span>
                    <ArrowRight className="h-3 w-3 text-emerald-600" />
                    <span className="text-xs font-black text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 shadow-xs">
                      {fileStats.compressedSize}
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      Hemat {fileStats.savedPercent}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 mt-3 border-t border-emerald-100">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-white hover:bg-zinc-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Ganti Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[11px] font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>

              <div className="h-[140px] relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-900 shadow-sm group">
                <img
                  src={previewUrl}
                  alt="KTP Preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-center">
                  <span className="text-[10px] text-white/90 font-bold uppercase tracking-wider">
                    Pratinjau KTP
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* 3. DROPZONE PEMILIHAN BERKAS */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 hover:border-brand-accent bg-zinc-50/70 hover:bg-brand-accent/5 p-6 rounded-2xl cursor-pointer transition-all duration-300 text-center group min-h-[140px]"
            >
              <div className="bg-white p-3.5 rounded-full shadow-sm mb-2.5 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                <UploadCloud className="h-6 w-6 text-brand-accent" />
              </div>
              <span className="text-xs text-brand-dark font-black uppercase tracking-wider">
                Pilih Dokumen KTP / SIM
              </span>
              <span className="text-[11px] text-zinc-400 mt-1 font-medium">
                Ambil Foto Kamera atau Galeri • Otomatis Dioptimalkan Instan
              </span>
            </div>
          )}
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
            disabled={isSubmitting || isCompressing}
            className="w-full sm:w-2/3 bg-brand-dark hover:bg-brand-accent text-white disabled:bg-zinc-200 disabled:text-zinc-400 font-black py-5 rounded-2xl text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed shadow-xl hover:shadow-brand-accent/20 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>
                  {uploadProgress > 0 && uploadProgress < 100
                    ? `Mengunggah Foto (${uploadProgress}%)...`
                    : "Memproses Verifikasi..."}
                </span>
              </>
            ) : isCompressing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Menyiapkan Berkas...</span>
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