"use client"
import { useState, useEffect } from 'react';

export default function PWAInstallPrompt({ isDark }: { isDark: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show our custom prompt
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    } else {
      console.log('User dismissed the PWA install prompt');
    }
    
    // We've used the prompt, and can't use it again, so clear it
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in slide-in-from-bottom-10 duration-500">
      <div className={`p-6 rounded-[2.5rem] border shadow-2xl flex items-center gap-4 ${
        isDark ? 'glass-dark border-white/10 shadow-black/50' : 'glass border-white shadow-slate-200/50'
      }`}>
        <div className="w-14 h-14 bg-gradient-to-tr from-rose-500 to-pink-600 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg shadow-rose-500/20">
          <img src="/DompetSayaIcon.svg" alt="Logo" className="w-10 h-10 object-contain" />
        </div>
        
        <div className="flex-1">
          <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Install Aplikasi
          </h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Akses keuangan lebih cepat & aman!
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={handleInstall}
            className="px-4 py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/30"
          >
            Instal
          </button>
          <button 
            onClick={() => setShowPrompt(false)}
            className={`text-[8px] font-black uppercase tracking-widest text-center ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
