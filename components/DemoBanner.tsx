'use client';

import { useEffect, useState } from 'react';
import { isDemoMode } from '@/lib/api';
import { DEMO_PASSWORD, listDemoUsers, resetDemo, switchDemoUser } from '@/lib/api/demo';
import { useAuth } from './AuthProvider';
import { useToast } from './Toast';
import { RotateCcw, ShieldAlert, Users } from 'lucide-react';
import Link from 'next/link';

export function DemoBanner() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<ReturnType<typeof listDemoUsers>>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isDemoMode) {
      setUsers(listDemoUsers());
    }
  }, []);

  if (!mounted || !isDemoMode) return null;

  const handleSwitch = (id: string) => {
    switchDemoUser(id);
    refresh();
    const target = users.find((u) => u.id === id);
    toast(`Đã chuyển sang: ${target?.full_name ?? id}`, 'success');
  };

  const handleReset = () => {
    if (confirm('Khôi phục dữ liệu demo mẫu ban đầu?')) {
      resetDemo();
      refresh();
      toast('Đã khôi phục dữ liệu demo', 'success');
    }
  };

  return (
    <div className="bg-amber-500 text-slate-900 border-b border-amber-600 px-3 py-1.5 text-xs font-medium">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-amber-900 text-amber-100 font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wide">
            Chế độ Test Admin
          </span>
          <span className="hidden sm:inline text-amber-950">
            Dữ liệu chạy trực tiếp trên trình duyệt (mở nhiều tab để test chat 2 bên). Mật khẩu: <code>{DEMO_PASSWORD}</code>
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-amber-400/60 rounded-lg px-2 py-1">
            <Users className="w-3.5 h-3.5 text-amber-950" />
            <span className="text-amber-950 font-semibold mr-1">Đổi vai:</span>
            <select
              value={user?.id ?? ''}
              onChange={(e) => handleSwitch(e.target.value)}
              className="bg-white text-slate-800 text-xs rounded border border-amber-600/30 px-1.5 py-0.5 outline-none font-medium cursor-pointer"
            >
              <option value="" disabled>
                Chọn tài khoản...
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.is_verified ? 'Đã duyệt' : u.verification_status === 'pending' ? 'Chờ duyệt' : 'Chưa duyệt'}) - {u.karma_points}K
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/admin"
            className="flex items-center gap-1 bg-slate-900 text-white px-2.5 py-1 rounded-md text-xs font-semibold hover:bg-slate-800 transition"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Duyệt MSSV
          </Link>

          <button
            onClick={handleReset}
            title="Khôi phục lại dữ liệu mẫu"
            className="flex items-center gap-1 bg-white/80 hover:bg-white text-slate-800 px-2 py-1 rounded-md text-xs font-medium transition"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}
