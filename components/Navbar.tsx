'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './AuthProvider';
import { Award, Plus, MessageSquare, ShieldCheck, User, LogIn } from 'lucide-react';
import { karmaTier } from '@/lib/utils';

export function Navbar() {
  const { user } = useAuth();
  const tier = user ? karmaTier(user.karma_points) : null;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-2.5 flex items-center justify-between shadow-xs">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative h-11 w-28 sm:w-36 flex items-center">
          <Image
            src="/logo-som.png"
            alt="SOM HUIT Logo"
            width={140}
            height={50}
            className="object-contain h-10 w-auto group-hover:scale-105 transition-transform"
            priority
          />
        </div>
        <div className="hidden sm:block border-l border-slate-200 pl-3">
          <span className="font-extrabold text-base tracking-tight text-[#0F3D6E] block leading-none">
            SOM HUIT
          </span>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Việc khó có chợ sinh viên lo</p>
        </div>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
        {user ? (
          <>
            <Link
              href="/profile"
              title="Điểm uy tín Karma"
              className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-200 transition"
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>{user.karma_points} Karma</span>
              {user.is_verified && (
                <span title="Đã xác thực MSSV">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
                </span>
              )}
            </Link>

            <Link
              href="/chat"
              className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
              title="Tin nhắn & Kết nối"
            >
              <MessageSquare className="w-5 h-5 text-slate-700" />
            </Link>

            <Link
              href="/post"
              className="bg-[#F26522] hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Đăng Tin</span>
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-2 pl-1 group"
              title="Trang cá nhân"
            >
              <div className="w-8 h-8 rounded-full bg-[#0F3D6E] text-white font-bold flex items-center justify-center text-xs shadow-xs group-hover:ring-2 group-hover:ring-offset-1 group-hover:ring-[#0F3D6E] transition">
                {user.full_name?.trim() ? user.full_name.trim()[0].toUpperCase() : 'U'}
              </div>
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-slate-100 transition"
            >
              <LogIn className="w-4 h-4" /> Đăng nhập
            </Link>
            <Link
              href="/register"
              className="bg-[#0F3D6E] hover:bg-blue-900 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
