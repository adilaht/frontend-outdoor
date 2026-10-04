'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Tags, FolderPlus, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';
import { apiInstance } from '@/src/lib/axios';
import ConfirmModal from '@/src/components/common/ConfirmModal';
import { validateFormText } from '@/src/utils/validation';

export default function AdminProdukPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Product State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Category State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryName, setCategoryName] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  // Form State Product
  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    harga_per_hari: '',
    stok_total: '',
    category_id: '',
    is_active: true,
  });
  const [images, setImages] = useState<FileList | null>(null);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info',
    hideCancel: false,
    action: () => { }
  });

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        apiInstance.get('/api/admin/products', { params: { limit: 100 } }),
        apiInstance.get('/api/categories')
      ]);
      setProducts(prodRes.data.data);
      setCategories(catRes.data.data);
    } catch (error) {
      console.error('Gagal memuat data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Nonaktifkan Produk',
      message: 'Yakin ingin menonaktifkan produk ini? Produk yang dinonaktifkan tidak akan terlihat oleh pelanggan.',
      type: 'warning',
      hideCancel: false,
      action: async () => {
        try {
          await apiInstance.delete(`/api/admin/products/${id}`);
          fetchData();
        } catch (error: any) {
          setConfirmModal({ isOpen: true, title: 'Gagal', message: error?.response?.data?.error || 'Gagal menghapus produk', type: 'danger', hideCancel: true, action: () => { } });
        }
      }
    });
  };

  const openModal = (product: any = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nama: product.nama || '',
        deskripsi: product.deskripsi || '',
        harga_per_hari: product.harga_per_hari || '',
        stok_total: product.stok_total || '',
        category_id: product.category?.id_category || product.category_id || '',
        is_active: product.is_active,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nama: '',
        deskripsi: '',
        harga_per_hari: '',
        stok_total: '',
        category_id: '',
        is_active: true,
      });
    }
    setImages(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi Keamanan XSS & SQLi
    const valNama = validateFormText(formData.nama, "Nama produk");
    if (!valNama.isValid) return setConfirmModal({ isOpen: true, title: 'Validasi Gagal', message: valNama.error, type: 'danger', hideCancel: true, action: () => { } });

    const valDeskripsi = validateFormText(formData.deskripsi, "Deskripsi produk");
    if (!valDeskripsi.isValid) return setConfirmModal({ isOpen: true, title: 'Validasi Gagal', message: valDeskripsi.error, type: 'danger', hideCancel: true, action: () => { } });

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('nama', formData.nama);
      submitData.append('deskripsi', formData.deskripsi);
      submitData.append('harga_per_hari', String(formData.harga_per_hari));
      submitData.append('stok_total', String(formData.stok_total));
      if (formData.category_id) {
        submitData.append('category_id', String(formData.category_id));
      }

      if (editingProduct) {
        submitData.append('is_active', String(formData.is_active));
      }

      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          submitData.append('images', images[i]);
        }
      }

      if (editingProduct) {
        await apiInstance.put(`/api/admin/products/${editingProduct.id_product}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setConfirmModal({ isOpen: true, title: 'Berhasil', message: 'Produk berhasil diperbarui', type: 'info', hideCancel: true, action: () => { } });
      } else {
        await apiInstance.post('/api/admin/products', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setConfirmModal({ isOpen: true, title: 'Berhasil', message: 'Produk berhasil ditambahkan', type: 'info', hideCancel: true, action: () => { } });
      }

      closeModal();
      fetchData();
    } catch (error: any) {
      setConfirmModal({ isOpen: true, title: 'Gagal', message: error?.response?.data?.error || 'Gagal menyimpan produk', type: 'danger', hideCancel: true, action: () => { } });
    } finally {
      setIsSubmitting(false);
    }
  };

  // CATEGORY FUNCTIONS
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi Keamanan XSS & SQLi
    const valCat = validateFormText(categoryName, "Nama kategori");
    if (!valCat.isValid) return setConfirmModal({ isOpen: true, title: 'Validasi Gagal', message: valCat.error, type: 'danger', hideCancel: true, action: () => { } });

    setIsSubmittingCategory(true);
    try {
      if (editingCategory) {
        await apiInstance.put(`/api/categories/${editingCategory.id_category}`, { nama: categoryName });
      } else {
        await apiInstance.post('/api/categories', { nama: categoryName });
      }
      setCategoryName('');
      setEditingCategory(null);
      fetchData();
    } catch (error: any) {
      setConfirmModal({ isOpen: true, title: 'Gagal', message: error?.response?.data?.error || 'Gagal menyimpan kategori', type: 'danger', hideCancel: true, action: () => { } });
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Kategori',
      message: 'Yakin hapus kategori ini? Tindakan ini tidak bisa dibatalkan.',
      type: 'danger',
      hideCancel: false,
      action: async () => {
        try {
          await apiInstance.delete(`/api/categories/${id}`);
          fetchData();
        } catch (error: any) {
          setConfirmModal({ isOpen: true, title: 'Gagal', message: error?.response?.data?.error || 'Kategori masih digunakan oleh produk', type: 'danger', hideCancel: true, action: () => { } });
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">Kelola Produk</h1>
          <p className="text-zinc-500 text-sm mt-1">Daftar inventaris alat outdoor & kategori.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex-1 sm:flex-none bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-2.5 px-5 rounded-xl text-sm transition flex items-center justify-center gap-2"
          >
            <Tags className="w-4 h-4" /> Kategori
          </button>
          <button
            onClick={() => openModal()}
            className="flex-1 sm:flex-none bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Produk
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/60 shadow-xs">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
            placeholder="Cari nama produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 uppercase font-black bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Nama Produk</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Stok Total</th>
                <th className="px-6 py-4">Harga / Hari</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={`skel-prod-${i}`} className="border-b border-zinc-50">
                    <td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-12"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-48"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-zinc-200/60 rounded animate-pulse w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 rounded animate-pulse w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-zinc-200/60 rounded animate-pulse w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-zinc-200/60 rounded animate-pulse w-24 ml-auto"></div></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-zinc-400">Tidak ada data produk</td></tr>
              ) : (
                products
                  .filter(p => p.nama.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((product) => (
                    <tr key={product.id_product} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition group">
                      <td className="px-6 py-4 font-mono font-bold text-zinc-400">{product.id_product}</td>
                      <td className="px-6 py-4 font-bold text-zinc-900">{product.nama}</td>
                      <td className="px-6 py-4 text-zinc-500">{product.category?.nama || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${product.stok_total < 3
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}>
                          {product.stok_total} pcs
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-900">Rp {(product.harga_per_hari || 0).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${product.is_active
                            ? 'bg-green-50 text-green-600'
                            : 'bg-red-50 text-red-500'
                          }`}>
                          {product.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); openModal(product); }}
                            className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {product.is_active && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(product.id_product); }}
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer" title="Nonaktifkan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL KATEGORI */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Kelola Kategori</h2>
              <button onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); setCategoryName(''); }} className="p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleCategorySubmit} className="flex gap-2 mb-6">
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  placeholder="Nama Kategori Baru/Edit..."
                  className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition"
                />
                <button
                  type="submit"
                  disabled={isSubmittingCategory}
                  className="bg-brand-accent hover:bg-orange-600 text-white font-bold py-2.5 px-5 rounded-xl transition disabled:opacity-50 text-sm"
                >
                  {isSubmittingCategory ? '...' : (editingCategory ? 'Update' : 'Tambah')}
                </button>
                {editingCategory && (
                  <button type="button" onClick={() => { setEditingCategory(null); setCategoryName(''); }} className="px-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-sm">Batal</button>
                )}
              </form>

              <div className="space-y-2">
                {categories.length === 0 ? (
                  <p className="text-center text-zinc-400 text-sm py-4">Belum ada kategori</p>
                ) : (
                  categories.map(cat => (
                    <div key={cat.id_category} className="flex justify-between items-center p-3 border border-zinc-100 rounded-xl bg-zinc-50">
                      <span className="font-bold text-zinc-900 text-sm">{cat.nama}</span>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingCategory(cat); setCategoryName(cat.nama); }} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteCategory(cat.id_category)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Tambah/Edit Produk */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <button onClick={closeModal} className="p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="productForm" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Nama Produk *</label>
                    <input type="text" required value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition" />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Deskripsi</label>
                    <textarea rows={3} value={formData.deskripsi} onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Harga Sewa / Hari (Rp) *</label>
                    <input type="number" required min="0" value={formData.harga_per_hari} onChange={e => setFormData({ ...formData, harga_per_hari: e.target.value })}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Stok Total *</label>
                    <input type="number" required min="0" value={formData.stok_total} onChange={e => setFormData({ ...formData, stok_total: e.target.value })}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Kategori</label>
                    <select value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition">
                      <option value="">-- Pilih Kategori --</option>
                      {categories.map(c => (
                        <option key={c.id_category} value={c.id_category}>{c.nama}</option>
                      ))}
                    </select>
                  </div>

                  {editingProduct && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Status Aktif</label>
                      <select value={formData.is_active ? "true" : "false"} onChange={e => setFormData({ ...formData, is_active: e.target.value === "true" })}
                        className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition">
                        <option value="true">Aktif</option>
                        <option value="false">Nonaktif</option>
                      </select>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Foto Produk {editingProduct && "(Kosongi jika tidak diubah)"}</label>
                    <input type="file" multiple accept="image/*" onChange={e => setImages(e.target.files)}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 transition" />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-zinc-100 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl font-bold text-zinc-600 hover:bg-zinc-100 transition">
                Batal
              </button>
              <button
                type="submit"
                form="productForm"
                disabled={isSubmitting}
                className="bg-brand-accent hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-xl transition disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Simpan Produk'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        type={confirmModal.type}
        hideCancel={(confirmModal as any).hideCancel}
        confirmText={(confirmModal as any).hideCancel ? 'OK' : 'Lanjutkan'}
      />
    </div>
  );
}
