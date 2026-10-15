// src/context/CartContext.tsx
'use client';

import * as React from 'react';
import { parseISO, format } from "date-fns"; // sesuaikan dengan library date lu
import { getCart } from '@/src/services/cartService';
import { type DateRange } from 'react-day-picker';


interface CartContextType {
  dateRange: DateRange | undefined; 
  setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>; 
  isDateSelected: boolean;
  isLoadingCartGlobal: boolean;
  refreshGlobalDate: () => Promise<void>;
  cartItemCount: number;
  cartItems: any[];
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [isLoadingCartGlobal, setIsLoadingCartGlobal] = React.useState(true);
  const [cartItemCount, setCartItemCount] = React.useState(0);
  const [cartItems, setCartItems] = React.useState<any[]>([]);

  // Fungsi untuk menarik tanggal aktif dari server (API getCart)
  const refreshGlobalDate = React.useCallback(async () => {
    try {
      const rawRes = await getCart() as any;
      
      // 🌟 SINKRONISASI: Bongkar lapisannya sesuai format response backend ({ data: { data: cart } })
      const cart = rawRes?.data?.data ? rawRes.data.data : (rawRes?.data ? rawRes.data : rawRes);

      if (cart) {
        if (cart.items) {
          const count = cart.items.reduce((total: number, item: any) => total + item.jumlah, 0);
          setCartItemCount(count);
          setCartItems(cart.items);
        } else {
          setCartItemCount(0);
          setCartItems([]);
        }

        if (cart.tanggal_mulai && cart.tanggal_selesai) {
          setDateRange({
            from: new Date(cart.tanggal_mulai), // Menggunakan new Date() lebih aman jika formatnya ISO string standar
            to: new Date(cart.tanggal_selesai),
          });
          console.log("🎯 [Context] Berhasil sinkronisasi tanggal global dari backend:", cart.tanggal_mulai);
        } else {
          setDateRange(undefined);
        }
      } else {
        setDateRange(undefined);
        setCartItemCount(0);
      }
    } catch (error) {
      console.error("Gagal sinkronisasi tanggal di Context:", error);
      setCartItemCount(0);
    } finally {
      setIsLoadingCartGlobal(false);
    }
  }, []);

  React.useEffect(() => {
    refreshGlobalDate();
  }, [refreshGlobalDate]);

  const isDateSelected = !!(dateRange?.from && dateRange?.to);

  return (
    <CartContext.Provider value={{ dateRange, setDateRange, isDateSelected, isLoadingCartGlobal, refreshGlobalDate, cartItemCount, cartItems }}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook agar panggilnya gampang di komponen lain
export function useCartGlobal() {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error('useCartGlobal harus digunakan di dalam CartProvider');
  }
  return context;
}