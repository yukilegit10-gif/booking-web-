'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Listing, Profile } from '@/lib/types';
import { FACULTIES } from '@/lib/constants';
import { formatPrice, karmaTier, timeAgo } from '@/lib/utils';
import { compressImage } from '@/lib/image-compression';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';
import {
  ShieldCheck,
  ShieldAlert,
  Award,
  UploadCloud,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  LogOut,
  Camera,
  Loader2,
  Trash2,
  ExternalLink,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const toast = useToast();

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  // Student card verification form state
  const [mssv, setMssv] = useState('');
  const [faculty, setFaculty] = useState(FACULTIES[0]);
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [cardPreview, setCardPreview] = useState<string | null>(null);
  const [submittingVerify, setSubmittingVerify] = useState(false);

  useEffect(() => {
    if (!user) return;
    setMssv(user.mssv || '');
    setFaculty(user.faculty || FACULTIES[0]);
    api
      .listUserListings(user.id, true)
      .then(setMyListings)
      .catch((err) => console.error(err))
      .finally(() => setLoadingListings(false));
  }, [user]);

  const handleCardSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setCardFile(compressed);
    setCardPreview(URL.createObjectURL(compressed));
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mssv.trim() || !/^\d{8,12}$/.test(mssv.trim())) {
      toast('Vui lòng nhập MSSV hợp lệ (8-12 chữ số)', 'error');
      return;
    }
    if (!cardFile) {
      toast('Vui lòng chụp ảnh thẻ sinh viên hoặc app SV HUIT', 'error');
      return;
    }

    setSubmittingVerify(true);
    try {
      await api.submitVerification(mssv.trim(), faculty, cardFile);
      toast('Đã gửi yêu cầu xác thực MSSV! Admin sẽ duyệt sớm.', 'success');
      refresh();
    } catch (err: any) {
      toast(err.message || 'Lỗi khi gửi xác thực', 'error');
    } finally {
      setSubmittingVerify(false);
    }
  };

  const handleStatusChange = async (listingId: string, newStatus: 'completed' | 'hidden') => {
    try {
      await api.updateListingStatus(listingId, newStatus);
      toast('Đã cập nhật trạng thái tin', 'success');
      if (user) {
        const updated = await api.listUserListings(user.id, true);
        setMyListings(updated);
      }
    } catch (err: any) {
      toast(err.message || 'Lỗi cập nhật', 'error');
    }
  };

  const handleSignOut = async () => {
    await api.signOut();
    toast('Đã đăng xuất', 'success');
    refresh();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Vui lòng đăng nhập</h2>
        <p className="text-xs text-slate-500 mb-5">
          Đăng nhập để xem hồ sơ, tích lũy điểm Karma và quản lý tin đăng của bạn.
        </p>
        <Link href="/login" className="btn-blue text-xs">
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  const tier = karmaTier(user.karma_points);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* 1. Header Profile Card */}
      <div className="card p-5 sm:p-6 bg-gradient-to-r from-blue-900 to-[#0F3D6E] text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white text-[#0F3D6E] text-2xl font-bold flex items-center justify-center shadow-md">
              {user.full_name?.[0]?.toUpperCase() || 'H'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold">{user.full_name}</h1>
                {user.is_verified ? (
                  <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> Đã xác thực MSSV
                  </span>
                ) : user.verification_status === 'pending' ? (
                  <span className="bg-amber-500/30 text-amber-200 border border-amber-400/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-300" /> Đang chờ duyệt
                  </span>
                ) : (
                  <span className="bg-white/20 text-slate-200 text-[11px] font-medium px-2 py-0.5 rounded-full">
                    Chưa xác thực MSSV
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-200 mt-1">
                {user.faculty} • {user.email}
              </p>
              {user.mssv && (
                <p className="text-xs text-blue-200 font-mono mt-0.5">MSSV: {user.mssv}</p>
              )}
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
            <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-extrabold">{user.karma_points} Karma</span>
            </div>
            <button
              onClick={handleSignOut}
              className="mt-2 text-xs text-red-200 hover:text-white flex items-center gap-1 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Verification Form */}
        <div className="md:col-span-1 space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0F3D6E]" />
              Xác thực Sinh viên HUIT
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Xác minh MSSV giúp bạn nhận tích xanh, tạo niềm tin tuyệt đối khi mua bán và nhận việc.
            </p>

            {user.is_verified ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Tài khoản đã được xác thực
                </div>
                <p className="text-slate-600">
                  Mã SV: <strong className="font-mono text-emerald-950">{user.mssv}</strong>
                </p>
                <p className="text-slate-600">
                  Khoa: <strong>{user.faculty}</strong>
                </p>
              </div>
            ) : user.verification_status === 'pending' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Yêu cầu đang chờ duyệt
                </div>
                <p className="text-slate-600">
                  Ban quản trị SOM hoặc bot Telegram đang xử lý ảnh thẻ sinh viên của bạn. Vui lòng đợi trong giây lát!
                </p>
              </div>
            ) : (
              <form onSubmit={handleVerifySubmit} className="space-y-3">
                {user.verification_status === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>Yêu cầu trước đó bị từ chối do ảnh thẻ không rõ hoặc sai MSSV. Vui lòng gửi lại.</span>
                  </div>
                )}

                <div>
                  <label className="label text-xs">Mã số sinh viên (MSSV)</label>
                  <input
                    type="text"
                    required
                    value={mssv}
                    onChange={(e) => setMssv(e.target.value)}
                    placeholder="Ví dụ: 2001210123"
                    className="input text-xs font-mono"
                    maxLength={15}
                  />
                </div>

                <div>
                  <label className="label text-xs">Khoa</label>
                  <select
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    className="input text-xs bg-white cursor-pointer"
                  >
                    {FACULTIES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label text-xs">Ảnh thẻ SV hoặc chụp màn hình app HUIT</label>
                  <label className="border-2 border-dashed border-slate-300 hover:border-[#0F3D6E] rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50 transition text-center">
                    {cardPreview ? (
                      <img src={cardPreview} alt="Card preview" className="w-full h-28 object-contain rounded-lg" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-slate-400" />
                        <span className="text-xs font-medium text-slate-600">Chọn ảnh thẻ</span>
                        <span className="text-[10px] text-slate-400">Tự động nén WebP an toàn</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCardSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submittingVerify}
                  className="w-full btn-blue text-xs font-bold py-2.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  {submittingVerify ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Gửi xác thực MSSV'
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Karma info box */}
          <div className="card p-4 text-xs text-slate-600 space-y-2 bg-gradient-to-br from-slate-50 to-amber-50/30">
            <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Cách kiếm điểm Uy tín Karma
            </div>
            <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
              <li>Mỗi lần xác nhận Bắt tay thành công: <strong>+10 Karma</strong></li>
              <li>Nhận đánh giá 5★ từ bạn bè: <strong>+5 Karma</strong></li>
              <li>Nhận đánh giá 4★: <strong>+3 Karma</strong></li>
              <li>Đánh giá thấp 1-2★: <strong>-2 đến -5 Karma</strong></li>
            </ul>
          </div>
        </div>

        {/* Right Column: User's Listings */}
        <div className="md:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#0F3D6E]" />
                Tin đăng của bạn ({myListings.length})
              </h2>

              <Link
                href="/post"
                className="btn-primary text-xs py-1.5 px-3"
              >
                + Đăng tin mới
              </Link>
            </div>

            {loadingListings ? (
              <div className="py-12 flex justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : myListings.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {myListings.map((l) => (
                  <div key={l.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        {l.image_urls?.[0] ? (
                          <img src={l.image_urls[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                            Không ảnh
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <Link
                          href={`/listings/${l.id}`}
                          className="font-bold text-sm text-slate-800 hover:text-[#0F3D6E] truncate block"
                        >
                          {l.title}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-bold text-[#F26522]">{formatPrice(l.price)}</span>
                          <span>•</span>
                          <span>{timeAgo(l.created_at)}</span>
                          <span>•</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              l.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : l.status === 'completed'
                                ? 'bg-blue-50 text-[#0F3D6E]'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {l.status === 'active' ? 'Đang hiển thị' : l.status === 'completed' ? 'Đã hoàn tất' : 'Đã ẩn'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <Link
                        href={`/listings/${l.id}`}
                        className="btn-ghost text-xs py-1 px-2.5"
                        title="Xem tin"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      {l.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(l.id, 'completed')}
                          className="btn-ghost text-xs py-1 px-2.5 text-blue-700 hover:bg-blue-50 cursor-pointer"
                        >
                          Xong
                        </button>
                      )}

                      {l.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(l.id, 'hidden')}
                          className="btn-ghost text-xs py-1 px-2.5 text-slate-500 hover:text-red-600 cursor-pointer"
                        >
                          Ẩn tin
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400">
                <p className="text-xs mb-3">Bạn chưa đăng tin nào.</p>
                <Link href="/post" className="btn-blue text-xs">
                  Đăng tin đầu tiên
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
