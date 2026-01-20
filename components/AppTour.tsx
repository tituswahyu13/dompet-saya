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
    title: 'Selamat Datang! 🐷✨',
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
    title: 'Komando Notifikasi',
    content: 'Pantau pengeluaran budget, target impian, dan tagihan rutin Anda di sini. Jangan biarkan ada transaksi yang terlewat!',
    position: 'bottom'
  },
  {
    id: 'balance',
    targetId: 'tour-balance',
    title: 'Dashboard Utama',
    content: 'Monitor total saldo, pemasukan, dan pengeluaran Anda. Gunakan "Mode Aset" untuk melihat kekayaan likuid atau total aset.',
    position: 'bottom'
  },
  {
    id: 'saving',
    targetId: 'tour-saving',
    title: 'Tabungan & Investasi',
    content: 'Kartu biru ini merangkum dana alokasi produk investasi. Semua transaksi "Simpan" akan terkumpul di sini.',
    position: 'bottom'
  },
  {
    id: 'wallets',
    targetId: 'tour-wallets',
    title: 'Manajemen Dompet',
    content: 'Atur semua rekening bank dan e-wallet Anda. Gunakan "Sync Saldo" untuk menyamakan saldo aplikasi dengan uang nyata.',
    position: 'top'
  },
  {
    id: 'intelligence',
    targetId: 'tour-intelligence',
    title: 'Analisis Kecerdasan AI',
    content: 'Visualisasikan tren pengeluaran dengan grafik interaktif dan biarkan AI memberikan saran penghematan terbaik.',
    position: 'top'
  },
  {
    id: 'ledger',
    targetId: 'tour-ledger',
    title: 'Cloud Ledger',
    content: 'Daftar transaksi terakhir Anda. Segala aktivitas masuk, keluar, maupun simpan akan tercatat rapi di sini.',
    position: 'top'
  },
  {
    id: 'goto-transactions',
    targetId: 'tour-goto-transactions',
    title: 'Kendali Transaksi',
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
    content: 'Ada 3 mode: Masuk (Hijau) untuk pemasukan, Keluar (Merah) untuk pengeluaran, dan Simpan (Biru) untuk tabungan. Pilih sesuai jenis transaksi Anda.',
    position: 'bottom'
  },
  {
    id: 'tx-mode',
    targetId: 'tour-tx-mode',
    title: 'Beralih ke Transfer',
    content: 'Gunakan tombol ini jika Anda hanya ingin memindahkan uang antar rekening tanpa mencatat sebagai pengeluaran.',
    position: 'bottom'
  },
  {
    id: 'tx-list',
    targetId: 'tour-tx-list',
    title: 'Kontrol Transaksi',
    content: 'Tombol Edit dan Hapus kini selalu terlihat untuk memudahkan Anda mengelola data tanpa perlu hover.',
    position: 'top'
  },
  {
    id: 'tx-recurring',
    targetId: 'tour-tx-recurring',
    title: 'Penjadwalan Rutin',
    content: 'Otomatisasi transaksi bulanan Anda di sini. Hemat waktu dengan membiarkan sistem mencatat pengeluaran rutin.',
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

const ANALYTICS_STEPS: TourStep[] = [
  {
    id: 'an-welcome',
    targetId: '',
    title: 'Pusat Kecerdasan 🧠',
    content: 'Selamat datang di laboratorium finansial Anda. Mari kita lihat bagaimana AI menganalisis kekayaan Anda melalui data.',
    position: 'center'
  },
  {
    id: 'an-header',
    targetId: 'tour-analytics-header',
    title: 'Sorotan Utama',
    content: 'Pantau ringkasan singkat analisis data dan prediksi tren masa depan dari sistem neural kami.',
    position: 'bottom'
  },
  {
    id: 'an-ai',
    targetId: 'tour-analytics-ai',
    title: 'Wawasan Neuro AI',
    content: 'AI kami memproses ribuan data untuk memberikan saran penghematan dan peringatan risiko finansial secara real-time.',
    position: 'top'
  },
  {
    id: 'an-toggle',
    targetId: 'tour-analytics-toggle',
    title: 'Mode Tampilan',
    content: 'Beralih antara visualisasi sederhana atau grafik lanjutan (Advanced) untuk analisis yang lebih mendalam.',
    position: 'bottom'
  },
  {
    id: 'an-visual',
    targetId: 'tour-analytics-visual',
    title: 'Analitik Visual',
    content: 'Pahami distribusi kategori dan tren pengeluaran Anda melalui grafik interaktif yang memanjakan mata.',
    position: 'top'
  }
];

const BUDGETS_STEPS: TourStep[] = [
  {
    id: 'bg-welcome',
    targetId: '',
    title: 'Kendali Pengeluaran 🛡️',
    content: 'Disiplin adalah kunci kekayaan. Mari atur batasan belanja Anda agar target masa depan tetap terjaga.',
    position: 'center'
  },
  {
    id: 'bg-summary',
    targetId: 'tour-budgets-summary',
    title: 'Ringkasan Anggaran',
    content: 'Pantau akumulasi pemasukan, pengeluaran, dan tabungan Anda dalam satu tampilan grid yang bersih.',
    position: 'bottom'
  },
  {
    id: 'bg-tracker',
    targetId: 'tour-budgets-tracker',
    title: 'Pelacak Target',
    content: 'Lihat sisa kuota belanja di setiap kategori. Bar progres akan berubah warna jika Anda mendekati batas limit.',
    position: 'top'
  }
];

const GOALS_STEPS: TourStep[] = [
  {
    id: 'gl-welcome',
    targetId: '',
    title: 'Wujudkan Impian! 🚀',
    content: 'Rumah, Mobil, atau Liburan? Apapun itu, mari buat rencana tabungan yang terukur dan otomatis.',
    position: 'center'
  },
  {
    id: 'gl-add',
    targetId: 'tour-goals-add',
    title: 'Tambah Target Baru',
    content: 'Mulai langkah pertama dengan membuat goal baru. Tentukan nominal, ikon, dan metode menabungnya.',
    position: 'bottom'
  },
  {
    id: 'gl-summary',
    targetId: 'tour-goals-summary',
    title: 'Wealth Building Progress',
    content: 'Monitor seberapa dekat Anda dengan kebebasan finansial melalui persentase agregat seluruh aset impian.',
    position: 'bottom'
  },
  {
    id: 'gl-list',
    targetId: 'tour-goals-list',
    title: 'Daftar Impian',
    content: 'Setiap impian Anda tercatat di sini dengan visualisasi progres yang memotivasi Anda untuk terus menabung.',
    position: 'top'
  }
];

const WALLETS_STEPS: TourStep[] = [
  {
    id: 'wl-welcome',
    targetId: '',
    title: 'Arsitektur Aset 🏛️',
    content: 'Bangun fondasi keuangan Anda. Kelola semua sumber dana mulai dari tunai hingga instrumen investasi.',
    position: 'center'
  },
  {
    id: 'wl-total',
    targetId: 'tour-wallets-total',
    title: 'Kekayaan Terkonsolidasi',
    content: 'Lihat jumlah uang Anda di seluruh platform secara real-time. Tidak perlu lagi menghitung manual satu per satu.',
    position: 'bottom'
  },
  {
    id: 'wl-list',
    targetId: 'tour-wallets-list',
    title: 'Struktur Portofolio',
    content: 'Dompet Anda dikelompokkan berdasarkan jenis (Bank, E-Wallet, Tunai) untuk memudahkan alokasi dana.',
    position: 'bottom'
  },
  {
    id: 'wl-manage',
    targetId: 'tour-wallets-manage',
    title: 'Kelola & Sinkronisasi',
    content: 'Tambah dompet baru atau perbarui saldo dengan fitur sync jika ada perbedaan dengan saldo nyata di rekening Anda.',
    position: 'bottom'
  }
];

export default function AppTour({ isDark }: { isDark: boolean }) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [pageKey, setPageKey] = useState('');
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    let currentSteps = DASHBOARD_STEPS;
    let key = 'dash';

    if (path === '/transactions') { currentSteps = TRANSACTION_STEPS; key = 'tx'; }
    else if (path === '/analytics') { currentSteps = ANALYTICS_STEPS; key = 'an'; }
    else if (path === '/budgets') { currentSteps = BUDGETS_STEPS; key = 'bg'; }
    else if (path === '/goals') { currentSteps = GOALS_STEPS; key = 'gl'; }
    else if (path === '/wallets') { currentSteps = WALLETS_STEPS; key = 'wl'; }

    setSteps(currentSteps);
    setPageKey(key);

    const hasSeenTour = localStorage.getItem(`hasSeenTour_${key}`);
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
    if (dontShowAgain) {
      localStorage.setItem(`hasSeenTour_${pageKey}`, 'true');
    }
  };

  const startTourManual = () => {
    setIsVisible(true);
    setCurrentStep(0);
    setDontShowAgain(false);
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
          !targetRect ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-sm' : ''
        }`}
        style={targetRect ? {
          top: (() => {
            const viewportHeight = window.innerHeight;
            const tooltipHeight = window.innerWidth < 640 ? 320 : 260;
            const gap = 20;
            
            if (step.position === 'bottom') {
              const pos = targetRect.bottom + gap;
              if (pos + tooltipHeight > viewportHeight - 20) {
                return Math.max(20, viewportHeight - tooltipHeight - 20);
              }
              return pos;
            } else if (step.position === 'top') {
              const pos = targetRect.top - tooltipHeight - gap;
              if (pos < 20) {
                return targetRect.bottom + gap;
              }
              return pos;
            }
            return targetRect.top;
          })(),
          left: (() => {
            if (window.innerWidth < 640) return '50%';
            if (step.position === 'right') return targetRect.right + 340 > window.innerWidth ? targetRect.left - 20 : targetRect.right + 20;
            return Math.max(180, Math.min(window.innerWidth - 180, targetRect.left + (targetRect.width / 2)));
          })(),
          transform: window.innerWidth < 640 ? 'translateX(-50%)' : (step.position === 'right' && targetRect.right + 340 > window.innerWidth ? 'translateX(-100%)' : (step.position === 'right' ? 'none' : 'translateX(-50%)')),
          width: window.innerWidth < 640 ? 'calc(100vw - 24px)' : '320px',
          maxWidth: '340px',
          zIndex: 310
        } : {}}
      >
        <div className={`p-4 sm:p-6 rounded-[1.8rem] sm:rounded-[2.5rem] border shadow-2xl relative ${
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

          <h3 className={`text-base sm:text-lg font-black uppercase tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {step?.title}
          </h3>
          <p className={`text-[11px] sm:text-sm leading-relaxed mb-4 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {step?.content}
          </p>

          {/* Don't Show Again Checkbox */}
          <label className={`flex items-center gap-2 mb-4 cursor-pointer group ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <input 
              type="checkbox" 
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-2 border-slate-300 text-rose-500 focus:ring-2 focus:ring-rose-500 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide group-hover:text-rose-500 transition-colors">
              Jangan Tampilkan Lagi
            </span>
          </label>

          <div className="flex justify-between items-center gap-2">
            <div className="flex gap-0.5 sm:gap-1 flex-wrap max-w-[80px] sm:max-w-none">
                {steps.map((_, i) => (
                    <div key={i} className={`w-1 h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-3 sm:w-4 bg-rose-500' : 'bg-slate-300'}`} />
                ))}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {currentStep > 0 && (
                <button 
                  onClick={handlePrev}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all ${
                    isDark ? 'border-white/5 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                   Kembali
                </button>
              )}
              <button 
                onClick={handleNext}
                className="px-4 sm:px-6 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transition-all flex items-center gap-1.5 sm:gap-2 active:scale-95"
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
