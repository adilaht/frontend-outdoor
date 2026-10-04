'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiInstance } from '@/src/lib/axios';
import { Printer, MessageCircle, ArrowLeft, Download } from 'lucide-react';

export default function PrintInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await apiInstance.get(`/api/admin/bookings/${id}`);
        setBooking(response.data.data);
      } catch (error) {
        console.error('Gagal mengambil data booking', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  const handleWhatsApp = () => {
    const text = `Halo ${booking.nama_customer},\n\nBerikut adalah bukti transaksi penyewaan alat outdoor Anda dengan kode referensi *${booking.kode_booking}*.\n\nTerima kasih telah menyewa di tempat kami!`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/${booking.no_hp}?text=${encodedText}`, '_blank');
  };

  if (isLoading) {
    return <div className="p-10 text-center font-mono">Memuat Nota...</div>;
  }

  if (!booking) {
    return <div className="p-10 text-center font-mono text-red-500">Nota tidak ditemukan.</div>;
  }

  return (
    <div className="bg-zinc-100 min-h-screen py-8">

      {/* ACTION BUTTONS (HIDDEN IN PRINT) */}
      <div className="max-w-[800px] mx-auto mb-6 flex justify-between items-center px-8 no-print">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-white text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 font-bold text-sm transition shadow-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleWhatsApp}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-bold text-sm transition shadow-md flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" /> Bagikan WA
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-orange-600 font-bold text-sm transition shadow-md shadow-brand-accent/20 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Cetak / Simpan PDF
          </button>
        </div>
      </div>

      <div id="print-section" className="bg-white p-8 text-black shadow-xl" style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* HEADER */}
        <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">TwentyOne</h1>
            <p className="text-sm font-bold tracking-widest mt-0.5">OUTDOOR RENT</p>
            <p className="text-xs mt-2 text-gray-600">Jl. Raya Cibiuk Kp. Maja Pasir Kacapi RT 03 RW 06<br /> Kel. Sukaratu, Kec. Majasari, Kab. Pandeglang, Banten 42217<br />Telp: 089638616224</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase tracking-wider mb-1">BUKTI TRANSAKSI</h2>
            <p className="font-mono text-lg font-bold bg-gray-100 px-2 py-1 inline-block">{booking.kode_booking}</p>
          </div>
        </div>

        {/* CUSTOMER INFO & BOOKING DATES */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Informasi Penyewa</h3>
            <p className="font-bold text-lg">{booking.nama_customer}</p>
            <p className="text-sm">{booking.no_hp}</p>
            <p className="text-sm">{booking.email}</p>
            <p className="text-sm mt-1">{booking.alamat || '-'}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Detail Sewa</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600">Tanggal Ambil</td>
                  <td className="py-1 font-bold text-right">{new Date(booking.tanggal_mulai).toLocaleDateString('id-ID', { dateStyle: 'long' })}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Tanggal Kembali</td>
                  <td className="py-1 font-bold text-right">{booking.tanggal_kembali ? new Date(booking.tanggal_kembali).toLocaleDateString('id-ID', { dateStyle: 'long' }) : new Date(booking.tanggal_selesai).toLocaleDateString('id-ID', { dateStyle: 'long' })}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Status</td>
                  <td className="py-1 font-bold text-right uppercase">{booking.status}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <table className="w-full mb-8 border-collapse">
          <thead>
            <tr className="border-y-2 border-black">
              <th className="py-3 text-left text-xs uppercase tracking-wider">Item</th>
              <th className="py-3 text-center text-xs uppercase tracking-wider w-20">Qty</th>
              <th className="py-3 text-right text-xs uppercase tracking-wider w-32">Harga/Hari</th>
              <th className="py-3 text-right text-xs uppercase tracking-wider w-32">Subtotal</th>
            </tr>
          </thead>
          <tbody className="border-b border-gray-300">
            {booking.details?.map((item: any) => (
              <tr key={item.id_detail} className="border-b border-gray-100 last:border-none">
                <td className="py-3">
                  <p className="font-bold">{item.product.nama}</p>
                </td>
                <td className="py-3 text-center font-mono">{item.jumlah}</td>
                <td className="py-3 text-right font-mono">Rp {(item.harga_sewa || 0).toLocaleString('id-ID')}</td>
                <td className="py-3 text-right font-mono">Rp {(item.subtotal || 0).toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS */}
        <div className="flex justify-end">
          <div className="w-64">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-600 font-bold">Total Sewa</td>
                  <td className="py-2 text-right font-bold font-mono">Rp {(booking.total_harga || 0).toLocaleString('id-ID')}</td>
                </tr>
                {booking.nominal_denda > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-red-600 font-bold">Denda/Kerusakan</td>
                    <td className="py-2 text-right font-bold font-mono text-red-600">Rp {(booking.nominal_denda).toLocaleString('id-ID')}</td>
                  </tr>
                )}
                <tr className="border-y-2 border-black text-lg">
                  <td className="py-3 font-black">GRAND TOTAL</td>
                  <td className="py-3 text-right font-black font-mono">Rp {((booking.total_harga || 0) + (booking.nominal_denda || 0)).toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {booking.catatan_denda && (
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 text-sm">
            <p className="font-bold mb-1">Catatan Tambahan:</p>
            <p>{booking.catatan_denda}</p>
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-16 text-center text-xs text-gray-500 flex flex-col gap-1 border-t pt-4">
          <p>Terima kasih telah mempercayakan perjalanan outdoor Anda bersama TwentyOne Outdoor.</p>
          <p>Barang yang sudah disewa dan dibawa menjadi tanggung jawab penyewa.</p>
          <p className="mt-2 font-mono">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
        </div>

        {/* HIDE NAVBAR & FOOTER WHEN PRINTING via Global CSS or just relying on standard print behavior */}
        <style dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * { visibility: hidden; }
          #print-section, #print-section * { visibility: visible; }
          #print-section { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; }
          .no-print, nav, footer, aside, .chatbot-widget { display: none !important; }
        }
      `}} />
      </div>
    </div>
  );
}
