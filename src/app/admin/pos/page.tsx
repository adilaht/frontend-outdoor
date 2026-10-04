'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, CalendarDays } from 'lucide-react';
import { apiInstance } from '@/src/lib/axios';
import ConfirmModal from '@/src/components/common/ConfirmModal';
import { validateFormText, isValidEmail, isValidPhone } from '@/src/utils/validation';

export default function POSPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Date range state
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [dateSet, setDateSet] = useState(false);
  
  // Untuk validasi kalender agar tidak bisa milih tanggal mundur
  const today = new Date().toISOString().split('T')[0];

  // Checkout form
  const [showCheckout, setShowCheckout] = useState(false);
  const [customer, setCustomer] = useState({ nama_customer: '', no_hp: '', email: '', metode_pembayaran: 'cash' });

  // Discount state
  const [showDiscount, setShowDiscount] = useState(false);
  const [tipeDiskon, setTipeDiskon] = useState('persen');
  const [nilaiDiskon, setNilaiDiskon] = useState('');

  // Alert/Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'danger' | 'warning' | 'info',
    hideCancel: true,
    action: () => {}
  });

  const fetchProducts = async (start = tanggalMulai, end = tanggalSelesai) => {
    try {
      const params: any = { limit: 50 };
      if (start && end) {
        params.tanggal_mulai = start;
        params.tanggal_selesai = end;
      }
      const res = await apiInstance.get('/api/admin/pos/products', { params });
      setProducts(res.data.data);
    } catch (error) {
      console.error('Gagal memuat produk:', error);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await apiInstance.get('/api/admin/pos/cart');
      const cartData = res.data.data;
      setCart(cartData);
      
      // Sync date dari backend ke state lokal jika ada
      if (cartData?.tanggal_mulai && cartData?.tanggal_selesai) {
        const start = cartData.tanggal_mulai.substring(0, 10);
        const end = cartData.tanggal_selesai.substring(0, 10);
        setTanggalMulai(start);
        setTanggalSelesai(end);
        setDateSet(true);
        return { start, end };
      }
      return null;
    } catch (error) {
      console.error('Gagal memuat cart:', error);
      return null;
    }
  };

  const fetchAll = async () => {
    setIsLoading(true);
    // Ambil cart dulu biar dapet tanggalnya (sumber kebenaran dari backend)
    const cartDates = await fetchCart();
    
    // Gunakan tanggal dari cart jika ada, jika tidak gunakan state lokal
    await fetchProducts(cartDates?.start || tanggalMulai, cartDates?.end || tanggalSelesai);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSetDate = async () => {
    if (!tanggalMulai || !tanggalSelesai) {
      setConfirmModal({ isOpen: true, title: 'Perhatian', message: 'Isi tanggal mulai dan selesai terlebih dahulu', type: 'warning', hideCancel: true, action: () => {} });
      return;
    }
    try {
      await apiInstance.post('/api/admin/pos/cart/date', { tanggal_mulai: tanggalMulai, tanggal_selesai: tanggalSelesai });
      setDateSet(true);
      fetchAll();
    } catch (error: any) {
      setConfirmModal({ isOpen: true, title: 'Gagal', message: error?.response?.data?.error || 'Gagal set tanggal', type: 'danger', hideCancel: true, action: () => {} });
    }
  };

  const addToCart = async (productId: number) => {
    try {
      await apiInstance.post('/api/admin/pos/cart/items', { id_product: productId, jumlah: 1 });
      fetchCart();
    } catch (error: any) {
      setConfirmModal({ isOpen: true, title: 'Gagal', message: error?.response?.data?.error || 'Gagal tambah ke keranjang', type: 'danger', hideCancel: true, action: () => {} });
    }
  };

  const updateQty = async (itemId: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(itemId);
      return;
    }
    try {
      await apiInstance.put(`/api/admin/pos/cart/items/${itemId}`, { jumlah: newQty });
      fetchCart();
    } catch (error: any) {
      setConfirmModal({ isOpen: true, title: 'Gagal', message: error?.response?.data?.error || 'Gagal update kuantitas', type: 'danger', hideCancel: true, action: () => {} });
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await apiInstance.delete(`/api/admin/pos/cart/items/${itemId}`);
      fetchCart();
    } catch (error) {
      console.error('Gagal hapus:', error);
    }
  };

  const handleCheckout = async () => {
    if (!customer.nama_customer || !customer.no_hp) {
      setConfirmModal({ isOpen: true, title: 'Perhatian', message: 'Nama dan No HP wajib diisi', type: 'warning', hideCancel: true, action: () => {} });
      return;
    }
    
    // Validasi Keamanan XSS & SQLi
    const valNama = validateFormText(customer.nama_customer, "Nama Customer");
    if (!valNama.isValid) {
      setConfirmModal({ isOpen: true, title: 'Validasi Gagal', message: valNama.error, type: 'danger', hideCancel: true, action: () => {} });
      return;
    }
    if (customer.email && !isValidEmail(customer.email)) {
      setConfirmModal({ isOpen: true, title: 'Validasi Gagal', message: 'Format email tidak valid', type: 'danger', hideCancel: true, action: () => {} });
      return;
    }
    if (!isValidPhone(customer.no_hp)) {
      setConfirmModal({ isOpen: true, title: 'Validasi Gagal', message: 'Format nomor HP tidak valid (hanya angka, spasi, +, -)', type: 'danger', hideCancel: true, action: () => {} });
      return;
    }

    setIsProcessing(true);
    try {
      await apiInstance.post('/api/admin/pos/checkout', {
        nama_customer: customer.nama_customer,
        no_hp: customer.no_hp,
        email: customer.email || null,
        metode_pembayaran: customer.metode_pembayaran,
        tipe_diskon: showDiscount ? tipeDiskon : null,
        nilai_diskon: showDiscount ? Number(nilaiDiskon) : 0,
      });
      setConfirmModal({ isOpen: true, title: 'Berhasil', message: 'Transaksi berhasil diproses!', type: 'info', hideCancel: true, action: () => {} });
      setShowCheckout(false);
      setShowDiscount(false);
      setNilaiDiskon('');
      setCustomer({ nama_customer: '', no_hp: '', email: '', metode_pembayaran: 'cash' });
      fetchAll();
    } catch (error: any) {
      setConfirmModal({ isOpen: true, title: 'Checkout Gagal', message: error?.response?.data?.error || 'Terjadi kesalahan saat memproses pembayaran', type: 'danger', hideCancel: true, action: () => {} });
    } finally {
      setIsProcessing(false);
    }
  };

  const cartItems = cart?.items || [];
  const cartTotal = cart?.total_harga || 0;
  const jumlahHari = cart?.jumlah_hari || 0;

  // Calculate discount for display
  let calculatedDiskon = 0;
  if (showDiscount && nilaiDiskon) {
    if (tipeDiskon === 'persen') {
      calculatedDiskon = Math.floor(cartTotal * Number(nilaiDiskon) / 100);
    } else {
      calculatedDiskon = Number(nilaiDiskon);
    }
  }
  if (calculatedDiskon > cartTotal) {
    calculatedDiskon = cartTotal;
  }
  const finalTotal = cartTotal - calculatedDiskon;

  const getCoverImage = (images: any[]) => {
    if (!images || images.length === 0) return '';
    // Sesuai dengan schema.prisma: field-nya 'url' bukan 'image_url'
    const imgUrl = images[0].url;

    if (!imgUrl) return '';
    // Jika backend POS controller sudah memformat url menjadi full http, gunakan langsung
    if (imgUrl.startsWith('http')) return imgUrl;

    // Jika masih path relatif
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/${imgUrl.replace(/^\/+/, '')}`;
  };

  const filteredProducts = products.filter(p => p.nama.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/60 shadow-xs flex flex-col sm:flex-row items-end gap-4">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1">Tanggal Mulai</label>
          <input type="date" value={tanggalMulai} onChange={e => setTanggalMulai(e.target.value)} min={today}
            className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none" />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1">Tanggal Selesai</label>
          <input type="date" value={tanggalSelesai} onChange={e => setTanggalSelesai(e.target.value)} min={tanggalMulai || today}
            className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none" />
        </div>
        <button onClick={handleSetDate} className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2 px-5 rounded-xl text-sm transition flex items-center gap-2 shrink-0 h-[38px]">
          <CalendarDays className="w-4 h-4" /> Set Periode
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6" style={{ height: 'calc(100vh - 14rem)' }}>
        {/* Katalog Kiri */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-zinc-200/60 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="font-black text-zinc-900 uppercase text-sm">Pilih Alat ({filteredProducts.length})</h2>
            <div className="relative w-52">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-zinc-400" />
              </div>
              <input type="text" className="block w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
                placeholder="Cari alat..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 relative content-scrollbar">
            {isLoading ? (
              <div className="flex justify-center p-8"><span className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map(product => {
                  const isOutOfStock = (product.stok_tersedia ?? product.stok_total) <= 0;
                  return (
                    <div key={product.id_product} onClick={() => !isOutOfStock && addToCart(product.id_product)}
                      className={`bg-white border border-zinc-200 rounded-2xl p-3 transition group relative ${isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-brand-accent hover:shadow-lg hover:-translate-y-1'}`}>
                      <div className="w-full aspect-square bg-zinc-50 rounded-xl mb-3 flex flex-col items-center justify-center overflow-hidden relative">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={getCoverImage(product.images)}
                            alt={product.nama}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <PackageIcon className="w-8 h-8 text-zinc-300 group-hover:text-brand-accent transition" />
                        )}

                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="bg-zinc-900 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider shadow-xl">Habis</span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-zinc-900 text-xs line-clamp-2 leading-tight mb-1">{product.nama}</h3>
                      <div className="flex justify-between items-end mt-2">
                        <p className="font-black text-brand-accent text-xs">Rp {(product.harga_per_hari || 0).toLocaleString('id-ID')}</p>
                        <p className="text-zinc-500 text-[10px] font-semibold bg-zinc-100 px-1.5 py-0.5 rounded">Stok: {product.stok_tersedia ?? product.stok_total}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Kasir Kanan */}
        <div className="w-full lg:w-96 flex flex-col bg-white rounded-3xl border border-zinc-200/60 shadow-xs overflow-hidden shrink-0">
          <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-brand-accent" />
              <h2 className="font-black uppercase tracking-wider text-sm">Keranjang POS</h2>
            </div>
            {jumlahHari > 0 && (
              <span className="text-xs bg-white/10 px-2 py-1 rounded-lg">{jumlahHari} hari</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">Keranjang masih kosong</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item: any) => (
                  <div key={item.id_item} className="flex gap-3 items-center border-b border-zinc-100 pb-3">
                    <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 overflow-hidden border border-zinc-200">
                      {item.product?.images && item.product.images.length > 0 ? (
                        <img
                          src={getCoverImage(item.product.images)}
                          alt={item.product?.nama}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PackageIcon className="w-5 h-5 text-zinc-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-zinc-900 text-sm truncate">{item.product?.nama}</h4>
                      <p className="text-brand-accent font-bold text-xs">Rp {(item.subtotal || 0).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
                      <button onClick={() => updateQty(item.id_item, item.jumlah - 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-xs text-zinc-600 hover:text-zinc-900">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold">{item.jumlah}</span>
                      <button onClick={() => updateQty(item.id_item, item.jumlah + 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-xs text-zinc-600 hover:text-zinc-900">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id_item)} className="p-1.5 text-zinc-400 hover:text-red-500 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Form (conditional) */}
          {showCheckout && (
            <div className="p-4 border-t border-zinc-200 space-y-3 bg-zinc-50">
              <input type="text" placeholder="Nama Customer *" value={customer.nama_customer} onChange={e => setCustomer({ ...customer, nama_customer: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none focus:border-brand-accent" />
              <input type="text" placeholder="No HP *" value={customer.no_hp} onChange={e => setCustomer({ ...customer, no_hp: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none focus:border-brand-accent" />
              <input type="email" placeholder="Email (opsional)" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none focus:border-brand-accent" />
              <select value={customer.metode_pembayaran} onChange={e => setCustomer({ ...customer, metode_pembayaran: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none focus:border-brand-accent bg-white">
                <option value="cash">Cash</option>
                <option value="qris">QRIS</option>
                <option value="transfer">Transfer</option>
              </select>

              {/* Toggle Discount */}
              {!showDiscount ? (
                <button onClick={() => setShowDiscount(true)} className="text-xs font-bold text-brand-accent hover:text-orange-600 transition flex items-center gap-1 mt-2">
                  <Plus className="w-3 h-3" /> Tambah Diskon
                </button>
              ) : (
                <div className="bg-white p-3 rounded-xl border border-zinc-200 mt-2 space-y-2 relative">
                  <button onClick={() => { setShowDiscount(false); setNilaiDiskon(''); }} className="absolute top-2 right-2 text-zinc-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Diskon</label>
                  <div className="flex gap-2">
                    <select value={tipeDiskon} onChange={e => setTipeDiskon(e.target.value)} className="w-1/3 px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none focus:border-brand-accent bg-zinc-50">
                      <option value="persen">Persen (%)</option>
                      <option value="nominal">Rupiah (Rp)</option>
                    </select>
                    <input type="number" placeholder={tipeDiskon === 'persen' ? "Contoh: 10" : "Contoh: 50000"} value={nilaiDiskon} onChange={e => setNilaiDiskon(e.target.value)}
                      className="w-2/3 px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none focus:border-brand-accent" />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-4 bg-zinc-50 border-t border-zinc-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-zinc-500 font-bold uppercase text-xs tracking-wider">Total</span>
              <div className="text-right">
                {calculatedDiskon > 0 && (
                  <div className="text-xs text-red-500 font-bold mb-1">
                    <span className="line-through text-zinc-400 mr-1">Rp {cartTotal.toLocaleString('id-ID')}</span>
                    - Rp {calculatedDiskon.toLocaleString('id-ID')}
                  </div>
                )}
                <span className="text-2xl font-black text-zinc-900">Rp {finalTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
            {!showCheckout ? (
              <button
                onClick={() => setShowCheckout(true)}
                disabled={cartItems.length === 0}
                className="w-full bg-brand-accent hover:bg-orange-600 text-white font-bold py-3 rounded-xl uppercase tracking-wider text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proses Transaksi
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setShowCheckout(false)} className="flex-1 bg-zinc-200 text-zinc-700 font-bold py-3 rounded-xl text-sm transition hover:bg-zinc-300">Batal</button>
                <button onClick={handleCheckout} disabled={isProcessing}
                  className="flex-1 bg-brand-accent hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition disabled:opacity-50">
                  {isProcessing ? 'Proses...' : 'Bayar'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        type={confirmModal.type}
        hideCancel={confirmModal.hideCancel}
        confirmText="OK"
      />
    </div>
  );
}

function PackageIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
  );
}
