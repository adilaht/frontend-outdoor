import React from 'react';
import Image from 'next/image';
import { Tent, Mountain, ShieldCheck, Clock, MapPin, Phone } from 'lucide-react';

export const metadata = {
  title: 'Tentang Kami | TwentyOne Outdoor',
  description: 'Mengenal TwentyOne Outdoor Rent lebih dekat',
};

export default function TentangPage() {
  const values = [
    {
      icon: ShieldCheck,
      title: 'Kualitas Premium',
      desc: 'Setiap perlengkapan disterilisasi dan diperiksa fungsinya sebelum disewakan.',
    },
    {
      icon: Clock,
      title: 'Booking Instan',
      desc: 'Sistem booking tanpa registrasi yang rumit, langsung checkout dan bayar.',
    },
    {
      icon: Tent,
      title: 'Pilihan Lengkap',
      desc: 'Mulai dari tenda ultralight, alat masak, hingga carrier berkapasitas besar.',
    },
    {
      icon: Mountain,
      title: 'Dukung Petualangan',
      desc: 'Kami mendesain layanan agar Anda fokus pada pendakian, bukan logistik.',
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ─── DARK HERO BANNER ─── */}
      <section className="relative bg-zinc-950 pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-accent/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(249,87,56,0.05),transparent_60%)]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Logo */}
          {/* <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10 mx-auto mb-8 shadow-2xl">
            <Image src="/logo.jpg" alt="TwentyOne Outdoor" fill className="object-cover" sizes="80px" />
          </div> */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-zinc-400 tracking-[0.2em] uppercase">Mengenal Kami</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase leading-none mb-5">
            TWENTYONE OUTDOOR
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-base leading-relaxed">
            Berdiri sejak tahun 2024, TwentyOne Outdoor hadir untuk memberikan kemudahan bagi para pecinta alam dalam mempersiapkan petualangan mereka melalui layanan sewa yang profesional.
          </p>
        </div>
      </section>

      {/* ─── IMAGE & STORY ─── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative h-[450px] w-full rounded-3xl overflow-hidden border border-zinc-200/50 shadow-2xl shadow-zinc-200/60 group">
            <Image
              src="/logo.jpg"
              alt="TwentyOne Outdoor Store"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/20 via-transparent to-transparent" />
          </div>
          <div className="space-y-6">
            <span className="text-[10px] font-black text-brand-accent tracking-[0.2em] uppercase">Cerita Kami</span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight leading-tight">Lebih dari Sekadar Toko Sewa</h2>
            <p className="text-zinc-500 leading-relaxed text-lg">
              Kami menyadari bahwa persiapan alat yang memadai adalah kunci dari keselamatan dan kenyamanan pendakian. Terlalu sering pendaki pemula kesulitan mendapatkan alat berkualitas dengan harga terjangkau.
            </p>
            <p className="text-zinc-500 leading-relaxed text-lg">
              Oleh karena itu, kami menghadirkan sistem penyewaan online yang terintegrasi, transparan, dan mudah digunakan. Dengan prosedur pengecekan ketat (quality control) pada setiap alat yang kembali, Anda tak perlu ragu akan performa alat kami.
            </p>
          </div>
        </div>
      </section>

      {/* ─── VALUES ─── */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-zinc-50 rounded-3xl p-10 md:p-16 border border-zinc-200/60">
            <div className="text-center mb-14">
              <span className="text-[10px] font-black text-brand-accent tracking-[0.2em] uppercase">Mengapa Memilih Kami</span>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight uppercase mt-2">Nilai Perusahaan</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {values.map((val, idx) => {
                const Icon = val.icon;
                return (
                  <div key={idx} className="flex flex-col items-center text-center group">
                    <div className="w-16 h-16 bg-zinc-900 text-brand-accent rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:shadow-brand-accent/20 group-hover:-translate-y-1 transition-all duration-300">
                      <Icon className="w-7 h-7" strokeWidth={2} />
                    </div>
                    <h3 className="font-bold text-zinc-900 mb-2 text-base">{val.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{val.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONTACT & MAP ─── */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-zinc-950 text-white rounded-3xl p-10 sm:p-12 flex flex-col justify-center border border-zinc-800/50 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-accent/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10">
              <span className="text-[10px] font-black text-brand-accent tracking-[0.2em] uppercase">Temui Kami</span>
              <h2 className="text-2xl sm:text-3xl font-black mb-8 uppercase tracking-tight mt-2">Kunjungi Store Kami</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shrink-0">
                    <MapPin className="text-brand-accent w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold mb-1 text-sm">Alamat Utama</p>
                    <p className="text-zinc-400 text-sm leading-relaxed">Jl. Raya Cibiuk Kp. Maja Pasir Kacapi RT 03 RW 06 Kel. Sukaratu Kec. Majasari, Kab. Pandeglang, Banten 42217</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shrink-0">
                    <Clock className="text-brand-accent w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold mb-1 text-sm">Jam Operasional</p>
                    <p className="text-zinc-400 text-sm">Setiap Hari: 07.00 - 22.00 WIB</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shrink-0">
                    <Phone className="text-brand-accent w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold mb-1 text-sm">Kontak Cepat</p>
                    <p className="text-zinc-400 text-sm font-mono">+62 896-3861-6224</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-100 rounded-3xl h-[450px] border border-zinc-200 flex items-center justify-center relative overflow-hidden group">
            <a
              href="https://maps.app.goo.gl/1rzHBE7yynCva4v77"
              target="_blank"
              rel="noopener noreferrer"
              className="block z-10 m-6 outline-none"
            >
              <div className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-2xl border border-zinc-200 hover:bg-white hover:shadow-xl hover:border-zinc-300 transition-all duration-300 cursor-pointer group/btn">
                <MapPin className="w-12 h-12 text-zinc-900 mx-auto mb-4 group-hover/btn:scale-110 group-hover/btn:text-brand-accent transition-all duration-300" />
                <h3 className="font-black text-zinc-900 mb-2 text-lg">TwentyOne Outdoor</h3>
                <p className="text-sm text-brand-accent font-bold">Buka di Google Maps ↗</p>
              </div>
            </a>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          </div>
        </div>
      </section>
    </div>
  );
}
