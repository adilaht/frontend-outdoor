'use client';

import * as React from 'react';
import Script from 'next/script';
import StepDataPenyewa from '@/src/components/checkout/StepDataPenyewa';
import { Check, User, Mail, CreditCard } from 'lucide-react';
import StepOTP from '@/src/components/checkout/StepOTP';
import StepPayment from '@/src/components/checkout/StepPayment';

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = React.useState<1 | 2 | 3>(1);
  const [bookingId, setBookingId] = React.useState<string | null>(null);
  const [userEmail, setUserEmail] = React.useState<string>("");
  const [snapToken, setSnapToken] = React.useState<string | null>(null);
  const [totalPrice, setTotalPrice] = React.useState<number>(0); // 🌟 1. Tambah state penampung harga

  const steps = [
    { id: 1, name: 'Data Penyewa', icon: User },
    { id: 2, name: 'Verifikasi OTP', icon: Mail },
    { id: 3, name: 'Pembayaran', icon: CreditCard },
  ];

  return (
    <>
      <Script 
        src="https://app.sandbox.midtrans.com/snap/snap.js" 
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />

      {/* ✨ PUSAT PERUBAHAN: Background halaman jadi light-mode elegan (brand-mist) */}
      <div className="min-h-screen bg-brand-mist text-zinc-800 pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-10">
          
          {/* Header Title Checkout */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-brand-dark">Selesaikan Pesanan</h1>
            <p className="text-sm text-zinc-500 font-medium tracking-wide">3 langkah mudah untuk amankan peralatan petualangan Anda.</p>
          </div>

          {/* 🌟 PROGRESS INDICATOR FLOATING MINIMALIST */}
          <div className="relative max-w-lg mx-auto mt-8 mb-4">
            
            {/* Garis Penghubung Belakang */}
            <div className="absolute left-8 right-8 sm:left-12 sm:right-12 top-6 sm:top-7 -translate-y-1/2 h-1 bg-zinc-200 rounded-full z-0" />
            
            {/* Garis Progress yang Aktif */}
            <div 
              className="absolute left-8 sm:left-12 top-6 sm:top-7 -translate-y-1/2 h-1 bg-brand-dark transition-all duration-700 ease-out rounded-full z-0" 
              style={{ width: `calc(${((currentStep - 1) / (steps.length - 1)) * 100}% - 48px)` }}
            />

            <div className="relative flex items-start justify-between z-10">
              {steps.map((step) => {
                const Icon = step.icon;
                const isCompleted = currentStep > step.id;
                const isActive = currentStep === step.id;

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center group w-1/3">
                    
                    {/* Circle Icon Container */}
                    <div 
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-md ${
                        isCompleted 
                          ? 'bg-brand-dark text-white border-4 border-brand-mist shadow-brand-dark/20' 
                          : isActive
                          ? 'bg-brand-accent text-white border-4 border-brand-mist ring-4 ring-brand-accent/20 scale-110 shadow-xl'
                          : 'bg-white border-2 border-zinc-200 text-zinc-300'
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" /> : <Icon className="w-5 h-5 sm:w-5 sm:h-5" />}
                    </div>
                    
                    {/* Text Container */}
                    <div className={`mt-4 sm:mt-5 flex flex-col items-center text-center transition-all duration-300 ${
                        isActive ? 'scale-105' : ''
                      }`}>
                      <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest ${
                        isActive ? 'text-brand-accent' : isCompleted ? 'text-brand-dark' : 'text-zinc-400'
                      }`}>
                        Langkah {step.id}
                      </span>
                      <span className={`text-xs sm:text-sm font-bold mt-1 ${
                        isActive ? 'text-zinc-900' : isCompleted ? 'text-zinc-700' : 'text-zinc-400'
                      }`}>
                        {step.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🌟 RENDER FORM STEP (Wrapper Premium) */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-b from-zinc-200/50 to-transparent blur-2xl opacity-50 -z-10 rounded-[3rem]" />
            {currentStep === 1 && (
              <StepDataPenyewa 
                onSuccess={(id_booking, email) => {
                  setBookingId(id_booking);
                  setUserEmail(email);
                  setCurrentStep(2);
                }} 
              />
            )}

            {currentStep === 2 && (
              <div className="animate-fadeInUp">
                <StepOTP 
                  email={userEmail}
                  bookingId={bookingId}
                  onSuccess={(tokenMidtrans, hargaFinal) => {
                    setSnapToken(tokenMidtrans);
                    setTotalPrice(hargaFinal); 
                    setCurrentStep(3); 
                  }}
                  onBack={() => setCurrentStep(1)}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="animate-fadeInUp">
                <StepPayment 
                  snapToken={snapToken}
                  totalHarga={totalPrice}              
                  onBack={() => setCurrentStep(2)}
                />            
              </div>
            )}
          </div>

        </div>
      </div>
    </>        
  );
}