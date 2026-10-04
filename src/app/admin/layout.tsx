'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  CalendarCheck, 
  MonitorSmartphone, 
  LogOut, 
  Menu,
  X,
  ChevronRight,
  PieChart
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token && !isLoginPage) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, isLoginPage, router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  };

  // Jika di halaman login, jangan tampilkan sidebar dan header
  if (isLoginPage) {
    return <div className="min-h-screen bg-zinc-50">{children}</div>;
  }

  // Jangan render anak-anaknya dulu kalau belum cek autentikasi
  if (!isAuthenticated && !isLoginPage) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><span className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" /></div>;
  }

  const menuItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/booking', icon: CalendarCheck, label: 'Kelola Booking' },
    { href: '/admin/produk', icon: Package, label: 'Kelola Produk' },
    { href: '/admin/pos', icon: MonitorSmartphone, label: 'POS Kasir' },
    { href: '/admin/laporan', icon: PieChart, label: 'Laporan & Analitik' },
  ];

  return (
    <div className="min-h-screen bg-zinc-100/50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar — Premium Dark */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-[260px] bg-zinc-950 z-50
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Brand */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-zinc-800/60 shrink-0">
          <Link href="/admin" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo TwentyOne" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
            <div>
              <p className="text-sm font-black text-white tracking-tight leading-none">TwentyOne</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Admin Panel</p>
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-zinc-500 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 mb-3 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Menu Utama</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            
            return (
              <Link 
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                  ${isActive 
                    ? 'bg-white/10 text-white shadow-lg shadow-black/20' 
                    : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}
                `}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-brand-accent/20 text-brand-accent' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 text-zinc-600" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-zinc-800/60 shrink-0">
          <button onClick={handleLogout} className="group flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl text-sm font-semibold text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-red-500/10 transition">
              <LogOut className="w-[18px] h-[18px]" />
            </div>
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b border-zinc-200/60 flex items-center px-4 lg:hidden shrink-0 sticky top-0 z-30 shadow-sm">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="ml-3 flex items-center gap-2">
            <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-black tracking-tight text-zinc-900 text-sm">Admin Panel</span>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
