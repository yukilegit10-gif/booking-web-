'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Listing } from '@/lib/types';
import { formatPrice, timeAgo } from '@/lib/utils';
import { categoryEmoji } from '@/lib/constants';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';
import {
  MapPin,
  ShieldCheck,
  MessageSquare,
  Flame,
  ArrowLeft,
  Share2,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [openingChat, setOpeningChat] = useState(false);

  useEffect(() => {
    api
      .getListing(resolvedParams.id)
      .then((data) => {
        setListing(data);
        if (data?.image_urls?.[0]) setSelectedImg(data.image_urls[0]);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  const handleOpenChat = async () => {
    if (!listing) return;
    if (!user) {
      toast('Vui lòng đăng nhập để nhắn tin', 'error');
      router.push('/login');
      return;
    }
    if (user.id === listing.user_id) {
      toast('Đây là tin đăng của bạn', 'error');
      return;
    }

    setOpeningChat(true);
    try {
      const ticketId = await api.openTicket(listing.id);
      router.push(`/chat/${ticketId}`);
    } catch (err: any) {
      toast(err.message || 'Không thể tạo cuộc trò chuyện', 'error');
    } finally {
      setOpeningChat(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: listing?.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast('Đã copy đường dẫn tin!', 'success');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F3D6E]" />
        <p className="text-sm font-medium">Đang tải thông tin tin đăng...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy tin đăng</h2>
        <p className="text-sm text-slate-500 mb-6">Tin đăng có thể đã bị xóa hoặc đã hoàn tất.</p>
        <Link href="/" className="btn-blue text-xs sm:text-sm">
          <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === listing.user_id;
  const emoji = categoryEmoji(listing.type, listing.category);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Back & share buttons */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </Link>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs transition"
        >
          <Share2 className="w-4 h-4" /> Chia sẻ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Images & Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="card overflow-hidden">
            <div className="relative aspect-16/10 bg-slate-900/5 flex items-center justify-center overflow-hidden">
              {selectedImg ? (
                <img
                  src={selectedImg}
                  alt={listing.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-8 text-slate-400">
                  <span className="text-5xl block mb-2">{emoji}</span>
                  <span className="text-xs font-medium">Người đăng không đính kèm hình ảnh</span>
                </div>
              )}

              {listing.is_urgent && (
                <span className="absolute top-3 left-3 bg-[#F26522] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-white" /> Việc gấp SOS
                </span>
              )}
            </div>

            {/* Thumbnail selector */}
            {listing.image_urls && listing.image_urls.length > 1 && (
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2 overflow-x-auto">
                {listing.image_urls.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImg(url)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition ${
                      selectedImg === url ? 'border-[#F26522]' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details & Description */}
          <div className="card p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs font-semibold text-[#0F3D6E] bg-blue-50 px-2.5 py-1 rounded-md">
                {emoji} {listing.category}
              </span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                {listing.type === 'goods' ? 'Chợ Đồ Cũ' : 'Việc Vặt'}
              </span>
              {listing.condition_status && (
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                  {listing.condition_status}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 leading-snug">
              {listing.title}
            </h1>

            <div className="text-2xl font-extrabold text-[#F26522] mb-6">
              {formatPrice(listing.price, listing.price_unit)}
            </div>

            <div className="border-t border-slate-100 pt-4 mb-6">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Mô tả chi tiết:</h3>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Safe meetup notice */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Khuyến nghị an toàn HUIT:</span>
                Ưu tiên gặp gỡ và trao đổi trực tiếp tại điểm hẹn đã chọn:{' '}
                <strong className="text-amber-900">{listing.safe_meetup_location}</strong>. Tuyệt đối
                không chuyển khoản đặt cọc trước với người chưa xác thực MSSV.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Poster Card & Actions */}
        <div className="space-y-4">
          {/* Seller Profile Card */}
          <div className="card p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Người đăng tin
            </h3>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#0F3D6E] text-white text-lg font-bold flex items-center justify-center shrink-0 shadow-xs">
                {listing.profiles?.full_name?.[0]?.toUpperCase() || 'H'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm sm:text-base text-slate-800 truncate block">
                    {listing.profiles?.full_name || 'Sinh viên HUIT'}
                  </span>
                  {listing.profiles?.is_verified && (
                    <span title="Đã duyệt MSSV" className="shrink-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{listing.profiles?.faculty || 'HUIT Student'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl text-center mb-5 border border-slate-100">
              <div>
                <div className="text-xs text-slate-500">Điểm Uy Tín</div>
                <div className="text-base font-bold text-emerald-700">
                  {listing.profiles?.karma_points ?? 0} Karma
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Trạng thái MSSV</div>
                <div className="text-xs font-bold mt-0.5">
                  {listing.profiles?.is_verified ? (
                    <span className="text-emerald-700">Đã xác minh</span>
                  ) : (
                    <span className="text-slate-500">Chưa xác minh</span>
                  )}
                </div>
              </div>
            </div>

            {/* Meetup location */}
            <div className="text-xs text-slate-600 mb-5 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#0F3D6E] shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[11px]">Điểm hẹn giao dịch:</span>
                <span className="font-semibold text-slate-800">{listing.safe_meetup_location}</span>
              </div>
            </div>

            {/* Action buttons */}
            {isOwner ? (
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 text-[#0F3D6E] rounded-xl text-xs font-semibold text-center">
                  Đây là tin đăng của bạn
                </div>
                <Link
                  href="/profile"
                  className="btn-ghost w-full text-xs font-medium py-2"
                >
                  Quản lý tin đăng
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenChat}
                disabled={openingChat}
                className="w-full btn-blue text-sm font-bold py-3 flex items-center justify-center gap-2 active:scale-95"
              >
                {openingChat ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang kết nối...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Nhắn tin & Kết nối ngay</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Karma Handshake Explanation */}
          <div className="card p-4 bg-gradient-to-br from-emerald-50/50 to-white text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Hệ thống Bắt tay uy tín (Karma)
            </div>
            <p className="leading-relaxed">
              Không dùng tiền tệ/nạp xu. Khi hoàn tất trao đổi trực tiếp, cả hai cùng bấm{' '}
              <strong>🤝 Bắt tay</strong> trong khung chat để nhận <strong>+10 Karma</strong> và đánh giá lẫn nhau.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
