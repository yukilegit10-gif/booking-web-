import Link from 'next/link';
import type { Listing } from '@/lib/types';
import { formatPrice, timeAgo } from '@/lib/utils';
import { categoryEmoji } from '@/lib/constants';
import { MapPin, ShieldCheck, MessageSquare, Flame } from 'lucide-react';

export function ListingCard({ item }: { item: Listing }) {
  const emoji = categoryEmoji(item.type, item.category);
  const firstImage = item.image_urls?.[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Thumbnail or placeholder */}
        <Link href={`/listings/${item.id}`} className="block relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
          {firstImage ? (
            <img
              src={firstImage}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
              <span className="text-4xl mb-1">{emoji}</span>
              <span className="text-xs font-medium text-slate-500">Chưa có ảnh</span>
            </div>
          )}

          {item.is_urgent && (
            <span className="absolute top-2 left-2 bg-[#F26522] text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow flex items-center gap-1 animate-pulse">
              <Flame className="w-3 h-3 fill-white" /> Cần gấp
            </span>
          )}

          {item.condition_status && item.type === 'goods' && (
            <span className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
              {item.condition_status}
            </span>
          )}
        </Link>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-[#0F3D6E] bg-blue-50 px-2.5 py-0.5 rounded-md flex items-center gap-1 truncate">
              <span>{emoji}</span>
              <span className="truncate">{item.category}</span>
            </span>
            <span className="text-base font-extrabold text-[#F26522] shrink-0">
              {formatPrice(item.price, item.price_unit)}
            </span>
          </div>

          <Link href={`/listings/${item.id}`}>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base line-clamp-2 mb-2 group-hover:text-[#0F3D6E] transition-colors leading-snug">
              {item.title}
            </h3>
          </Link>

          <p className="text-xs text-slate-500 flex items-center gap-1 mb-1 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{item.safe_meetup_location}</span>
          </p>

          <p className="text-[11px] text-slate-400">
            {timeAgo(item.created_at)}
          </p>
        </div>
      </div>

      {/* Seller / Poster Info (PeerZu Trust Style) */}
      <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0F3D6E] font-bold flex items-center justify-center text-xs shrink-0">
            {item.profiles?.full_name?.[0]?.toUpperCase() || 'H'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-700 truncate block">
                {item.profiles?.full_name || 'Sinh viên HUIT'}
              </span>
              {item.profiles?.is_verified && (
                <span title="Đã duyệt MSSV" className="shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="truncate">{item.profiles?.faculty || 'HUIT'}</span>
              <span>•</span>
              <span className="font-semibold text-emerald-700">{item.profiles?.karma_points ?? 0}K</span>
            </div>
          </div>
        </div>

        <Link
          href={`/listings/${item.id}`}
          className="bg-[#0F3D6E] hover:bg-blue-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0 active:scale-95"
        >
          <MessageSquare className="w-3.5 h-3.5" /> Chi tiết
        </Link>
      </div>
    </div>
  );
}
