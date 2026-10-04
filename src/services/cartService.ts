// src/services/cartService.ts
import { apiInstance } from '@/src/lib/axios';
import { getOrCreateSessionId } from '@/src/lib/session';
import { ApiResponse, CartData, GetCartResponse } from '@/src/types';
import { differenceInDays } from 'date-fns';

// Helper header menggunakan nama key baru: x-session-id
const getSessionHeader = () => ({
  headers: { 'x-session-id': getOrCreateSessionId() }
});

export interface CartSummary {
  items: CartData['items'];
  grandTotal: number;
  durasiHari: number;
  // 🌟 Tambahan data meta dari CartData untuk kebutuhan UI & Dev Mode
  id_cart?: number;
  session_id?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  created_at?: string;
  updated_at?: string;
  expired_at?: string | null;
}



/**
 * Mengambil isi keranjang belanja dan menghitung kalkulasi harga + durasi sewa
 */
// 🌟 BARU: Fungsi untuk mengambil data cart aktif berdasarkan session_id
export async function getCart(): Promise<CartData | null> {
  try {
    const sessionId = getOrCreateSessionId(); // Memakai fungsi mengambil/membuat session ID yang udah lu punya
    const response = await apiInstance.get<GetCartResponse>('/api/cart', {
      headers: { 'x-session-id': sessionId }
    });

    // Berdasarkan JSON lu, datanya dibungkus di dalam properti .data
    return response.data.data || null;
  } catch (error: any) {
    console.error("Gagal mengambil data cart dari server:", error.response?.data || error.message);
    return null;
  }
}


export async function getCartItems(): Promise<CartSummary> {
  try {
    const response = await apiInstance.get<ApiResponse<CartData>>('/api/cart', getSessionHeader());
    const cart = response.data.data;

    // Jika cart murni kosong atau belum dibuat
    if (!cart || !cart.items || cart.items.length === 0) {
      return { 
        items: [], 
        grandTotal: 0, 
        durasiHari: 0,
        session_id: cart?.session_id || "" 
      };
    }

    // Hitung durasi sewa menggunakan date-fns
    const tglMulai = new Date(cart.tanggal_mulai);
    const tglSelesai = new Date(cart.tanggal_selesai);
    const durasiHari = Math.max(differenceInDays(tglSelesai, tglMulai), 1);

    // Hitung akumulasi grand total
    const grandTotal = cart.items.reduce((total, item) => {
      const itemCost = item.product.harga_per_hari * durasiHari * item.jumlah;
      return total + itemCost;
    }, 0);

    // 🌟 RETURN SEMUA DATA UTUH KE FRONTEND
    return {
      items: cart.items,
      grandTotal,
      durasiHari,
      id_cart: cart.id_cart,
      session_id: cart.session_id,
      tanggal_mulai: cart.tanggal_mulai,
      tanggal_selesai: cart.tanggal_selesai,
      created_at: cart.created_at,
      updated_at: cart.updated_at,
      expired_at: cart.expired_at
    };
  } catch (error) {
    console.error("Gagal mengambil data keranjang:", error);
    return { items: [], grandTotal: 0, durasiHari: 0 };
  }
}

/**
 * Menghapus item tertentu dari keranjang berdasarkan id_item
 */
// src/services/cartService.ts

export async function removeFromCart(id_item: number): Promise<boolean> {
  try {
    const sessionId = getOrCreateSessionId();
    // 🌟 PASTIKAN: Menggunakan .delete dan path-nya murni /api/cart/item/:id
    const response = await apiInstance.delete(`/api/cart/item/${id_item}`, {
      headers: { 'x-session-id': sessionId }
    });
    
    // Sesuaikan dengan response backend lu, biasanya jika sukses statusnya 200 atau 244
    return response.status === 200 || response.data.message !== undefined;
  } catch (error) {
    console.error("Gagal menghapus item dari cart:", error);
    return false;
  }
}


/**
 * Menambahkan alat gunung ke dalam keranjang belanja
 */
export async function addToCart(id_product: number, jumlah: number): Promise<boolean> {
  try {
    const response = await apiInstance.post('/api/cart', {
      id_product,
      jumlah
    }, {
      headers: { 'x-session-id': getOrCreateSessionId() }
    });
    
    return response.status === 200 || response.status === 201;
  } catch (error) {
    console.error("Gagal menambahkan item ke keranjang:", error);
    return false;
  }
}


/**
 * Menyimpan tanggal sewa untuk pertama kali (Inisialisasi Cart)
 */
export async function setCartDate(tanggalMulai: string, tanggalSelesai: string): Promise<boolean> {
  try {
    const response = await apiInstance.post('/api/cart/set-date', {
      tanggal_mulai: tanggalMulai,     // Format: "2026-06-13"
      tanggal_selesai: tanggalSelesai  // Format: "2026-06-14"
    }, {
      headers: { 'x-session-id': getOrCreateSessionId() }
    });
    
    return response.status === 200 || response.status === 201;
  } catch (error) {
    console.error("Gagal melakukan set-date:", error);
    return false;
  }
}

/**
 * Mengubah tanggal sewa yang sudah ada di cart aktif
 */
export async function updateCartDate(tanggalMulai: string, tanggalSelesai: string): Promise<boolean> {
  try {
    const response = await apiInstance.put('/api/cart/update-date', {
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai
    }, {
      headers: { 'x-session-id': getOrCreateSessionId() }
    });
    
    return response.status === 200 || response.status === 201;
  } catch (error) {
    console.error("Gagal melakukan update-date:", error);
    return false;
  }
}

// Di src/services/cartService.ts pastikan polanya merethrow error:
export async function updateItemQuantity(id_item: number, jumlah: number) {
  const sessionId = getOrCreateSessionId();
  // Jangan di-catch di dalam service kalau mau di-handle custom text-nya di UI komponen page
  const response = await apiInstance.put(`/api/cart/item/${id_item}`, { jumlah }, {
    headers: { 'x-session-id': sessionId }
  });
  return response.status === 200;
}