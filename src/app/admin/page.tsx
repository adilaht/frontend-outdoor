'use client';

import React, { useState, useEffect } from 'react';
import { Users, ShoppingBag, CreditCard, TrendingUp, Package, AlertTriangle, Calendar as CalendarIcon, ArrowUpRight, Clock } from 'lucide-react';
import { apiInstance } from '@/src/lib/axios';
import { getCoverImage } from '@/src/lib/imageHelper';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('7'); // default 7 days
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await apiInstance.get('/api/admin/dashboard/stats', {
        params: { period }
      });
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);



  const s = data?.stats;
  const recentBookings = data?.recent_bookings || [];
  const lowStockProducts = data?.low_stock_products || [];
  const chartData = data?.chart_data || [];
  const calendarBookings = data?.calendar_bookings || [];
  const topProducts = data?.top_products || [];
  const utilization = data?.warehouse_utilization || { tersedia: 0, disewa: 0, total_kapasitas: 0 };

  const stats = [
    { label: 'Total Booking', value: s?.total_bookings ?? 0, icon: ShoppingBag, accent: 'from-brand-accent to-orange-600', iconBg: 'bg-brand-accent/10 text-brand-accent' },
    { label: 'Total Pendapatan', value: `Rp ${(s?.total_revenue ?? 0).toLocaleString('id-ID')}`, icon: CreditCard, accent: 'from-emerald-500 to-green-600', iconBg: 'bg-emerald-50 text-emerald-600' },
    { label: 'Rental Aktif', value: s?.active_rentals ?? 0, icon: TrendingUp, accent: 'from-blue-500 to-indigo-600', iconBg: 'bg-blue-50 text-blue-600' },
    { label: 'Menunggu Bayar', value: s?.pending_payments ?? 0, icon: Clock, accent: 'from-amber-500 to-yellow-600', iconBg: 'bg-amber-50 text-amber-600' },
  ];

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending_payment: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      paid: 'bg-blue-50 text-blue-600 border-blue-200',
      ongoing: 'bg-brand-accent/10 text-brand-accent border-brand-accent/20',
      completed: 'bg-green-50 text-green-600 border-green-200',
      expired: 'bg-zinc-100 text-zinc-500 border-zinc-200',
      canceled: 'bg-red-50 text-red-500 border-red-200',
    };
    return map[status] || 'bg-zinc-100 text-zinc-600 border-zinc-200';
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending_payment: 'Menunggu Bayar',
      paid: 'Lunas',
      ongoing: 'Sedang Disewa',
      completed: 'Selesai',
      expired: 'Kedaluwarsa',
      canceled: 'Dibatalkan',
    };
    return map[status] || status;
  };

  const getPeriodLabel = () => {
    if (period === '1') return 'Hari Ini';
    if (period === '7') return '7 Hari Terakhir';
    if (period === '30') return '30 Hari Terakhir';
    return 'Sepanjang Waktu';
  };

  // Find bookings for the selected date on calendar
  const bookingsOnSelectedDate = calendarBookings.filter((b: any) => {
    if (!selectedDate) return false;
    const start = new Date(b.tanggal_mulai).setHours(0, 0, 0, 0);
    const end = new Date(b.tanggal_selesai).setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate).setHours(0, 0, 0, 0);
    return selected >= start && selected <= end;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">Ringkasan aktivitas rental TwentyOne Outdoor.</p>
        </div>

        {/* Filter Periode — Pill Style */}
        <div className="bg-white p-1.5 rounded-2xl border border-zinc-200/80 shadow-sm flex text-sm font-bold gap-1">
          {[
            { val: '1', label: 'Hari Ini' },
            { val: '7', label: '7 Hari' },
            { val: '30', label: '30 Hari' },
            { val: 'all', label: 'Semua' },
          ].map(item => (
            <button key={item.val} onClick={() => setPeriod(item.val)} className={`px-4 py-2 rounded-xl transition-all duration-200 ${period === item.val ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50'}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards — Premium with Gradient Accent */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="group bg-white p-6 rounded-2xl border border-zinc-200/60 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
              {/* Gradient accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.accent} opacity-80`} />
              <div className="flex justify-between items-start mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
              </div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1.5">{stat.label}</p>
              <div className="text-2xl font-black text-zinc-900 tracking-tight">{isLoading ? <div className="h-8 bg-zinc-200/60 rounded animate-pulse w-24 mt-1" /> : stat.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik Pendapatan */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-black text-zinc-900">Tren Pendapatan</h2>
              <p className="text-xs text-zinc-500 mt-0.5">{getPeriodLabel()}</p>
            </div>
            <span className="text-xs font-bold text-zinc-400 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100">
              {chartData.length} data point
            </span>
          </div>
          <div className="flex-1 min-h-[300px]">
            {isLoading ? (
              <div className="w-full h-full bg-zinc-100/50 rounded-xl animate-pulse"></div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-sm gap-2">
                <CalendarIcon className="w-10 h-10 text-zinc-200" />
                <p>Tidak ada data untuk grafik ini</p>
                <p className="text-xs text-zinc-300">Coba pilih periode 7 Hari atau 30 Hari</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="dateFormatted" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} tickFormatter={(val) => `Rp${val / 1000}k`} />
                  {/* @ts-ignore */}
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: '1px solid #f4f4f5', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.08)', padding: '12px 16px' }}
                    formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pendapatan']}
                    labelStyle={{ fontWeight: 700, color: '#18181b', marginBottom: 4 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 5, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Kalender Sewa */}
        <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-black text-zinc-900 mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-brand-accent" /> Kalender Sewa
          </h2>
          <div className="flex justify-center border-b border-zinc-100 pb-4 mb-4">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{
                booked: calendarBookings.map((b: any) => ({
                  from: new Date(b.tanggal_mulai),
                  to: new Date(b.tanggal_selesai)
                }))
              }}
              modifiersClassNames={{
                booked: 'relative bg-orange-50 font-black text-brand-accent rounded-full shadow-sm border border-brand-accent/20 !after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-brand-accent after:rounded-full'
              }}
              className="bg-white"
            />
          </div>
          <div className="flex-1 overflow-y-auto min-h-[100px]">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-3">
              Jadwal — {selectedDate?.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
            </h3>
            {bookingsOnSelectedDate.length === 0 ? (
              <p className="text-sm text-zinc-300 text-center py-4">Tidak ada jadwal sewa</p>
            ) : (
              <div className="space-y-2">
                {bookingsOnSelectedDate.map((b: any) => (
                  <div key={b.id_booking} className="flex flex-col p-3 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-zinc-200 transition">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono font-bold text-xs text-zinc-900">{b.kode_booking}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(b.status)}`}>{getStatusLabel(b.status)}</span>
                    </div>
                    <p className="text-sm text-zinc-500 truncate">{b.nama_customer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Terbaru */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100">
            <h2 className="text-lg font-black text-zinc-900">Transaksi Terbaru</h2>
            <a href="/admin/booking" className="text-xs font-bold text-brand-accent hover:text-orange-600 transition flex items-center gap-1">
              Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider bg-zinc-50/50">
                <tr>
                  <th className="px-6 py-3">Kode</th>
                  <th className="px-6 py-3">Nama</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={`skel-recent-${i}`} className="border-b border-zinc-50">
                      <td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-32"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-16"></div></td>
                    </tr>
                  ))
                ) : recentBookings.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-zinc-300 text-sm">Belum ada data booking</td></tr>
                ) : (
                  recentBookings.map((b: any) => (
                    <tr key={b.id_booking} className="border-b border-zinc-50 hover:bg-zinc-50/70 transition">
                      <td className="px-6 py-4 font-mono font-bold text-zinc-900 text-xs">{b.kode_booking}</td>
                      <td className="px-6 py-4 text-zinc-600">{b.nama_customer}</td>
                      <td className="px-6 py-4 font-bold text-zinc-900">Rp {(b.total_harga || 0).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(b.status)}`}>
                          {getStatusLabel(b.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Produk Stok Menipis */}
        <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="text-lg font-black text-zinc-900">Stok Menipis</h2>
          </div>
          <div className="p-5 flex-1 overflow-y-auto max-h-[350px]">
            <div className="space-y-3">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={`skel-low-${i}`} className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <div className="w-10 h-10 bg-zinc-200/60 rounded-lg animate-pulse shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-zinc-200/60 rounded animate-pulse w-3/4"></div>
                      <div className="h-2 bg-zinc-200/60 rounded animate-pulse w-full"></div>
                    </div>
                  </div>
                ))
              ) : lowStockProducts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-zinc-300 text-sm">Semua stok aman 👍</p>
                </div>
              ) : (
                lowStockProducts.map((p: any) => (
                  <div key={p.id_product} className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <Package className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-900 truncate">{p.nama}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.max(5, (p.stok_total / 10) * 100)}%` }} />
                        </div>
                        <span className="text-xs font-black text-red-500 shrink-0">{p.stok_total} pcs</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Baris Baru: Top Produk & Utilitas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Produk Terlaris */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200/60 shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <h2 className="text-lg font-black text-zinc-900">Alat Paling Laris</h2>
          </div>
          <div className="p-5 flex-1 overflow-y-auto max-h-[350px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={`skel-top-${i}`} className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <div className="w-14 h-14 bg-zinc-200/60 rounded-lg animate-pulse shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-zinc-200/60 rounded animate-pulse w-3/4"></div>
                      <div className="h-3 bg-zinc-200/60 rounded animate-pulse w-1/2"></div>
                    </div>
                    <div className="w-16 h-12 bg-zinc-200/60 rounded-lg animate-pulse shrink-0"></div>
                  </div>
                ))
              ) : topProducts.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-zinc-300 text-sm">Belum ada data penyewaan di periode ini</p>
                </div>
              ) : (
                topProducts.map((p: any, idx: number) => {
                  const coverImage = getCoverImage(p.images, '');
                  // Pastikan prepending API_URL dilakukan jika coverImage adalah path relatif (dimulai dengan /uploads atau uploads)
                  const imageUrl = coverImage 
                    ? (coverImage.startsWith('http') ? coverImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${coverImage.startsWith('/') ? '' : '/'}${coverImage}`)
                    : null;

                  return (
                    <div key={p.id_product} className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition group">
                      <div className="relative w-14 h-14 bg-zinc-200 rounded-lg flex-shrink-0 overflow-hidden shadow-sm">
                        {imageUrl ? (
                          <img src={imageUrl} alt={p.nama} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        ) : (
                          <Package className="w-6 h-6 text-zinc-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        )}
                        {/* Rank Badge */}
                        <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-br-lg z-10">
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-900 truncate" title={p.nama}>{p.nama}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5 tracking-wide">Frekuensi Sewa</p>
                      </div>
                      <div className="text-right shrink-0 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100/50">
                        <p className="text-base font-black text-emerald-600 leading-none mb-1">{p.total_dipinjam}</p>
                        <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-widest leading-none">Kali</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Utilitas Gudang */}
        <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Package className="w-4 h-4 text-indigo-500" />
            </div>
            <h2 className="text-lg font-black text-zinc-900">Utilitas Gudang</h2>
          </div>
          
          {(() => {
            if (isLoading) {
              return (
                <div className="flex-1 flex flex-col justify-center space-y-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="h-10 bg-zinc-200/60 rounded animate-pulse w-20 mb-2"></div>
                      <div className="h-3 bg-zinc-200/60 rounded animate-pulse w-24"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-6 bg-zinc-200/60 rounded animate-pulse w-16 mb-2 ml-auto"></div>
                      <div className="h-3 bg-zinc-200/60 rounded animate-pulse w-16 ml-auto"></div>
                    </div>
                  </div>
                  <div className="h-6 w-full bg-zinc-200/60 rounded-full animate-pulse"></div>
                  <div className="flex justify-between pt-4 border-t border-zinc-100">
                    <div className="h-3 bg-zinc-200/60 rounded animate-pulse w-20"></div>
                    <div className="h-3 bg-zinc-200/60 rounded animate-pulse w-20"></div>
                  </div>
                </div>
              );
            }

            const pctDisewa = utilization.total_kapasitas > 0 ? Math.round((utilization.disewa / utilization.total_kapasitas) * 100) : 0;
            const pctTersedia = 100 - pctDisewa;
            
            return (
              <div className="flex-1 flex flex-col justify-center space-y-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-4xl font-black text-zinc-900">{pctDisewa}%</p>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1">Terpakai (Disewa)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-zinc-400">{utilization.disewa} <span className="text-sm">/ {utilization.total_kapasitas}</span></p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Total Unit</p>
                  </div>
                </div>

                {/* Stacked Progress Bar */}
                <div className="h-6 w-full bg-zinc-100 rounded-full overflow-hidden flex shadow-inner">
                  <div className="h-full bg-brand-accent transition-all duration-1000 relative flex items-center" style={{ width: `${pctDisewa}%` }}>
                    {pctDisewa > 10 && <span className="absolute right-2 text-[10px] font-black text-white">{pctDisewa}%</span>}
                  </div>
                  <div className="h-full bg-zinc-200 transition-all duration-1000 relative flex items-center" style={{ width: `${pctTersedia}%` }}>
                    {pctTersedia > 10 && <span className="absolute right-2 text-[10px] font-black text-zinc-500">{pctTersedia}%</span>}
                  </div>
                </div>
                
                <div className="flex justify-between text-xs font-bold pt-4 border-t border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-brand-accent shadow-sm"></span>
                    <span className="text-zinc-600">Disewa ({utilization.disewa})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600">Tersedia ({utilization.tersedia})</span>
                    <span className="w-3 h-3 rounded-full bg-zinc-200 shadow-sm"></span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
