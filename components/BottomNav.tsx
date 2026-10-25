'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, MessageSquare, User, ShieldAlert } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { isDemoMode } from '@/lib/api';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = [
    { href: '/', label: 'Trang chủ', icon: Home },
    { href: '/post', label: 'Đăng tin', icon: PlusCircle, highlight: true },
    { href: '/chat', label: 'Tin nhắn', icon: MessageSquare },
    { href: '/profile', label: 'Cá nhân', icon: User },
  ];

  if (isDemoMode) {
    links.push({ href: '/admin', label: 'Duyệt SV', icon: ShieldAlert, highlight: false });
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1 px-2 flex justify-around items-center sm:hidden shadow-lg">
      {links.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        if (item.highlight) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center -mt-4 text-[#F26522] group"
            >
              <div className="w-11 h-11 rounded-full bg-[#F26522] text-white flex items-center justify-center shadow-md group-active:scale-95 transition-transform">
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
              isActive ? 'text-[#0F3D6E] font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
