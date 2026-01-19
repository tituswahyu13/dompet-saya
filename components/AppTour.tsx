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
    content: 'Mari berkeliling sejenak untuk mengenal fitur-fitur tercanggih yang akan membantu Anda menguasai keuangan pribadi.',
    position: 'center'
  },
  {
    id: 'theme',
    targetId: 'tour-theme',
    title: 'Personalisasi Visual',
    content: 'Pilih antara Mode Gelap (Pro) yang elegan atau Mode Terang yang bersih sesuai kenyamanan Anda.',
    position: 'bottom'
  },
  {
    id: 'notifications',
    targetId: 'tour-notifications',
    title: 'Pusat Komando Notifikasi',
    content: 'Pantau pengeluaran budget, target impian, dan tagihan rutin Anda di sini. Jangan biarkan ada transaksi yang terlewat!',
    position: 'bottom'
  },
  {
    id: 'balance',
    targetId: 'tour-balance',
    title: 'Dashboard Keuangan Utama',
    content: 'Monitor total saldo, pemasukan, dan pengeluaran Anda. Gunakan tombol "Mode Aset" untuk melihat kekayaan likuid atau total aset.',
    position: 'bottom'
  },
  {
    id: 'saving',
    targetId: 'tour-saving',
    title: 'Lacak Tabungan & Investasi',
    content: 'Kartu biru ini merangkum seluruh dana yang Anda alokasikan ke produk investasi. Semua transaksi "Simpan" akan terkumpul di sini.',
    position: 'bottom'
  },
  {
    id: 'wallets',
    targetId: 'tour-wallets',
    title: 'Manajemen Dompet & Sync',
    content: 'Atur semua rekening bank dan e-wallet Anda. Sekarang Anda bisa melakukan "Sync Saldo" untuk menyamakan saldo aplikasi dengan uang nyata.',
    position: 'top'
  },
  {
    id: 'intelligence',
    targetId: 'tour-intelligence',
    title: 'Analisis Kecerdasan AI',
    content: 'Visualisasikan tren pengeluaran Anda dengan grafik interaktif dan biarkan AI memberikan saran penghematan terbaik untuk Anda.',
    position: 'top'
  },
  {
    id: 'ledger',
    targetId: 'tour-ledger',
    title: 'Cloud Ledger Terbaru',
    content: 'Daftar transaksi terakhir Anda. Segala aktivitas masuk, keluar, maupun simpan akan tercatat rapi di sini.',
    position: 'top'
  },
  {
    id: 'goto-transactions',
    targetId: 'tour-goto-transactions',
    title: 'Kendali Penuh Transaksi',
    content: 'Ingin mengelola data lebih detail? Klik "Lihat Semua" untuk masuk ke halaman manajemen transaksi yang lebih lengkap.',
    position: 'top'
  }
];

const TRANSACTION_STEPS: TourStep[] = [
  {
    id: 'tx-welcome',
    targetId: '',
    title: 'Buku Besar Cloud 📝',
    content: 'Selamat datang di pusat kendali data. Di sini Anda bisa mengelola setiap transaksi dengan akurasi maksimal.',
    position: 'center'
  },
  {
    id: 'tx-form',
    targetId: 'tour-tx-form',
    title: 'Form Transaksi Pintar',
    content: 'Gunakan mode "Simpan" (Biru) untuk mencatat tabungan. Sekarang, setiap tabungan wajib memiliki wallet asal untuk memotong saldo secara otomatis.',
    position: 'right'
  },
  {
    id: 'tx-mode',
    targetId: 'tour-tx-mode',
    title: 'Beralih ke Transfer',
    content: 'Gunakan tombol ini jika Anda hanya ingin memindahkan uang antar rekening tanpa mencatat sebagai pengeluaran atau tabungan.',
    position: 'bottom'
  },
  {
    id: 'tx-list',
    targetId: 'tour-tx-list',
    title: 'Kontrol Transaksi Cepat',
    content: 'Tombol Edit dan Hapus kini selalu terlihat untuk memudahkan Anda mengelola data tanpa perlu repot mengarahkan kursor.',
    position: 'top'
  },
  {
    id: 'tx-recurring',
    targetId: 'tour-tx-recurring',
    title: 'Penjadwalan Rutin',
    content: 'Otomatisasi transaksi bulanan Anda di sini. Hemat waktu dengan membiarkan sistem mencatat pengeluaran rutin Anda.',
    position: 'bottom'
  },
  {
    id: 'tx-export',
    targetId: 'tour-tx-export',
    title: 'Ekspor Data CSV',
    content: 'Butuh data untuk Excel atau Sheets? Klik di sini untuk mengunduh laporan transaksi lengkap Anda kapan saja.',
    position: 'bottom'
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
            ? `polygon(0% 0%, 0% 100%, ${targetRect.left - 8}px 100%, ${targetRect.left - 8}px ${targetRect.top - 8}px, ${targetRect.right + 8}px ${targetRect.top - 8}px, ${targetRect.right + 8}px ${targetRect.bottom + 8}px, ${targetRect.left - 8}px ${targetRect.bottom + 8}px, ${targetRect.left - 8}px 100%, 100% 100%, 100% 0%)`
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
            const gap = 20;
            
            if (step.position === 'bottom') {
              const pos = targetRect.bottom + gap;
              if (pos + tooltipHeight > viewportHeight - 80) {
                return Math.max(20, targetRect.top - tooltipHeight - gap);
              }
              return pos;
            } else if (step.position === 'top') {
              const pos = targetRect.top - tooltipHeight - gap;
              if (pos < 20) {
                return targetRect.bottom + gap;
              }
              return pos;
            } else if (step.position === 'right') {
                return targetRect.top;
            }
            return targetRect.top;
          })(),
          left: (() => {
            if (window.innerWidth < 640) return '50%';
            if (step.position === 'right') return targetRect.right + 340 > window.innerWidth ? targetRect.left - 20 : targetRect.right + 20;
            return Math.max(180, Math.min(window.innerWidth - 180, targetRect.left + (targetRect.width / 2)));
          })(),
          transform: window.innerWidth < 640 ? 'translateX(-50%)' : (step.position === 'right' && targetRect.right + 340 > window.innerWidth ? 'translateX(-100%)' : (step.position === 'right' ? 'none' : 'translateX(-50%)')),
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
            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 shadow-inner">
              <Sparkles size={20} />
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-slate-500/10 rounded-lg transition-colors group">
              <X size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
            </button>
          </div>

          <h3 className={`text-lg font-black uppercase tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {step?.title}
          </h3>
          <p className={`text-sm leading-relaxed mb-6 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {step?.content}
          </p>

          <div className="flex justify-between items-center">
            <div className="flex gap-1">
                {steps.map((_, i) => (
                    <div key={i} className={`w-1 h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-4 bg-rose-500' : 'bg-slate-300'}`} />
                ))}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button 
                  onClick={handlePrev}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    isDark ? 'border-white/5 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                   Kembali
                </button>
              )}
              <button 
                onClick={handleNext}
                className="px-6 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transition-all flex items-center gap-2 active:scale-95"
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
