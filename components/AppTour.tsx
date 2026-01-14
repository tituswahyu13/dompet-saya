"use client"
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Lightbulb } from 'lucide-react';

interface TourStep {
  id: string;
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const DASHBOARD_STEPS: TourStep[] = [
  {
    id: 'welcome',
    targetId: '',
    title: 'Selamat Datang di Dompet Saya Pro! 🐷✨',
    content: 'Mari berkeliling sejenak untuk mengenal bagaimana aplikasi ini membantu Anda menguasai takdir keuangan Anda.',
    position: 'center'
  },
  {
    id: 'theme',
    targetId: 'tour-theme',
    title: 'Tema Visual',
    content: 'Sesuaikan kenyamanan mata Anda dengan beralih antara Mode Gelap (Pro) yang mewah atau Mode Terang yang bersih.',
    position: 'bottom'
  },
  {
    id: 'notifications',
    targetId: 'tour-notifications',
    title: 'Pusat Notifikasi',
    content: 'Dapatkan peringatan jika pengeluaran melebihi budget atau ada transaksi berulang yang perlu diproses.',
    position: 'bottom'
  },
  {
    id: 'actions',
    targetId: 'tour-actions',
    title: 'Kendali Cepat',
    content: 'Kelola semua Dompet/Rekening dan Target Keuangan Anda secara terpusat melalui baris menu ini.',
    position: 'bottom'
  },
  {
    id: 'balance',
    targetId: 'tour-balance',
    title: 'Monitor Arus Kas',
    content: 'Lihat ringkasan Saldo, Pemasukan, dan Pengeluaran Anda secara instan. Gunakan toggle "Mode Aset" untuk melihat total kekayaan Anda.',
    position: 'bottom'
  },
  {
    id: 'wallets',
    targetId: 'tour-wallets',
    title: 'Arsitektur Wallet',
    content: 'Atur semua akun bank, dompet digital, dan investasi Anda di sini. Berikan warna unik untuk setiap kategori!',
    position: 'top'
  },
  {
    id: 'goals',
    targetId: 'tour-goals',
    title: 'Target Keuangan',
    content: 'Wujudkan impian Anda dengan fitur Target. Hubungkan target ke wallet tertentu untuk pelacakan otomatis.',
    position: 'top'
  },
  {
    id: 'intelligence',
    targetId: 'tour-intelligence',
    title: 'Data Intelligence',
    content: 'Visualisasikan tren keuangan Anda dengan grafik canggih. Pelajari pola pengeluaran bulanan Anda di sini.',
    position: 'top'
  },
  {
    id: 'ai',
    targetId: 'tour-ai',
    title: 'AI Insights',
    content: 'Teknologi AI kami akan menganalisis data Anda untuk memberikan saran penghematan dan prediksi saldo di masa depan.',
    position: 'top'
  },
  {
    id: 'budget',
    targetId: 'tour-budget',
    title: 'Analisis Anggaran',
    content: 'Monitor sisa dana Anda di berbagai kategori pengeluaran secara visual agar tidak "boncos" di akhir bulan.',
    position: 'top'
  },
  {
    id: 'ledger',
    targetId: 'tour-ledger',
    title: 'Cloud Ledger',
    content: 'Catatan ringkasan transaksi terbaru Anda. Klik "Lihat Semua" untuk masuk ke manajemen transaksi yang lebih lengkap.',
    position: 'top'
  },
  {
    id: 'goto-transactions',
    targetId: 'tour-goto-transactions',
    title: 'Pusat Kendali Ledger',
    content: 'Ingin mengelola data lebih detail? Klik di sini untuk masuk ke halaman Ledger lengkap dengan fitur filter dan ekspor.',
    position: 'top'
  }
];

const TRANSACTION_STEPS: TourStep[] = [
  {
    id: 'tx-welcome',
    targetId: '',
    title: 'Manajemen Transaksi 📝',
    content: 'Selamat datang di pusat kendali data. Di sini Anda bisa mengelola setiap rupiah yang masuk dan keluar dengan detail.',
    position: 'center'
  },
  {
    id: 'tx-recurring',
    targetId: 'tour-tx-recurring',
    title: 'Mesin Transaksi Otomatis',
    content: 'Buat template untuk transaksi rutin seperti tagihan bulanan atau tabungan otomatis agar Anda tidak perlu mencatat manual setiap saat.',
    position: 'bottom'
  },
  {
    id: 'tx-form',
    targetId: 'tour-tx-form',
    title: 'Input Transaksi Pintar',
    content: 'Gunakan form ini untuk mencatat pengeluaran atau pemasukan baru. Anda juga bisa mengoreksi data yang sudah ada di sini.',
    position: 'bottom'
  },
  {
    id: 'tx-mode',
    targetId: 'tour-tx-mode',
    title: 'Mode Transfer',
    content: 'Butuh memindahkan uang antar rekening? Klik tombol ini untuk beralih ke form Transfer antar dompet.',
    position: 'bottom'
  },
  {
    id: 'tx-filters',
    targetId: 'tour-tx-filters',
    title: 'Penyaringan Data',
    content: 'Cari transaksi spesifik dengan mudah menggunakan filter bulan, tahun, atau fitur pencarian teks.',
    position: 'bottom'
  },
  {
    id: 'tx-export',
    targetId: 'tour-tx-export',
    title: 'Ekspor CSV',
    content: 'Unduh semua riwayat transaksi Anda dalam format CSV untuk keperluan audit atau analisis di Excel/Sheets.',
    position: 'bottom'
  },
  {
    id: 'tx-list',
    targetId: 'tour-tx-list',
    title: 'Cloud Ledger Table',
    content: 'Daftar transaksi lengkap Anda. Untuk pengguna Pro, Anda bisa melihat seluruh riwayat tanpa batas waktu.',
    position: 'top'
  }
];

export default function AppTour({ isDark }: { isDark: boolean }) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [steps, setSteps] = useState<TourStep[]>([]);

