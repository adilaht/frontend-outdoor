// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/src/components/common/Navbar";
import Footer from "@/src/components/common/Footer";
import ChatbotWidget from "@/src/components/common/ChatbotWidget";
import { CartProvider } from "../context/CartContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TwentyOne Outdoor - Rental Alat Outdoor Berkualitas",
  description: "Sewa alat camping dan gunung mudah tanpa ribet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen flex flex-col`}>
       {/* 🌟 BUNGKUS DI SINI: Semua komponen di dalamnya sekarang punya akses state global */}
        <CartProvider>
          <Navbar />
          
          {/* main grow agar footer selalu di bawah jika konten sedikit */}
          <main className="flex-grow">
            {children}
          </main>
          
          <Footer />
          <ChatbotWidget />
        </CartProvider>
      </body>
    </html>
  );
}