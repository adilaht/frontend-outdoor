// src/types/index.ts

// 1. Kontrak data utama untuk Produk (Sesuai kode awal lu)
export interface Product {
  id_product: number;
  nama: string;
  slug: string;
  deskripsi: string;
  harga_per_hari: number;
  stok_total: number;
  is_active: boolean;
  category_id: number | null;
  images: string[]; // Mengakomodasi array kosg [] atau isi url string
  stok_tersedia?: number; // Sisa stok real-time (jika ada rentang tanggal)
  // 🌟 UPDATE: Tambahkan objek category sesuai response API lu
  category?: {
    nama: string;
  };
}

export interface PopularProductsResponse {
  data: Product[];
}

export interface PaginatedProductResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: Product[];
}

// 3. Kontrak data wrapper untuk API non-paginated (seperti Object Cart tunggal)
export interface ApiResponse<T> {
  data: T;
}

// Interface untuk mencocokkan kembalian real API categories lu
export interface Category {
  id_category: number;
  nama: string;
  slug: string;
  _count?: {
    products: number;
  };
}

export interface CategoriesResponse {
  data: Category[];
}

// 🌟 Interface untuk Single Category Detail beserta array products di dalamnya
export interface CategoryWithProducts {
  id_category: number;
  nama: string;
  slug: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  products: Product[]; // Array produk hasil paginasi dari backend
}

export interface SingleCategoryResponse {
  data: CategoryWithProducts;
}

// 4. Kontrak data untuk Item di dalam Keranjang (Menyesuaikan response backend lu)
export interface CartItem {
  id_item: number;
  id_cart: number;
  id_product: number;
  jumlah: number;
  is_available: boolean;
  stok_tersedia?: number; // Sisa stok real-time dari backend
  product: Product; // Relasi ke kontrak Product di atas
}

// 5. Kontrak data utama untuk Cart (Menyesuaikan response backend lu)
export interface CartData {
  id_cart: number;
  session_id: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  created_at: string;
  updated_at: string;
  expired_at: string | null;
  items: CartItem[]; // Array berisi daftar item alat gunung
}

export interface GetCartResponse {
  data: CartData;
}