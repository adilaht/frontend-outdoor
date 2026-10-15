// src/services/productService.ts
import { apiInstance } from '@/src/lib/axios'; // Import instance axios lu
import { Product, PaginatedProductResponse, PopularProductsResponse, Category, CategoriesResponse, CategoryWithProducts, SingleCategoryResponse } from '@/src/types';


export async function getProducts(
  page = 1, 
  limit = 10, 
  categoryId?: number | string | null,
  tanggalMulai?: string | null,
  tanggalSelesai?: string | null
): Promise<PaginatedProductResponse | null> {
  try {
    const params: Record<string, any> = { page, limit };
    
    // Jika ada category_id yang dipilih, masukkan ke query params
    if (categoryId) {
      params.category_id = categoryId;
    }
    
    if (tanggalMulai && tanggalSelesai) {
      params.tanggal_mulai = tanggalMulai;
      params.tanggal_selesai = tanggalSelesai;
    }

    const response = await apiInstance.get<PaginatedProductResponse>('/api/products', { params });
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil data katalog produk:", error);
    return null;
  }
}

/**
 * Mengambil data produk terpopuler/terbaru dari API
 */
export async function getHighlightedProducts(): Promise<Product[]> {
  try {
    // 🌟 UBAH: Tembak ke endpoint /api/products/popular tanpa params pagination jika tidak dibutuhkan backend
    const response = await apiInstance.get<PopularProductsResponse>(`/api/products/popular`);

    const json = response.data;
    
    // 🌟 KARENA data langsung berupa array, langsung return atau filter jika ada flag is_active
    // Jika di endpoint popular sudah pasti aktif dari backend, bisa langsung: return json.data || [];
    return (json.data || []).filter((product) => product.is_active !== false);
  } catch (error) {
    console.error("Gagal mengambil produk populer di productService:", error);
    return []; // Fallback aman berupa array kosong agar frontend tidak crash
  }
}

// Tambahkan ke src/services/productService.ts
export async function getProductById(
  id: string,
  tanggalMulai?: string | null,
  tanggalSelesai?: string | null
): Promise<Product | null> {
  try {
    const params: Record<string, any> = {};
    if (tanggalMulai && tanggalSelesai) {
      params.tanggal_mulai = tanggalMulai;
      params.tanggal_selesai = tanggalSelesai;
    }
    const response = await apiInstance.get(`/api/products/${id}`, { params });
    return response.data; // Sesuaikan jika response backend lu pakai .data.data
  } catch (error) {
    console.error("Gagal mengambil detail produk:", error);
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const response = await apiInstance.get<CategoriesResponse>('/api/categories');
    return response.data.data || [];
  } catch (error) {
    console.error("Gagal mengambil data kategori dari API:", error);
    return []; // Fallback jika API bermasalah
  }
}

// Update fungsi getCategoryById agar menerima parameter page dan limit

// src/services/productService.ts

export async function getCategoryById(
  id: number | string,
  page = 1,
  limit = 9,
  tanggalMulai?: string | null,
  tanggalSelesai?: string | null
): Promise<CategoryWithProducts | null> {
  try {
    const params: Record<string, any> = { page, limit };
    if (tanggalMulai && tanggalSelesai) {
      params.tanggal_mulai = tanggalMulai;
      params.tanggal_selesai = tanggalSelesai;
    }

    const response = await apiInstance.get<CategoryWithProducts>(`/api/categories/${id}`, { params });
    
    // Karena response.data sudah langsung berisi objek { id_category, nama, products, ... }
    return response.data || null;
  } catch (error: any) {
    console.error(`Gagal mengambil data kategori dengan ID ${id}:`, error.response?.data || error.message);
    return null;
  }
}