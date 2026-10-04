'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, Info, AlertCircle, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  hideCancel?: boolean;
}

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Yakin', 
  cancelText = 'Batal',
  type = 'danger',
  hideCancel = false
}: ConfirmModalProps) {
  const [render, setRender] = useState(false);

  // Smooth unmount effect
  useEffect(() => {
    if (isOpen) setRender(true);
    else {
      const timeout = setTimeout(() => setRender(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!render) return null;

  const IconComponent = type === 'danger' ? Trash2 : type === 'warning' ? AlertTriangle : Info;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-zinc-900/60 backdrop-blur-md transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onCancel}
      />
      
      {/* Modal Content */}
      <div className={`relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl flex flex-col p-6 sm:p-8 border border-white/40 overflow-hidden transform transition-all duration-200 ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
        
        {/* Dekorasi Latar Belakang (Glow) */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
          type === 'danger' ? 'bg-red-500' : type === 'warning' ? 'bg-orange-500' : 'bg-brand-accent'
        }`} />

        <div className="flex justify-between items-start mb-5 relative z-10">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
            type === 'danger' ? 'bg-red-50 text-red-500 ring-4 ring-red-50/50' : 
            type === 'warning' ? 'bg-orange-50 text-orange-500 ring-4 ring-orange-50/50' : 
            'bg-brand-accent/10 text-brand-accent ring-4 ring-brand-accent/10'
          }`}>
            <IconComponent className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-900 transition-colors p-2 -mr-2 bg-zinc-50 hover:bg-zinc-100 rounded-full">
            <X className="w-4 h-4" strokeWidth={3} />
          </button>
        </div>

        <div className="relative z-10">
          <h3 className="text-xl font-black text-zinc-900 tracking-tight mb-2 leading-tight">{title}</h3>
          <p className="text-sm text-zinc-500 mb-8 leading-relaxed font-medium">{message}</p>
        </div>

        <div className="flex gap-3 relative z-10 mt-auto">
          {!hideCancel && (
            <button onClick={onCancel} className="flex-1 px-4 py-3.5 rounded-2xl font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 hover:text-zinc-900 transition-all active:scale-95">
              {cancelText}
            </button>
          )}
          <button onClick={() => { onConfirm(); onCancel(); }} className={`flex-1 px-4 py-3.5 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${
            type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/25' : 
            type === 'warning' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25' : 
            'bg-brand-accent hover:bg-orange-600 shadow-brand-accent/25'
          }`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
