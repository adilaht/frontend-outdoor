import React from 'react';
import Image from 'next/image';
import { Search, ShoppingCart, CheckCircle, PackageSearch, Smartphone, MapPin, Calendar } from 'lucide-react';

export const metadata = {
  title: 'Cara Sewa | TwentyOne Outdoor',
  description: 'Panduan cara menyewa perlengkapan outdoor di TwentyOne',
};

export default function CaraSewaPage() {
  const steps = [
    {
      icon: Calendar,
      title: 'Tentukan Periode Sewa',
      description: 'Pilih tanggal mulai dan tanggal selesai sewa pada form kalender di bagian atas halaman katalog produk sebelum memilih barang.',
    },
    {
      icon: Search,
      title: 'Pilih Perlengkapan',
      description: 'Setelah periode sewa ditentukan, cari dan pilih perlengkapan outdoor berkualitas dari katalog lengkap kami.',
    },
    {
      icon: ShoppingCart,
      title: 'Masukkan ke Keranjang',
      description: 'Tambahkan alat yang Anda butuhkan ke dalam keranjang. Harga total dan ketersediaan stok akan otomatis menyesuaikan dengan periode yang Anda pilih.',
    },
    {
      icon: Smartphone,
      title: 'Checkout & Verifikasi OTP',
      description: 'Lakukan proses checkout dengan sistem Guest (tanpa daftar akun panjang). Cukup verifikasi email menggunakan kode OTP.',
    },
    {
      icon: CheckCircle,
      title: 'Pembayaran Aman',
      description: 'Selesaikan pembayaran menggunakan berbagai metode (Transfer Bank, E-Wallet, QRIS) melalui sistem Midtrans yang aman.',
    },
    {
      icon: MapPin,
      title: 'Ambil di Toko',
      description: 'Tunjukkan Kode Booking yang dikirim ke email Anda kepada petugas di toko kami, lalu ambil perlengkapan Anda dan siap berangkat!',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ─── DARK HERO BANNER ─── */}
      <section className="relative bg-zinc-950 pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-accent/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(249,87,56,0.05),transparent_60%)]" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-zinc-400 tracking-[0.2em] uppercase">Panduan Praktis</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase leading-none mb-5">
            Cara Sewa
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed text-base">
            Sistem rental modern kami dirancang khusus agar Anda dapat menyewa peralatan camping lebih cepat, mudah, dan aman tanpa proses registrasi yang berbelit.
          </p>
        </div>
      </section>

      {/* ─── TIMELINE STEPS ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto relative">
          {/* Vertical Line */}
          <div className="absolute left-8 sm:left-10 top-0 bottom-0 w-px bg-gradient-to-b from-brand-accent/30 via-zinc-200 to-zinc-100 hidden sm:block" />

          <div className="space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div 
                  key={index} 
                  className="relative flex gap-6 sm:gap-8 items-start group"
                >
                  {/* Step Number Circle */}
                  <div className="shrink-0 relative z-10">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border-2 border-zinc-200 rounded-2xl flex flex-col items-center justify-center shadow-lg group-hover:border-brand-accent group-hover:shadow-brand-accent/10 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-900 group-hover:text-brand-accent transition-colors duration-300" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow pt-2 sm:pt-3 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-black bg-zinc-900 text-white px-2.5 py-1 rounded-lg tracking-widest">
                        STEP {index + 1}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-zinc-900 tracking-tight mb-2">{step.title}</h3>
                    <p className="text-zinc-500 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA BOX ─── */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="relative overflow-hidden bg-zinc-950 rounded-3xl p-10 sm:p-12 text-center">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/15 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-accent/10 blur-[60px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="p-4 bg-brand-accent/10 rounded-2xl mb-6">
                <PackageSearch className="text-brand-accent w-10 h-10" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">Siap untuk Berpetualang?</h3>
              <p className="text-zinc-400 mb-8 max-w-md">Katalog kami memiliki berbagai alat camping premium yang telah dirawat dan disterilisasi.</p>
              <a href="/produk" className="bg-brand-accent hover:bg-orange-600 text-white font-black py-3.5 px-10 rounded-xl transition-all duration-300 uppercase tracking-widest text-xs shadow-xl shadow-brand-accent/20 hover:shadow-brand-accent/40 hover:-translate-y-0.5">
                Lihat Katalog Alat
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
