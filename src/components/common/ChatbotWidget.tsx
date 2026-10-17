'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, RefreshCw } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { getOrCreateSessionId } from '@/src/lib/session';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

const STORAGE_KEY = 'twentyone_chat_history';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false); // To prevent hydration mismatch with localStorage

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // URL webhook n8n (Udah di-set ke lokal n8n untuk testing)
  const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '';

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    // Load chat history from local storage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed);
      } catch (e) {
        console.error("Failed to parse chat history");
        setMessages(getInitialMessages());
      }
    } else {
      setMessages(getInitialMessages());
    }
  }, []);

  // Save to local storage whenever messages change
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, isClient]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const getInitialMessages = (): ChatMessage[] => [
    {
      id: 'init-1',
      text: 'Halo! Saya asisten virtual TwentyOne Outdoor. Ada yang bisa saya bantu terkait sewa alat, jadwal, atau informasi lainnya?',
      sender: 'bot',
      timestamp: Date.now(),
    }
  ];

  const clearHistory = () => {
    if (confirm('Apakah Anda yakin ingin menghapus riwayat obrolan?')) {
      const initMsgs = getInitialMessages();
      setMessages(initMsgs);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initMsgs));
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      text: inputValue.trim(),
      sender: 'user',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Simulasi delay jaringan (hapus ini saat menembak ke n8n sungguhan)
      if (!N8N_WEBHOOK_URL) {
        await new Promise(res => setTimeout(res, 1500));
        const botReply: ChatMessage = {
          id: `bot-${Date.now()}`,
          text: 'Maaf, webhook n8n belum terhubung. Silakan atur NEXT_PUBLIC_N8N_WEBHOOK_URL di environment variables Anda.',
          sender: 'bot',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, botReply]);
      } else {
        const sessionId = getOrCreateSessionId();

        // Tembak ke n8n dengan sessionId yang sama dengan Cart/Customer
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            message: userMsg.text,
            timestamp: userMsg.timestamp
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`HTTP ${response.status}: ${response.statusText}. URL: ${N8N_WEBHOOK_URL}. Body: ${errText}`);
        }

        const data = await response.json();
        
        // Handle kalo n8n me-return array (n8n biasanya me-return array of objects)
        const responseObj = Array.isArray(data) ? data[0] : data;

        const botReply: ChatMessage = {
          id: `bot-${Date.now()}`,
          text: responseObj.reply || responseObj.output || responseObj.message || 'Saya tidak mengerti format balasan sistem.',
          sender: 'bot',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, botReply]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorReply: ChatMessage = {
        id: `err-${Date.now()}`,
        text: 'Maaf, layanan chat sedang mengalami gangguan. Silakan coba beberapa saat lagi.',
        sender: 'bot',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormattedText = (text: string) => {
    let cleanText = text;

    // 1. Bongkar format tabel Markdown (| Langkah | Rincian |) jika AI n8n menghasilkan tabel
    if (cleanText.includes('|')) {
      // Pisahkan baris tabel yang dempetan '| |'
      cleanText = cleanText.replace(/\|\s*\|/g, '|\n|');
      // Hapus header tabel dan garis pemisah seperti | Langkah | Rincian | dan |---|---|
      cleanText = cleanText.replace(/\|[^|\n]+\|[^|\n]+\|\s*\|[\s\-:|]+\|/gi, '\n\n');
      // Konversi baris tabel '| Kolom 1 | Kolom 2 |' menjadi baris vertikal
      cleanText = cleanText.replace(/\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|/g, (match, col1, col2) => {
        return `\n\n${col1.trim()}\n${col2.trim()}`;
      });
      // Bersihkan sisa karakter pipa '|'
      cleanText = cleanText.replace(/\|\s*/g, ' ');
    }

    // 2. Bersihkan dan konversi tag HTML umum dari n8n menjadi format teks rapi
    cleanText = cleanText
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(ul|ol)>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/?p>/gi, '\n')
      .replace(/<\/?(strong|b)>/gi, '**')
      .replace(/<[^>]+>/g, '') // Hapus tag sisa jika ada
      .trim();

    // 3. Otomatis beri baris baru jika nomor list (1., 2., dst) nempel langsung tanpa enter
    cleanText = cleanText.replace(/([^\n])\s+(\d+\.\s+(?:\*\*|[A-Z]))/g, '$1\n\n$2');

    // 4. Otomatis beri baris baru jika bullet list (- atau •) nempel tanpa enter
    cleanText = cleanText.replace(/([^\n])\s+([•\-\*]\s+(?:\*\*|[A-Z]))/g, '$1\n$2');

    // 5. Batasi maksimal 2 newline berturut-turut
    cleanText = cleanText.replace(/\n{3,}/g, '\n\n');

    // 6. Render teks dengan dukungan **bold**
    const parts = cleanText.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-zinc-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isClient) return null; // Avoid hydration mismatch

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">

      {/* CHAT WINDOW */}
      <div
        className={`bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 transform origin-bottom-right flex flex-col border border-zinc-200/80 pointer-events-auto
          ${isOpen ? 'scale-100 opacity-100 mb-4' : 'scale-0 opacity-0 h-0 w-0 mb-0 pointer-events-none'}
          sm:w-[380px] sm:h-[600px] w-[calc(100vw-2rem)] h-[calc(100vh-8rem)]
        `}
      >
        {/* Header */}
        <div className="bg-brand-dark px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
              <Bot className="w-5 h-5 text-brand-accent" />
            </div>
            <div>
              <h3 className="font-black text-white uppercase tracking-wider text-sm">TwentyOne Bot</h3>
              <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearHistory}
              title="Bersihkan Obrolan"
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 bg-zinc-50/50 flex flex-col gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>

              {/* Avatar Bot */}
              {msg.sender === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-brand-dark/5 flex items-center justify-center shrink-0 mr-3 border border-zinc-200 mt-1">
                  <Bot className="w-4 h-4 text-brand-dark" />
                </div>
              )}

              <div className={`max-w-[80%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${msg.sender === 'user'
                    ? 'bg-brand-dark text-white rounded-2xl rounded-tr-sm shadow-md'
                    : 'bg-white text-zinc-800 rounded-2xl rounded-tl-sm shadow-sm border border-zinc-200'
                    }`}
                >
                  {renderFormattedText(msg.text)}
                </div>
                <span className="text-[10px] text-zinc-400 font-medium mt-1 px-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>

            </div>
          ))}

          {/* Loading Indicator Indicator */}
          {isLoading && (
            <div className="flex w-full justify-start">
              <div className="w-8 h-8 rounded-full bg-brand-dark/5 flex items-center justify-center shrink-0 mr-3 border border-zinc-200 mt-1">
                <Bot className="w-4 h-4 text-brand-dark" />
              </div>
              <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm border border-zinc-200 flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-white border-t border-zinc-100 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder="Ketik pertanyaan Anda..."
            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="bg-brand-dark hover:bg-brand-accent text-white p-3 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-dark/10"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 z-50 pointer-events-auto
          ${isOpen ? 'bg-zinc-100 text-zinc-500 rotate-90 scale-90 shadow-none hover:bg-zinc-200' : 'bg-brand-dark text-brand-accent hover:shadow-brand-dark/30'}
        `}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-brand-dark rounded-full"></span>
          </div>
        )}
      </button>

    </div>
  );
}