  useEffect(() => {
    const isTransactionPage = window.location.pathname === '/transactions';
    const currentSteps = isTransactionPage ? TRANSACTION_STEPS : DASHBOARD_STEPS;
    setSteps(currentSteps);

    const hasSeenTour = localStorage.getItem(`hasSeenTour_${isTransactionPage ? 'tx' : 'dash'}`);
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setCurrentStep(0);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const updateRect = () => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const step = steps[currentStep];
      if (step.targetId) {
        const el = document.getElementById(step.targetId);
        if (el) {
          setTargetRect(el.getBoundingClientRect());
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    if (isVisible) {
      window.addEventListener('resize', updateRect);
      window.addEventListener('scroll', updateRect, true);
      updateRect();
    }
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isVisible, currentStep, steps]);

  useEffect(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const step = steps[currentStep];
      if (step.targetId) {
        const el = document.getElementById(step.targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const timer = setTimeout(updateRect, 600);
          return () => clearTimeout(timer);
        }
      } else {
        setTargetRect(null);
      }
    }
  }, [currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setCurrentStep(-1);
    const isTransactionPage = window.location.pathname === '/transactions';
    localStorage.setItem(`hasSeenTour_${isTransactionPage ? 'tx' : 'dash'}`, 'true');
  };

  const startTourManual = () => {
    setIsVisible(true);
    setCurrentStep(0);
  };

  if (!isVisible || currentStep === -1) {
    return (
      <button
        onClick={startTourManual}
        className={`fixed bottom-24 right-6 z-[90] w-12 h-12 rounded-full flex items-center justify-center transition-all bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/40 hover:scale-110 active:scale-95 group sm:bottom-8`}
        title="Bantuan Navigasi"
      >
        <Lightbulb size={24} className="group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[300] pointer-events-none">
      {/* Backdrop with Hole */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto transition-all duration-300"
        onClick={handleClose}
        style={{
          position: 'fixed',
          clipPath: targetRect 
            ? `polygon(0% 0%, 0% 100%, ${targetRect.left}px 100%, ${targetRect.left}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.bottom}px, ${targetRect.left}px 100%, 100% 100%, 100% 0%)`
            : 'none'
        }}
      />

      {/* Tooltip Content */}
      <div 
        className={`fixed pointer-events-auto transition-all duration-300 ease-out p-4 ${
          !targetRect ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm' : ''
        }`}
        style={targetRect ? {
          top: (() => {
            const viewportHeight = window.innerHeight;
            const tooltipHeight = window.innerWidth < 640 ? 260 : 220;
            const gap = 12;
            
            if (step.position === 'bottom') {
              const pos = targetRect.bottom + gap;
              // If too close to bottom, try to push up
              if (pos + tooltipHeight > viewportHeight - 80) { // 80px for mobile nav
                return Math.max(20, targetRect.top - tooltipHeight - gap);
              }
              return pos;
            } else if (step.position === 'top') {
              const pos = targetRect.top - tooltipHeight - gap;
              // If too close to top, push down
              if (pos < 20) {
                return targetRect.bottom + gap;
              }
              return pos;
            }
            return targetRect.top;
          })(),
          left: window.innerWidth < 640 
            ? '50%' 
            : Math.max(180, Math.min(window.innerWidth - 180, targetRect.left + (targetRect.width / 2))),
          transform: 'translateX(-50%)',
          width: window.innerWidth < 640 ? 'calc(100vw - 32px)' : '320px',
          maxWidth: '320px',
          zIndex: 310
        } : {}}
      >
        <div className={`p-5 sm:p-6 rounded-[1.8rem] sm:rounded-[2rem] border shadow-2xl ${
          isDark ? 'bg-slate-900 border-white/10 shadow-black' : 'bg-white border-slate-200 shadow-slate-200/50'
        }`}
        style={{
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }}>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500">
              <Sparkles size={20} />
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-slate-500/10 rounded-lg transition-colors">
              <X size={16} className="text-slate-400" />
            </button>
          </div>

          <h3 className={`text-lg font-black uppercase tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {step?.title}
          </h3>
          <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {step?.content}
          </p>

          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {currentStep + 1} / {steps.length}
            </p>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button 
                  onClick={handlePrev}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    isDark ? 'border-white/5 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <ChevronLeft size={14} className="inline mr-1" /> Prev
                </button>
              )}
              <button 
                onClick={handleNext}
                className="px-6 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? 'Selesai' : 'Lanjut'} <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
