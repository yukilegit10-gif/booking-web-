'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { ListingType } from '@/lib/types';
import { CATEGORIES, CONDITIONS, SAFE_ZONES } from '@/lib/constants';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';
import { ImageUploader } from '@/components/ImageUploader';
import { ArrowLeft, Flame, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function CreateListingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const [type, setType] = useState<ListingType>('goods');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES.goods[0].value);
  const [priceType, setPriceType] = useState<'fixed' | 'negotiable' | 'free'>('fixed');
  const [priceNumber, setPriceNumber] = useState('');
  const [condition, setCondition] = useState(CONDITIONS[1]);
  const [zone, setZone] = useState(SAFE_ZONES[0]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // When type changes, default category
  const handleTypeChange = (t: ListingType) => {
    setType(t);
    setCategory(CATEGORIES[t][0].value);
    if (t === 'gigs') {
      setCondition('');
    } else {
      setCondition(CONDITIONS[1]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast('Vui lòng đăng nhập để đăng tin', 'error');
      router.push('/login');
      return;
    }

    if (!title.trim() || title.length < 5) {
      toast('Tiêu đề cần ít nhất 5 ký tự', 'error');
      return;
    }
    if (!description.trim() || description.length < 10) {
      toast('Mô tả chi tiết cần ít nhất 10 ký tự', 'error');
      return;
    }

    let finalPrice: number | null = null;
    if (priceType === 'free') finalPrice = 0;
    else if (priceType === 'fixed') {
      const num = parseInt(priceNumber.replace(/\D/g, ''), 10);
      if (isNaN(num) || num < 0) {
        toast('Vui lòng nhập giá hợp lệ', 'error');
        return;
      }
      finalPrice = num;
    }

    setSubmitting(true);
    try {
      const id = await api.createListing(
        {
          type,
          title: title.trim(),
          description: description.trim(),
          category,
          price: finalPrice,
          condition_status: type === 'goods' ? condition : null,
          safe_meetup_location: zone,
          is_urgent: isUrgent,
        },
        images,
      );

      toast('Đăng tin thành công!', 'success');
      router.push(`/listings/${id}`);
    } catch (err: any) {
      toast(err.message || 'Lỗi khi tạo tin đăng', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 mb-4 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </Link>

      <div className="card p-5 sm:p-7">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
            Đăng Tin Mới
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Đăng bán/tặng đồ cũ hoặc tìm người giúp việc vặt ngay trong khuôn viên trường HUIT.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type selector */}
          <div>
            <label className="label">Bạn muốn đăng loại tin nào?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('goods')}
                className={`py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                  type === 'goods'
                    ? 'border-[#F26522] bg-orange-50 text-[#F26522] shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>📦</span> Chợ Đồ Cũ (Order)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('gigs')}
                className={`py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                  type === 'gigs'
                    ? 'border-[#D4AC0D] bg-amber-50 text-slate-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>🤝</span> Việc Vặt (Market)
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="label">
              Tiêu đề tin đăng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'goods'
                  ? 'Ví dụ: Giáo trình Cấu trúc dữ liệu & Giải thuật mới 99%'
                  : 'Ví dụ: [Cần gấp] Mượn áo blouse size M ca chiều tại khu B'
              }
              className="input text-sm"
              maxLength={100}
            />
          </div>

          {/* Category */}
          <div>
            <label className="label">Danh mục</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input text-sm bg-white cursor-pointer"
            >
              {CATEGORIES[type].map((c) => (
                <option key={c.value} value={c.value}>
                  {c.emoji} {c.value}
                </option>
              ))}
            </select>
          </div>

          {/* Price options */}
          <div>
            <label className="label">Giá / Chi phí</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setPriceType('fixed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  priceType === 'fixed'
                    ? 'border-[#0F3D6E] bg-blue-50 text-[#0F3D6E]'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Có giá cụ thể
              </button>
              <button
                type="button"
                onClick={() => setPriceType('negotiable')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  priceType === 'negotiable'
                    ? 'border-[#0F3D6E] bg-blue-50 text-[#0F3D6E]'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Thỏa thuận
              </button>
              <button
                type="button"
                onClick={() => setPriceType('free')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  priceType === 'free'
                    ? 'border-[#0F3D6E] bg-blue-50 text-[#0F3D6E]'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Tặng miễn phí (0đ)
              </button>
            </div>

            {priceType === 'fixed' && (
              <div className="relative">
                <input
                  type="text"
                  required
                  value={priceNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPriceNumber(val ? Number(val).toLocaleString('vi-VN') : '');
                  }}
                  placeholder="Ví dụ: 50.000"
                  className="input pr-12 text-sm font-semibold text-[#F26522]"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  VNĐ
                </span>
              </div>
            )}
          </div>

          {/* Condition (only for goods) */}
          {type === 'goods' && (
            <div>
              <label className="label">Tình trạng</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="input text-sm bg-white cursor-pointer"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Safe meetup location */}
          <div>
            <label className="label">Điểm hẹn an toàn trong trường</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="input text-sm bg-white cursor-pointer"
            >
              {SAFE_ZONES.map((z) => (
                <option key={z} value={z}>
                  📍 {z}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Khuyến nghị giao dịch tại các khu vực công cộng có camera và bảo vệ của HUIT.
            </p>
          </div>

          {/* Urgent / SOS checkbox */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
            <input
              type="checkbox"
              id="is_urgent"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
            />
            <label htmlFor="is_urgent" className="text-xs text-amber-950 cursor-pointer">
              <span className="font-bold flex items-center gap-1 text-orange-700">
                <Flame className="w-3.5 h-3.5 fill-orange-500" /> Gắn nhãn Việc Gấp / SOS
              </span>
              Tin này sẽ xuất hiện trên thanh tin chạy khẩn cấp ở đầu trang để được hỗ trợ nhanh nhất.
            </label>
          </div>

          {/* Image uploader */}
          <div>
            <label className="label">Hình ảnh minh họa</label>
            <ImageUploader files={images} onChange={setImages} maxFiles={4} />
          </div>

          {/* Description */}
          <div>
            <label className="label">
              Mô tả chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả kỹ tình trạng đồ, yêu cầu công việc, thời gian gặp mặt cụ thể..."
              className="input text-sm leading-relaxed"
            />
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary py-3 text-base font-bold shadow-md active:scale-98"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang đăng tin...</span>
                </>
              ) : (
                <span>Đăng tin lên Chợ SOM</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
