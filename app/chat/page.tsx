'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Ticket } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { formatPrice, timeAgo } from '@/lib/utils';
import {
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Clock,
  PackageOpen,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export default function ChatListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .listMyTickets()
      .then(setTickets)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user && !loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800 mb-1">Đăng nhập để xem tin nhắn</h2>
        <p className="text-xs text-slate-500 mb-5">
          Bạn cần đăng nhập tài khoản sinh viên HUIT để trò chuyện và kết nối.
        </p>
        <Link href="/login" className="btn-blue text-xs">
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Tin Nhắn & Kết Nối
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Trò chuyện trực tiếp, hẹn gặp tại trường và xác nhận Bắt tay uy tín.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-7 h-7 animate-spin text-[#0F3D6E]" />
          <p className="text-xs font-medium">Đang tải cuộc trò chuyện...</p>
        </div>
      ) : tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.map((t) => {
            const isBuyer = user?.id === t.buyer_id;
            const peer = isBuyer ? t.seller : t.buyer;
            const roleLabel = isBuyer ? 'Người bán' : 'Người hỏi';
            const isCompleted = t.status === 'handshake_completed';

            return (
              <Link
                key={t.id}
                href={`/chat/${t.id}`}
                className="card p-4 hover:shadow-md hover:border-blue-200 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Peer Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[#0F3D6E] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {peer?.full_name?.[0]?.toUpperCase() || 'H'}
                    </div>
                    {isCompleted ? (
                      <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5" title="Đã bắt tay">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-900 rounded-full p-0.5" title="Đang trao đổi">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-bold text-sm text-slate-800 truncate group-hover:text-[#0F3D6E] transition-colors">
                        {peer?.full_name || 'Sinh viên HUIT'}
                      </span>
                      {peer?.is_verified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 shrink-0" />
                      )}
                      <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                        {roleLabel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 truncate font-medium">
                      Tin: {t.listing?.title || 'Tin đăng'}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{timeAgo(t.created_at)}</span>
                      <span>•</span>
                      {isCompleted ? (
                        <span className="text-emerald-700 font-semibold">🤝 Đã bắt tay thành công</span>
                      ) : (
                        <span className="text-amber-700 font-medium">Đang trao đổi</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right hidden sm:flex items-center gap-2 text-slate-400 group-hover:text-[#0F3D6E] transition">
                  {t.listing?.price !== undefined && (
                    <span className="text-xs font-bold text-[#F26522] mr-2">
                      {formatPrice(t.listing.price)}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card py-16 px-4 text-center">
          <PackageOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">Chưa có tin nhắn nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            Khi bạn bấm "Nhắn tin" ở một tin đăng bất kỳ, cuộc trò chuyện sẽ xuất hiện tại đây.
          </p>
          <Link href="/" className="btn-blue text-xs sm:text-sm">
            Khám phá Chợ SOM
          </Link>
        </div>
      )}
    </div>
  );
}
