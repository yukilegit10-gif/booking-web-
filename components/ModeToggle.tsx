import type { ListingType } from '@/lib/types';
import { ShoppingBag, Briefcase } from 'lucide-react';

interface Props {
  activeTab: ListingType;
  onChange: (tab: ListingType) => void;
}

export function ModeToggle({ activeTab, onChange }: Props) {
  return (
    <div className="inline-flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
      <button
        type="button"
        onClick={() => onChange('goods')}
        className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
          activeTab === 'goods'
            ? 'bg-[#F26522] text-white shadow-md scale-100 font-bold'
            : 'text-white/80 hover:text-white hover:bg-white/5'
        }`}
      >
        <ShoppingBag className="w-4 h-4" /> Chợ Đồ Cũ (Order)
      </button>
      <button
        type="button"
        onClick={() => onChange('gigs')}
        className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
          activeTab === 'gigs'
            ? 'bg-[#D4AC0D] text-slate-900 shadow-md scale-100 font-bold'
            : 'text-white/80 hover:text-white hover:bg-white/5'
        }`}
      >
        <Briefcase className="w-4 h-4" /> Việc Vặt (Market)
      </button>
    </div>
  );
}
