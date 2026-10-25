import type { ListingType } from '@/lib/types';
import { CATEGORIES, SAFE_ZONES } from '@/lib/constants';
import { Search, X } from 'lucide-react';

interface Props {
  type: ListingType;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedZone: string;
  onSelectZone: (zone: string) => void;
  searchTerm: string;
  onSearchChange: (q: string) => void;
}

export function FilterBar({
  type,
  selectedCategory,
  onSelectCategory,
  selectedZone,
  onSelectZone,
  searchTerm,
  onSearchChange,
}: Props) {
  const categories = CATEGORIES[type] || [];

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            type === 'goods'
              ? 'Tìm giáo trình, áo blouse, máy tính casio, quạt...'
              : 'Tìm việc gấp, phụ chuyển trọ, gia sư, mượn đồ...'
          }
          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#0F3D6E] focus:ring-2 focus:ring-blue-100 shadow-xs transition"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Safe Meetup Zones */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
        <span className="font-bold text-slate-500 uppercase tracking-wider shrink-0 text-[11px] mr-1">
          Điểm hẹn:
        </span>
        <button
          type="button"
          onClick={() => onSelectZone('all')}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all font-medium cursor-pointer ${
            selectedZone === 'all'
              ? 'bg-[#0F3D6E] text-white shadow-xs font-semibold'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          Tất cả địa điểm
        </button>
        {SAFE_ZONES.map((zone) => (
          <button
            key={zone}
            type="button"
            onClick={() => onSelectZone(zone)}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all font-medium cursor-pointer ${
              selectedZone === zone
                ? 'bg-[#0F3D6E] text-white shadow-xs font-semibold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {zone}
          </button>
        ))}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
        <span className="font-bold text-slate-500 uppercase tracking-wider shrink-0 text-[11px] mr-1">
          Danh mục:
        </span>
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all font-medium cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#F26522] text-white shadow-xs font-semibold'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          Tất cả
        </button>
        {categories.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onSelectCategory(c.value)}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all font-medium cursor-pointer flex items-center gap-1 ${
              selectedCategory === c.value
                ? 'bg-[#F26522] text-white shadow-xs font-semibold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>{c.emoji}</span>
            <span>{c.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
