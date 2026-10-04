'use client';

import React, { useState } from 'react';
import { Search, MapPin, Calendar, Clock, AlertCircle, Package, FileText } from 'lucide-react';
import { apiInstance } from '@/src/lib/axios';

export default function CekBookingPage() {
  const [bookingId, setBookingId] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingData, setBookingData] = useState<any>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !email) {
      setError('Mohon isi Kode Booking dan Email');
      return;
    }

    setIsLoading(true);
    setError('');
    setBookingData(null);

    try {
      const response = await apiInstance.get(`/api/booking/check?id=${bookingId}&email=${email}`);
      setBookingData(response.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Booking tidak ditemukan. Pastikan Kode Booking dan Email benar.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'paid' || s === 'ongoing') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (s === 'completed') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (s === 'cancelled' || s === 'expired') return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ─── DARK HERO BANNER ─── */}
      <section className="relative bg-zinc-950 pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-accent/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(249,87,56,0.05),transparent_60%)]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-zinc-400 tracking-[0.2em] uppercase">Pantau Pesanan Anda</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase leading-none mb-5">
            Cek Status Booking
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed text-base">
            Masukkan kode booking dan email Anda untuk melihat detail dan status penyewaan saat ini.
          </p>
        </div>
      </section>

      {/* ─── SEARCH FORM ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl p-8 border border-zinc-200/60 shadow-lg shadow-zinc-200/50">
            <form onSubmit={handleCheck} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="bookingId" className="block text-[10px] font-black text-zinc-900 tracking-[0.15em] uppercase mb-2.5">Kode Booking</label>
                <input
                  id="bookingId"
                  type="text"
                  placeholder="Contoh: BK-12345"
                  className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition uppercase font-medium text-sm"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label htmlFor="email" className="block text-[10px] font-black text-zinc-900 tracking-[0.15em] uppercase mb-2.5">Email Pemesan</label>
                <input
                  id="email"
                  type="email"
                  placeholder="email@anda.com"
                  className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition font-medium text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full md:w-auto h-[50px] px-10 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs tracking-widest uppercase shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Cari</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* ─── HASIL PENCARIAN ─── */}
          {bookingData && (
            <div className="mt-8 bg-white rounded-3xl border border-zinc-200/60 shadow-lg shadow-zinc-200/50 overflow-hidden animate-fadeInUp">
              {/* Header Status */}
              <div className="bg-zinc-950 p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-zinc-500 text-xs font-bold tracking-wider uppercase mb-2">Status Saat Ini</p>
                  <span className={`inline-flex px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase border ${getStatusStyle(bookingData.status)}`}>
                    {bookingData.status || 'MENUNGGU PEMBAYARAN'}
                  </span>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-zinc-500 text-xs font-bold tracking-wider uppercase mb-2">Total Tagihan</p>
                  <p className="text-3xl font-black text-white tracking-tight">
                    Rp {(bookingData.total_harga || 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] mb-4">Informasi Penyewa</h3>
                    <div className="space-y-3 text-sm">
                      <p><span className="text-zinc-500 inline-block w-24">Nama:</span> <span className="font-bold text-zinc-900">{bookingData.nama}</span></p>
                      <p><span className="text-zinc-500 inline-block w-24">No HP:</span> <span className="font-bold text-zinc-900">{bookingData.no_hp}</span></p>
                      <p><span className="text-zinc-500 inline-block w-24">Tanggal:</span> <span className="font-bold text-zinc-900">{bookingData.tanggal_mulai} s/d {bookingData.tanggal_selesai}</span></p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] mb-4">Metode Pengambilan</h3>
                    <div className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                      <MapPin className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-bold text-zinc-900 mb-1">Ambil di Toko</p>
                        <p className="text-zinc-500">Tunjukkan laman ini atau kode booking Anda kepada petugas.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] mb-4 border-b border-zinc-100 pb-3">Daftar Barang</h3>
                  <div className="space-y-4">
                    {(bookingData.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-500">
                            <Package className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-zinc-900">{item.nama_barang}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-500 mr-4">{item.jumlah}x</span>
                          <span className="font-bold text-zinc-900">Rp {(item.harga * item.jumlah).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    ))}
                    {(!bookingData.items || bookingData.items.length === 0) && (
                      <p className="text-zinc-500 text-sm text-center py-4">Data barang tidak tersedia.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
