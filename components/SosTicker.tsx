'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Listing } from '@/lib/types';
import { Flame } from 'lucide-react';

export function SosTicker() {
  const [urgentList, setUrgentList] = useState<Listing[]>([]);

  useEffect(() => {
    api.listUrgent().then(setUrgentList).catch(() => {});
  }, []);

  const fallbackText =
    '[Cần gấp] Mượn áo blouse trắng size M ca chiều tại khu B (Hậu tạ 1 ly trà sữa) • [Chuyển trọ] Cần 1 bạn nam phụ khiêng tủ lạnh ở Nguyễn Quý Anh lúc 17h • [Lab CNTT] Cần mượn cáp Type-C to HDMI tại phòng B402';

  return (
    <div className="bg-amber-50/90 border-y border-amber-200/80 px-4 py-2 text-xs lg:text-sm text-amber-950 flex items-center gap-2 overflow-hidden shadow-xs">
      <div className="flex items-center gap-1.5 font-bold shrink-0 text-orange-700 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300/60">
        <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500 animate-pulse" />
        <span>SOS Việc Gấp:</span>
      </div>

      <div className="overflow-hidden whitespace-nowrap w-full">
        <div className="inline-block animate-ticker text-amber-900 font-medium">
          {urgentList.length > 0 ? (
            urgentList.map((item, idx) => (
              <span key={item.id} className="inline-flex items-center">
                <Link
                  href={`/listings/${item.id}`}
                  className="hover:underline hover:text-orange-700 transition"
                >
                  🔥 {item.title} ({item.safe_meetup_location})
                </Link>
                {idx < urgentList.length - 1 && <span className="mx-4 text-amber-400">•</span>}
              </span>
            ))
          ) : (
            <span>{fallbackText}</span>
          )}
        </div>
      </div>
    </div>
  );
}
