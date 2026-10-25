'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, isDemoMode } from '@/lib/api';
import type { PendingVerification } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  Users,
  Eye,
  RefreshCw,
} from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [pendingList, setPendingList] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const items = await api.listPendingVerifications();
      setPendingList(items);
    } catch (err: any) {
      toast(err.message || 'Lỗi tải danh sách chờ duyệt', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const handleReview = async (userId: string, approve: boolean) => {
    setProcessingId(userId);
    try {
      await api.reviewVerification(userId, approve);
      toast(
        approve ? 'Đã duyệt MSSV thành công! Sinh viên đã có tích xanh.' : 'Đã từ chối yêu cầu xác thực.',
        approve ? 'success' : 'error',
      );
      await loadPending();
    } catch (err: any) {
      toast(err.message || 'Lỗi xử lý', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-[#0F3D6E]" />
              Bảng Điều Khiển Admin (Duyệt MSSV HUIT)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 ml-7">
            {isDemoMode
              ? 'Chế độ Demo: Bạn có thể duyệt hoặc từ chối trực tiếp tại đây để kiểm tra giao diện & tích xanh.'
              : 'Duyệt các yêu cầu thẻ sinh viên gửi lên từ hệ thống hoặc qua Telegram Bot.'}
          </p>
        </div>

        <button
          onClick={loadPending}
          disabled={loading}
          className="btn-ghost text-xs py-2 px-3 self-start sm:self-center flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Pending Verifications Card */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Danh sách chờ duyệt thẻ SV</span>
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
              {pendingList.length} yêu cầu
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-[#0F3D6E]" />
            <p className="text-xs">Đang tải danh sách chờ duyệt...</p>
          </div>
        ) : pendingList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingList.map(({ profile, card_url }) => {
              const isWorking = processingId === profile.id;

              return (
                <div
                  key={profile.id}
                  className="rounded-xl border border-slate-200 p-4 bg-slate-50/60 flex flex-col justify-between gap-3 hover:border-blue-200 transition"
                >
                  <div>
                    {/* Student Info */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-800">{profile.full_name}</span>
                      <span className="text-[11px] font-mono font-bold bg-blue-100 text-[#0F3D6E] px-2 py-0.5 rounded">
                        MSSV: {profile.mssv || 'Chưa nhập'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 mb-3">
                      <div>
                        Khoa: <span className="font-semibold">{profile.faculty}</span>
                      </div>
                      <div>
                        Email: <span className="text-slate-500">{profile.email}</span>
                      </div>
                      <div>
                        User ID: <code className="text-[10px] bg-slate-200 px-1 rounded">{profile.id}</code>
                      </div>
                    </div>

                    {/* Student card thumbnail */}
                    {card_url && (
                      <div className="relative aspect-16/10 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 group">
                        <img
                          src={card_url}
                          alt="Ảnh thẻ SV"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => setPreviewImg(card_url)}
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewImg(card_url)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-white text-xs font-semibold transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" /> Xem ảnh lớn
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Approve / Reject buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      disabled={isWorking}
                      onClick={() => handleReview(profile.id, false)}
                      className="btn-ghost text-xs py-2 text-red-600 hover:bg-red-50 hover:border-red-200 font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" /> Từ chối
                    </button>
                    <button
                      type="button"
                      disabled={isWorking}
                      onClick={() => handleReview(profile.id, true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 rounded-xl font-bold flex items-center justify-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      {isWorking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" /> Duyệt tích xanh
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700 mb-0.5">Không có yêu cầu chờ duyệt</h3>
            <p className="text-xs text-slate-500">
              Tất cả các sinh viên gửi yêu cầu xác thực thẻ đã được duyệt hoặc chưa có yêu cầu mới.
            </p>
          </div>
        )}
      </div>

      {/* Guide & Architecture Info */}
      <div className="card p-5 bg-gradient-to-br from-slate-50 to-blue-50/40 text-xs text-slate-700 space-y-3">
        <h3 className="font-bold text-sm text-[#0F3D6E]">
          📌 Hướng Dẫn Tích Hợp Telegram Bot Cho Admin HUIT:
        </h3>
        <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-slate-600">
          <li>
            Tạo Bot bằng <strong>@BotFather</strong> trên Telegram và lấy <code>TELEGRAM_BOT_TOKEN</code>.
          </li>
          <li>
            Tạo nhóm Telegram nội bộ cho Ban quản trị SOM, thêm bot vào nhóm và lấy <code>TELEGRAM_CHAT_ID</code>.
          </li>
          <li>
            Cấu hình Webhook bằng lệnh sau để bot tự động nhận nút bấm duyệt:
            <pre className="mt-1 bg-slate-900 text-amber-300 p-2.5 rounded-lg overflow-x-auto text-[11px] font-mono">
              curl -X POST "https://api.telegram.org/bot&lt;BOT_TOKEN&gt;/setWebhook?url=&lt;DOMAIN&gt;/api/telegram-webhook&amp;secret_token=&lt;WEBHOOK_SECRET&gt;"
            </pre>
          </li>
          <li>
            Mỗi khi sinh viên tải ảnh thẻ, bot sẽ gửi ảnh + thông tin vào group với 2 nút <strong>✅ Duyệt</strong> và <strong>❌ Từ chối</strong>.
          </li>
        </ol>
      </div>

      {/* Photo Preview Modal */}
      {previewImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImg(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
            <img src={previewImg} alt="Ảnh thẻ phóng to" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
            <p className="text-center text-xs text-slate-500 py-1 font-medium">Bấm ra ngoài để đóng</p>
          </div>
        </div>
      )}
    </div>
  );
}
