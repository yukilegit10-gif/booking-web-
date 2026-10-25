'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, isDemoMode } from '@/lib/api';
import { DEMO_PASSWORD, listDemoUsers } from '@/lib/api/demo';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';
import { LogIn, Loader2, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.signIn(email, password);
      toast('Đăng nhập thành công!', 'success');
      refresh();
      router.push('/');
    } catch (err: any) {
      toast(err.message || 'Lỗi đăng nhập', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setPassword(DEMO_PASSWORD);
    setLoading(true);
    try {
      await api.signIn(userEmail, DEMO_PASSWORD);
      toast(`Đã đăng nhập với tài khoản ${userEmail}`, 'success');
      refresh();
      router.push('/');
    } catch (err: any) {
      toast(err.message || 'Lỗi đăng nhập', 'error');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = isDemoMode ? listDemoUsers() : [];

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="card p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 text-[#0F3D6E] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Đăng Nhập SOM HUIT</h1>
          <p className="text-xs text-slate-500 mt-1">
            Nền tảng Chợ đồ cũ & Việc vặt an toàn cho sinh viên HUIT
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label text-xs">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhap.email@som.huit"
              className="input text-xs sm:text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label text-xs mb-0">Mật khẩu</label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input text-xs sm:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-blue py-2.5 text-xs sm:text-sm font-bold shadow-sm active:scale-95 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đăng nhập'}
          </button>
        </form>

        {/* Demo Quick Logins */}
        {isDemoMode && demoAccounts.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Đăng nhập nhanh 1-chạm để test:</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Mật khẩu mặc định là <code>{DEMO_PASSWORD}</code>. Bấm vào tài khoản bất kỳ để test:
            </p>

            <div className="space-y-1.5">
              {demoAccounts.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u.email!)}
                  className="w-full text-left p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between text-xs transition cursor-pointer"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 block truncate">{u.full_name}</span>
                    <span className="text-[10px] text-slate-500">{u.faculty} • {u.karma_points}K</span>
                  </div>
                  {u.is_verified ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Đã duyệt
                    </span>
                  ) : u.verification_status === 'pending' ? (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                      Chờ duyệt
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-slate-500">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-[#0F3D6E] font-bold hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
