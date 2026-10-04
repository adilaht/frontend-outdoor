'use client';

import React, { useState, useEffect } from 'react';
import { Download, FileText, TrendingUp, Package, AlertCircle, Search, Filter, ArrowRight, Calendar as CalendarIcon } from 'lucide-react';
import { apiInstance } from '@/src/lib/axios';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { type DateRange } from 'react-day-picker';
import { Calendar } from '@/src/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/Popover';

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState<'keuangan' | 'inventaris'>('keuangan');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // Default 30 days
  const [searchQuery, setSearchQuery] = useState('');

  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const [pageKeuangan, setPageKeuangan] = useState(1);
  const [pageInventaris, setPageInventaris] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const fetchLaporan = async () => {
    setIsLoading(true);
    try {
      const params: any = { period };
      if (period === 'custom' && dateRange?.from && dateRange?.to) {
        params.startDate = format(dateRange.from, 'yyyy-MM-dd');
        params.endDate = format(dateRange.to, 'yyyy-MM-dd');
      }

      const response = await apiInstance.get('/api/admin/laporan', { params });
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch laporan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (period === 'custom') {
      // Hanya fetch kalau range sudah lengkap dipilih
      if (dateRange?.from && dateRange?.to) {
        fetchLaporan();
      }
    } else {
      fetchLaporan();
    }
  }, [period, dateRange]);

  const keuangan = data?.keuangan || [];
  const ringkasan_keuangan = data?.ringkasan_keuangan || { total_pendapatan: 0, total_denda: 0, total_transaksi: 0, total_cash: 0 };
  const inventaris = data?.inventaris || [];
  const ringkasan_inventaris = data?.ringkasan_inventaris || { total_item_fisik: 0, total_disewa_periode: 0, tersedia: 0, rusak_hilang: 0 };

  const filteredInventaris = inventaris.filter((item: any) =>
    item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Pagination Logic ---
  const totalKeuanganPages = Math.ceil(keuangan.length / ITEMS_PER_PAGE);
  const paginatedKeuangan = keuangan.slice((pageKeuangan - 1) * ITEMS_PER_PAGE, pageKeuangan * ITEMS_PER_PAGE);

  const totalInventarisPages = Math.ceil(filteredInventaris.length / ITEMS_PER_PAGE);
  const paginatedInventaris = filteredInventaris.slice((pageInventaris - 1) * ITEMS_PER_PAGE, pageInventaris * ITEMS_PER_PAGE);

  const renderPagination = (currentPage: number, totalPages: number, setPage: (p: number) => void) => {
    if (totalPages <= 1) return null;
    return (
      <div className="p-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <span className="text-xs text-zinc-500 font-medium">
          Halaman <span className="font-bold text-zinc-900">{currentPage}</span> dari <span className="font-bold text-zinc-900">{totalPages}</span>
        </span>
        <div className="flex gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-bold text-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 transition"
          >
            Prev
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-bold text-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 transition"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // --- Export Logic (CSV) ---
  const exportCSV = () => {
    if (activeTab === 'keuangan') {
      const headers = ['Invoice', 'Tanggal', 'Penyewa', 'Biaya Sewa', 'Denda', 'Total Bersih', 'Metode Bayar', 'Status'];
      const rows = keuangan.map((item: any) => [
        item.id,
        item.tanggal,
        `"${item.nama}"`,
        item.sewa,
        item.denda,
        item.total,
        item.metode_bayar,
        item.status
      ]);
      const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `laporan_keuangan_${period}_hari.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Kode Alat', 'Nama', 'Total Fisik', 'Total Disewa', 'Tersedia Realtime', 'Rusak'];
      const rows = filteredInventaris.map((item: any) => [
        item.id,
        `"${item.nama}"`,
        item.total_stok,
        item.dipinjam,
        item.tersedia,
        item.rusak
      ]);
      const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `laporan_inventaris.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // --- Export Logic (PDF) ---
  const exportPDF = async () => {
    // Dynamically import jspdf and jspdf-autotable to prevent SSR issues
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();

    if (activeTab === 'keuangan') {
      doc.setFontSize(16);
      doc.text(`Laporan Keuangan - ${period === 'all' ? 'Semua Waktu' : period + ' Hari Terakhir'}`, 14, 15);

      const tableData = keuangan.map((item: any) => [
        item.id,
        item.tanggal,
        item.nama,
        `Rp ${item.sewa.toLocaleString('id-ID')}`,
        `Rp ${item.denda.toLocaleString('id-ID')}`,
        `Rp ${item.total.toLocaleString('id-ID')}`,
        item.metode_bayar
      ]);

      autoTable(doc, {
        head: [['Invoice', 'Tanggal', 'Penyewa', 'Sewa', 'Denda', 'Total', 'Metode']],
        body: tableData,
        startY: 20,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [39, 39, 42] } // zinc-800
      });

      doc.save(`laporan_keuangan_${period}_hari.pdf`);
    } else {
      doc.setFontSize(16);
      doc.text(`Laporan Inventaris Aset`, 14, 15);

      const tableData = filteredInventaris.map((item: any) => [
        item.id,
        item.nama,
        item.total_stok,
        item.dipinjam,
        item.tersedia,
        item.rusak
      ]);

      autoTable(doc, {
        head: [['Kode', 'Nama Alat', 'Fisik', 'Total Disewa', 'Tersedia (Now)', 'Rusak']],
        body: tableData,
        startY: 20,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [79, 70, 229] } // indigo-600
      });

      doc.save(`laporan_inventaris.pdf`);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Laporan & Analitik</h1>
          <p className="text-zinc-500 text-sm mt-1">Pantau performa bisnis dan utilitas aset Anda di sini.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-50 transition shadow-sm">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-800 transition shadow-md shadow-zinc-900/20">
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Tabs & Global Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('keuangan')}
            className={`px-6 py-3 font-bold text-sm transition-all relative ${activeTab === 'keuangan' ? 'text-brand-accent' : 'text-zinc-500 hover:text-zinc-700'
              }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Laporan Keuangan
            </div>
            {activeTab === 'keuangan' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('inventaris')}
            className={`px-6 py-3 font-bold text-sm transition-all relative ${activeTab === 'inventaris' ? 'text-indigo-600' : 'text-zinc-500 hover:text-zinc-700'
              }`}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Laporan Inventaris
            </div>
            {activeTab === 'inventaris' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
            )}
          </button>
        </div>

        {/* Global Period Filter */}
        <div className="flex items-center gap-2 pb-2 sm:pb-0">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider hidden sm:block mr-1">Periode:</span>
          <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200/60">
            {['1', '7', '30', 'all', 'custom'].map((val) => (
              <button
                key={val}
                onClick={() => setPeriod(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === val ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'}`}
              >
                {val === 'all' ? 'Semua' : val === 'custom' ? 'Custom' : `${val} Hari`}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:bg-zinc-50 transition">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd MMM yy", { locale: id })} -{" "}
                        {format(dateRange.to, "dd MMM yy", { locale: id })}
                      </>
                    ) : (
                      format(dateRange.from, "dd MMM yy", { locale: id })
                    )
                  ) : (
                    "Pilih Tanggal"
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border-zinc-200 rounded-2xl shadow-xl" align="end">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Konten Laporan Keuangan */}
      {activeTab === 'keuangan' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-zinc-200/60 shadow-sm relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Pendapatan</p>
              <div className="text-2xl font-black text-zinc-900">
                {isLoading ? <div className="h-7 bg-zinc-200/60 rounded animate-pulse w-3/4 mt-1" /> : `Rp ${(ringkasan_keuangan.total_pendapatan || 0).toLocaleString('id-ID')}`}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-zinc-200/60 shadow-sm relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-400" />
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Uang Tunai (Di Laci)</p>
              <div className="text-2xl font-black text-zinc-900">
                {isLoading ? <div className="h-7 bg-zinc-200/60 rounded animate-pulse w-3/4 mt-1" /> : `Rp ${(ringkasan_keuangan.total_cash || 0).toLocaleString('id-ID')}`}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-zinc-200/60 shadow-sm relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent" />
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Denda</p>
              <div className="text-2xl font-black text-zinc-900">
                {isLoading ? <div className="h-7 bg-zinc-200/60 rounded animate-pulse w-3/4 mt-1" /> : `Rp ${(ringkasan_keuangan.total_denda || 0).toLocaleString('id-ID')}`}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-zinc-200/60 shadow-sm relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Transaksi</p>
              <div className="text-2xl font-black text-zinc-900">
                {isLoading ? <div className="h-7 bg-zinc-200/60 rounded animate-pulse w-1/2 mt-1" /> : `${ringkasan_keuangan.total_transaksi} Transaksi`}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="font-black text-zinc-900">Rincian Keuangan</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider bg-zinc-50/50">
                  <tr>
                    <th className="px-6 py-4">Invoice / Tanggal</th>
                    <th className="px-6 py-4">Penyewa</th>
                    <th className="px-6 py-4 text-right">Biaya Sewa</th>
                    <th className="px-6 py-4 text-right">Denda Keterlambatan</th>
                    <th className="px-6 py-4 text-right">Total Bersih</th>
                    <th className="px-6 py-4 text-center">Metode Bayar</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={`skel-keu-${i}`} className="border-b border-zinc-50">
                        <td className="px-6 py-4"><div className="h-3 bg-zinc-200/60 rounded animate-pulse w-24 mb-2"></div><div className="h-2 bg-zinc-200/60 rounded animate-pulse w-16"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-32"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-24 ml-auto"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-24 ml-auto"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-28 ml-auto"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-20 mx-auto"></div></td>
                      </tr>
                    ))
                  ) : paginatedKeuangan.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-zinc-400">Tidak ada data keuangan</td></tr>
                  ) : (
                    paginatedKeuangan.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="font-mono font-bold text-zinc-900 text-xs">{item.id}</div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">{item.tanggal}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-zinc-700">{item.nama}</td>
                        <td className="px-6 py-4 text-right font-medium text-zinc-600">Rp {item.sewa.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 text-right font-medium text-red-500">{item.denda > 0 ? `+ Rp ${item.denda.toLocaleString('id-ID')}` : '-'}</td>
                        <td className="px-6 py-4 text-right font-black text-emerald-600 bg-emerald-50/30">Rp {item.total.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 text-center font-bold text-zinc-700 text-xs uppercase tracking-wider">{item.metode_bayar}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination(pageKeuangan, totalKeuanganPages, setPageKeuangan)}
          </div>
        </div>
      )}

      {/* Konten Laporan Inventaris */}
      {activeTab === 'inventaris' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-zinc-200/60 shadow-sm flex flex-col justify-center">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Item Fisik</p>
              <div className="text-2xl font-black text-zinc-900">{isLoading ? <div className="h-7 bg-zinc-200/60 rounded animate-pulse w-1/2 mt-1" /> : `${ringkasan_inventaris.total_item_fisik} Unit`}</div>
            </div>
            <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-center">
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Total Disewa (Sesuai Periode)</p>
              <div className="text-2xl font-black text-indigo-700">{isLoading ? <div className="h-7 bg-indigo-200/60 rounded animate-pulse w-1/2 mt-1" /> : `${ringkasan_inventaris.total_disewa_periode} Unit`}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-zinc-200/60 shadow-sm flex flex-col justify-center">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Tersedia di Gudang</p>
              <div className="text-2xl font-black text-zinc-900">{isLoading ? <div className="h-7 bg-zinc-200/60 rounded animate-pulse w-1/2 mt-1" /> : `${ringkasan_inventaris.tersedia} Unit`}</div>
            </div>
            <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-center">
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Rusak / Hilang
              </p>
              <div className="text-2xl font-black text-red-600">{isLoading ? <div className="h-7 bg-red-200/60 rounded animate-pulse w-1/2 mt-1" /> : `${ringkasan_inventaris.rusak_hilang} Unit`}</div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="font-black text-zinc-900">Status Kondisi Aset</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari aset..."
                  className="pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium w-64 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider bg-zinc-50/50">
                  <tr>
                    <th className="px-6 py-4">Kode / Nama Alat</th>
                    <th className="px-6 py-4 text-center">Total Fisik</th>
                    <th className="px-6 py-4 text-center">Total Disewa (Sesuai Periode)</th>
                    <th className="px-6 py-4 text-center">Tersedia (Real-Time)</th>
                    <th className="px-6 py-4 text-center text-red-500">Rusak</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={`skel-inv-${i}`} className="border-b border-zinc-50">
                        <td className="px-6 py-4"><div className="h-2 bg-zinc-200/60 rounded animate-pulse w-16 mb-2"></div><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-32"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-8 mx-auto"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-indigo-200/60 rounded animate-pulse w-8 mx-auto"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-emerald-200/60 rounded animate-pulse w-8 mx-auto"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-red-200/60 rounded animate-pulse w-8 mx-auto"></div></td>
                      </tr>
                    ))
                  ) : paginatedInventaris.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-zinc-400">Tidak ada aset ditemukan</td></tr>
                  ) : (
                    paginatedInventaris.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="font-mono text-zinc-400 text-[10px] mb-0.5 font-bold">{item.id}</div>
                          <div className="font-bold text-zinc-900">{item.nama}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-black text-zinc-900">{item.total_stok}</td>
                        <td className="px-6 py-4 text-center font-bold text-indigo-600 bg-indigo-50/30">{item.dipinjam}</td>
                        <td className="px-6 py-4 text-center font-bold text-emerald-600">{item.tersedia}</td>
                        <td className="px-6 py-4 text-center font-bold text-red-500">{item.rusak}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination(pageInventaris, totalInventarisPages, setPageInventaris)}
          </div>
        </div>
      )}
    </div>
  );
}
