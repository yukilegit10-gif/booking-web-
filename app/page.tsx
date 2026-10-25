'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Listing, ListingType } from '@/lib/types';
import { ModeToggle } from '@/components/ModeToggle';
import { SosTicker } from '@/components/SosTicker';
import { FilterBar } from '@/components/FilterBar';
import { ListingCard } from '@/components/ListingCard';
import { Plus, Loader2, PackageOpen, Sparkles } from 'lucide-react';

export default function SomHomePage() {
  const [activeTab, setActiveTab] = useState<ListingType>('goods');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedZone, setSelectedZone] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listListings({
        type: activeTab,
        category: selectedCategory,
        zone: selectedZone,
        q: searchTerm,
      });
      setListings(data);
    } catch (err) {
      console.error('Lỗi tải tin:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory, selectedZone, searchTerm]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Reset category filter when switching tabs
  const handleTabChange = (tab: ListingType) => {
    setActiveTab(tab);
    setSelectedCategory('all');
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* 1. Hero Section & Segmented Mode Switcher */}
      <section className="bg-gradient-to-br from-[#0F3D6E] via-[#124479] to-[#164E87] text-white py-9 px-4 text-center relative overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md mb-3 border border-white/20 text-blue-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Nền tảng nội bộ sinh viên HUIT
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 tracking-tight">
            Kết nối & Hỗ trợ sinh viên HUIT
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-slate-200 max-w-xl mx-auto mb-6 leading-relaxed">
            Mua bán đồ cũ, giáo trình, áo blouse và thuê việc vặt an toàn ngay tại các điểm hẹn trong trường.
          </p>

          {/* Toggle Mode Switcher */}
          <ModeToggle activeTab={activeTab} onChange={handleTabChange} />
        </div>
      </section>

      {/* 2. SOS Live Ticker (Việc khó cần gấp) */}
      <SosTicker />

      {/* 3. Main Filter & Content Section */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="card p-4 sm:p-5 mb-6">
          <FilterBar
            type={activeTab}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        {/* Section title & count */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              {activeTab === 'goods' ? 'Chợ Đồ Cũ Sinh Viên' : 'Việc Vặt & Hỗ Trợ Sinh Viên'}
            </h2>
            <span className="bg-slate-200 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {listings.length} tin
            </span>
          </div>

          <Link
            href="/post"
            className="text-xs font-semibold text-[#F26522] hover:text-orange-700 flex items-center gap-1 sm:hidden"
          >
            <Plus className="w-4 h-4" /> Đăng tin
          </Link>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-[#0F3D6E]" />
            <p className="text-sm font-medium">Đang tải danh sách tin...</p>
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="card py-16 px-4 text-center">
            <PackageOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 mb-1">Chưa có tin phù hợp</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
              Không tìm thấy tin đăng nào theo bộ lọc hiện tại. Bạn có thể là người đầu tiên đăng tin mục này!
            </p>
            <Link
              href="/post"
              className="inline-flex items-center gap-2 bg-[#F26522] hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" /> Đăng tin ngay
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
