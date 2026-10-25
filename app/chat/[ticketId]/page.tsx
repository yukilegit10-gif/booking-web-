'use client';

import { use, useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Message, Review, Ticket } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';
import { formatPrice, timeAgo } from '@/lib/utils';
import {
  ArrowLeft,
  Send,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Star,
  Award,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export default function ChatRoomPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [handshaking, setHandshaking] = useState(false);

  // Review states
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      const [t, m, r] = await Promise.all([
        api.getTicket(resolvedParams.ticketId),
        api.listMessages(resolvedParams.ticketId),
        api.getMyReview(resolvedParams.ticketId),
      ]);
      setTicket(t);
      setMessages(m);
      setMyReview(r);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.ticketId]);

  useEffect(() => {
    loadData();
    const unsub = api.subscribeTicket(resolvedParams.ticketId, () => {
      loadData();
    });
    return unsub;
  }, [loadData, resolvedParams.ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText('');
    setSending(true);
    try {
      await api.sendMessage(resolvedParams.ticketId, text);
      await loadData();
    } catch (err: any) {
      toast(err.message || 'Lỗi gửi tin nhắn', 'error');
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const handleConfirmHandshake = async () => {
    setHandshaking(true);
    try {
      await api.confirmHandshake(resolvedParams.ticketId);
      toast('Đã xác nhận bắt tay!', 'success');
      await loadData();
    } catch (err: any) {
      toast(err.message || 'Lỗi khi xác nhận bắt tay', 'error');
    } finally {
      setHandshaking(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.submitReview(resolvedParams.ticketId, rating, comment);
      toast('Đã gửi đánh giá uy tín thành công!', 'success');
      setShowReviewModal(false);
      await loadData();
    } catch (err: any) {
      toast(err.message || 'Lỗi khi gửi đánh giá', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F3D6E]" />
        <p className="text-xs font-medium">Đang tải cuộc trò chuyện...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Không tìm thấy cuộc trò chuyện</h2>
        <Link href="/chat" className="btn-blue text-xs">
          Quay lại danh sách chat
        </Link>
      </div>
    );
  }

  const isBuyer = user?.id === ticket.buyer_id;
  const peer = isBuyer ? ticket.seller : ticket.buyer;
  const myConfirmed = isBuyer ? ticket.buyer_confirmed : ticket.seller_confirmed;
  const peerConfirmed = isBuyer ? ticket.seller_confirmed : ticket.buyer_confirmed;
  const isCompleted = ticket.status === 'handshake_completed';

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-6 flex flex-col h-[calc(100vh-8rem)]">
      {/* 1. Header with Peer Info & Listing Summary */}
      <div className="card p-3 sm:p-4 mb-3 shrink-0 shadow-xs">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/chat"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="w-10 h-10 rounded-full bg-[#0F3D6E] text-white font-bold flex items-center justify-center text-sm shrink-0">
              {peer?.full_name?.[0]?.toUpperCase() || 'H'}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 truncate">
                  {peer?.full_name || 'Sinh viên HUIT'}
                </span>
                {peer?.is_verified && (
                  <span title="Đã duyệt MSSV" className="shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {peer?.faculty} • <span className="font-semibold text-emerald-700">{peer?.karma_points ?? 0} Karma</span>
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {isCompleted ? (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Bắt tay xong
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Đang trao đổi
              </span>
            )}
          </div>
        </div>

        {/* Listing preview bar */}
        {ticket.listing && (
          <div className="pt-2.5 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-slate-400 font-medium shrink-0">Tin đăng:</span>
              <span className="font-semibold text-slate-800 truncate">{ticket.listing.title}</span>
              {ticket.listing.price !== undefined && (
                <span className="font-bold text-[#F26522] shrink-0">
                  {formatPrice(ticket.listing.price)}
                </span>
              )}
            </div>
            <Link
              href={`/listings/${ticket.listing_id}`}
              className="text-[#0F3D6E] hover:underline font-semibold flex items-center gap-0.5 shrink-0"
              target="_blank"
            >
              Xem tin <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* 2. Karma Handshake Bar */}
      <div className="card p-3 sm:p-4 mb-3 shrink-0 bg-gradient-to-r from-emerald-50/70 via-white to-blue-50/50 border-emerald-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 font-bold text-sm text-slate-800 mb-0.5">
              <span>🤝 Hệ thống Bắt tay uy tín (Karma Handshake)</span>
            </div>
            <p className="text-xs text-slate-600">
              {isCompleted
                ? 'Giao dịch hoàn tất! Cả hai bên đã được cộng +10 điểm Karma uy tín.'
                : 'Sau khi gặp mặt trực tiếp trao đổi, cả 2 cùng bấm Xác nhận để nhận +10 Karma.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isCompleted ? (
              <div className="flex items-center gap-2">
                <div className="text-right text-[11px] text-slate-500 hidden sm:block">
                  <div>Bạn: {myConfirmed ? '✅ Đã bấm' : '⏳ Chưa bấm'}</div>
                  <div>Đối phương: {peerConfirmed ? '✅ Đã bấm' : '⏳ Chưa bấm'}</div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmHandshake}
                  disabled={myConfirmed || handshaking}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
                    myConfirmed
                      ? 'bg-emerald-100 text-emerald-800 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                  }`}
                >
                  {handshaking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : myConfirmed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Đã xác nhận
                    </>
                  ) : (
                    <>
                      <span>🤝 Bắt tay (+10 Karma)</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                {myReview ? (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-xl inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Bạn đã đánh giá {myReview.rating}★
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(true)}
                    className="bg-[#D4AC0D] hover:bg-amber-500 text-slate-900 font-bold px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Star className="w-4 h-4 fill-slate-900" /> Đánh giá uy tín 2 chiều
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Messages Scroll Area */}
      <div className="card flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-white/70">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-1 py-12">
            <span className="text-3xl">👋</span>
            <p className="text-xs font-medium">Bắt đầu trò chuyện và hẹn điểm gặp tại trường HUIT!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === user?.id;

            return (
              <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] sm:max-w-[70%] px-3.5 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                    isMe
                      ? 'bg-[#0F3D6E] text-white rounded-br-xs'
                      : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60'
                  }`}
                >
                  <p className="whitespace-pre-line break-words">{m.content}</p>
                </div>
                <span className="text-[10px] text-slate-400 px-1 mt-0.5">{timeAgo(m.created_at)}</span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Message Input Box */}
      <form onSubmit={handleSend} className="mt-3 flex gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Nhập tin nhắn... (ví dụ: Mình hẹn ở sảnh thư viện lúc 15h nhé)"
          className="input flex-1 text-xs sm:text-sm py-2.5"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={sending || !inputText.trim()}
          className="btn-blue px-4 py-2.5 shrink-0 text-xs sm:text-sm active:scale-95 cursor-pointer"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="hidden sm:inline">Gửi</span>
        </button>
      </form>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
              Đánh Giá Uy Tín Cho {peer?.full_name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Đánh giá công tâm giúp cộng đồng sinh viên HUIT chọn đúng người uy tín. Đánh giá 5★ giúp bạn ấy +5 Karma!
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star selector */}
              <div>
                <label className="label">Mức độ hài lòng</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-2xl transition hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'text-amber-500 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-700 self-center ml-2">
                    {rating === 5 && 'Rất uy tín (+5 Karma)'}
                    {rating === 4 && 'Tốt (+3 Karma)'}
                    {rating === 3 && 'Bình thường'}
                    {rating === 2 && 'Chưa hài lòng (-2 Karma)'}
                    {rating === 1 && 'Không uy tín (-5 Karma)'}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="label">Nhận xét (không bắt buộc)</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ví dụ: Bạn ấy đúng giờ, đồ đẹp y như ảnh chụp..."
                  className="input text-xs sm:text-sm"
                  maxLength={300}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="btn-ghost text-xs py-2 px-3 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-primary text-xs py-2 px-4 cursor-pointer"
                >
                  {submittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Gửi đánh giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
