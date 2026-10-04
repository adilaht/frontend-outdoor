// src/app/page.tsx
'use client';

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { type DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, ShieldCheck, Zap, CreditCard, Sparkles, Users, FileText, AlertTriangle, UserCheck, ChevronDown, CheckCircle2, ShoppingBag, Truck } from "lucide-react";

import { Calendar } from "@/src/components/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/Popover";
import { ProductHighlight } from "@/src/components/ProductHighlight";
import { setCartDate, getCart, updateCartDate } from "@/src/services/cartService";
import { useCartGlobal } from "../../context/CartContext";
import ConfirmModal from "@/src/components/common/ConfirmModal";

const BACKGROUND_IMAGES = [
  "/background.avif",
  "/background1.avif",
  "/background2.avif",
  "/background3.avif",
  "/background4.jpg",
  "/background5.jpg",
  "/background6.jpg",
  "/background7.jpg",
  "/background8.jpg",
  "/background9.jpg",
  "/background10.jpg",
  "/background11.jpg",
  "/background12.jpg",
  "/background13.jpg"
];

export default function HomePage() {
  const router = useRouter();
  const [bgIndex, setBgIndex] = React.useState(0);
  const { dateRange, setDateRange, isDateSelected } = useCartGlobal();
  const [isSubmitting, setIsSubmitting] = React.useState(false); // 🌟 BARU: State loading untuk hit API
  const [isUpdatingDate, setIsUpdatingDate] = React.useState(false);

  const [confirmModal, setConfirmModal] = React.useState({
    isOpen: false,
    title: 'Informasi',
    message: '',
    type: 'info' as 'danger' | 'warning' | 'info',
    hideCancel: true,
    action: () => { }
  });

  // 1. EFFECT BACKGROUND CHANGER (Sudah ada)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prevIndex) => (prevIndex + 1) % BACKGROUND_IMAGES.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);


  // 2. 🌟 SIMPAN DI SINI: Effect baru buat restore tanggal dari server saat pertama kali buka web
  const handleDateChange = async (range: DateRange | undefined) => {
    setDateRange(range); // Simpan ke global, otomatis Navbar & page Produk tahu

    if (range?.from && range?.to) {
      setIsUpdatingDate(true);
      try {
        await updateCartDate(format(range.from, 'yyyy-MM-dd'), format(range.to, 'yyyy-MM-dd'));
      } catch (error) {
        console.error(error);
      } finally {
        setIsUpdatingDate(false);
      }
    }
  };

  // 3. FUNGSI HANDLER: Menyimpan logika submit/search ditaruh setelah seluruh useEffect selesai
  // 🌟 UPDATE LOGIC: Menembak POST /cart/set-date sebelum pindah halaman
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (dateRange?.from && dateRange?.to) {
      setIsSubmitting(true);

      // Diformat menjadi YYYY-MM-DD sesuai spesifikasi endpoint lu
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = format(dateRange.to, 'yyyy-MM-dd');

      try {
        // Hit API set-date pembawa x-session-id murni dari service lu
        const success = await setCartDate(fromStr, toStr);

        if (success) {
          console.log("Tanggal cart global berhasil diinisialisasi.");
          // Jika sukses, lempar user ke halaman katalog beserta query string-nya
          router.push(`/produk?from=${fromStr}&to=${toStr}`);
        } else {
          setConfirmModal({ isOpen: true, title: 'Gagal', message: 'Gagal mengunci tanggal sewa di server. Silakan coba kembali.', type: 'danger', hideCancel: true, action: () => { } });
        }
      } catch (error) {
        console.error("Terjadi kesalahan sistem saat set-date:", error);
        setConfirmModal({ isOpen: true, title: 'Gangguan Server', message: 'Server mengalami gangguan, gagal memproses data.', type: 'danger', hideCancel: true, action: () => { } });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setConfirmModal({ isOpen: true, title: 'Perhatian', message: 'Silakan pilih periode sewa terlebih dahulu!', type: 'warning', hideCancel: true, action: () => { } });
    }
  };

  return (
    <div className="relative w-full bg-white text-brand-dark overflow-x-hidden">

      {/* ─── BACKGROUND SLIDER ─── */}
      <div className="absolute inset-0 h-screen w-full bg-brand-dark z-0 overflow-hidden">
        {BACKGROUND_IMAGES.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-[2000ms] ease-in-out ${index === bgIndex
              ? "opacity-40 scale-105"
              : "opacity-0 scale-110"
              }`}
            style={{
              backgroundImage: `url('${image}')`,
              animation: index === bgIndex ? 'zoom 14s ease-in-out infinite' : 'none',
            }}
          />
        ))}
        {/* Multi-layer gradient for consistent text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/30 via-brand-dark/50 to-brand-dark" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/40 via-transparent to-brand-dark/40" />
        {/* Subtle radial glow behind hero content */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-accent/5 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* ─── HERO CONTENT ─── */}
      <section className="relative z-10 flex flex-col items-center justify-center h-screen px-4 sm:px-6 lg:px-8 text-center text-white">
        <div className="max-w-4xl mx-auto animate-fadeInUp">
          {/* Logo */}
          {/* <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10 mx-auto mb-8 shadow-2xl shadow-black/40">
            <Image src="/logo.jpg" alt="TwentyOne Outdoor" fill className="object-cover" sizes="80px" priority />
          </div> */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm mb-6">
            <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-zinc-400 tracking-[0.2em] uppercase">Next Gen Outdoor Rental</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mt-6 mb-6 uppercase leading-[0.95]">EQUIP YOUR <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-300 to-brand-accent">ADVENTURE.</span></h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mb-12 tracking-wide font-normal">Sewa ekosistem alat gunung premium di <span className="text-white font-medium">TWENTYONE OUTDOOR</span>. Steril, siap tempur, tanpa hambatan registrasi akun.</p>
          <div className="relative group max-w-xl mx-auto">
            <div className="absolute inset-0 bg-brand-accent rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-zinc-900/90 border border-zinc-700/50 p-2 rounded-xl shadow-2xl backdrop-blur-md">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 items-center">
                <div className="w-full sm:flex-grow">
                  <Popover>
                    <PopoverTrigger asChild>
                      {/* Tombol dimatikan jika API sedang loading */}
                      <button type="button" disabled={isSubmitting} className="w-full flex items-center gap-3 bg-zinc-950/80 hover:bg-black text-white border border-zinc-800 p-3.5 rounded-lg transition text-left text-sm font-medium focus:outline-none disabled:opacity-50">
                        <CalendarIcon className="h-4 w-4 text-brand-accent flex-shrink-0" />
                        {dateRange?.from && dateRange?.to ? (
                          <span className="font-semibold tracking-wide text-sm">{format(dateRange.from, "dd MMM", { locale: id })} → {format(dateRange.to, "dd MMM yyyy", { locale: id })}</span>
                        ) : (
                          <span className="text-zinc-500 text-sm">Pilih Tanggal Sewa</span>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-brand-dark border-zinc-800 text-white shadow-2xl rounded-xl" align="start">
                      <Calendar mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={handleDateChange} numberOfMonths={2} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} />
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Tombol submit dikondisikan loading state */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-brand-accent hover:bg-red-600 text-white font-black px-8 py-3.5 rounded-lg transition-all duration-200 text-xs tracking-widest uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]"
                >
                  {isSubmitting ? "MEMPROSES..." : "CEK KETERSEDIAAN"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center opacity-40 hover:opacity-100 transition cursor-pointer group">
          <span className="text-[10px] uppercase tracking-widest mb-2 font-bold text-white/70 group-hover:text-white transition">Scroll</span>
          <div className="w-8 h-12 rounded-full border-2 border-white/30 group-hover:border-brand-accent flex items-start justify-center pt-2 transition-colors">
            <div className="w-1.5 h-3 bg-white/50 group-hover:bg-brand-accent rounded-full animate-bounce transition" />
          </div>
        </div>

        {/* Bottom Image Indicators */}
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {BACKGROUND_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setBgIndex(index)}
              className={`transition-all duration-500 rounded-full cursor-pointer ${index === bgIndex
                ? 'w-8 h-2 bg-brand-accent'
                : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                }`}
            />
          ))}
        </div>
      </section>

      {/* ─── STATS SECTION (LIGHT PREMIUM) ─── */}
      <section className="relative py-20 bg-white border-b border-zinc-100 z-20 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Users, value: '3,000+', label: 'Pelanggan Dilayani' },
              { icon: ShieldCheck, value: '100%', label: 'Kualitas Terjamin' },
              { icon: Zap, value: '24/7', label: 'Dukungan Cepat' },
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-8 bg-zinc-50/50 border border-zinc-100 rounded-[2rem] hover:bg-white hover:shadow-xl hover:shadow-zinc-200/50 hover:-translate-y-1 transition-all duration-300 group">
                <div className="p-4 bg-brand-accent/10 rounded-2xl mb-6 group-hover:bg-brand-accent/20 transition-colors duration-300">
                  <stat.icon className="w-8 h-8 text-brand-accent" />
                </div>
                <div className="text-4xl md:text-5xl font-black text-brand-dark mb-2">{stat.value}</div>
                <div className="text-zinc-500 text-xs font-bold tracking-[0.2em] uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CARA KERJA (HOW IT WORKS) ─── */}
      <section className="relative z-20 bg-zinc-50 border-b border-zinc-100 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mb-16">
            <span className="text-xs font-bold text-brand-accent uppercase tracking-widest">[ PROSES MUDAH ]</span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-brand-dark mt-2 mb-4">Cara Kerja Kami</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto font-medium">Tidak perlu ribet. Sewa alat camping semudah memesan makanan online. Hanya butuh 4 langkah mudah.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Garis Penghubung (Hanya Desktop) */}
            <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-1 bg-gradient-to-r from-zinc-200 via-brand-accent/30 to-zinc-200 rounded-full z-0"></div>

            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-white border-4 border-zinc-100 rounded-full flex items-center justify-center mb-6 group-hover:border-brand-accent group-hover:shadow-brand-accent/20 group-hover:shadow-xl group-hover:-translate-y-2 transition-all duration-300 shadow-md">
                <CalendarIcon className="w-8 h-8 text-brand-dark group-hover:text-brand-accent transition-colors" />
              </div>
              <h3 className="font-bold text-xl uppercase tracking-tight mb-2 text-brand-dark">1. Pilih Tanggal</h3>
              <p className="text-sm text-zinc-500 font-medium">Tentukan kapan berangkat & kembali. Stok diupdate real-time.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-white border-4 border-zinc-100 rounded-full flex items-center justify-center mb-6 group-hover:border-brand-accent group-hover:shadow-brand-accent/20 group-hover:shadow-xl group-hover:-translate-y-2 transition-all duration-300 shadow-md">
                <ShoppingBag className="w-8 h-8 text-brand-dark group-hover:text-brand-accent transition-colors" />
              </div>
              <h3 className="font-bold text-xl uppercase tracking-tight mb-2 text-brand-dark">2. Pilih Alat</h3>
              <p className="text-sm text-zinc-500 font-medium">Eksplorasi katalog kami dan masukkan alat yang dibutuhkan ke tas (Cart).</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-white border-4 border-zinc-100 rounded-full flex items-center justify-center mb-6 group-hover:border-brand-accent group-hover:shadow-brand-accent/20 group-hover:shadow-xl group-hover:-translate-y-2 transition-all duration-300 shadow-md">
                <CreditCard className="w-8 h-8 text-brand-dark group-hover:text-brand-accent transition-colors" />
              </div>
              <h3 className="font-bold text-xl uppercase tracking-tight mb-2 text-brand-dark">3. Checkout</h3>
              <p className="text-sm text-zinc-500 font-medium">Pembayaran aman. Tanpa perlu mendaftar akun atau login.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-white border-4 border-zinc-100 rounded-full flex items-center justify-center mb-6 group-hover:border-brand-accent group-hover:shadow-brand-accent/20 group-hover:shadow-xl group-hover:-translate-y-2 transition-all duration-300 shadow-md">
                <Truck className="w-8 h-8 text-brand-dark group-hover:text-brand-accent transition-colors" />
              </div>
              <h3 className="font-bold text-xl uppercase tracking-tight mb-2 text-brand-dark">4. Ambil Alat</h3>
              <p className="text-sm text-zinc-500 font-medium">Tunjukkan bukti pesanan di toko. Alat sudah disiapkan dan siap dibawa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION BENEFITS (BENTO BOX LIGHT MODE) ─── */}
      <section className="relative z-20 bg-white py-24 px-4 sm:px-6 lg:px-8 border-b border-zinc-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <span className="text-xs font-bold text-brand-accent uppercase tracking-widest">[ KEUNGGULAN KAMI ]</span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-brand-dark mt-2">Engineered for<br />Performance</h2>
            </div>
            <p className="text-zinc-500 max-w-md text-sm md:text-base font-medium">Kenapa ribuan petualang memilih TWENTYONE OUTDOOR? Karena kami memberikan standar tak tertandingi dalam setiap penyewaan.</p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 - Large */}
            <div className="md:col-span-2 group relative bg-zinc-50 rounded-[2rem] p-10 overflow-hidden border border-zinc-100 hover:border-brand-accent/30 hover:shadow-2xl hover:shadow-brand-accent/5 hover:-translate-y-1 transition-all duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[80px] rounded-full group-hover:bg-brand-accent/10 transition-all duration-500"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <Sparkles className="w-12 h-12 text-brand-accent mb-8" />
                <div>
                  <h3 className="font-black text-2xl md:text-3xl uppercase tracking-tight text-brand-dark mb-4">Ultra-Cleaned & Sanitized</h3>
                  <p className="text-zinc-500 font-medium leading-relaxed">Seluruh tenda dan apparel kami dicuci secara profesional dan melalui proses sanitasi standar tinggi sebelum dilepas ke tangan penyewa. Bersih, wangi, siap pakai.</p>
                </div>
              </div>
            </div>

            {/* Card 2 - Small */}
            <div className="group relative bg-zinc-50 rounded-[2rem] p-10 overflow-hidden border border-zinc-100 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-500">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 blur-[50px] rounded-full group-hover:bg-blue-500/10 transition-all duration-500"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <Zap className="w-10 h-10 text-blue-500 mb-8" />
                <div>
                  <h3 className="font-bold text-xl uppercase tracking-tight text-brand-dark mb-3">Zero Account</h3>
                  <p className="text-sm text-zinc-500 font-medium leading-relaxed">Sistem guest checkout instan. Pilih barang, bayar, ambil tanpa birokrasi form login.</p>
                </div>
              </div>
            </div>

            {/* Card 3 - Small */}
            <div className="group relative bg-zinc-50 rounded-[2rem] p-10 overflow-hidden border border-zinc-100 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-500">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full group-hover:bg-emerald-500/10 transition-all duration-500"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mb-8" />
                <div>
                  <h3 className="font-bold text-xl uppercase tracking-tight text-brand-dark mb-3">Verified Gear</h3>
                  <p className="text-sm text-zinc-500 font-medium leading-relaxed">Menyewakan alat bersertifikasi internasional demi keselamatan maksimal.</p>
                </div>
              </div>
            </div>

            {/* Card 4 - Large */}
            <div className="md:col-span-2 group relative bg-zinc-50 rounded-[2rem] p-10 overflow-hidden border border-zinc-100 hover:border-brand-accent/30 hover:shadow-2xl hover:shadow-brand-accent/5 hover:-translate-y-1 transition-all duration-500">
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-accent/5 blur-[80px] rounded-full group-hover:bg-brand-accent/10 transition-all duration-500"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <CreditCard className="w-12 h-12 text-brand-accent mb-8" />
                <div>
                  <h3 className="font-black text-2xl md:text-3xl uppercase tracking-tight text-brand-dark mb-4">Fixed Rate Pricing</h3>
                  <p className="text-zinc-500 font-medium leading-relaxed">Skema biaya flat harian yang transparan tanpa tambahan biaya siluman saat pengembalian. Anda hanya membayar apa yang Anda lihat di struk akhir checkout.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── KEBIJAKAN SECTIONS (LIGHT PREMIUM) ─── */}
      <div className="bg-zinc-50 text-brand-dark relative z-20 overflow-hidden">

        {/* Syarat & Ketentuan */}
        <section id="syarat-ketentuan" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 scroll-mt-20 border-b border-zinc-200">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="w-full md:w-5/12 flex justify-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-brand-accent rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative bg-white border border-zinc-100 p-12 rounded-3xl transform group-hover:-translate-y-2 transition duration-500 shadow-xl">
                  <FileText className="w-24 h-24 text-brand-accent" />
                </div>
              </div>
            </div>
            <div className="w-full md:w-7/12">
              <span className="text-brand-accent text-sm font-black tracking-[0.2em] uppercase mb-4 block">01 / Kebijakan Utama</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-8 leading-none">Syarat & <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-dark to-zinc-400">Ketentuan</span></h2>
              <div className="space-y-6 text-zinc-500 leading-relaxed text-lg font-medium">
                <div className="flex gap-4 items-start"><div className="w-8 h-8 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0 text-brand-accent font-bold text-sm">1</div><p><strong className="text-brand-dark font-black uppercase tracking-wide">Identitas Resmi:</strong> Penyewa wajib menitipkan KTP asli atau identitas resmi yang masih berlaku sebagai jaminan.</p></div>
                <div className="flex gap-4 items-start"><div className="w-8 h-8 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0 text-brand-accent font-bold text-sm">2</div><p><strong className="text-brand-dark font-black uppercase tracking-wide">Pengecekan Bersama:</strong> Pengecekan kondisi alat dilakukan secara bersama-sama sebelum serah terima.</p></div>
                <div className="flex gap-4 items-start"><div className="w-8 h-8 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0 text-brand-accent font-bold text-sm">3</div><p><strong className="text-brand-dark font-black uppercase tracking-wide">Durasi Sewa:</strong> Hitungan sewa adalah per hari (24 Jam) yang dimulai sejak barang diambil dari toko.</p></div>
                <div className="flex gap-4 items-start"><div className="w-8 h-8 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0 text-brand-accent font-bold text-sm">4</div><p><strong className="text-brand-dark font-black uppercase tracking-wide">Sistem Pembayaran:</strong> Seluruh biaya sewa dibayarkan secara lunas di muka saat pengambilan alat.</p></div>
              </div>
            </div>
          </div>
        </section>

        {/* Guest Checkout */}
        <section id="guest-checkout" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 scroll-mt-20 border-b border-zinc-200">
          <div className="flex flex-col md:flex-row-reverse gap-16 items-center">
            <div className="w-full md:w-5/12 flex justify-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative bg-white border border-zinc-100 p-12 rounded-3xl transform group-hover:-translate-y-2 transition duration-500 shadow-xl">
                  <UserCheck className="w-24 h-24 text-blue-500" />
                </div>
              </div>
            </div>
            <div className="w-full md:w-7/12 md:text-right">
              <span className="text-blue-500 text-sm font-black tracking-[0.2em] uppercase mb-4 block">02 / Privasi & Keamanan</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-8 leading-none">Guest <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-dark to-zinc-400">Checkout</span></h2>
              <div className="space-y-6 text-zinc-500 leading-relaxed text-lg font-medium flex flex-col items-start md:items-end text-left md:text-right">
                <div className="flex gap-4 items-start md:flex-row-reverse"><div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-500 font-bold text-sm">1</div><p><strong className="text-brand-dark font-black uppercase tracking-wide">Tanpa Registrasi:</strong> Sistem transaksi instan tanpa perlu mendaftar atau login akun.</p></div>
                <div className="flex gap-4 items-start md:flex-row-reverse"><div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-500 font-bold text-sm">2</div><p><strong className="text-brand-dark font-black uppercase tracking-wide">Privasi Data:</strong> Data pribadi pemesan dijamin aman dan hanya digunakan untuk validasi order terkait.</p></div>
                <div className="flex gap-4 items-start md:flex-row-reverse"><div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-500 font-bold text-sm">3</div><p><strong className="text-brand-dark font-black uppercase tracking-wide">Transparansi Pesanan:</strong> Detail pesanan dan instruksi pengambilan akan langsung diberikan setelah checkout.</p></div>
                <div className="flex gap-4 items-start md:flex-row-reverse"><div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-500 font-bold text-sm">4</div><p><strong className="text-brand-dark font-black uppercase tracking-wide">Bukti Transaksi:</strong> Sangat disarankan untuk menyimpan atau screenshot bukti order Anda.</p></div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FAQ ACCORDION SECTION (NEW) ─── */}
        <section id="faq" className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 scroll-mt-20">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-brand-accent uppercase tracking-widest">[ TANYA JAWAB ]</span>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-brand-dark mt-2">Pertanyaan Umum (FAQ)</h2>
          </div>

          <div className="space-y-4">
            <details className="group border border-zinc-200 bg-white rounded-2xl [&_summary::-webkit-details-marker]:hidden shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 p-6 text-brand-dark font-bold hover:text-brand-accent transition-colors">
                <h3 className="text-sm sm:text-base uppercase tracking-wide">Berapa lama hitungan 1 hari sewa?</h3>
                <span className="relative size-5 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 size-5 opacity-100 group-open:opacity-0 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 size-5 opacity-0 group-open:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                </span>
              </summary>
              <p className="px-6 pb-6 text-sm text-zinc-500 leading-relaxed font-medium">Hitungan 1 hari adalah 24 jam sejak alat diambil dari toko kami. Jika Anda mengambil jam 08:00 pagi, maka batas pengembalian adalah jam 08:00 pagi keesokan harinya.</p>
            </details>

            <details className="group border border-zinc-200 bg-white rounded-2xl [&_summary::-webkit-details-marker]:hidden shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 p-6 text-brand-dark font-bold hover:text-brand-accent transition-colors">
                <h3 className="text-sm sm:text-base uppercase tracking-wide">Apakah bisa diwakilkan saat pengambilan?</h3>
                <span className="relative size-5 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 size-5 opacity-100 group-open:opacity-0 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 size-5 opacity-0 group-open:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                </span>
              </summary>
              <p className="px-6 pb-6 text-sm text-zinc-500 leading-relaxed font-medium">Bisa, asalkan perwakilan membawa bukti booking (screenshot QR / Nomor Pesanan) dan bersedia menitipkan KTP aslinya sebagai jaminan pengganti.</p>
            </details>

            <details className="group border border-zinc-200 bg-white rounded-2xl [&_summary::-webkit-details-marker]:hidden shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 p-6 text-brand-dark font-bold hover:text-brand-accent transition-colors">
                <h3 className="text-sm sm:text-base uppercase tracking-wide">Bagaimana jika terjadi kerusakan?</h3>
                <span className="relative size-5 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 size-5 opacity-100 group-open:opacity-0 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 size-5 opacity-0 group-open:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                </span>
              </summary>
              <p className="px-6 pb-6 text-sm text-zinc-500 leading-relaxed font-medium">Jika alat rusak, penyewa akan dikenakan denda sesuai dengan tingkat kerusakan. Jika alat hilang atau rusak berat, penyewa wajib mengganti dengan barang yang sama atau uang senilai harga baru barang tersebut.</p>
            </details>
          </div>
        </section>
      </div>

      {/* ─── CATALOGUE SECTION ─── */}
      <section className="w-full bg-white py-32 px-4 sm:px-6 lg:px-8 border-t border-zinc-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="text-xs font-black text-brand-accent uppercase tracking-widest">[ HIGHLIGHTED EQUIPMENT ]</span>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-brand-dark mt-3">Katalog Alat <br />Tersedia</h2>
            </div>
            <button onClick={() => router.push('/produk')} className="group flex items-center gap-3 bg-brand-dark text-white px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase hover:bg-brand-accent transition-all duration-300 shadow-xl shadow-brand-dark/20 hover:shadow-brand-accent/40">
              Lihat Semua Katalog
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          <ProductHighlight isSimpleDisplay={true} />

        </div>
      </section>

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