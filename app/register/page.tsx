'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { FACULTIES } from '@/lib/constants';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';
import { UserPlus, Loader2, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [faculty, setFaculty] = useState(FACULTIES[0]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || fullName.trim().length < 2) {
      toast('Vui lòng nhập họ tên đầy đủ', 'error');
      return;
    }
    if (password.length < 6) {
      toast('Mật khẩu tối thiểu 6 ký tự', 'error');
      return;
    }
    if (password !== confirmPassword) {
      toast('Mật khẩu nhập lại không khớp', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.signUp({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        faculty,
      });

      if (res.needsEmailConfirm) {
        toast('Đã đăng ký! Vui lòng kiểm tra email để xác nhận tài khoản.', 'success');
      } else {
        toast('Đăng ký tài khoản thành công!', 'success');
        refresh();
        router.push('/profile');
      }
    } catch (err: any) {
      toast(err.message || 'Lỗi khi đăng ký tài khoản', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="card p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-orange-100 text-[#F26522] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Đăng Ký Tài Khoản</h1>
          <p className="text-xs text-slate-500 mt-1">
            Gia nhập cộng đồng chợ sinh viên & việc vặt HUIT
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="label text-xs">Họ và tên sinh viên</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="input text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="label text-xs">Khoa đang theo học</label>
            <select
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              className="input text-xs sm:text-sm bg-white cursor-pointer"
            >
              {FACULTIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label text-xs">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten.sv@gmail.com hoặc email HUIT"
              className="input text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="label text-xs">Mật khẩu</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="input text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="label text-xs">Nhập lại mật khẩu</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="input text-xs sm:text-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 text-xs sm:text-sm font-bold shadow-sm active:scale-95 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo tài khoản'}
            </button>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-[#0F3D6E] font-bold hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
