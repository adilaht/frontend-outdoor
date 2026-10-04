// src/components/common/Footer.tsx
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="w-full bg-brand-dark text-white relative overflow-hidden">
      {/* Gradient Line Top */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent" />

      <div className="max-w-7xl mx-auto pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

          {/* KOLOM 1: BRAND & SOSIAL MEDIA */}
          <div className="flex flex-col gap-5">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 group-hover:border-brand-accent/50 transition-colors shadow-lg">
                <Image src="/logo.jpg" alt="TwentyOne Outdoor" fill className="object-cover" sizes="48px" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tight uppercase leading-none">TWENTYONE</span>
                <span className="text-[9px] font-bold text-zinc-500 tracking-[0.2em] uppercase leading-none mt-0.5">OUTDOOR RENT</span>
              </div>
            </Link>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
              Penyedia layanan sewa peralatan outdoor dan camping premium dengan sistem instan tanpa ribet.
            </p>
            <div className="flex items-center gap-3 mt-1">
              {/* Instagram */}
              <a
                href="https://instagram.com/twentyone.outdoor"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-zinc-900 hover:bg-brand-accent text-zinc-400 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-brand-accent/20 hover:-translate-y-0.5"
                aria-label="Instagram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
              </a>
              {/* TikTok */}
              <a
                href="https://tiktok.com/@twentyone.outdoor"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-zinc-900 hover:bg-brand-accent text-zinc-400 hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-brand-accent/20 hover:-translate-y-0.5"
                aria-label="TikTok"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
              </a>
            </div>
          </div>

          {/* KOLOM 2: LOKASI & JAM BUKA */}
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-black tracking-[0.2em] text-brand-accent uppercase">Lokasi & Jam Buka</span>
            <div className="text-sm text-zinc-400 flex flex-col gap-3">
              <div>
                <p className="font-semibold text-zinc-200 mb-1">Store Pusat</p>
                <p className="leading-relaxed">Jl. Raya Cibiuk Kp. Maja Pasir Kacapi RT 03 RW 06, Kel. Sukaratu, Kec. Majasari, Kab. Pandeglang, Banten 42217</p>
              </div>
              <div>
                <p className="font-semibold text-zinc-200 mb-1">Jam Operasional</p>
                <p>Senin - Minggu: <span className="text-white font-medium">07.00 - 22.00 WIB</span></p>
              </div>
            </div>
          </div>

          {/* KOLOM 3: HUBUNGI KAMI */}
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-black tracking-[0.2em] text-brand-accent uppercase">Kontak Utama</span>
            <div className="flex flex-col gap-3 text-sm">
              <a
                href="https://wa.me/6289638616224"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-zinc-400 hover:text-white transition group"
              >
                <div className="p-2.5 bg-zinc-900 group-hover:bg-green-600 rounded-xl text-zinc-400 group-hover:text-white transition-all duration-300 group-hover:shadow-lg group-hover:shadow-green-600/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                </div>
                <span className="font-mono text-sm">+62 896-3861-6224</span>
              </a>
              <a
                href="mailto:jasaoutdoor21@gmail.com"
                className="flex items-center gap-3 text-zinc-400 hover:text-white transition group"
              >
                <div className="p-2.5 bg-zinc-900 group-hover:bg-brand-accent rounded-xl text-zinc-400 group-hover:text-white transition-all duration-300 group-hover:shadow-lg group-hover:shadow-brand-accent/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                </div>
                <span className="font-mono text-sm">jasaoutdoor21@gmail.com</span>
              </a>
            </div>
          </div>

          {/* KOLOM 4: BANTUAN & KEBIJAKAN */}
          <div>
            <h4 className="text-[10px] font-black tracking-[0.2em] text-brand-accent uppercase mb-5">Bantuan & Kebijakan</h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="/#syarat-ketentuan" className="hover:text-white transition-colors duration-200 flex items-center gap-2"><span className="w-1 h-1 bg-zinc-600 rounded-full" />Syarat & Ketentuan Rental</Link></li>
              <li><Link href="/#denda-kerusakan" className="hover:text-white transition-colors duration-200 flex items-center gap-2"><span className="w-1 h-1 bg-zinc-600 rounded-full" />Denda & Kerusakan</Link></li>
              <li><Link href="/#guest-checkout" className="hover:text-white transition-colors duration-200 flex items-center gap-2"><span className="w-1 h-1 bg-zinc-600 rounded-full" />Kebijakan Guest Checkout</Link></li>
            </ul>
          </div>

        </div>

        {/* HAK CIPTA BAWAH */}
        <div className="border-t border-zinc-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-600 gap-4">
          <p>© {new Date().getFullYear()} TWENTYONE OUTDOOR RENT. All Rights Reserved.</p>
          <p className="tracking-[0.2em] uppercase font-medium">Designed for High Performance</p>
        </div>
      </div>
    </footer>
  );
}