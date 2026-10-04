// src/components/common/Navbar.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCartGlobal } from '@/src/context/CartContext';

export default function Navbar() {
  const { cartItemCount } = useCartGlobal();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const pathname = usePathname();

  // Hide on admin routes
  if (pathname.startsWith('/admin')) return null;

  // Efek untuk memantau pergerakan scroll mouse browser
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isActive = (path: string) => pathname === path;
  const isHomePage = pathname === '/';

  const navLinks = [
    { href: '/', label: 'Beranda', active: isActive('/') },
    { href: '/produk', label: 'Katalog Alat', active: pathname.startsWith('/produk') },
    { href: '/cara-sewa', label: 'Cara Sewa', active: isActive('/cara-sewa') },
    { href: '/cek-booking', label: 'Cek Booking', active: isActive('/cek-booking') },
    { href: '/tentang', label: 'Tentang', active: isActive('/tentang') },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
      !isHomePage
        ? "bg-zinc-950/95 backdrop-blur-xl border-b border-white/5 py-3 shadow-2xl"
        : isScrolled 
          ? "bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 py-3 shadow-2xl" 
          : "bg-transparent py-5 border-b border-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10 group-hover:border-brand-accent/50 transition-colors duration-300 shadow-lg">
            <Image 
              src="/logo.jpg" 
              alt="TwentyOne Outdoor" 
              fill 
              className="object-cover" 
              sizes="40px"
              priority
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-black text-white tracking-tight uppercase leading-none">TWENTYONE</span>
            <span className="text-[9px] font-bold text-zinc-500 tracking-[0.2em] uppercase leading-none mt-0.5">OUTDOOR RENT</span>
          </div>
        </Link>

        {/* Navigasi Tengah */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-4 py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-all duration-300 ${
                link.active
                  ? 'text-white bg-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
              {link.active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-brand-accent rounded-full" />
              )}
            </Link>
          ))}
        </div>

        {/* Kanan: Keranjang & Menu Mobile */}
        <div className="flex items-center gap-2">
          <Link href="/cart" className="relative p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 text-white transition-all duration-300 cursor-pointer group">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:scale-105 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1 text-[10px] font-black text-white bg-brand-accent rounded-full shadow-lg shadow-brand-accent/30">
                {cartItemCount}
              </span>
            )}
          </Link>

          <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="md:hidden p-2.5 text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition cursor-pointer">
            {isMobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Panel */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="mt-3 mx-4 bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex flex-col gap-1 shadow-2xl">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                link.active
                  ? 'text-white bg-white/10 font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.active && <span className="w-1.5 h-1.5 bg-brand-accent rounded-full" />}
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}