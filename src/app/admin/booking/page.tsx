'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, CheckCircle, Truck, PackageCheck, ArrowUpDown, Download, X, AlertCircle, ImageIcon, ZoomIn, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiInstance } from '@/src/lib/axios';
import ConfirmModal from '@/src/components/common/ConfirmModal';
import { getCoverImage } from '@/src/lib/imageHelper';

export default function AdminBookingPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters and Sorts
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [quickFilter, setQuickFilter] = useState<'all' | 'pickup' | 'return' | 'overdue'>('all');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (dateString: string) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  const isPast = (dateString: string) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    d.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  };

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: 'Konfirmasi Tindakan',
    message: '',
    type: 'info' as 'danger' | 'warning' | 'info',
    hideCancel: false,
    action: () => { }
  });

  // Detail Modal State
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean, data: any, isLoading: boolean }>({
    isOpen: false,
    data: null,
    isLoading: false
  });
  const [isCompleting, setIsCompleting] = useState(false);
  const [denda, setDenda] = useState<string>('');
  const [catatanDenda, setCatatanDenda] = useState('');
  const [showIdPreview, setShowIdPreview] = useState(false);

  const getFotoIdentitasUrl = (path: string | null) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    return `${baseUrl}/${cleanPath}${token ? `?token=${token}` : ''}`;
  };

  const isImagePath = (val: string | null) => {
    if (!val) return false;
    return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(val) || val.includes('/') || val.startsWith('storage');
  };

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        limit: 100,
        sortBy,
        order
      };
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.q = searchTerm;

      const response = await apiInstance.get('/api/admin/bookings', { params });
      setBookings(response.data.data);
    } catch (error) {
      console.error('Gagal memuat booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when filters or sorts change
  useEffect(() => {
    fetchBookings();
  }, [statusFilter, sortBy, order]);

  // Handle manual search form submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const updateStatus = async (id: number, status: string, nominal_denda = 0, catatan_denda = '') => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Tindakan',
      message: status === 'completed' ? `Selesaikan booking ini? Denda: Rp ${nominal_denda.toLocaleString('id-ID')}` : `Ubah status menjadi "${status}"?`,
      type: 'info',
      hideCancel: false,
      action: async () => {
        try {
          await apiInstance.put(`/api/admin/bookings/${id}/status`, { status, nominal_denda, catatan_denda });
          fetchBookings();
          // Jika modal detail sedang terbuka dan ID-nya sama, refresh detailnya juga
          if (detailModal.isOpen && detailModal.data?.id_booking === id) {
            openDetail(id);
            setIsCompleting(false);
            setDenda('');
            setCatatanDenda('');
          }
        } catch (error: any) {
          setConfirmModal({ isOpen: true, title: 'Gagal', message: error?.response?.data?.error || 'Gagal update status booking', type: 'danger', hideCancel: true, action: () => {} });
        }
      }
    });
  };

  const openDetail = async (id: number) => {
    setDetailModal({ isOpen: true, data: null, isLoading: true });
    setIsCompleting(false);
    setDenda('');
    setCatatanDenda('');
    setShowIdPreview(false);
    try {
      const response = await apiInstance.get(`/api/admin/bookings/${id}`);
      setDetailModal({ isOpen: true, data: response.data.data, isLoading: false });
    } catch (error) {
      console.error(error);
      setConfirmModal({ isOpen: true, title: 'Gagal', message: 'Gagal memuat detail booking', type: 'danger', hideCancel: true, action: () => {} });
      setDetailModal({ isOpen: false, data: null, isLoading: false });
    }
  };

  const closeDetail = () => {
    setDetailModal({ isOpen: false, data: null, isLoading: false });
    setIsCompleting(false);
    setDenda('');
    setCatatanDenda('');
    setShowIdPreview(false);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (bookings.length === 0) {
      setConfirmModal({ isOpen: true, title: 'Perhatian', message: 'Tidak ada data untuk diexport', type: 'warning', hideCancel: true, action: () => {} });
      return;
    }

    const headers = ['Kode Booking', 'Nama Customer', 'No HP', 'Tanggal Mulai', 'Tanggal Selesai', 'Total Tagihan', 'Status'];
    const csvData = bookings.map(b => [
      b.kode_booking,
      `"${b.nama_customer}"`,
      b.no_hp || '-',
      new Date(b.tanggal_mulai).toLocaleDateString('id-ID'),
      new Date(b.tanggal_selesai).toLocaleDateString('id-ID'),
      b.total_harga,
      b.status
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Booking_TwentyOne_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
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

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'pending_payment', label: 'Menunggu Bayar' },
    { value: 'paid', label: 'Lunas' },
    { value: 'ongoing', label: 'Sedang Disewa' },
    { value: 'completed', label: 'Selesai' },
    { value: 'canceled', label: 'Dibatalkan' },
    { value: 'expired', label: 'Kadaluarsa' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">Kelola Booking</h1>
          <p className="text-zinc-500 text-sm mt-1">Daftar transaksi penyewaan alat.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/60 shadow-xs flex flex-col xl:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearch} className="relative w-full xl:w-96 flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
              placeholder="Cari kode booking / nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 transition">Cari</button>
        </form>

        <div className="flex gap-3 w-full xl:w-auto flex-wrap items-center">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm font-bold focus:ring-2 focus:ring-brand-accent/20 outline-none"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-1">
            <ArrowUpDown className="w-4 h-4 text-zinc-400 ml-2 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-sm font-bold outline-none py-1 px-1 cursor-pointer"
            >
              <option value="created_at">Tgl Dibuat</option>
              <option value="tanggal_mulai">Tgl Sewa</option>
              <option value="tanggal_selesai">Tgl Selesai</option>
            </select>
            <div className="h-4 w-px bg-zinc-300 mx-1"></div>
            <button
              onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
              className="text-xs font-black uppercase px-2 py-1 text-zinc-600 hover:text-zinc-900 transition"
            >
              {order === 'desc' ? 'Terbaru' : 'Terlama'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-none">
        <button 
          onClick={() => setQuickFilter('all')} 
          className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${quickFilter === 'all' ? 'bg-zinc-900 text-white shadow-md' : 'bg-white text-zinc-500 hover:bg-zinc-50 border border-zinc-200'}`}
        >
          Semua Transaksi
        </button>
        <button 
          onClick={() => setQuickFilter('pickup')} 
          className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${quickFilter === 'pickup' ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-md' : 'bg-white text-zinc-500 hover:bg-zinc-50 border border-zinc-200'}`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Ambil Hari Ini
        </button>
        <button 
          onClick={() => setQuickFilter('return')} 
          className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${quickFilter === 'return' ? 'bg-green-50 text-green-700 border border-green-200 shadow-md' : 'bg-white text-zinc-500 hover:bg-zinc-50 border border-zinc-200'}`}
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Kembali Hari Ini
        </button>
        <button 
          onClick={() => setQuickFilter('overdue')} 
          className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${quickFilter === 'overdue' ? 'bg-red-50 text-red-700 border border-red-200 shadow-md' : 'bg-white text-zinc-500 hover:bg-zinc-50 border border-zinc-200'}`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Lewat Batas (Overdue)
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 uppercase font-black bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4">Kode Booking</th>
                <th className="px-6 py-4">Nama Pelanggan</th>
                <th className="px-6 py-4">Tanggal Sewa</th>
                <th className="px-6 py-4">Total Tagihan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredBookings = bookings.filter((b) => {
                  const isPickup = b.status === 'paid' && isToday(b.tanggal_mulai);
                  const isReturn = b.status === 'ongoing' && isToday(b.tanggal_selesai);
                  const isOverdue = b.status === 'ongoing' && isPast(b.tanggal_selesai);

                  if (quickFilter === 'pickup') return isPickup;
                  if (quickFilter === 'return') return isReturn;
                  if (quickFilter === 'overdue') return isOverdue;
                  return true;
                });

                if (isLoading) {
                  return (
                    <>
                      {Array(5).fill(0).map((_, i) => (
                        <tr key={`skel-book-${i}`} className="border-b border-zinc-50">
                          <td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-24"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-32"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-32"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-24"></div></td>
                          <td className="px-6 py-4"><div className="h-6 bg-zinc-200/60 rounded animate-pulse w-20"></div></td>
                          <td className="px-6 py-4"><div className="h-8 bg-zinc-200/60 rounded animate-pulse w-24 ml-auto"></div></td>
                        </tr>
                      ))}
                    </>
                  );
                }

                if (filteredBookings.length === 0) {
                  return <tr><td colSpan={6} className="text-center py-8 text-zinc-400">Tidak ada data transaksi di kategori ini</td></tr>;
                }

                return filteredBookings.map((booking) => {
                  const isPickup = booking.status === 'paid' && isToday(booking.tanggal_mulai);
                  const isReturn = booking.status === 'ongoing' && isToday(booking.tanggal_selesai);
                  const isOverdue = booking.status === 'ongoing' && isPast(booking.tanggal_selesai);

                  return (
                    <tr key={booking.id_booking} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition group">
                      <td className="px-6 py-4 font-mono font-bold text-zinc-900 flex items-center gap-2">
                        {isOverdue ? (
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" title="Terlambat"></div>
                        ) : isPickup ? (
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" title="Ambil Hari Ini"></div>
                        ) : isReturn ? (
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" title="Kembali Hari Ini"></div>
                        ) : null}
                        {booking.kode_booking}
                      </td>
                      <td className="px-6 py-4 text-zinc-700">{booking.nama_customer}</td>
                      <td className="px-6 py-4 text-zinc-500">
                        {new Date(booking.tanggal_mulai).toLocaleDateString('id-ID')} - {new Date(booking.tanggal_selesai).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-900">Rp {(booking.total_harga || 0).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-black tracking-wider border ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDetail(booking.id_booking); }}
                            className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center justify-center gap-1 text-xs font-bold px-2 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" /> Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL PREMIUM UI */}
      {detailModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center shrink-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Detail Reservasi</h2>
                <p className="text-zinc-500 text-sm mt-1">Kode: <span className="font-mono font-bold text-zinc-900">{detailModal.data?.kode_booking}</span></p>
              </div>
              <button onClick={() => setDetailModal({ ...detailModal, isOpen: false })} className="p-2.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-zinc-50/50">
              {detailModal.isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <span className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                </div>
              ) : detailModal.data ? (
                <div className="space-y-8">
                  {/* Status Banner */}
                  <div className={`p-5 rounded-2xl border flex items-center justify-between ${getStatusColor(detailModal.data.status).replace('bg-', 'bg-opacity-10 bg-')}`}>
                    <div>
                      <p className="text-sm font-bold opacity-75 uppercase tracking-wider mb-1">Status Saat Ini</p>
                      <p className="text-lg font-black uppercase">{detailModal.data.status}</p>
                    </div>
                    {detailModal.data.status === 'completed' && detailModal.data.nominal_denda > 0 && (
                      <div className="text-right">
                        <p className="text-sm font-bold opacity-75 uppercase tracking-wider mb-1">Denda Keterlambatan</p>
                        <p className="text-lg font-black text-red-500">Rp {detailModal.data.nominal_denda.toLocaleString('id-ID')}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200/60 shadow-sm">
                      <h3 className="font-black text-zinc-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-accent"></span> Penyewa
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-zinc-50 pb-2">
                          <span className="text-zinc-500">Nama</span>
                          <span className="font-bold text-zinc-900">{detailModal.data.nama_customer}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-50 pb-2">
                          <span className="text-zinc-500">No. HP</span>
                          <span className="font-bold text-zinc-900">{detailModal.data.no_hp}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-50 pb-2">
                          <span className="text-zinc-500">Email</span>
                          <span className="font-bold text-zinc-900">{detailModal.data.email || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1 pb-2">
                          <span className="text-zinc-500">Alamat Lengkap</span>
                          <span className="font-bold text-zinc-900 text-right md:text-left">{detailModal.data.alamat || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Info */}
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200/60 shadow-sm">
                      <h3 className="font-black text-zinc-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Jadwal & Pembayaran
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-zinc-50 pb-2">
                          <span className="text-zinc-500">Tanggal Ambil</span>
                          <span className="font-bold text-zinc-900">{new Date(detailModal.data.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-50 pb-2">
                          <span className="text-zinc-500">Tanggal Kembali</span>
                          <span className="font-bold text-zinc-900">{new Date(detailModal.data.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-50 pb-2">
                          <span className="text-zinc-500">Total Harga</span>
                          <span className="font-black text-brand-accent text-base">Rp {detailModal.data.total_harga.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between pb-2">
                          <span className="text-zinc-500">Sumber</span>
                          <span className="font-bold text-zinc-900 uppercase">{detailModal.data.sumber}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Foto Identitas (KTP/SIM) */}
                  {detailModal.data.foto_identitas && (
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200/60 shadow-sm">
                      <h3 className="font-black text-zinc-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span> Kartu Identitas
                      </h3>
                      {isImagePath(detailModal.data.foto_identitas) ? (
                        <div className="relative group cursor-pointer" onClick={() => setShowIdPreview(true)}>
                          <img
                            src={getFotoIdentitasUrl(detailModal.data.foto_identitas)}
                            alt="Foto Identitas"
                            className="w-full max-h-[200px] object-contain rounded-xl border border-zinc-100 bg-zinc-50"
                          />
                          <div className="absolute inset-0 bg-zinc-900/0 group-hover:bg-zinc-900/40 rounded-xl transition-all duration-200 flex items-center justify-center">
                            <div className="bg-white/90 px-4 py-2 rounded-xl text-sm font-bold text-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 shadow-lg">
                              <ZoomIn className="w-4 h-4" /> Perbesar
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">No. Identitas Fisik (POS)</p>
                          <p className="text-base font-black font-mono text-zinc-900 mt-1">{detailModal.data.foto_identitas}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rented Items */}
                  <div className="bg-white p-6 rounded-2xl border border-zinc-200/60 shadow-sm">
                    <h3 className="font-black text-zinc-900 mb-5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> Barang yang Disewa
                    </h3>
                    <div className="space-y-4">
                      {detailModal.data.details?.map((item: any) => (
                        <div key={item.id_detail} className="flex gap-4 p-4 border border-zinc-100 rounded-xl bg-zinc-50/50 hover:bg-zinc-50 transition">
                          {item.product?.images?.length > 0 ? (
                            <img src={getCoverImage(item.product.images)} alt={item.product.nama} className="w-20 h-20 object-cover rounded-xl shadow-sm" />
                          ) : (
                            <div className="w-20 h-20 bg-zinc-200 rounded-xl flex items-center justify-center text-xs font-bold text-zinc-400">No Img</div>
                          )}
                          <div className="flex-1 flex flex-col justify-center">
                            <p className="font-bold text-zinc-900 text-base">{item.product?.nama || 'Produk Dihapus'}</p>
                            <p className="text-sm text-zinc-500 mt-1">{item.jumlah} Unit × Rp {item.harga_sewa.toLocaleString('id-ID')} / hari</p>
                            <p className="text-sm font-black text-zinc-900 mt-2">Subtotal: Rp {item.subtotal.toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FORM PENYELESAIAN BOOKING (Muncul saat klik "Barang Kembali") */}
                  {isCompleting && (
                    <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300 border border-zinc-800">
                      <h3 className="font-black text-white mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" /> Selesaikan Booking
                      </h3>
                      <p className="text-zinc-400 text-sm mb-5">Apakah ada keterlambatan atau denda kerusakan? Kosongi jika barang kembali dengan aman.</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                        <div>
                          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Nominal Denda (Rp) - Opsional</label>
                          <input type="number" min="0" value={denda} onChange={e => setDenda(e.target.value)} placeholder="0"
                            className="w-full px-4 py-3 border border-zinc-700 rounded-xl bg-zinc-800 text-white font-bold focus:ring-2 focus:ring-brand-accent outline-none transition" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Catatan Denda - Opsional</label>
                          <input type="text" value={catatanDenda} onChange={e => setCatatanDenda(e.target.value)} placeholder="Misal: Telat 1 hari, tenda robek..."
                            className="w-full px-4 py-3 border border-zinc-700 rounded-xl bg-zinc-800 text-white focus:ring-2 focus:ring-brand-accent outline-none transition" />
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end">
                        <button onClick={() => setIsCompleting(false)} className="px-5 py-2.5 rounded-xl font-bold text-zinc-300 hover:bg-zinc-800 transition">Batal</button>
                        <button onClick={() => updateStatus(detailModal.data.id_booking, 'completed', Number(denda) || 0, catatanDenda)}
                          className="bg-brand-accent hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-lg shadow-brand-accent/20">
                          Simpan & Selesaikan
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <p className="text-center text-zinc-400 py-12 font-bold">Gagal memuat data</p>
              )}
            </div>

            {/* Action Bar Linear Flow */}
            {detailModal.data && !isCompleting && (
              <div className="px-8 py-5 border-t border-zinc-100 bg-white shrink-0 flex items-center justify-between z-10">
                <span className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Aksi Tersedia</span>
                <div className="flex gap-3">
                  {/* TOMBOL CETAK BUKTI */}
                  {['paid', 'ongoing', 'completed'].includes(detailModal.data.status) && (
                    <button
                      onClick={() => router.push(`/admin/booking/print/${detailModal.data.id_booking}`)}
                      className="px-5 py-2.5 rounded-xl font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" /> Cetak Bukti
                    </button>
                  )}

                  {detailModal.data.status === 'pending_payment' && (
                    <>
                      <button onClick={() => updateStatus(detailModal.data.id_booking, 'canceled')} className="px-5 py-2.5 rounded-xl font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition">Batalkan</button>
                      <button onClick={() => updateStatus(detailModal.data.id_booking, 'paid')} className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2.5 px-6 rounded-xl transition">Tandai Lunas</button>
                    </>
                  )}

                  {detailModal.data.status === 'paid' && (
                    <>
                      <button onClick={() => updateStatus(detailModal.data.id_booking, 'canceled')} className="px-5 py-2.5 rounded-xl font-bold text-zinc-600 bg-zinc-100 hover:bg-red-50 hover:text-red-600 transition">Batalkan (Refund/Reschedule)</button>
                      <button onClick={() => updateStatus(detailModal.data.id_booking, 'ongoing')} className="bg-brand-accent hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-xl transition flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Barang Diambil
                      </button>
                    </>
                  )}

                  {detailModal.data.status === 'ongoing' && (
                    <button onClick={() => setIsCompleting(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-8 rounded-xl transition flex items-center gap-2">
                      <PackageCheck className="w-5 h-5" /> Barang Kembali
                    </button>
                  )}

                  {['completed', 'canceled', 'expired'].includes(detailModal.data.status) && (
                    <button onClick={() => setDetailModal({ ...detailModal, isOpen: false })} className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2.5 px-8 rounded-xl transition">Tutup</button>
                  )}

                  {!['completed', 'canceled', 'expired'].includes(detailModal.data.status) && (
                    <button onClick={closeDetail} className="px-6 py-2.5 rounded-xl font-bold text-zinc-500 hover:bg-zinc-100 transition">Tutup</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen ID Preview */}
      {showIdPreview && detailModal.data?.foto_identitas && isImagePath(detailModal.data.foto_identitas) && (
        <div className="fixed inset-0 z-[60] bg-zinc-900/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowIdPreview(false)}>
          <button className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 p-3 rounded-full transition cursor-pointer" onClick={() => setShowIdPreview(false)}>
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={getFotoIdentitasUrl(detailModal.data.foto_identitas)}
            alt="Foto Identitas Full"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl bg-black/40"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        type={confirmModal.type}
        hideCancel={confirmModal.hideCancel}
        confirmText={confirmModal.hideCancel ? 'OK' : 'Lanjutkan'}
      />
    </div>
  );
}
