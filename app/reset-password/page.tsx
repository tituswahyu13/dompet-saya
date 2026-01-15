"use client"
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark';
    }
    return false;
  });

  useEffect(() => {
    // Handle recovery token from both query params and hash fragment
    const handleRecoveryToken = async () => {
      // Try query params first (newer Supabase format)
      const urlParams = new URLSearchParams(window.location.search);
      let accessToken = urlParams.get('access_token');
      let refreshToken = urlParams.get('refresh_token');
      let type = urlParams.get('type');

      // Fallback to hash fragment (older format)
      if (!accessToken) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        accessToken = hashParams.get('access_token');
        refreshToken = hashParams.get('refresh_token');
        type = hashParams.get('type');
      }

      if (type === 'recovery' && accessToken) {
        // Set the session with the recovery token
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (error) {
          console.error('Session error:', error);
          setMessage({ 
            type: 'error', 
            text: 'Link reset password tidak valid atau sudah kadaluarsa. Silakan request ulang.' 
          });
        } else {
          // Clear the params/hash from URL for cleaner UX
          window.history.replaceState(null, '', window.location.pathname);
          setMessage(null); // Clear any previous error
        }
      } else {
        // Check if user already has valid session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setMessage({ 
            type: 'error', 
            text: 'Link reset password tidak valid atau sudah kadaluarsa. Silakan request ulang.' 
          });
        }
      }
    };

    handleRecoveryToken();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validation
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter' });
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Password tidak cocok' });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage({ 
        type: 'success', 
        text: 'Password berhasil diubah! Anda akan diarahkan ke dashboard...' 
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 relative overflow-hidden ${isDark ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Background Animated Blobs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className={`w-full max-w-md p-10 rounded-[3rem] border transition-all duration-500 ${
        isDark ? 'glass-dark border-white/5 shadow-2xl shadow-black/40' : 'glass border-white shadow-xl shadow-slate-200/50'
      }`}>
        <div className="text-center mb-10">
          <div className="w-40 h-40 bg-white/10 backdrop-blur-md rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-2xl overflow-hidden border-2 border-white/20">
            <img src="/DompetSaya.svg" alt="Dompet Saya Mascot" className="w-32 h-32 object-contain p-2" />
          </div>
          <h2 className={`text-2xl font-black uppercase tracking-[0.2em] ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Buat Password Baru
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
            Pemulihan Akses Keamanan
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-2xl text-xs font-bold uppercase tracking-wider text-center border flex items-center justify-center gap-2 ${
            message.type === 'error' 
              ? 'bg-red-500/10 text-red-500 border-red-500/20' 
              : 'bg-green-500/10 text-green-500 border-green-500/20'
          }`}>
            {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div className="space-y-2">
            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Password Baru
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full p-4 pr-12 rounded-2xl border outline-none transition-all font-bold text-sm ${
                  isDark ? 'bg-slate-900/50 border-white/5 text-white focus:border-rose-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-rose-500/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                  isDark ? 'text-slate-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Konfirmasi Password
            </label>
            <input 
              type={showPassword ? "text" : "password"} 
              required
              placeholder="Ketik ulang password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full p-4 rounded-2xl border outline-none transition-all font-bold text-sm ${
                isDark ? 'bg-slate-900/50 border-white/5 text-white focus:border-rose-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-rose-500/50'
              }`}
            />
          </div>

          {/* Password Strength Indicator */}
          {newPassword && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      newPassword.length >= level * 2
                        ? newPassword.length >= 12
                          ? 'bg-green-500'
                          : newPassword.length >= 8
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-[9px] font-bold uppercase tracking-wider ${
                newPassword.length >= 12
                  ? 'text-green-500'
                  : newPassword.length >= 8
                  ? 'text-yellow-500'
                  : 'text-red-500'
              }`}>
                {newPassword.length >= 12
                  ? '✓ Password Kuat'
                  : newPassword.length >= 8
                  ? '⚠ Password Sedang'
                  : '⚠ Password Lemah'}
              </p>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Memproses...
              </span>
            ) : 'Update Password'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => router.push('/')}
            className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400 hover:text-rose-400' : 'text-slate-500 hover:text-rose-500'} transition-all`}
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    </div>
  );
}
